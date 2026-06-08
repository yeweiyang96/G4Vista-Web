import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import type { Chart, ChartData, ChartOptions, LegendItem, Plugin, TooltipItem } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { BaseChartDirective } from 'ng2-charts';
import {
  G4FlankWindow,
  G4FeatureBreakdownItem,
  G4GeneBiotypePositionBreakdown,
  G4_FLANK_WINDOW_OPTIONS,
  G4PositionCategory,
  G4PositionDistributionResponse,
  G4PositionMotifStats,
  G4PositionStatisticsCategory,
  G4PositionStatisticsResponse,
  G4PositionStatisticsWindow,
  G4Type,
} from '../../../services/g4.service';

interface PositionCategoryView extends G4PositionCategory {
  color: string;
  displayLabel: string;
  displayDescription: string;
}

interface PositionSummaryMetric {
  key: string;
  label: string;
  value: string;
  detail: string;
}

interface PositionStatisticsCategoryView extends G4PositionStatisticsCategory {
  color: string;
  displayLabel: string;
}

interface PositionStrengthRow {
  id: string;
  category: PositionStatisticsCategoryView;
  stats: G4PositionMotifStats;
}

interface GeneBiotypeCategoryCell {
  key: string;
  label: string;
  color: string;
  count: number;
  ratio: number;
  value: string;
}

interface GeneBiotypeBreakdownView extends Omit<G4GeneBiotypePositionBreakdown, 'categories'> {
  color: string;
  categories: readonly GeneBiotypeCategoryCell[];
}

interface PositionDistributionFilterModel {
  selectedTetrads: number[];
  minScore: string;
  maxScore: string;
}

type StrengthBoxPlotKey = 'score' | 'tetrads' | 'length';

interface SummaryDoughnutSegment {
  key: string;
  label: string;
  count: number;
  ratio: number;
  color: string;
}

interface StrengthBoxPlotRow {
  key: string;
  label: string;
  color: string;
  minValue: number;
  q1Value: number;
  medianValue: number;
  p75Value: number;
  maxValue: number;
  minX: number;
  q1X: number;
  medianX: number;
  p75X: number;
  maxX: number;
  boxWidth: number;
}

interface StrengthBoxPlotView {
  key: StrengthBoxPlotKey;
  title: string;
  minLabel: string;
  maxLabel: string;
  rows: readonly StrengthBoxPlotRow[];
}

const POSITION_CATEGORY_COLORS: Record<string, string> = {
  gene_inside: '#2a6f68',
  gene_upstream: '#b75f2a',
  gene_downstream: '#6f5ba7',
  other_root_non_gene_feature: '#b33f62',
  non_feature: '#58606f',
};
const POSITION_CATEGORY_KEYS = [
  'gene_inside',
  'gene_upstream',
  'gene_downstream',
  'other_root_non_gene_feature',
  'non_feature',
] as const;
const FALLBACK_POSITION_CATEGORY_COLOR = '#5f6368';
const MERGED_SUMMARY_CATEGORY_COLOR = '#87919f';
const SVG_BOX_PLOT_WIDTH = 100;
const SVG_BOX_PLOT_PADDING = 6;
const COUNT_FORMATTER = new Intl.NumberFormat('en-US');
const NUMBER_FORMATTER = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 2,
  minimumFractionDigits: 0,
});
const PERCENT_FORMATTER = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 1,
  minimumFractionDigits: 0,
  style: 'percent',
});
const POSITION_STATISTIC_TOOLTIPS = {
  category: 'Mutually exclusive genomic position category used for this statistics row.',
  count: 'Observed motif count assigned to this category.',
  intervalLength: 'Category denominator is the merged non-overlapping interval length.',
  densityPerMb: 'Motif count divided by merged interval length in megabases.',
  foldVsGenome: 'Category density divided by genome-wide density.',
  foldVsNonFeature: 'Category density divided by outside-annotation density.',
  medianP75:
    'Median is the typical value; p75 is the 75th percentile and the upper edge of the box plot.',
  boxPlot:
    'Whiskers show minimum and maximum. The box spans q1 to p75, with the median line inside.',
  geneBiotypeBreakdown:
    'Ratios are within each gene biotype row; the same site can appear in multiple biotype rows when it has multiple gene relations.',
  geneBiotypeDonut:
    'Outer ring shows displayed gene biotype share; inner ring splits each biotype span by position category.',
} as const;
const TRANSPARENT_CHART_SEGMENT = 'rgba(0, 0, 0, 0)';
const GENE_BIOTYPE_CATEGORY_COLUMNS = [
  { key: 'gene_inside', label: 'In genes' },
  { key: 'gene_upstream', label: 'Upstream flank' },
  { key: 'gene_downstream', label: 'Downstream flank' },
  { key: 'other_root_non_gene_feature', label: 'Other annotations' },
  { key: 'non_feature', label: 'Outside annotations' },
] as const;
const GENE_BIOTYPE_COLORS = [
  '#3f6c8a',
  '#b45f06',
  '#5b8f5a',
  '#8b5fbf',
  '#b64f7a',
  '#7b6d3a',
  '#507f7f',
  '#9b5b48',
  '#4f6fb3',
  '#6f7d2f',
  '#9a5c8a',
  '#5d6b78',
] as const;

