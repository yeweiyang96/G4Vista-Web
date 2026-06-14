import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import type { ChartData, ChartOptions, Plugin, TooltipItem } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { BaseChartDirective } from 'ng2-charts';
import {
  G4FlankWindow,
  G4_FLANK_WINDOW_OPTIONS,
  G4PositionDistributionResponse,
  G4Type,
} from '../../../services/g4.service';
import {
  categoryCount,
  defaultPositionCategoryViews,
  formatCount,
  formatRatio,
  formatNullableNumber,
  PositionCategoryView,
  summaryChartLabel,
} from './position-category-view';

interface PositionSummaryMetric {
  key: string;
  label: string;
  value: string;
  detail: string;
}

interface PositionDistributionFilterModel {
  selectedTetrads: number[];
  minScore: string;
  maxScore: string;
}

interface SummaryDoughnutSegment {
  key: string;
  label: string;
  count: number;
  ratio: number;
  color: string;
}

const OTHER_SUMMARY_CATEGORY_COLOR = '#a8adb7';
const OTHER_SUMMARY_CATEGORY_DESCRIPTION =
  'Predicted motif sites outside genes and selected gene flanks.';

function motifTypeShortLabel(g4Type: G4Type): string {
  return g4Type === 'i-motif' ? 'i-motif' : 'G4';
}

