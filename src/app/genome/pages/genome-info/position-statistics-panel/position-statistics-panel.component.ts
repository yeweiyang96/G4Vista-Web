import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  G4PositionCategoryStats,
  G4PositionStatisticsBiotypeCategory,
  G4PositionStatisticsCategory,
  G4PositionStatisticsResponse,
  G4PositionStatisticsWindow,
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
  cells: readonly GeneBiotypeDensityCell[];
}

interface PositionStrengthRow {
  id: string;
  category: PositionStatisticsCategoryView;
  stats: G4PositionCategoryStats;
}

type StrengthBoxPlotKey = 'score' | 'length';

interface StrengthBoxPlotView {
  key: StrengthBoxPlotKey;
  title: string;
  rows: readonly StrengthBoxPlotDatum[];
}

const BOX_PLOT_TOOLTIP =
  'Whiskers show minimum and maximum. The box spans q1 to p75, with the median line inside.';
const MAX_VISIBLE_BIOTYPE_ROWS = 12;
const LENGTH_MB_FORMATTER = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 3,
  minimumFractionDigits: 0,
});
const GENE_CONTEXT_CATEGORY_KEYS: readonly GeneContextCategoryKey[] = [
  'gene_inside',
  'gene_upstream',
  'gene_downstream',
];

const EMPTY_CATEGORY_STATS: G4PositionCategoryStats = {
  count: 0,
  denominator_bp: 0,
  denominator_mode: null,
  density_per_mb: null,
  min_score: null,
  q1_score: null,
  median_score: null,
  p75_score: null,
  max_score: null,
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

function categoryStatsForType(
  source: Pick<G4PositionStatisticsCategory, 'quadruplex_types'>,
  g4Type: G4Type,
): G4PositionCategoryStats {
  return source.quadruplex_types?.[g4Type] ?? EMPTY_CATEGORY_STATS;
}

function biotypeCategoryLabel(biotype: string): string {
  const canonicalValue = canonicalGeneBiotype(biotype);
  if (canonicalValue === 'other') {
    return 'Other';
  }
  return biotype.trim() || 'Unspecified';
}

function biotypeCategoryCell(
  categories: readonly G4PositionStatisticsBiotypeCategory[],
  key: GeneContextCategoryKey,
  g4Type: G4Type,
): GeneBiotypeDensityCell {
  const category = categories.find((candidate) => candidate.category === key) ?? null;
  const stats = category?.quadruplex_types[g4Type] ?? null;
  const displayText = categoryDisplayText({
    key,
    label: key,
    description: '',
  });
  return {
    key,
    label: displayText.displayLabel,
    color: positionCategoryColor(key),
    count: stats?.count ?? 0,
    lengthMb: stats ? stats.denominator_bp / 1_000_000 : 0,
    densityPerMb: stats?.density_per_mb ?? null,
  };
}

function groupedBiotypeCategories(
  categories: readonly G4PositionStatisticsBiotypeCategory[],
): readonly {
  biotype: string;
  categories: readonly G4PositionStatisticsBiotypeCategory[];
}[] {
  const grouped = new Map<string, readonly G4PositionStatisticsBiotypeCategory[]>();
  for (const category of categories) {
    grouped.set(category.biotype, [...(grouped.get(category.biotype) ?? []), category]);
  }
  return Array.from(grouped.entries()).map(([biotype, biotypeCategories]) => ({
    biotype,
    categories: biotypeCategories,
  }));
}

function biotypeCategoryDensityRow(
  biotype: string,
  categories: readonly G4PositionStatisticsBiotypeCategory[],
  g4Type: G4Type,
): GeneBiotypeDensityRow {
  const cells = GENE_CONTEXT_CATEGORY_KEYS.map((categoryKey) =>
    biotypeCategoryCell(categories, categoryKey, g4Type),
  );
  return {
    key: canonicalGeneBiotype(biotype),
    label: biotypeCategoryLabel(biotype),
    totalCount: cells.reduce((sum, cell) => sum + cell.count, 0),
    cells,
  };
}

function biotypeDensityRowsForWindow(
  window: G4PositionStatisticsWindow,
  g4Type: G4Type,
): readonly GeneBiotypeDensityRow[] {
  return groupedBiotypeCategories(window.biotype_categories ?? []).map((group) =>
    biotypeCategoryDensityRow(group.biotype, group.categories, g4Type),
  );
}

function compareBiotypeDensityRows(
  left: GeneBiotypeDensityRow,
  right: GeneBiotypeDensityRow,
): number {
  const countDifference = right.totalCount - left.totalCount;
  if (countDifference !== 0) {
    return countDifference;
  }
  return left.label.localeCompare(right.label, 'en', {
    numeric: true,
    sensitivity: 'base',
  });
}

function completeBoxPlotValues(
  stats: G4PositionCategoryStats,
  metric: StrengthBoxPlotKey,
): [number, number, number, number, number] | null {
  const values: [
    number | null | undefined,
    number | null | undefined,
    number | null | undefined,
    number | null | undefined,
    number | null | undefined,
  ] =
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
    minValue == null ||
    q1Value == null ||
    medianValue == null ||
    p75Value == null ||
    maxValue == null
  ) {
    return null;
  }
  return [minValue, q1Value, medianValue, p75Value, maxValue];
}

@Component({
  selector: 'app-position-statistics-panel',
  imports: [
    MatExpansionModule,
    MatIconModule,
    MatProgressSpinnerModule,
    StrengthBoxPlotVegaComponent,
  ],
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
    this.statistics()
      .windows.flatMap((window) => biotypeDensityRowsForWindow(window, this.g4Type()))
      .sort(compareBiotypeDensityRows),
  );
  readonly visibleBiotypeDensityRows = computed<readonly GeneBiotypeDensityRow[]>(() =>
    this.biotypeDensityRows().slice(0, MAX_VISIBLE_BIOTYPE_ROWS),
  );
  readonly additionalBiotypeDensityRows = computed<readonly GeneBiotypeDensityRow[]>(() =>
    this.biotypeDensityRows().slice(MAX_VISIBLE_BIOTYPE_ROWS),
  );
  readonly strengthRows = computed<readonly PositionStrengthRow[]>(() =>
    this.statisticsRows().map((category) => ({
      id: category.key,
      category,
      stats: this.categoryStats(category),
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
  readonly hasStrengthBoxPlotData = computed(() =>
    this.strengthBoxPlots().some((plot) => plot.rows.length > 0),
  );
  readonly hasBiotypeDensity = computed(() => this.biotypeDensityRows().length > 0);
  readonly hasStatistics = computed(
    () => this.hasBiotypeDensity() || this.statisticsRows().length > 0,
  );

  categoryStats(category: PositionStatisticsCategoryView): G4PositionCategoryStats {
    return categoryStatsForType(category, this.g4Type());
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