function motifTypeLabel(g4Type: G4Type): string {
  return g4Type === 'i-motif' ? 'i-motif sequence sites' : 'G4 sequence sites';
}

function categoryDisplayText(
  category: Pick<G4PositionCategory, 'key' | 'label' | 'description'>,
): Pick<PositionCategoryView, 'displayLabel' | 'displayDescription'> {
  switch (category.key) {
    case 'gene_inside':
      return {
        displayLabel: 'In genes',
        displayDescription: 'Predicted motif sites that fall within annotated gene intervals.',
      };
    case 'gene_upstream':
      return {
        displayLabel: 'Upstream flank',
        displayDescription: 'Predicted motif sites in the selected upstream gene flank.',
      };
    case 'gene_downstream':
      return {
        displayLabel: 'Downstream flank',
        displayDescription: 'Predicted motif sites in the selected downstream gene flank.',
      };
    case 'other_root_non_gene_feature':
      return {
        displayLabel: 'Other annotations',
        displayDescription:
          'Predicted motif sites assigned to parentless non-gene annotations such as promoters or repeat regions.',
      };
    case 'non_feature':
      return {
        displayLabel: 'Outside annotations',
        displayDescription:
          'Predicted motif sites outside genes, selected gene flanks, and other annotations.',
      };
    default:
      return {
        displayLabel: category.label,
        displayDescription: category.description,
      };
  }
}

function categoryCount(categories: readonly G4PositionCategory[], key: string): number {
  return categories.find((category) => category.key === key)?.count ?? 0;
}

function summaryChartLabel(category: Pick<G4PositionCategory, 'key' | 'label'>): string {
  switch (category.key) {
    case 'gene_inside':
      return 'In genes';
    case 'gene_upstream':
      return 'Upstream flank';
    case 'gene_downstream':
      return 'Downstream flank';
    case 'other_root_non_gene_feature':
      return 'Other annotations';
    case 'non_feature':
      return 'Outside annotations';
    default:
      return category.label;
  }
}

function formatCount(value: number): string {
  return COUNT_FORMATTER.format(value);
}

function formatRatio(value: number): string {
  return PERCENT_FORMATTER.format(value);
}

function formatNullableNumber(value: number | null, suffix = ''): string {
  return value === null ? 'N/A' : `${NUMBER_FORMATTER.format(value)}${suffix}`;
}

function motifTypeShortLabel(g4Type: G4Type): string {
  return g4Type === 'i-motif' ? 'i-motif' : 'G4';
}

