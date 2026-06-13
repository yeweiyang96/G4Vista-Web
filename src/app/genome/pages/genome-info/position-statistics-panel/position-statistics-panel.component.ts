import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  G4PositionMotifStats,
  G4PositionStatisticsCategory,
  G4PositionStatisticsResponse,
  G4Type,
} from '../../../services/g4.service';
import {
  defaultPositionStatisticsCategoryViews,
  formatCount,
  formatNullableNumber,
  PositionStatisticsCategoryView,
} from '../position-distribution/position-category-view';
import {
  StrengthBoxPlotDatum,
  StrengthBoxPlotVegaComponent,
} from '../position-distribution/strength-box-plot-vega.component';

interface DensityBarRow {
  key: string;
  label: string;
  color: string;
  count: number;
  lengthMb: number;
  densityPerMb: number | null;
  densityWidth: number;
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

function motifTypeLabel(g4Type: G4Type): string {
  return g4Type === 'i-motif' ? 'i-motif' : 'G4';
}

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
  selector: 'app-position-statistics-panel',
  imports: [MatProgressSpinnerModule, StrengthBoxPlotVegaComponent],
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
  readonly formatCount = formatCount;
  readonly formatNullableNumber = formatNullableNumber;
  readonly boxPlotTooltip = BOX_PLOT_TOOLTIP;
  readonly motifTypeLabel = computed(() => motifTypeLabel(this.g4Type()));
  readonly statisticsRows = computed<readonly PositionStatisticsCategoryView[]>(() =>
    this.statistics().windows.flatMap((window) =>
      defaultPositionStatisticsCategoryViews(window.categories, this.selectedCategoryKeys()),
    ),
  );
  readonly densityRows = computed<readonly DensityBarRow[]>(() => {
    const rows = this.statisticsRows().map((category) => {
      const stats = this.motifStats(category);
      return {
        key: category.key,
        label: category.displayLabel,
        color: category.color,
        count: stats.count,
        lengthMb: category.length_mb,
        densityPerMb: stats.density_per_mb,
      };
    });
    const maxDensity = rows.reduce(
      (maxValue, row) => Math.max(maxValue, row.densityPerMb ?? 0),
      0,
    );
    return rows.map((row) => ({
      ...row,
      densityWidth: maxDensity > 0 ? ((row.densityPerMb ?? 0) / maxDensity) * 100 : 0,
    }));
  });
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
  readonly hasStatistics = computed(() => this.statisticsRows().length > 0);

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
