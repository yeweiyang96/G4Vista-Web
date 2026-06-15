import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  G4PositionMotifStats,
  G4PositionStatisticsCategory,
  G4PositionStatisticsGeneBiotypeBreakdown,
  G4PositionStatisticsGeneBiotypeCategory,
  G4PositionStatisticsResponse,
  G4Type,
} from '../../../services/g4.service';
import { canonicalGeneBiotype } from '../../../../shared/gene-biotype';
import {
  categoryDisplayText,
  defaultPositionStatisticsCategoryViews,
  formatCount,
  formatNullableNumber,
  PositionStatisticsCategoryView,
  positionCategoryColor,
} from '../position-distribution/position-category-view';
import {
  StrengthBoxPlotDatum,
  StrengthBoxPlotVegaComponent,
} from '../position-distribution/strength-box-plot-vega.component';

type GeneContextCategoryKey = 'gene_inside' | 'gene_upstream' | 'gene_downstream';

interface GeneBiotypeDensityCell {
  key: GeneContextCategoryKey;
  label: string;
  color: string;
  count: number;
  lengthMb: number;
  densityPerMb: number | null;
}

interface GeneBiotypeDensityRow {
  key: string;
  label: string;
  totalCount: number;
  isOther: boolean;
  cells: readonly GeneBiotypeDensityCell[];
}

interface PositionStrengthRow {
  id: string;
  category: PositionStatisticsCategoryView;
  stats: G4PositionMotifStats;
}

type StrengthBoxPlotKey = 'score' | 'length';

interface StrengthBoxPlotView {
  key: StrengthBoxPlotKey;
  title: string;
  rows: readonly StrengthBoxPlotDatum[];
}

const BOX_PLOT_TOOLTIP =
  'Whiskers show minimum and maximum. The box spans q1 to p75, with the median line inside.';
const MAX_VISIBLE_NON_OTHER_BIOTYPE_ROWS = 11;
const LENGTH_MB_FORMATTER = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 3,
  minimumFractionDigits: 0,
});
const GENE_CONTEXT_CATEGORY_KEYS: readonly GeneContextCategoryKey[] = [
  'gene_inside',
  'gene_upstream',
  'gene_downstream',
];