const EMPTY_MOTIF_STATS: G4PositionMotifStats = {
  count: 0,
  density_per_mb: null,
  expected_vs_genome: null,
  fold_vs_genome: null,
  fold_vs_non_feature: null,
  min_score: null,
  q1_score: null,
  median_score: null,
  p75_score: null,
  max_score: null,
  min_tetrads: null,
  q1_tetrads: null,
  median_tetrads: null,
  p75_tetrads: null,
  max_tetrads: null,
  min_length: null,
  q1_length: null,
  median_length: null,
  p75_length: null,
  max_length: null,
};

function motifStatsForType(
  category: G4PositionStatisticsCategory,
  g4Type: G4Type,
): G4PositionMotifStats {
  return category.motifs[g4Type] ?? EMPTY_MOTIF_STATS;
}

function completeBoxPlotValues(
  stats: G4PositionMotifStats,
  metric: StrengthBoxPlotKey,
): [number, number, number, number, number] | null {
  const values: [number | null, number | null, number | null, number | null, number | null] =
    metric === 'score'
      ? [stats.min_score, stats.q1_score, stats.median_score, stats.p75_score, stats.max_score]
      : metric === 'tetrads'
        ? [
            stats.min_tetrads,
            stats.q1_tetrads,
            stats.median_tetrads,
            stats.p75_tetrads,
            stats.max_tetrads,
          ]
        : [
            stats.min_length,
            stats.q1_length,
            stats.median_length,
            stats.p75_length,
            stats.max_length,
          ];

  const [minValue, q1Value, medianValue, p75Value, maxValue] = values;
  if (
    minValue === null ||
    q1Value === null ||
    medianValue === null ||
    p75Value === null ||
    maxValue === null
  ) {
    return null;
  }
  return [minValue, q1Value, medianValue, p75Value, maxValue];
}

function scaledBoxPlotX(value: number, domainMin: number, domainMax: number): number {
  if (domainMax <= domainMin) {
    return SVG_BOX_PLOT_WIDTH / 2;
  }
  const plotWidth = SVG_BOX_PLOT_WIDTH - SVG_BOX_PLOT_PADDING * 2;
  return SVG_BOX_PLOT_PADDING + ((value - domainMin) / (domainMax - domainMin)) * plotWidth;
}

