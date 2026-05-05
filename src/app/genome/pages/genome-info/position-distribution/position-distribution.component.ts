import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
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
  window_bp: number;
  windowLabel: string;
}

interface PositionStrengthRow {
  id: string;
  category: PositionStatisticsCategoryView;
  motifType: G4Type;
  motifLabel: string;
  stats: G4PositionMotifStats;
}

interface PositionWindowSensitivityRow {
  id: string;
  category: PositionStatisticsCategoryView;
  normalDensityRatio: number;
  revcompDensityRatio: number;
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
  minGscore: string;
  maxGscore: string;
}

const POSITION_CATEGORY_COLORS: Record<string, string> = {
  gene_inside: '#2a6f68',
  gene_upstream: '#b75f2a',
  gene_downstream: '#6f5ba7',
  other_root_non_gene_feature: '#b33f62',
  non_feature: '#58606f',
};
const FALLBACK_POSITION_CATEGORY_COLOR = '#5f6368';
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
const SIGNED_PERCENT_FORMATTER = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 1,
  minimumFractionDigits: 0,
  signDisplay: 'exceptZero',
  style: 'percent',
});
const POSITION_STATISTIC_TOOLTIPS = {
  window: 'Upstream/downstream flank size used for this statistics row.',
  category: 'Mutually exclusive genomic position category used for this statistics row.',
  type: 'Motif class: G4 for normal calls and i-motif for reverse-complement calls.',
  count: 'Observed motif count assigned to this category.',
  intervalLength: 'Category denominator is the merged non-overlapping interval length.',
  densityPerMb: 'Motif count divided by merged interval length in megabases.',
  foldVsGenome: 'Category density divided by genome-wide density.',
  foldVsNonFeature: 'Category density divided by non-feature density.',
  medianP95: 'Median is the typical value; p95 is the 95th percentile, not the maximum.',
  fraction: 'Share of G4 or i-motif counts within the same category.',
  fractionDelta: 'G4 fraction minus i-motif fraction in the same category.',
  densityRatio:
    'G4 density divided by i-motif density; N/A when denominator is zero or unavailable.',
  relativeDensity:
    'Bar scaled to the largest upstream/downstream density for that motif type across displayed windows; not a time trend.',
  geneBiotypeBreakdown:
    'Ratios are within each gene biotype row; the same site can appear in multiple biotype rows when it has multiple gene relations.',
  geneBiotypeDonut:
    'Outer ring shows displayed gene biotype share; inner ring splits each biotype span by position category.',
} as const;
const TRANSPARENT_CHART_SEGMENT = 'rgba(0, 0, 0, 0)';
const GENE_BIOTYPE_CATEGORY_COLUMNS = [
  { key: 'gene_inside', label: 'Inside genes' },
  { key: 'gene_upstream', label: 'Upstream' },
  { key: 'gene_downstream', label: 'Downstream' },
  { key: 'other_root_non_gene_feature', label: 'Root non-gene' },
  { key: 'non_feature', label: 'Non-feature' },
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
  return g4Type === 'revcomp' ? 'i-motif sequence sites' : 'G4 sequence sites';
}

