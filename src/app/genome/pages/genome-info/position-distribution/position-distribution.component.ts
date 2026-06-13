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
import {
  StrengthBoxPlotDatum,
  StrengthBoxPlotVegaComponent,
} from './strength-box-plot-vega.component';

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

interface GeneBiotypeBreakdownSourceRow {
  readonly bio_type: string;
  readonly display_label: string;
  readonly total_count: number;
  readonly categories: readonly G4PositionCategory[];
}

interface PositionDistributionFilterModel {
  selectedTetrads: number[];
  minScore: string;
  maxScore: string;
}

type StrengthBoxPlotKey = 'score' | 'length';

interface SummaryDoughnutSegment {
  key: string;
  label: string;
  count: number;
  ratio: number;
  color: string;
}

interface StrengthBoxPlotView {
  key: StrengthBoxPlotKey;
  title: string;
  rows: readonly StrengthBoxPlotDatum[];
}

const POSITION_CATEGORY_COLORS: Record<string, string> = {
  gene_inside: '#2a6f68',
  gene_upstream: '#b75f2a',
  gene_downstream: '#6f5ba7',
};
const DISPLAYED_POSITION_CATEGORY_KEYS = [
  'gene_inside',
  'gene_upstream',
  'gene_downstream',
] as const;
const DISPLAYED_POSITION_CATEGORY_KEY_SET: ReadonlySet<string> = new Set<string>(
  DISPLAYED_POSITION_CATEGORY_KEYS,
);
const FALLBACK_POSITION_CATEGORY_COLOR = '#5f6368';
const MERGED_SUMMARY_CATEGORY_COLOR = '#87919f';
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
  densityPerMb: 'Motif count normalized by region size.',
  genomeEnrichment:
    'Category density divided by genome-wide motif density. 1x is genome average; values above 1x are enriched.',
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
    default:
      return category.label;
  }
}

function isDisplayedPositionCategoryKey(key: string): boolean {
  return DISPLAYED_POSITION_CATEGORY_KEY_SET.has(key);
}

function normalizedOptionalText(value: string | null): string | null {
  const normalizedValue = value?.trim() ?? '';
  return normalizedValue ? normalizedValue : null;
}

function displayedCategoryTotal(
  categories: readonly G4PositionCategory[],
  columns: readonly { key: string }[],
): number {
  return columns.reduce((sum, column) => sum + categoryCount(categories, column.key), 0);
}