@Component({
  selector: 'app-position-distribution',
  imports: [
    BaseChartDirective,
    MatButtonModule,
    MatButtonToggleModule,
    MatCardModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatTabsModule,
    MatTooltipModule,
  ],
  templateUrl: './position-distribution.component.html',
  styleUrl: './position-distribution.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PositionDistributionComponent {
  readonly distribution = input.required<G4PositionDistributionResponse>();
  readonly isLoading = input(false);
  readonly errorMessage = input('');
  readonly statistics = input.required<G4PositionStatisticsResponse>();
  readonly statisticsLoading = input(false);
  readonly statisticsErrorMessage = input('');
  readonly flankWindow = input.required<G4FlankWindow>();
  readonly flankWindowLabel = input.required<string>();
  readonly g4Type = input.required<G4Type>();
  readonly tetradOptions = input.required<readonly number[]>();
  readonly filterSelectedTetrads = input<number[]>([]);
  readonly filterMinScore = input('');
  readonly filterMaxScore = input('');
  readonly g4TypeChange = output<G4Type>();
  readonly flankWindowChange = output<G4FlankWindow>();
  readonly filterModelChange = output<PositionDistributionFilterModel>();
  readonly applyFilters = output<void>();
  readonly resetFilters = output<void>();
  readonly flankWindowOptions = G4_FLANK_WINDOW_OPTIONS;
  readonly summaryVisibleCategoryKeys = signal<string[]>([...POSITION_CATEGORY_KEYS]);
  readonly formatCount = formatCount;
  readonly formatRatio = formatRatio;
  readonly formatNullableNumber = formatNullableNumber;
  readonly statisticTooltips = POSITION_STATISTIC_TOOLTIPS;
  readonly motifTypeLabel = computed(() => motifTypeLabel(this.g4Type()));
  readonly motifTypeShortLabel = computed(() => motifTypeShortLabel(this.g4Type()));
  readonly summaryDoughnutPlugins: Plugin<'doughnut'>[] = [ChartDataLabels as Plugin<'doughnut'>];
  readonly summaryDoughnutOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '56%',
    elements: {
      arc: {
        borderAlign: 'inner',
        borderColor: 'rgba(255, 255, 255, 0.85)',
        borderWidth: 1,
      },
    },
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          boxHeight: 8,
          boxWidth: 8,
          padding: 12,
          usePointStyle: true,
        },
      },
      tooltip: {
        filter: (context) => Number(context.parsed) > 0,
        callbacks: {
          label: (context) => this.summaryDoughnutTooltipLabel(context),
        },
      },
      datalabels: {
        align: 'center',
        anchor: 'center',
        clamp: true,
        color: '#ffffff',
        display: (context) => {
          const value = Number(context.dataset.data[context.dataIndex] ?? 0);
          return value > 0 ? 'auto' : false;
        },
        font: {
          size: 11,
          weight: 'bold',
        },
        formatter: (value) => {
          const count = Number(value);
          return count > 0 ? formatCount(count) : '';
        },
        textStrokeColor: 'rgba(0, 0, 0, 0.42)',
        textStrokeWidth: 2,
      },
    },
  };
  readonly geneBiotypeDoughnutOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '42%',
    elements: {
      arc: {
        borderAlign: 'inner',
        borderColor: 'rgba(255, 255, 255, 0.85)',
        borderWidth: 1,
      },
    },
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          boxHeight: 8,
          boxWidth: 8,
          generateLabels: (chart) =>
            this.geneBiotypeDoughnutLegendLabels(chart as Chart<'doughnut'>),
          padding: 12,
          usePointStyle: true,
        },
        onClick: (_event, legendItem, legend) =>
          this.toggleGeneBiotypeDoughnutLegendItem(legendItem, legend.chart as Chart<'doughnut'>),
      },
      tooltip: {
        filter: (context) => this.showGeneBiotypeDoughnutTooltip(context),
        callbacks: {
          label: (context) => this.geneBiotypeDoughnutTooltipLabel(context),
        },
      },
    },
  };

  readonly categoryRows = computed<readonly PositionCategoryView[]>(() =>
    this.distribution().categories.map((category) => {
      const displayText = categoryDisplayText(category);
      return {
        ...category,
        ...displayText,
        color: POSITION_CATEGORY_COLORS[category.key] ?? FALLBACK_POSITION_CATEGORY_COLOR,
      };
    }),
  );
  readonly summaryDoughnutSegments = computed<readonly SummaryDoughnutSegment[]>(() => {
    const selectedKeys = new Set(this.summaryVisibleCategoryKeys());
    const total = this.distribution().total_count;
    const separateSegments: SummaryDoughnutSegment[] = [];
    let mergedCount = 0;

    for (const category of this.categoryRows()) {
      if (selectedKeys.has(category.key)) {
        separateSegments.push({
          key: category.key,
          label: summaryChartLabel(category),
          count: category.count,
          ratio: category.ratio,
          color: category.color,
        });
        continue;
      }
      mergedCount += category.count;
    }

    if (mergedCount > 0) {
      separateSegments.push({
        key: 'other_categories',
        label: 'Other categories',
        count: mergedCount,
        ratio: total ? mergedCount / total : 0,
        color: MERGED_SUMMARY_CATEGORY_COLOR,
      });
    }

    return separateSegments;
  });
  readonly summaryDoughnutData = computed<ChartData<'doughnut', number[], string>>(() => {
    const categories = this.summaryDoughnutSegments();
    return {
      labels: categories.map((category) => category.label),
      datasets: [
        {
          label: motifTypeShortLabel(this.g4Type()),
          data: categories.map((category) => category.count),
          backgroundColor: categories.map((category) => category.color),
          hoverBackgroundColor: categories.map((category) => category.color),
          hoverOffset: 2,
        },
      ],
    };
  });
  readonly featureBreakdown = computed<readonly G4FeatureBreakdownItem[]>(() =>
    this.distribution().feature_breakdown.slice(0, 12),
  );
  readonly geneBiotypeCategoryColumns = GENE_BIOTYPE_CATEGORY_COLUMNS.map((column) => ({
    ...column,
    color: POSITION_CATEGORY_COLORS[column.key] ?? FALLBACK_POSITION_CATEGORY_COLOR,
  }));
  readonly geneBiotypeBreakdown = computed<readonly GeneBiotypeBreakdownView[]>(() =>
    this.geneBiotypeBreakdownSource().map((row, index) => {
      return {
        bio_type: row.bio_type,
        display_label: row.display_label || row.bio_type || 'Unspecified gene biotype',
        total_count: row.total_count,
        color: GENE_BIOTYPE_COLORS[index % GENE_BIOTYPE_COLORS.length],
        categories: this.geneBiotypeCategoryColumns.map((column) => {
          const category = row.categories.find((item) => item.key === column.key);
          const count = category?.count ?? 0;
          const ratio = category?.ratio ?? 0;
          return {
            key: column.key,
            label: column.label,
            color: POSITION_CATEGORY_COLORS[column.key] ?? FALLBACK_POSITION_CATEGORY_COLOR,
            count,
            ratio,
            value: `${formatCount(count)} (${formatRatio(ratio)})`,
          };
        }),
      };
    }),
  );
  readonly geneBiotypeTotal = computed(() =>
    this.geneBiotypeBreakdown().reduce((sum, row) => sum + row.total_count, 0),
  );
  readonly geneBiotypeDoughnutData = computed<ChartData<'doughnut', number[], string>>(() => {
    const labels: string[] = [];
    const outerData: number[] = [];
    const innerData: number[] = [];
    const outerBackground: string[] = [];
    const innerBackground: string[] = [];

    for (const row of this.geneBiotypeBreakdown()) {
      row.categories.forEach((category, categoryIndex) => {
        labels.push(`${row.display_label} / ${category.label}`);
        outerData.push(categoryIndex === 0 ? row.total_count : 0);
        innerData.push(category.count);
        outerBackground.push(categoryIndex === 0 ? row.color : TRANSPARENT_CHART_SEGMENT);
        innerBackground.push(category.color);
      });
    }

    return {
      labels,
      datasets: [
        {
          label: 'Gene biotype',
          data: outerData,
          backgroundColor: outerBackground,
          hoverBackgroundColor: outerBackground,
          hoverOffset: 2,
          weight: 1,
        },
        {
          label: 'Position category within gene biotype',
          data: innerData,
          backgroundColor: innerBackground,
          hoverBackgroundColor: innerBackground,
          hoverOffset: 2,
          weight: 1,
        },
      ],
    };
  });
  private readonly geneBiotypeBreakdownSource = computed(() =>
    [...this.distribution().gene_biotype_breakdown]
      .sort((a, b) => {
        const totalComparison = b.total_count - a.total_count;
        if (totalComparison !== 0) {
          return totalComparison;
        }
        return a.display_label.localeCompare(b.display_label);
      })
      .slice(0, 12),
  );
  readonly summaryMetrics = computed<readonly PositionSummaryMetric[]>(() => {
    const distribution = this.distribution();
    const categories = distribution.categories;
    const total = distribution.total_count;
    const geneInside = categoryCount(categories, 'gene_inside');
    const upstream = categoryCount(categories, 'gene_upstream');
    const downstream = categoryCount(categories, 'gene_downstream');
    const otherFeature = categoryCount(categories, 'other_root_non_gene_feature');
    const nonFeature = categoryCount(categories, 'non_feature');
    const regulatoryNeighborhood = upstream + downstream;

    return [
      {
        key: 'total',
        label: `${this.motifTypeShortLabel()} sites`,
        value: formatCount(total),
        detail: 'Whole genome, all accessions',
      },
      {
        key: 'gene',
        label: 'In genes',
        value: formatRatio(total ? geneInside / total : 0),
        detail: `${formatCount(geneInside)} sites`,
      },
      {
        key: 'regulatory',
        label: 'In gene flanks',
        value: formatRatio(total ? regulatoryNeighborhood / total : 0),
        detail: `${formatCount(regulatoryNeighborhood)} sites within ${this.flankWindowLabel()}`,
      },
      {
        key: 'non-feature',
        label: 'Outside annotations',
        value: formatRatio(total ? nonFeature / total : 0),
        detail: `${formatCount(nonFeature)} outside; ${formatCount(otherFeature)} in other annotations`,
      },
    ];
  });
  readonly statisticsRows = computed<readonly PositionStatisticsCategoryView[]>(() =>
    this.statistics().windows.flatMap((window) => this.statisticsWindowRows(window)),
  );
  readonly strengthRows = computed<readonly PositionStrengthRow[]>(() =>
    this.statisticsRows().map((category) => ({
      id: category.key,
      category,
      stats: motifStatsForType(category, this.g4Type()),
    })),
  );
  readonly strengthBoxPlots = computed<readonly StrengthBoxPlotView[]>(() =>
    (
      [
        { key: 'score', title: 'Score' },
        { key: 'tetrads', title: 'Tetrads' },
        { key: 'length', title: 'Length' },
      ] as const
    ).map((metric) => this.createStrengthBoxPlot(metric.key, metric.title)),
  );
  readonly hasStatistics = computed(() => this.statistics().windows.length > 0);

  changeG4Type(value: G4Type): void {
    this.g4TypeChange.emit(value);
  }

  changeFlankWindow(value: G4FlankWindow): void {
    this.flankWindowChange.emit(value);
  }

  isSummaryCategoryVisible(key: string): boolean {
    return this.summaryVisibleCategoryKeys().includes(key);
  }

  changeSummaryCategoryVisibility(key: string, checked: boolean): void {
    this.summaryVisibleCategoryKeys.update((keys) => {
      if (checked) {
        return keys.includes(key) ? keys : [...keys, key];
      }
      return keys.filter((currentKey) => currentKey !== key);
    });
  }

  motifStats(category: PositionStatisticsCategoryView): G4PositionMotifStats {
    return motifStatsForType(category, this.g4Type());
  }

  onMinScoreInput(event: Event): void {
    this.changeMinScore(this.readInputValue(event));
  }

  onMaxScoreInput(event: Event): void {
    this.changeMaxScore(this.readInputValue(event));
  }

  changeSelectedTetrads(value: number[] | null): void {
    this.filterModelChange.emit({
      selectedTetrads: value ?? [],
      minScore: this.filterMinScore(),
      maxScore: this.filterMaxScore(),
    });
  }

  changeMinScore(rawValue: string): void {
    this.filterModelChange.emit({
      selectedTetrads: this.filterSelectedTetrads(),
      minScore: rawValue,
      maxScore: this.filterMaxScore(),
    });
  }

  changeMaxScore(rawValue: string): void {
    this.filterModelChange.emit({
      selectedTetrads: this.filterSelectedTetrads(),
      minScore: this.filterMinScore(),
      maxScore: rawValue,
    });
  }

  onApplyFilters(event?: Event): void {
    event?.preventDefault();
    this.applyFilters.emit();
  }

  onResetFilters(): void {
    this.resetFilters.emit();
  }

  private readInputValue(event: Event): string {
    return (event.target as HTMLInputElement | null)?.value ?? '';
  }

  private showGeneBiotypeDoughnutTooltip(context: TooltipItem<'doughnut'>): boolean {
    return context.datasetIndex !== 0 || Number(context.parsed) > 0;
  }

  private geneBiotypeDoughnutLegendLabels(chart: Chart<'doughnut'>): LegendItem[] {
    const slotCount = this.geneBiotypeCategoryColumns.length;
    return this.geneBiotypeBreakdown().map((row, rowIndex) => {
      const dataIndex = rowIndex * slotCount;
      return {
        datasetIndex: 0,
        fillStyle: row.color,
        hidden: !chart.getDataVisibility(dataIndex),
        index: dataIndex,
        lineWidth: 0,
        pointStyle: 'circle',
        strokeStyle: row.color,
        text: row.display_label,
      };
    });
  }

  private toggleGeneBiotypeDoughnutLegendItem(
    legendItem: LegendItem,
    chart: Chart<'doughnut'>,
  ): void {
    if (legendItem.index === undefined) {
      return;
    }

    const nextVisible = !chart.getDataVisibility(legendItem.index);
    for (let offset = 0; offset < this.geneBiotypeCategoryColumns.length; offset += 1) {
      const dataIndex = legendItem.index + offset;
      if (chart.getDataVisibility(dataIndex) !== nextVisible) {
        chart.toggleDataVisibility(dataIndex);
      }
    }
    chart.update();
  }

  private summaryDoughnutTooltipLabel(context: TooltipItem<'doughnut'>): string {
    const segment = this.summaryDoughnutSegments()[context.dataIndex];
    if (!segment) {
      return '';
    }
    return `${segment.label}: ${formatCount(segment.count)} (${formatRatio(segment.ratio)})`;
  }

  private geneBiotypeDoughnutTooltipLabel(context: TooltipItem<'doughnut'>): string {
    const rowIndex = Math.floor(context.dataIndex / this.geneBiotypeCategoryColumns.length);
    const categoryIndex = context.dataIndex % this.geneBiotypeCategoryColumns.length;
    const row = this.geneBiotypeBreakdown()[rowIndex];
    if (!row) {
      return '';
    }
    if (context.datasetIndex === 0) {
      return `${row.display_label}: ${formatCount(row.total_count)} (${formatRatio(
        this.geneBiotypeTotal() ? row.total_count / this.geneBiotypeTotal() : 0,
      )})`;
    }
    const category = row.categories[categoryIndex];
    return `${row.display_label} / ${category.label}: ${formatCount(category.count)} (${formatRatio(
      category.ratio,
    )})`;
  }

  private statisticsWindowRows(
    window: G4PositionStatisticsWindow,
  ): readonly PositionStatisticsCategoryView[] {
    return window.categories.map((category) => {
      const displayText = categoryDisplayText(category);
      return {
        ...category,
        ...displayText,
        color: POSITION_CATEGORY_COLORS[category.key] ?? FALLBACK_POSITION_CATEGORY_COLOR,
      };
    });
  }

  private createStrengthBoxPlot(key: StrengthBoxPlotKey, title: string): StrengthBoxPlotView {
    const metricRows = this.strengthRows()
      .map((row) => {
        const values = completeBoxPlotValues(row.stats, key);
        return values
          ? {
              row,
              values,
            }
          : null;
      })
      .filter(
        (
          row,
        ): row is { row: PositionStrengthRow; values: [number, number, number, number, number] } =>
          row !== null,
      );

    const flatValues = metricRows.flatMap((row) => row.values);
    const domainMin = Math.min(...flatValues);
    const domainMax = Math.max(...flatValues);

    return {
      key,
      title,
      minLabel: flatValues.length ? formatNullableNumber(domainMin) : 'N/A',
      maxLabel: flatValues.length ? formatNullableNumber(domainMax) : 'N/A',
      rows: metricRows.map(({ row, values }) => {
        const [minValue, q1Value, medianValue, p75Value, maxValue] = values;
        const minX = scaledBoxPlotX(minValue, domainMin, domainMax);
        const q1X = scaledBoxPlotX(q1Value, domainMin, domainMax);
        const medianX = scaledBoxPlotX(medianValue, domainMin, domainMax);
        const p75X = scaledBoxPlotX(p75Value, domainMin, domainMax);
        const maxX = scaledBoxPlotX(maxValue, domainMin, domainMax);
        return {
          key: row.category.key,
          label: row.category.displayLabel,
          color: row.category.color,
          minValue,
          q1Value,
          medianValue,
          p75Value,
          maxValue,
          minX,
          q1X,
          medianX,
          p75X,
          maxX,
          boxWidth: Math.max(1, p75X - q1X),
        };
      }),
    };
  }
}