function categoryDisplayText(
  category: Pick<G4PositionCategory, 'key' | 'label' | 'description'>,
  flankWindowLabel: string,
): Pick<PositionCategoryView, 'displayLabel' | 'displayDescription'> {
  switch (category.key) {
    case 'gene_inside':
      return {
        displayLabel: 'Inside annotated genes',
        displayDescription: 'Predicted G4/i-motif sites that fall within annotated gene intervals.',
      };
    case 'gene_upstream':
      return {
        displayLabel: `Within ${flankWindowLabel} upstream of genes`,
        displayDescription: 'Predicted G4/i-motif sites in the upstream gene-neighbor window.',
      };
    case 'gene_downstream':
      return {
        displayLabel: `Within ${flankWindowLabel} downstream of genes`,
        displayDescription: 'Predicted G4/i-motif sites in the downstream gene-neighbor window.',
      };
    case 'other_root_non_gene_feature':
      return {
        displayLabel: 'Inside root non-gene features',
        displayDescription:
          'Predicted G4/i-motif sites assigned to parentless non-gene annotations such as promoters or repeat regions.',
      };
    case 'non_feature':
      return {
        displayLabel: 'No gene or root-feature assignment',
        displayDescription:
          'Predicted G4/i-motif sites outside genes, gene-neighbor windows, and root non-gene features.',
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
      return 'Inside genes';
    case 'gene_upstream':
      return 'Upstream';
    case 'gene_downstream':
      return 'Downstream';
    case 'other_root_non_gene_feature':
      return 'Root non-gene';
    case 'non_feature':
      return 'Non-feature';
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

function formatWindowLabel(windowBp: number): string {
  return windowBp >= 1000 ? `${windowBp / 1000} kb` : `${windowBp} bp`;
}

function formatNullableNumber(value: number | null, suffix = ''): string {
  return value === null ? 'N/A' : `${NUMBER_FORMATTER.format(value)}${suffix}`;
}

function formatNullablePercent(value: number | null): string {
  return value === null ? 'N/A' : PERCENT_FORMATTER.format(value);
}

function formatSignedPercent(value: number | null): string {
  return value === null ? 'N/A' : SIGNED_PERCENT_FORMATTER.format(value);
}

function motifTypeShortLabel(g4Type: G4Type): string {
  return g4Type === 'revcomp' ? 'i-motif' : 'G4';
}

@Component({
  selector: 'app-position-distribution',
  imports: [
    BaseChartDirective,
    MatButtonModule,
    MatButtonToggleModule,
    MatCardModule,
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
  readonly filterMinGscore = input('');
  readonly filterMaxGscore = input('');
  readonly g4TypeChange = output<G4Type>();
  readonly flankWindowChange = output<G4FlankWindow>();
  readonly filterModelChange = output<PositionDistributionFilterModel>();
  readonly applyFilters = output<void>();
  readonly resetFilters = output<void>();
  readonly flankWindowOptions = G4_FLANK_WINDOW_OPTIONS;
  readonly formatCount = formatCount;
  readonly formatRatio = formatRatio;
  readonly formatNullableNumber = formatNullableNumber;
  readonly formatNullablePercent = formatNullablePercent;
  readonly formatSignedPercent = formatSignedPercent;
  readonly statisticTooltips = POSITION_STATISTIC_TOOLTIPS;
  readonly motifTypeLabel = computed(() => motifTypeLabel(this.g4Type()));
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
      const displayText = categoryDisplayText(category, this.flankWindowLabel());
      return {
        ...category,
        ...displayText,
        color: POSITION_CATEGORY_COLORS[category.key] ?? FALLBACK_POSITION_CATEGORY_COLOR,
      };
    }),
  );
  readonly summaryDoughnutData = computed<ChartData<'doughnut', number[], string>>(() => {
    const categories = this.categoryRows();
    return {
      labels: categories.map((category) => summaryChartLabel(category)),
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
        label: 'Predicted G4/i-motif sites',
        value: formatCount(total),
        detail: 'Whole genome, all accessions',
      },
      {
        key: 'gene',
        label: 'Inside annotated genes',
        value: formatRatio(total ? geneInside / total : 0),
        detail: `${formatCount(geneInside)} G4/i-motif sites`,
      },
      {
        key: 'regulatory',
        label: `Within ${this.flankWindowLabel()} of genes`,
        value: formatRatio(total ? regulatoryNeighborhood / total : 0),
        detail: `${formatCount(regulatoryNeighborhood)} upstream or downstream sites`,
      },
      {
        key: 'non-feature',
        label: 'Outside annotated features',
        value: formatRatio(total ? nonFeature / total : 0),
        detail: `${formatCount(nonFeature)} unassigned; ${formatCount(otherFeature)} in root non-gene features`,
      },
    ];
  });
  readonly statisticsRows = computed<readonly PositionStatisticsCategoryView[]>(() =>
    this.statistics().windows.flatMap((window) => this.statisticsWindowRows(window)),
  );
  readonly strengthRows = computed<readonly PositionStrengthRow[]>(() =>
    this.statisticsRows().flatMap((category) =>
      (['normal', 'revcomp'] as const).map((motifType) => ({
        id: `${category.window_bp}:${category.key}:${motifType}`,
        category,
        motifType,
        motifLabel: motifTypeShortLabel(motifType),
        stats: category.motifs[motifType],
      })),
    ),
  );
  readonly asymmetryRows = computed<readonly PositionStatisticsCategoryView[]>(() =>
    this.statisticsRows().filter((category) => category.key !== 'non_feature'),
  );
  readonly windowSensitivityRows = computed<readonly PositionWindowSensitivityRow[]>(() => {
    const rows = this.statisticsRows().filter(
      (category) => category.key === 'gene_upstream' || category.key === 'gene_downstream',
    );
    const sortedRows = [...rows].sort((a, b) => {
      const labelComparison = a.label.localeCompare(b.label);
      if (labelComparison !== 0) {
        return labelComparison;
      }
      return a.window_bp - b.window_bp;
    });
    const maxNormalDensity = Math.max(
      0,
      ...sortedRows.map((row) => row.motifs.normal.density_per_mb ?? 0),
    );
    const maxRevcompDensity = Math.max(
      0,
      ...sortedRows.map((row) => row.motifs.revcomp.density_per_mb ?? 0),
    );
    return sortedRows.map((category) => ({
      id: `${category.window_bp}:${category.key}`,
      category,
      normalDensityRatio: maxNormalDensity
        ? ((category.motifs.normal.density_per_mb ?? 0) / maxNormalDensity) * 100
        : 0,
      revcompDensityRatio: maxRevcompDensity
        ? ((category.motifs.revcomp.density_per_mb ?? 0) / maxRevcompDensity) * 100
        : 0,
    }));
  });
  readonly hasStatistics = computed(() => this.statistics().windows.length > 0);

  changeG4Type(value: G4Type): void {
    this.g4TypeChange.emit(value);
  }

  changeFlankWindow(value: G4FlankWindow): void {
    this.flankWindowChange.emit(value);
  }

  onMinGscoreInput(event: Event): void {
    this.changeMinGscore(this.readInputValue(event));
  }

  onMaxGscoreInput(event: Event): void {
    this.changeMaxGscore(this.readInputValue(event));
  }

  changeSelectedTetrads(value: number[] | null): void {
    this.filterModelChange.emit({
      selectedTetrads: value ?? [],
      minGscore: this.filterMinGscore(),
      maxGscore: this.filterMaxGscore(),
    });
  }

  changeMinGscore(rawValue: string): void {
    this.filterModelChange.emit({
      selectedTetrads: this.filterSelectedTetrads(),
      minGscore: rawValue,
      maxGscore: this.filterMaxGscore(),
    });
  }

  changeMaxGscore(rawValue: string): void {
    this.filterModelChange.emit({
      selectedTetrads: this.filterSelectedTetrads(),
      minGscore: this.filterMinGscore(),
      maxGscore: rawValue,
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
    const category = this.categoryRows()[context.dataIndex];
    if (!category) {
      return '';
    }
    return `${category.displayLabel}: ${formatCount(category.count)} (${formatRatio(
      category.ratio,
    )})`;
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
      const displayText = categoryDisplayText(category, formatWindowLabel(window.window_bp));
      return {
        ...category,
        ...displayText,
        color: POSITION_CATEGORY_COLORS[category.key] ?? FALLBACK_POSITION_CATEGORY_COLOR,
        window_bp: window.window_bp,
        windowLabel: formatWindowLabel(window.window_bp),
      };
    });
  }
}