function createGeneBiotypeSourceRow(
  row: G4GeneBiotypePositionBreakdown,
  columns: readonly { key: string }[],
): GeneBiotypeBreakdownSourceRow | null {
  const bioType = normalizedOptionalText(row.bio_type);
  if (!bioType) {
    return null;
  }

  const totalCount = displayedCategoryTotal(row.categories, columns);
  if (totalCount <= 0) {
    return null;
  }

  return {
    bio_type: bioType,
    display_label: normalizedOptionalText(row.display_label) ?? bioType,
    total_count: totalCount,
    categories: row.categories,
  };
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

function strengthIntroText(g4Type: G4Type): string {
  const motifLabel = motifTypeShortLabel(g4Type);
  return [
    `These plots summarize ${motifLabel} site properties by position category.`,
    `Score is the numeric score stored for each detected ${motifLabel} site and used by the Min score / Max score filters; the Score plot compares ${motifLabel} score distributions.`,
    'Length compares motif lengths in base pairs.',
  ].join(' ');
}

function formatFold(value: number | null): string {
  return formatNullableNumber(value, 'x');
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
    StrengthBoxPlotVegaComponent,
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
  readonly summaryVisibleCategoryKeys = signal<string[]>([...DISPLAYED_POSITION_CATEGORY_KEYS]);
  readonly formatCount = formatCount;
  readonly formatRatio = formatRatio;
  readonly formatNullableNumber = formatNullableNumber;
  readonly formatFold = formatFold;
  readonly statisticTooltips = POSITION_STATISTIC_TOOLTIPS;
  readonly motifTypeLabel = computed(() => motifTypeLabel(this.g4Type()));
  readonly motifTypeShortLabel = computed(() => motifTypeShortLabel(this.g4Type()));
  readonly strengthIntroText = computed(() => strengthIntroText(this.g4Type()));
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
          title: (contexts) => this.geneBiotypeDoughnutTooltipTitle(contexts),
          label: (context) => this.geneBiotypeDoughnutTooltipLabel(context),
        },
      },
    },
  };

  readonly categoryRows = computed<readonly PositionCategoryView[]>(() => {
    const categories = this.distribution().categories.filter((category) =>
      isDisplayedPositionCategoryKey(category.key),
    );
    const total = categories.reduce((sum, category) => sum + category.count, 0);

    return categories.map((category) => {
      const displayText = categoryDisplayText(category);
      return {
        ...category,
        ...displayText,
        ratio: total ? category.count / total : 0,
        color: POSITION_CATEGORY_COLORS[category.key] ?? FALLBACK_POSITION_CATEGORY_COLOR,
      };
    });
  });
  readonly displayedPositionTotal = computed(() =>
    this.categoryRows().reduce((sum, category) => sum + category.count, 0),
  );
  readonly summaryDoughnutSegments = computed<readonly SummaryDoughnutSegment[]>(() => {
    const selectedKeys = new Set(this.summaryVisibleCategoryKeys());
    const total = this.displayedPositionTotal();
    const separateSegments: SummaryDoughnutSegment[] = [];
    let mergedCount = 0;

    for (const category of this.categoryRows()) {
      if (selectedKeys.has(category.key)) {
        separateSegments.push({
          key: category.key,
          label: summaryChartLabel(category),
          count: category.count,
          ratio: total ? category.count / total : 0,
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
  readonly geneBiotypeCategoryColumns = GENE_BIOTYPE_CATEGORY_COLUMNS.map((column) => ({
    ...column,
    color: POSITION_CATEGORY_COLORS[column.key] ?? FALLBACK_POSITION_CATEGORY_COLOR,
  }));
  readonly geneBiotypeBreakdown = computed<readonly GeneBiotypeBreakdownView[]>(() =>
    this.geneBiotypeBreakdownSource().map((row, index) => {
      return {
        bio_type: row.bio_type,
        display_label: row.display_label,
        total_count: row.total_count,
        color: GENE_BIOTYPE_COLORS[index % GENE_BIOTYPE_COLORS.length],
        categories: this.geneBiotypeCategoryColumns.map((column) => {
          const category = row.categories.find((item) => item.key === column.key);
          const count = category?.count ?? 0;
          const ratio = row.total_count ? count / row.total_count : 0;
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
    this.distribution()
      .gene_biotype_breakdown.map((row) =>
        createGeneBiotypeSourceRow(row, this.geneBiotypeCategoryColumns),
      )
      .filter((row): row is GeneBiotypeBreakdownSourceRow => row !== null)
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
    const categories = this.distribution().categories;
    const total = this.displayedPositionTotal();
    const geneInside = categoryCount(categories, 'gene_inside');
    const upstream = categoryCount(categories, 'gene_upstream');
    const downstream = categoryCount(categories, 'gene_downstream');
    const regulatoryNeighborhood = upstream + downstream;

    return [
      {
        key: 'total',
        label: `${this.motifTypeShortLabel()} gene-context sites`,
        value: formatCount(total),
        detail: `Visible gene categories within ${this.flankWindowLabel()}`,
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
    ];
  });
  readonly statisticsRows = computed<readonly PositionStatisticsCategoryView[]>(() =>
    this.statistics()
      .windows.flatMap((window) => this.statisticsWindowRows(window))
      .filter((category) => isDisplayedPositionCategoryKey(category.key)),
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
        { key: 'length', title: 'Length' },
      ] as const
    ).map((metric) => this.createStrengthBoxPlot(metric.key, metric.title)),
  );
  readonly hasStatistics = computed(() => this.statisticsRows().length > 0);

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
      return `Total: ${formatCount(row.total_count)} (${formatRatio(
        this.geneBiotypeTotal() ? row.total_count / this.geneBiotypeTotal() : 0,
      )})`;
    }
    const category = row.categories[categoryIndex];
    if (!category) {
      return '';
    }
    return `${formatCount(category.count)} (${formatRatio(category.ratio)})`;
  }

  private geneBiotypeDoughnutTooltipTitle(contexts: TooltipItem<'doughnut'>[]): string {
    const context = contexts[0];
    if (!context) {
      return '';
    }

    const rowIndex = Math.floor(context.dataIndex / this.geneBiotypeCategoryColumns.length);
    const categoryIndex = context.dataIndex % this.geneBiotypeCategoryColumns.length;
    const row = this.geneBiotypeBreakdown()[rowIndex];
    if (!row) {
      return '';
    }
    if (context.datasetIndex === 0) {
      return row.display_label;
    }

    const category = row.categories[categoryIndex];
    if (!category) {
      return row.display_label;
    }
    return `${row.display_label} / ${category.label}`;
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

    return {
      key,
      title,
      rows: metricRows.map(({ row, values }) => {
        const [minValue, q1Value, medianValue, p75Value, maxValue] = values;
        return {
          key: row.category.key,
          label: row.category.displayLabel,
          color: row.category.color,
          minValue,
          q1Value,
          medianValue,
          p75Value,
          maxValue,
        };
      }),
    };
  }
}