@Component({
  selector: 'app-position-distribution',
  imports: [
    BaseChartDirective,
    MatButtonModule,
    MatButtonToggleModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
  ],
  templateUrl: './position-distribution.component.html',
  styleUrl: './position-distribution.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PositionDistributionComponent {
  readonly distribution = input.required<G4PositionDistributionResponse>();
  readonly isLoading = input(false);
  readonly errorMessage = input('');
  readonly flankWindow = input.required<G4FlankWindow>();
  readonly flankWindowLabel = input.required<string>();
  readonly g4Type = input.required<G4Type>();
  readonly tetradOptions = input.required<readonly number[]>();
  readonly filterSelectedTetrads = input<number[]>([]);
  readonly filterMinScore = input('');
  readonly filterMaxScore = input('');
  readonly selectedCategoryKeys = input.required<readonly string[]>();
  readonly g4TypeChange = output<G4Type>();
  readonly flankWindowChange = output<G4FlankWindow>();
  readonly filterModelChange = output<PositionDistributionFilterModel>();
  readonly applyFilters = output<void>();
  readonly resetFilters = output<void>();
  readonly categorySelectionChange = output<readonly string[]>();
  readonly flankWindowOptions = G4_FLANK_WINDOW_OPTIONS;
  readonly formatCount = formatCount;
  readonly formatRatio = formatRatio;
  readonly formatNullableNumber = formatNullableNumber;
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
        display: false,
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

  readonly categoryRows = computed<readonly PositionCategoryView[]>(() =>
    defaultPositionCategoryViews(this.distribution().categories),
  );
  readonly displayedPositionTotal = computed(
    () =>
      this.categoryRows().reduce((sum, category) => sum + category.count, 0) +
      (this.hasDisplayedOtherCategory() ? 0 : this.otherPositionCount()),
  );
  readonly hasDisplayedOtherCategory = computed(() =>
    this.categoryRows().some((category) => category.key === 'other'),
  );
  readonly selectedCategoryRows = computed<readonly PositionCategoryView[]>(() => {
    const selectedKeys = new Set(this.selectedCategoryKeys());
    return this.categoryRows().filter((category) => selectedKeys.has(category.key));
  });
  readonly selectedPositionTotal = computed(() =>
    this.selectedCategoryRows().reduce((sum, category) => sum + category.count, 0),
  );
  readonly otherPositionCount = computed(() => {
    const categories = this.distribution().categories;
    const apiOtherCount = categoryCount(categories, 'other');
    if (categories.some((category) => category.key === 'other')) {
      return apiOtherCount;
    }

    const total = this.distribution().total_count;
    const geneInside = categoryCount(categories, 'gene_inside');
    const upstream = categoryCount(categories, 'gene_upstream');
    const downstream = categoryCount(categories, 'gene_downstream');
    return Math.max(0, total - geneInside - upstream - downstream);
  });
  readonly chartLegendRows = computed<readonly SummaryDoughnutSegment[]>(() => {
    const total = this.displayedPositionTotal();
    return [
      ...this.categoryRows().map((category) => ({
        key: category.key,
        label: category.displayLabel,
        count: category.count,
        ratio: total ? category.count / total : 0,
        color: category.color,
      })),
      ...this.fallbackOtherSegments(total),
    ];
  });
  readonly summaryDoughnutSegments = computed<readonly SummaryDoughnutSegment[]>(() => {
    const selectedKeys = new Set(this.selectedCategoryKeys());
    const total = this.displayedPositionTotal();
    const segments: SummaryDoughnutSegment[] = [];

    for (const category of this.categoryRows()) {
      if (selectedKeys.has(category.key)) {
        segments.push({
          key: category.key,
          label: summaryChartLabel(category),
          count: category.count,
          ratio: total ? category.count / total : 0,
          color: category.color,
        });
      }
    }

    if (!this.hasDisplayedOtherCategory() && selectedKeys.has('other')) {
      segments.push(...this.fallbackOtherSegments(total).filter((segment) => segment.count > 0));
    }

    return segments;
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
  readonly summaryMetrics = computed<readonly PositionSummaryMetric[]>(() => {
    const categories = this.distribution().categories;
    const total = this.distribution().total_count;
    const geneInside = categoryCount(categories, 'gene_inside');
    const upstream = categoryCount(categories, 'gene_upstream');
    const downstream = categoryCount(categories, 'gene_downstream');
    const geneFlanks = upstream + downstream;

    return [
      {
        key: 'total',
        label: `${this.motifTypeShortLabel()} sites`,
        value: formatCount(total),
        detail: 'Total predicted sites',
      },
      {
        key: 'gene',
        label: 'In genes',
        value: formatCount(geneInside),
        detail: 'sites in genes',
      },
      {
        key: 'regulatory',
        label: `In gene flanks (${this.flankWindowLabel()})`,
        value: formatCount(geneFlanks),
        detail: 'sites in selected flanks',
      },
      {
        key: 'other',
        label: 'Other',
        value: formatCount(this.otherPositionCount()),
        detail: 'sites outside genes and selected flanks',
      },
    ];
  });

  chartLegendDescription(key: string): string {
    if (key === 'other') {
      return OTHER_SUMMARY_CATEGORY_DESCRIPTION;
    }
    return this.categoryRows().find((category) => category.key === key)?.displayDescription ?? '';
  }

  private fallbackOtherSegments(total: number): readonly SummaryDoughnutSegment[] {
    if (this.hasDisplayedOtherCategory()) {
      return [];
    }

    const count = this.otherPositionCount();
    return [
      {
        key: 'other',
        label: 'Other',
        count,
        ratio: total ? count / total : 0,
        color: OTHER_SUMMARY_CATEGORY_COLOR,
      },
    ];
  }

  changeG4Type(value: G4Type): void {
    this.g4TypeChange.emit(value);
  }

  metricIcon(key: string): string {
    switch (key) {
      case 'total':
        return 'view_in_ar';
      case 'gene':
        return 'linear_scale';
      case 'regulatory':
        return 'sync_alt';
      case 'other':
        return 'block';
      default:
        return 'block';
    }
  }

  changeFlankWindow(value: G4FlankWindow): void {
    this.flankWindowChange.emit(value);
  }

  isSummaryCategoryVisible(key: string): boolean {
    return this.selectedCategoryKeys().includes(key);
  }

  changeSummaryCategoryVisibility(key: string, checked: boolean): void {
    const currentKeys = this.selectedCategoryKeys();
    if (checked) {
      this.categorySelectionChange.emit(
        currentKeys.includes(key) ? currentKeys : [...currentKeys, key],
      );
      return;
    }
    if (currentKeys.length <= 1) {
      return;
    }
    this.categorySelectionChange.emit(currentKeys.filter((currentKey) => currentKey !== key));
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

  private summaryDoughnutTooltipLabel(context: TooltipItem<'doughnut'>): string {
    const segment = this.summaryDoughnutSegments()[context.dataIndex];
    if (!segment) {
      return '';
    }
    return `${segment.label}: ${formatCount(segment.count)} (${formatRatio(segment.ratio)})`;
  }
}