const EMPTY_MOTIF_STATS: G4PositionMotifStats = {
  count: 0,
  density_per_mb: null,
  expected_vs_genome: null,
  fold_vs_genome: null,
  fold_vs_other: null,
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

function motifTypeLabel(g4Type: G4Type): string {
  return g4Type === 'i-motif' ? 'i-motif' : 'G4';
}

function formatLengthMb(value: number): string {
  return LENGTH_MB_FORMATTER.format(value);
}

function motifStatsForType(
  source: Pick<G4PositionStatisticsCategory, 'motifs'>,
  g4Type: G4Type,
): G4PositionMotifStats {
  return source.motifs[g4Type] ?? EMPTY_MOTIF_STATS;
}

function biotypeRowKey(row: G4PositionStatisticsGeneBiotypeBreakdown): string {
  return canonicalGeneBiotype(row.bio_type || row.display_label);
}

function biotypeRowLabel(row: G4PositionStatisticsGeneBiotypeBreakdown): string {
  const canonicalValue = biotypeRowKey(row);
  if (canonicalValue === 'other') {
    return 'Other';
  }
  return row.display_label.trim() || canonicalValue;
}

function categoryByKey(
  categories: readonly G4PositionStatisticsGeneBiotypeCategory[],
  key: GeneContextCategoryKey,
): G4PositionStatisticsGeneBiotypeCategory | null {
  return categories.find((category) => category.key === key) ?? null;
}

function emptyBiotypeCategory(
  key: GeneContextCategoryKey,
): G4PositionStatisticsGeneBiotypeCategory {
  const displayText = categoryDisplayText({
    key,
    label: key,
    description: '',
  });
  return {
    key,
    label: displayText.displayLabel,
    description: displayText.displayDescription,
    precedence_rank: GENE_CONTEXT_CATEGORY_KEYS.indexOf(key) + 1,
    display_label: displayText.displayLabel,
    display_description: displayText.displayDescription,
    category_group: 'gene_context',
    is_default_chart_category: true,
    display_order: GENE_CONTEXT_CATEGORY_KEYS.indexOf(key) + 1,
    count: 0,
    merged_interval_length_bp: 0,
    length_mb: 0,
    motifs: {},
  };
}

function biotypeDensityCell(
  categories: readonly G4PositionStatisticsGeneBiotypeCategory[],
  key: GeneContextCategoryKey,
  g4Type: G4Type,
): GeneBiotypeDensityCell {
  const category = categoryByKey(categories, key) ?? emptyBiotypeCategory(key);
  const displayText = categoryDisplayText(category);
  const stats = motifStatsForType(category, g4Type);
  return {
    key,
    label: displayText.displayLabel,
    color: positionCategoryColor(key),
    count: stats.count,
    lengthMb: category.length_mb,
    densityPerMb: stats.density_per_mb,
  };
}

function biotypeDensityRow(
  row: G4PositionStatisticsGeneBiotypeBreakdown,
  g4Type: G4Type,
): GeneBiotypeDensityRow {
  const key = biotypeRowKey(row);
  return {
    key,
    label: biotypeRowLabel(row),
    totalCount: row.total_count,
    isOther: key === 'other',
    cells: GENE_CONTEXT_CATEGORY_KEYS.map((categoryKey) =>
      biotypeDensityCell(row.categories, categoryKey, g4Type),
    ),
  };
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
  selector: 'app-position-statistics-panel',
  imports: [MatExpansionModule, MatProgressSpinnerModule, StrengthBoxPlotVegaComponent],
  templateUrl: './position-statistics-panel.component.html',
  styleUrl: './position-statistics-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PositionStatisticsPanelComponent {
  readonly statistics = input.required<G4PositionStatisticsResponse>();
  readonly isLoading = input(false);
  readonly errorMessage = input('');
  readonly g4Type = input.required<G4Type>();
  readonly selectedCategoryKeys = input.required<readonly string[]>();
  readonly geneContextColumns = GENE_CONTEXT_CATEGORY_KEYS.map((key) => {
    const displayText = categoryDisplayText({
      key,
      label: key,
      description: '',
    });
    return {
      key,
      label: displayText.displayLabel,
      color: positionCategoryColor(key),
    };
  });
  readonly formatCount = formatCount;
  readonly formatLengthMb = formatLengthMb;
  readonly formatNullableNumber = formatNullableNumber;
  readonly boxPlotTooltip = BOX_PLOT_TOOLTIP;
  readonly motifTypeLabel = computed(() => motifTypeLabel(this.g4Type()));
  readonly statisticsRows = computed<readonly PositionStatisticsCategoryView[]>(() =>
    this.statistics().windows.flatMap((window) =>
      defaultPositionStatisticsCategoryViews(window.categories, this.selectedCategoryKeys()),
    ),
  );
  readonly biotypeDensityRows = computed<readonly GeneBiotypeDensityRow[]>(() =>
    this.statistics().windows.flatMap((window) =>
      (window.gene_biotype_breakdown ?? []).map((row) => biotypeDensityRow(row, this.g4Type())),
    ),
  );
  readonly visibleBiotypeDensityRows = computed<readonly GeneBiotypeDensityRow[]>(() => [
    ...this.biotypeDensityRows().filter((row) => row.isOther),
    ...this.biotypeDensityRows()
      .filter((row) => !row.isOther)
      .slice(0, MAX_VISIBLE_NON_OTHER_BIOTYPE_ROWS),
  ]);
  readonly additionalBiotypeDensityRows = computed<readonly GeneBiotypeDensityRow[]>(() =>
    this.biotypeDensityRows()
      .filter((row) => !row.isOther)
      .slice(MAX_VISIBLE_NON_OTHER_BIOTYPE_ROWS),
  );
  readonly strengthRows = computed<readonly PositionStrengthRow[]>(() =>
    this.statisticsRows().map((category) => ({
      id: category.key,
      category,
      stats: this.motifStats(category),
    })),
  );
  readonly strengthBoxPlots = computed<readonly StrengthBoxPlotView[]>(() =>
    (
      [
        { key: 'score', title: 'G-score distribution' },
        { key: 'length', title: 'Length distribution' },
      ] as const
    ).map((metric) => this.createStrengthBoxPlot(metric.key, metric.title)),
  );
  readonly hasBiotypeDensity = computed(() => this.biotypeDensityRows().length > 0);
  readonly hasStatistics = computed(
    () => this.hasBiotypeDensity() || this.statisticsRows().length > 0,
  );

  motifStats(category: PositionStatisticsCategoryView): G4PositionMotifStats {
    return motifStatsForType(category, this.g4Type());
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
