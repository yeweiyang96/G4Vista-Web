import { DOCUMENT, DecimalPipe, TitleCasePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  effect,
  inject,
  OnDestroy,
  signal,
  untracked,
  ViewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, ParamMap, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { Sort } from '@angular/material/sort';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MtxGridColumn, MtxGridModule } from '@ng-matero/extensions/grid';
import type { VisualizationSpec } from 'vega-embed';
import { finalize, Observable } from 'rxjs';
import {
  EnvironmentCategoryBoxplotResponse,
  EnvironmentCategoryOption,
  EnvironmentChartKind,
  EnvironmentDownloadMode,
  EnvironmentDownloadRequest,
  EnvironmentNumericScatterPoint,
  EnvironmentNumericScatterResponse,
  EnvironmentOptionsResponse,
  EnvironmentOutcomeMetric,
  EnvironmentOutcomeMetricOption,
  EnvironmentQueryRequest,
  EnvironmentQueryResponse,
  EnvironmentSortCategoriesBy,
  EnvironmentSortOrder,
  EnvironmentTableRow,
  EnvironmentTaxonomyFilter,
  EnvironmentTaxonomyRank,
  EnvironmentTaxonomySearchResult,
  EnvironmentTraitCode,
  EnvironmentTraitOption,
  MicrobialEnvironmentG4Service,
} from '../../services/microbial-environment-g4.service';
import { UiThemeMode, UiThemeService } from '../../../theme/ui-theme.service';

interface SummaryMetric {
  readonly label: string;
  readonly value: string;
  readonly hint: string;
  readonly icon: string;
}

interface TableSortState {
  readonly active: string;
  readonly direction: EnvironmentSortOrder;
}

interface CategoryStatusRow {
  readonly key: string;
  readonly category: string;
  readonly nAssemblies: string;
  readonly median: string;
  readonly whiskerRange: string;
  readonly outliers: string;
  readonly status: string;
}

type EnvironmentTaxonomyRankSelection = 'all' | EnvironmentTaxonomyRank;

interface TaxonomyRankUiOption {
  readonly rank: EnvironmentTaxonomyRankSelection;
  readonly display_label: string;
}

type MappingEvidenceRank = 0 | 1 | 2 | 3;

interface MappingEvidenceLevelOption {
  readonly rank: MappingEvidenceRank;
  readonly label: string;
}

interface EnvironmentNoticeDialogData {
  readonly title: string;
  readonly message: string;
}

interface RouteInitialization {
  readonly traitCode: string | null;
  readonly outcomeMetric: EnvironmentOutcomeMetric | null;
  readonly taxonomyRank: EnvironmentTaxonomyRankSelection;
  readonly taxon: string | null;
  readonly run: boolean;
}

interface VegaPointDatum {
  readonly assembly_accession: string;
  readonly x_value: number;
  readonly y_value: number;
  readonly species: string;
  readonly genus: string;
}

interface VegaLineDatum {
  readonly x_value: number;
  readonly y_value: number;
}

interface VegaBoxplotDatum {
  readonly category_id: string;
  readonly label: string;
  readonly n_assemblies: number;
  readonly q1: number;
  readonly median: number;
  readonly q3: number;
  readonly whisker_low: number;
  readonly whisker_high: number;
}

interface VegaChartPadding {
  readonly left: number;
  readonly right: number;
  readonly top: number;
  readonly bottom: number;
}

interface VegaThemeColors {
  readonly axisText: string;
  readonly axisLine: string;
  readonly gridLine: string;
}

const COUNT_FORMATTER = new Intl.NumberFormat('en-US');
const NUMBER_FORMATTER = new Intl.NumberFormat('en-US', { maximumFractionDigits: 3 });
const INITIAL_TRAIT_CODE: EnvironmentTraitCode = 'growth_temperature';
const INITIAL_OUTCOME_METRIC: EnvironmentOutcomeMetric = 'g4_density_per_mb';
const ALL_TAXONOMY_RANK: EnvironmentTaxonomyRankSelection = 'all';
const INITIAL_TAXONOMY_RANK: EnvironmentTaxonomyRankSelection = ALL_TAXONOMY_RANK;
const INITIAL_PAGE_INDEX = 0;
const INITIAL_PAGE_SIZE = 20;
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];
const INITIAL_TABLE_SORT: TableSortState = {
  active: 'assembly_accession',
  direction: 'asc',
};
const INITIAL_SORT_CATEGORIES_BY: EnvironmentSortCategoriesBy = 'sort_order';
const INITIAL_DOWNLOAD_MODE: EnvironmentDownloadMode = 'csv';
const VEGA_CHART_PADDING: VegaChartPadding = { left: 70, right: 24, top: 16, bottom: 54 };
const VEGA_CHART_HEIGHT = 360;
const MINIMUM_VEGA_PLOT_WIDTH = 320;
const ENVIRONMENT_NOTICE_DIALOG_WIDTH = '420px';
const ENVIRONMENT_NOTICE_DIALOG_MAX_WIDTH = 'calc(100vw - 32px)';
const MAPPING_EVIDENCE_LEVEL_OPTIONS: readonly MappingEvidenceLevelOption[] = [
  { rank: 1, label: 'Low evidence or better' },
  { rank: 2, label: 'Medium evidence or better' },
  { rank: 3, label: 'High evidence only' },
];
const ENVIRONMENT_OUTCOME_METRICS: readonly EnvironmentOutcomeMetric[] = [
  'g4_density_per_mb',
  'gene_quadruplex_density_per_mb',
  'upstream_quadruplex_density_per_mb',
  'downstream_quadruplex_density_per_mb',
  'intergenic_quadruplex_density_per_mb',
];
const ENVIRONMENT_TAXONOMY_RANKS: readonly EnvironmentTaxonomyRank[] = [
  'domain',
  'phylum',
  'class',
  'order',
  'family',
  'genus',
  'species',
];
const OUTCOME_METRIC_DENSITY_PATTERN = /quadruplex(?: sequence)? density/gi;

function normalizeOutcomeMetricText(value: string): string {
  return value.replace(OUTCOME_METRIC_DENSITY_PATTERN, 'G4 density');
}

function normalizeOutcomeMetricOption(
  option: EnvironmentOutcomeMetricOption,
): EnvironmentOutcomeMetricOption {
  return {
    ...option,
    display_name: normalizeOutcomeMetricText(option.display_name),
    description: normalizeOutcomeMetricText(option.description),
  };
}

function normalizeEnvironmentOptions(
  options: EnvironmentOptionsResponse,
): EnvironmentOptionsResponse {
  return {
    ...options,
    outcome_metrics: options.outcome_metrics.map(normalizeOutcomeMetricOption),
  };
}

function isMappingEvidenceRank(value: number): value is MappingEvidenceRank {
  return Number.isInteger(value) && value >= 0 && value <= 3;
}

function mappingEvidenceRankFromNumber(value: number): MappingEvidenceRank {
  if (isMappingEvidenceRank(value)) {
    return value;
  }
  throw new Error(`Unsupported Environment-G4 mapping evidence rank: ${String(value)}.`);
}

function traitUsesMappingEvidenceControls(trait: EnvironmentTraitOption): boolean {
  const valueKind = trait.value_kind.toLowerCase();
  return (
    valueKind.includes('categorical') ||
    valueKind.includes('multi_label') ||
    trait.min_default_mapping_confidence_rank > 0
  );
}

function isEnvironmentOutcomeMetric(value: string): value is EnvironmentOutcomeMetric {
  return ENVIRONMENT_OUTCOME_METRICS.includes(value as EnvironmentOutcomeMetric);
}

function isEnvironmentTaxonomyRank(value: string): value is EnvironmentTaxonomyRank {
  return ENVIRONMENT_TAXONOMY_RANKS.includes(value as EnvironmentTaxonomyRank);
}

function isEnvironmentTaxonomyRankSelection(
  value: string,
): value is EnvironmentTaxonomyRankSelection {
  return value === ALL_TAXONOMY_RANK || isEnvironmentTaxonomyRank(value);
}

function queryParamValue(params: ParamMap, key: string): string | null {
  const value = params.get(key)?.trim();
  return value ? value : null;
}

function routeTraitCodeFromParamMap(params: ParamMap): string | null {
  return queryParamValue(params, 'trait');
}

function routeOutcomeMetricFromParamMap(params: ParamMap): EnvironmentOutcomeMetric | null {
  const value = queryParamValue(params, 'metric');
  if (value === null) {
    return null;
  }
  if (isEnvironmentOutcomeMetric(value)) {
    return value;
  }
  throw new Error(`Invalid Environment-G4 metric query param: ${value}.`);
}

function routeRankFromParamMap(params: ParamMap): EnvironmentTaxonomyRankSelection {
  const value = queryParamValue(params, 'rank');
  if (value === null) {
    return INITIAL_TAXONOMY_RANK;
  }
  if (isEnvironmentTaxonomyRankSelection(value)) {
    return value;
  }
  throw new Error(`Invalid Environment-G4 taxonomy rank query param: ${value}.`);
}

function routeRunFromParamMap(params: ParamMap): boolean {
  const value = queryParamValue(params, 'run');
  if (value === null) {
    return false;
  }
  if (value === 'true') {
    return true;
  }
  if (value === 'false') {
    return false;
  }
  throw new Error(`Invalid Environment-G4 run query param: ${value}.`);
}

function routeInitializationFromParamMap(params: ParamMap): RouteInitialization {
  return {
    traitCode: routeTraitCodeFromParamMap(params),
    outcomeMetric: routeOutcomeMetricFromParamMap(params),
    taxonomyRank: routeRankFromParamMap(params),
    taxon: queryParamValue(params, 'taxon'),
    run: routeRunFromParamMap(params),
  };
}

function extractErrorMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    const detail = (error.error as { detail?: unknown } | null)?.detail;
    if (typeof detail === 'string' && detail.trim()) {
      return detail;
    }
    if (typeof error.error === 'string' && error.error.trim()) {
      return error.error;
    }
    return error.message;
  }
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return String((error as { message: unknown }).message);
  }
  return 'Environment-G4 request failed.';
}

function resolveLightDarkColor(value: string, mode: UiThemeMode): string | null {
  const match = /^light-dark\(([^,]+),\s*([^)]+)\)$/.exec(value);
  const lightColor = match?.[1]?.trim();
  const darkColor = match?.[2]?.trim();
  if (!lightColor || !darkColor) {
    return null;
  }
  return mode === 'dark' ? darkColor : lightColor;
}

function toFiniteNumber(value: unknown): number | null {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return 'NA';
  }
  return NUMBER_FORMATTER.format(value);
}

function formatStatusLabel(value: string): string {
  return value
    .split('_')
    .filter((part) => part.length > 0)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function metricValue(row: EnvironmentTableRow, metric: EnvironmentOutcomeMetric): number | null {
  return row[metric];
}

function joinedValues(values: readonly string[]): string {
  return values.length ? values.join('; ') : 'NA';
}

function taxonomySummary(row: EnvironmentTableRow): string {
  const lineage = [row.domain, row.phylum, row.class_name, row.order, row.family, row.genus].filter(
    (value) => value.length > 0,
  );
  return lineage.length ? lineage.join(' > ') : 'NA';
}

function isNumericResponse(
  response: EnvironmentQueryResponse,
): response is EnvironmentNumericScatterResponse {
  return 'scatter_points' in response;
}

function defaultSelectedCategoryIds(categories: readonly EnvironmentCategoryOption[]): string[] {
  return categories
    .filter((category) => category.is_default_visible)
    .sort((left, right) => left.sort_order - right.sort_order)
    .map((category) => category.category_id);
}

@Component({
  selector: 'app-microbial-environment-notice-dialog',
  imports: [MatButtonModule, MatDialogModule, MatIconModule],
  template: `
    <h2 mat-dialog-title class="notice-dialog-title">
      <mat-icon aria-hidden="true">info</mat-icon>
      {{ data.title }}
    </h2>
    <mat-dialog-content>
      <p class="notice-dialog-message">{{ data.message }}</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-flat-button type="button" mat-dialog-close>OK</button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .notice-dialog-title {
        display: flex;
        gap: 10px;
        align-items: center;
      }

      .notice-dialog-title mat-icon {
        color: var(--mat-sys-primary);
      }

      .notice-dialog-message {
        margin: 0;
        color: var(--mat-sys-on-surface);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class MicrobialEnvironmentNoticeDialogComponent {
  readonly data = inject(MAT_DIALOG_DATA) as EnvironmentNoticeDialogData;
}

@Component({
  selector: 'app-microbial-environment-g4',
  imports: [
    MatButtonModule,
    MatCheckboxModule,
    MatChipsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatTooltipModule,
    MtxGridModule,
    ReactiveFormsModule,
    RouterLink,
    DecimalPipe,
    TitleCasePipe,
  ],
  templateUrl: './microbial-environment-g4.component.html',
  styleUrl: './microbial-environment-g4.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MicrobialEnvironmentG4Component implements AfterViewInit, OnDestroy {
  @ViewChild('chartPlot') private chartPlot?: ElementRef<HTMLDivElement>;

  private readonly service = inject(MicrobialEnvironmentG4Service);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly document = inject(DOCUMENT);
  private readonly noticeDialog = inject(MatDialog);
  private readonly uiThemeService = inject(UiThemeService);
  private readonly routeInitialization = routeInitializationFromParamMap(
    this.route.snapshot.queryParamMap,
  );
  private readonly selectedTraitCodeSignal = signal<EnvironmentTraitCode>(INITIAL_TRAIT_CODE);
  private readonly selectedOutcomeMetricSignal =
    signal<EnvironmentOutcomeMetric>(INITIAL_OUTCOME_METRIC);
  private readonly selectedContextAxisSignal = signal<string | null>(null);
  private readonly selectedCategoryIdsSignal = signal<readonly string[]>([]);
  private readonly taxonomyFiltersSignal = signal<EnvironmentTaxonomyFilter[]>([]);
  private readonly selectedTaxonomyCandidateKeysSignal = signal<readonly string[]>([]);
  private readonly pageIndex = signal(INITIAL_PAGE_INDEX);
  private readonly pageSize = signal(INITIAL_PAGE_SIZE);
  private readonly sortStateSignal = signal<TableSortState>(INITIAL_TABLE_SORT);

  private chartCleanup: (() => void) | null = null;
  private noticeDialogRef: MatDialogRef<MicrobialEnvironmentNoticeDialogComponent> | null = null;
  private taxonomyRequestVersion = 0;
  private queryRequestVersion = 0;
  private hasAppliedRouteInitialization = false;

  readonly options = signal<EnvironmentOptionsResponse | null>(null);
  readonly result = signal<EnvironmentQueryResponse | null>(null);
  readonly submittedQuery = signal<EnvironmentQueryRequest | null>(null);
  readonly taxonomyCandidates = signal<EnvironmentTaxonomySearchResult[]>([]);
  readonly loadingOptions = signal(false);
  readonly loadingTaxonomy = signal(false);
  readonly loadingQuery = signal(false);
  readonly tableLoading = signal(false);
  readonly downloading = signal(false);
  readonly errorMessage = signal('');
  readonly chartError = signal('');

  readonly form = new FormGroup({
    traitCode: new FormControl<EnvironmentTraitCode>(INITIAL_TRAIT_CODE, { nonNullable: true }),
    outcomeMetric: new FormControl<EnvironmentOutcomeMetric>(INITIAL_OUTCOME_METRIC, {
      nonNullable: true,
    }),
    taxonomyRank: new FormControl<EnvironmentTaxonomyRankSelection>(INITIAL_TAXONOMY_RANK, {
      nonNullable: true,
    }),
    taxonomyKeyword: new FormControl('', { nonNullable: true }),
    numericMin: new FormControl('', { nonNullable: true }),
    numericMax: new FormControl('', { nonNullable: true }),
    minMappingConfidenceRank: new FormControl<MappingEvidenceRank>(0, { nonNullable: true }),
    includeReviewValues: new FormControl(false, { nonNullable: true }),
  });

  readonly pageSizeOptions = PAGE_SIZE_OPTIONS;
  readonly mappingEvidenceLevelOptions = MAPPING_EVIDENCE_LEVEL_OPTIONS;
  readonly tablePageIndex = this.pageIndex.asReadonly();
  readonly tablePageSize = this.pageSize.asReadonly();
  readonly tableSortState = this.sortStateSignal.asReadonly();
  readonly selectedTraitCode = this.selectedTraitCodeSignal.asReadonly();
  readonly selectedOutcomeMetric = this.selectedOutcomeMetricSignal.asReadonly();
  readonly selectedContextAxis = this.selectedContextAxisSignal.asReadonly();
  readonly selectedCategoryIds = this.selectedCategoryIdsSignal.asReadonly();
  readonly taxonomyFilters = this.taxonomyFiltersSignal.asReadonly();
  readonly selectedTaxonomyCandidateKeys = this.selectedTaxonomyCandidateKeysSignal.asReadonly();
  readonly taxonomyRankOptions = computed<readonly TaxonomyRankUiOption[]>(() => [
    { rank: ALL_TAXONOMY_RANK, display_label: 'All' },
    ...(this.options()?.taxonomy_ranks ?? []),
  ]);

  readonly selectedTrait = computed<EnvironmentTraitOption | null>(() => {
    const traitCode = this.selectedTraitCodeSignal();
    return this.options()?.traits.find((trait) => trait.trait_code === traitCode) ?? null;
  });
  readonly chartKind = computed<EnvironmentChartKind>(
    () => this.selectedTrait()?.default_chart_kind ?? 'scatter',
  );
  readonly showEvidenceControls = computed(() => {
    const trait = this.selectedTrait();
    return trait ? traitUsesMappingEvidenceControls(trait) : false;
  });
  readonly contextAxisOptions = computed(() => {
    const options = this.options();
    if (!options) {
      return [];
    }
    return options.context_axes.filter(
      (axis) => axis.trait_code === this.selectedTraitCodeSignal(),
    );
  });
  readonly categoryOptions = computed(() => {
    const options = this.options();
    const contextAxis = this.selectedContextAxisSignal();
    if (!options || contextAxis === null) {
      return [];
    }
    return options.categories
      .filter(
        (category) =>
          category.trait_code === this.selectedTraitCodeSignal() &&
          category.context_axis === contextAxis,
      )
      .sort((left, right) => left.sort_order - right.sort_order);
  });
  readonly outcomeMetricOptions = computed<readonly EnvironmentOutcomeMetricOption[]>(() => {
    const options = this.options();
    const trait = this.selectedTrait();
    if (!options || !trait) {
      return [];
    }
    const allowed = new Set(trait.allowed_outcome_metrics);
    return options.outcome_metrics.filter((metric) => allowed.has(metric.metric));
  });
  readonly selectedOutcomeMetricOption = computed<EnvironmentOutcomeMetricOption | null>(() => {
    const selectedMetric = this.selectedOutcomeMetricSignal();
    return (
      this.options()?.outcome_metrics.find((metric) => metric.metric === selectedMetric) ?? null
    );
  });
  readonly tableRows = computed<EnvironmentTableRow[]>(() => {
    const response = this.result();
    return response ? [...response.table_preview] : [];
  });
  readonly previewTotal = computed(() => this.result()?.preview_total ?? 0);
  readonly canRun = computed(
    () => Boolean(this.options()) && !this.loadingOptions() && !this.loadingQuery(),
  );
  readonly studySummary = computed(() => {
    const trait = this.selectedTrait();
    const metric = this.selectedOutcomeMetricOption();
    const traitLabel = trait?.display_name ?? 'environmental trait';
    const metricLabel = metric?.display_name ?? 'G4 density';
    return `Compare BacDive-derived ${traitLabel} with ${metricLabel}. Associations are descriptive and taxonomy-aware.`;
  });
  readonly summaryMetrics = computed<SummaryMetric[]>(() => {
    const response = this.result();
    if (!response) {
      return [];
    }
    return [
      {
        label: 'assemblies',
        value: COUNT_FORMATTER.format(response.summary.assembly_count),
        hint: 'Assemblies in the submitted query',
        icon: 'groups',
      },
      {
        label: 'rows',
        value: COUNT_FORMATTER.format(response.summary.row_count),
        hint: 'Rows after selected filters',
        icon: 'table_rows',
      },
      {
        label: 'chart',
        value: response.summary.chart_kind === 'scatter' ? 'Scatter' : 'Box plot',
        hint: this.selectedTrait()?.value_kind ?? 'Trait value kind',
        icon: 'query_stats',
      },
      {
        label: 'metric',
        value: this.selectedOutcomeMetricOption()?.unit ?? 'per Mb',
        hint: this.selectedOutcomeMetricOption()?.display_name ?? response.summary.outcome_metric,
        icon: 'biotech',
      },
    ];
  });
  readonly categoryStatusRows = computed<readonly CategoryStatusRow[]>(() => {
    const response = this.result();
    if (!response || isNumericResponse(response)) {
      return [];
    }
    const categoryLabels = new Map(
      this.categoryOptions().map((category) => [category.category_id, category.display_label]),
    );
    return response.boxplot_summary.map((row) => ({
      key: `${row.context_axis}:${row.category_id}`,
      category: categoryLabels.get(row.category_id) ?? row.canonical_value,
      nAssemblies: COUNT_FORMATTER.format(row.n_assemblies),
      median: formatNumber(row.median),
      whiskerRange: `${formatNumber(row.whisker_low)}..${formatNumber(row.whisker_high)}`,
      outliers: COUNT_FORMATTER.format(row.outlier_count),
      status: formatStatusLabel(row.status),
    }));
  });
  readonly tableColumns = computed<MtxGridColumn<EnvironmentTableRow>[]>(() => {
    const metric = this.selectedOutcomeMetricSignal();
    const metricLabel = this.selectedOutcomeMetricOption()?.display_name ?? metric;
    const trait = this.selectedTrait();
    const traitLabel = trait?.display_name ?? 'Trait value';
    const sharedColumns: MtxGridColumn<EnvironmentTableRow>[] = [
      {
        header: 'Organism',
        field: 'full_scientific_name',
        sortable: true,
        sortProp: { id: 'full_scientific_name' },
      },
      { header: 'Assembly accession', field: 'assembly_accession', sortable: true },
      {
        header: 'Taxonomy summary',
        field: 'genus',
        sortable: true,
        formatter: (row) => taxonomySummary(row),
      },
      { header: 'Assembly level', field: 'assembly_level', sortable: true },
      {
        header: `${metricLabel} (${this.selectedOutcomeMetricOption()?.unit ?? 'per Mb'})`,
        field: metric,
        sortable: true,
        type: 'number',
        formatter: (row) => this.formatValue(metricValue(row, metric)),
      },
      {
        header: 'Genome size (bp)',
        field: 'genome_size',
        sortable: true,
        type: 'number',
        formatter: (row) => this.formatValue(row.genome_size),
      },
      {
        header: 'GC (%)',
        field: 'gc_percent',
        sortable: true,
        type: 'number',
        formatter: (row) => this.formatValue(row.gc_percent),
      },
    ];
    if (this.chartKind() === 'scatter') {
      return [
        ...sharedColumns.slice(0, 2),
        {
          header: traitLabel,
          field: 'numeric_midpoint',
          sortable: true,
          sortProp: { id: 'numeric_midpoint' },
          type: 'number',
          formatter: (row) =>
            'numeric_midpoint' in row ? this.formatValue(row.numeric_midpoint) : 'NA',
        },
        {
          header: 'Raw BacDive values',
          field: 'raw_values',
          formatter: (row) => ('raw_values' in row ? joinedValues(row.raw_values) : 'NA'),
        },
        {
          header: 'Normalized values',
          field: 'normalized_values',
          formatter: (row) =>
            'normalized_values' in row ? joinedValues(row.normalized_values) : 'NA',
        },
        ...sharedColumns.slice(2),
      ];
    }
    return [
      ...sharedColumns.slice(0, 2),
      {
        header: 'Canonical category',
        field: 'canonical_value',
        sortable: true,
        sortProp: { id: 'canonical_value' },
      },
      {
        header: 'Mapping confidence',
        field: 'mapping_confidence_rank',
        sortable: true,
        sortProp: { id: 'mapping_confidence_rank' },
        type: 'number',
      },
      {
        header: 'Mapping methods',
        field: 'mapping_methods',
        formatter: (row) => ('mapping_methods' in row ? joinedValues(row.mapping_methods) : 'NA'),
      },
      {
        header: 'Raw BacDive values',
        field: 'raw_values',
        formatter: (row) => ('raw_values' in row ? joinedValues(row.raw_values) : 'NA'),
      },
      {
        header: 'Normalized values',
        field: 'normalized_values',
        formatter: (row) =>
          'normalized_values' in row ? joinedValues(row.normalized_values) : 'NA',
      },
      ...sharedColumns.slice(2),
    ];
  });

  constructor() {
    effect(() => {
      this.uiThemeService.resolvedMode();
      if (untracked(() => Boolean(this.result()))) {
        this.scheduleChartRender();
      }
    });
    this.loadOptions();
  }

  ngAfterViewInit(): void {
    this.scheduleChartRender();
  }

  ngOnDestroy(): void {
    this.clearChart();
    this.noticeDialogRef?.close();
  }

  reloadOptions(): void {
    this.loadOptions();
  }

  selectTrait(value: unknown): void {
    const options = this.options();
    if (typeof value !== 'string' || !options?.traits.some((trait) => trait.trait_code === value)) {
      throw new Error(`Unsupported Environment-G4 trait selected: ${String(value)}.`);
    }
    this.applyTraitSelection(value as EnvironmentTraitCode, true);
  }

  selectOutcomeMetric(value: unknown): void {
    if (typeof value !== 'string' || !isEnvironmentOutcomeMetric(value)) {
      throw new Error(`Unsupported Environment-G4 outcome metric selected: ${String(value)}.`);
    }
    this.selectedOutcomeMetricSignal.set(value);
    this.form.controls.outcomeMetric.setValue(value);
    this.clearSubmittedResult();
  }

  selectContextAxis(value: unknown): void {
    if (typeof value !== 'string') {
      throw new Error(`Unsupported Environment-G4 context axis selected: ${String(value)}.`);
    }
    this.selectedContextAxisSignal.set(value);
    this.selectedCategoryIdsSignal.set(defaultSelectedCategoryIds(this.categoryOptions()));
    this.taxonomyCandidates.set([]);
    this.clearSubmittedResult();
  }

  toggleCategory(category: EnvironmentCategoryOption, checked: boolean): void {
    const selectedIds = new Set(this.selectedCategoryIdsSignal());
    if (checked) {
      selectedIds.add(category.category_id);
    } else {
      selectedIds.delete(category.category_id);
    }
    this.selectedCategoryIdsSignal.set([...selectedIds]);
    this.clearSubmittedResult();
  }

  selectAllCategories(): void {
    this.selectedCategoryIdsSignal.set(
      this.categoryOptions().map((category) => category.category_id),
    );
    this.clearSubmittedResult();
  }

  clearAllCategories(): void {
    this.selectedCategoryIdsSignal.set([]);
    this.clearSubmittedResult();
  }

  findTaxonomy(): void {
    const options = this.options();
    if (!options) {
      this.showNotice('Load Environment-G4 options before taxonomy search.');
      return;
    }
    const keyword = this.form.controls.taxonomyKeyword.value.trim();
    if (!keyword) {
      this.showNotice('Enter a taxonomy term before searching.');
      return;
    }
    const rank = this.form.controls.taxonomyRank.value;
    if (rank === ALL_TAXONOMY_RANK) {
      this.showNotice('Choose a specific microbial taxonomy rank before searching.');
      return;
    }
    if (!isEnvironmentTaxonomyRank(rank)) {
      throw new Error(`Unsupported Environment-G4 taxonomy rank selected: ${String(rank)}.`);
    }
    const requestVersion = ++this.taxonomyRequestVersion;
    this.loadingTaxonomy.set(true);
    this.errorMessage.set('');
    this.service
      .searchTaxonomy(
        rank,
        keyword,
        this.selectedTraitCodeSignal(),
        this.chartKind(),
        this.selectedContextAxisSignal(),
      )
      .pipe(
        finalize(() => {
          if (requestVersion === this.taxonomyRequestVersion) {
            this.loadingTaxonomy.set(false);
          }
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (response) => {
          if (requestVersion !== this.taxonomyRequestVersion) {
            return;
          }
          this.taxonomyCandidates.set(response.results);
          this.selectedTaxonomyCandidateKeysSignal.set([]);
          if (!response.results.length) {
            this.showNotice('No taxonomy matches for the current Environment-G4 trait.');
          }
        },
        error: (error: unknown) => {
          if (requestVersion === this.taxonomyRequestVersion) {
            this.handleError(error);
          }
        },
      });
  }

  addTaxonomyFilter(selection: EnvironmentTaxonomyFilter): void {
    const key = this.taxonomyKey(selection);
    this.taxonomyFiltersSignal.update((filters) =>
      filters.some((filter) => this.taxonomyKey(filter) === key)
        ? filters
        : [...filters, selection],
    );
    this.clearSubmittedResult();
  }

  removeTaxonomyFilter(selection: EnvironmentTaxonomyFilter): void {
    const key = this.taxonomyKey(selection);
    this.taxonomyFiltersSignal.update((filters) =>
      filters.filter((filter) => this.taxonomyKey(filter) !== key),
    );
    this.clearSubmittedResult();
  }

  clearTaxonomyFilters(): void {
    this.taxonomyFiltersSignal.set([]);
    this.clearSubmittedResult();
  }

  taxonomyCandidateChecked(candidate: EnvironmentTaxonomySearchResult): boolean {
    return this.selectedTaxonomyCandidateKeysSignal().includes(this.taxonomyKey(candidate));
  }

  toggleTaxonomyCandidate(candidate: EnvironmentTaxonomySearchResult, checked: boolean): void {
    const key = this.taxonomyKey(candidate);
    const selectedKeys = new Set(this.selectedTaxonomyCandidateKeysSignal());
    if (checked) {
      selectedKeys.add(key);
    } else {
      selectedKeys.delete(key);
    }
    this.selectedTaxonomyCandidateKeysSignal.set([...selectedKeys]);
  }

  selectAllTaxonomyCandidates(): void {
    this.selectedTaxonomyCandidateKeysSignal.set(
      this.taxonomyCandidates().map((candidate) => this.taxonomyKey(candidate)),
    );
  }

  clearAllTaxonomyCandidates(): void {
    this.selectedTaxonomyCandidateKeysSignal.set([]);
  }

  importCheckedTaxonomyCandidates(): void {
    const selectedKeys = new Set(this.selectedTaxonomyCandidateKeysSignal());
    if (!selectedKeys.size) {
      this.showNotice('Select taxonomy candidates before importing.');
      return;
    }
    const importedFilters: EnvironmentTaxonomyFilter[] = this.taxonomyCandidates()
      .filter((candidate) => selectedKeys.has(this.taxonomyKey(candidate)))
      .map((candidate) => ({
        rank: candidate.rank,
        value: candidate.value,
      }));
    this.taxonomyFiltersSignal.update((filters) => {
      const existingKeys = new Set(filters.map((filter) => this.taxonomyKey(filter)));
      const additions = importedFilters.filter(
        (candidate) => !existingKeys.has(this.taxonomyKey(candidate)),
      );
      return additions.length ? [...filters, ...additions] : filters;
    });
    this.selectedTaxonomyCandidateKeysSignal.set([]);
    this.clearSubmittedResult();
  }

  resetAnalysisSetup(): void {
    this.taxonomyRequestVersion++;
    this.queryRequestVersion++;
    const options = this.options();
    const traitCode = options?.traits[0]?.trait_code ?? INITIAL_TRAIT_CODE;
    this.applyTraitSelection(traitCode, false);
    this.form.controls.taxonomyRank.setValue(INITIAL_TAXONOMY_RANK);
    this.form.controls.taxonomyKeyword.setValue('');
    this.form.controls.numericMin.setValue('');
    this.form.controls.numericMax.setValue('');
    this.taxonomyCandidates.set([]);
    this.selectedTaxonomyCandidateKeysSignal.set([]);
    this.taxonomyFiltersSignal.set([]);
    this.pageIndex.set(INITIAL_PAGE_INDEX);
    this.pageSize.set(INITIAL_PAGE_SIZE);
    this.sortStateSignal.set(INITIAL_TABLE_SORT);
    this.loadingTaxonomy.set(false);
    this.loadingQuery.set(false);
    this.tableLoading.set(false);
    this.downloading.set(false);
    this.clearSubmittedResult();
  }

  runAnalysis(): void {
    if (!this.options()) {
      this.showNotice('Load Environment-G4 options before running analysis.');
      return;
    }
    this.pageIndex.set(INITIAL_PAGE_INDEX);
    const request = this.buildQuery();
    this.runQuery(request, true);
  }

  onTablePageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.runSubmittedQuery();
  }

  onTableSortChange(sort: Sort): void {
    if (!sort.direction) {
      return;
    }
    this.sortStateSignal.set({
      active: sort.active,
      direction: sort.direction as EnvironmentSortOrder,
    });
    this.pageIndex.set(INITIAL_PAGE_INDEX);
    this.runSubmittedQuery();
  }

  downloadResults(): void {
    const query = this.submittedQuery();
    if (!query) {
      this.showNotice('Run an Environment-G4 query before downloading results.');
      return;
    }
    const request = this.downloadRequestFromQuery(query, INITIAL_DOWNLOAD_MODE);
    this.downloading.set(true);
    this.service
      .downloadResults(request)
      .pipe(
        finalize(() => this.downloading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (download) => this.saveBlob(download.blob, download.filename),
        error: (error: unknown) => this.handleError(error),
      });
  }

  taxonomyRankLabel(rank: string): string {
    return (
      this.options()?.taxonomy_ranks.find((option) => option.rank === rank)?.display_label ?? rank
    );
  }

  taxonomyScopeLabel(filters: readonly EnvironmentTaxonomyFilter[]): string {
    if (!filters.length) {
      return 'All eligible assemblies';
    }
    return filters
      .map((filter) => `${this.taxonomyRankLabel(filter.rank)}: ${filter.value}`)
      .join('; ');
  }

  categoryChecked(category: EnvironmentCategoryOption): boolean {
    return this.selectedCategoryIdsSignal().includes(category.category_id);
  }

  selectedCategoryCount(): number {
    return this.selectedCategoryIdsSignal().length;
  }

  formatValue(value: string | number | null): string {
    if (typeof value === 'number') {
      return formatNumber(value);
    }
    return value ?? 'NA';
  }

  resultDescription(): string {
    return this.result()?.summary.description ?? this.studySummary();
  }

  chartRecordCount(): number {
    const response = this.result();
    if (!response) {
      return 0;
    }
    if (isNumericResponse(response)) {
      return this.vegaPoints(response.scatter_points).length;
    }
    return this.vegaBoxplotRows(response).length;
  }

  private applyTraitSelection(traitCode: EnvironmentTraitCode, clearResult: boolean): void {
    const options = this.options();
    const trait = options?.traits.find((candidate) => candidate.trait_code === traitCode) ?? null;
    if (options && !trait) {
      throw new Error(`Environment-G4 options do not include trait: ${traitCode}.`);
    }
    this.selectedTraitCodeSignal.set(traitCode);
    this.form.controls.traitCode.setValue(traitCode);

    const metric = trait?.default_outcome_metric ?? INITIAL_OUTCOME_METRIC;
    this.selectedOutcomeMetricSignal.set(metric);
    this.form.controls.outcomeMetric.setValue(metric);

    const contextAxis =
      trait?.default_context_axis ??
      options?.context_axes.find((axis) => axis.trait_code === traitCode)?.context_axis ??
      null;
    this.selectedContextAxisSignal.set(contextAxis);
    const categories = options?.categories.filter(
      (category) => category.trait_code === traitCode && category.context_axis === contextAxis,
    );
    this.selectedCategoryIdsSignal.set(defaultSelectedCategoryIds(categories ?? []));

    this.form.controls.minMappingConfidenceRank.setValue(
      mappingEvidenceRankFromNumber(trait?.min_default_mapping_confidence_rank ?? 0),
    );
    this.taxonomyCandidates.set([]);
    this.selectedTaxonomyCandidateKeysSignal.set([]);
    if (clearResult) {
      this.clearSubmittedResult();
    }
  }

  private buildQuery(): EnvironmentQueryRequest {
    const trait = this.selectedTrait();
    if (!trait) {
      throw new Error('Cannot build Environment-G4 query without a selected trait option.');
    }
    const base = this.buildBaseQuery();
    if (trait.default_chart_kind === 'scatter') {
      return {
        ...base,
        chart_kind: 'scatter',
        numeric_min: this.parseOptionalNumber(this.form.controls.numericMin.value, 'numeric_min'),
        numeric_max: this.parseOptionalNumber(this.form.controls.numericMax.value, 'numeric_max'),
      };
    }
    const contextAxis = this.selectedContextAxisSignal();
    if (contextAxis === null) {
      throw new Error('Cannot build category boxplot query without a context axis.');
    }
    return {
      ...base,
      chart_kind: 'boxplot',
      display_context_axis: contextAxis,
      display_category_ids: [...this.selectedCategoryIdsSignal()],
      sort_categories_by: INITIAL_SORT_CATEGORIES_BY,
    };
  }

  private buildBaseQuery(): Omit<EnvironmentQueryRequest, 'chart_kind'> {
    return {
      trait_code: this.selectedTraitCodeSignal(),
      outcome_metric: this.selectedOutcomeMetricSignal(),
      taxonomy_filters: this.taxonomyFiltersSignal(),
      category_filters: [],
      category_filter_logic: 'intersection',
      min_mapping_confidence_rank: this.form.controls.minMappingConfidenceRank.value,
      include_review_values: this.form.controls.includeReviewValues.value,
      page_index: this.pageIndex(),
      page_size: this.pageSize(),
      sort_field: this.sortStateSignal().active,
      sort_order: this.sortStateSignal().direction,
    };
  }

  private parseOptionalNumber(value: string, fieldName: string): number | null {
    const trimmedValue = value.trim();
    if (!trimmedValue) {
      return null;
    }
    const parsed = Number(trimmedValue);
    if (!Number.isFinite(parsed)) {
      throw new Error(`Invalid ${fieldName}: ${value}.`);
    }
    return parsed;
  }

  private runSubmittedQuery(): void {
    const submittedQuery = this.submittedQuery();
    if (!submittedQuery) {
      return;
    }
    const request: EnvironmentQueryRequest =
      submittedQuery.chart_kind === 'scatter'
        ? {
            ...submittedQuery,
            page_index: this.pageIndex(),
            page_size: this.pageSize(),
            sort_field: this.sortStateSignal().active,
            sort_order: this.sortStateSignal().direction,
          }
        : {
            ...submittedQuery,
            page_index: this.pageIndex(),
            page_size: this.pageSize(),
            sort_field: this.sortStateSignal().active,
            sort_order: this.sortStateSignal().direction,
          };
    this.runQuery(request, false);
  }

  private runQuery(request: EnvironmentQueryRequest, clearExistingResult: boolean): void {
    const requestVersion = ++this.queryRequestVersion;
    this.loadingQuery.set(true);
    this.tableLoading.set(true);
    this.errorMessage.set('');
    this.chartError.set('');
    if (clearExistingResult) {
      this.result.set(null);
      this.submittedQuery.set(null);
      this.clearChart();
    }
    this.queryObservable(request)
      .pipe(
        finalize(() => {
          if (requestVersion === this.queryRequestVersion) {
            this.loadingQuery.set(false);
            this.tableLoading.set(false);
          }
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (response) => {
          if (requestVersion !== this.queryRequestVersion) {
            return;
          }
          this.submittedQuery.set(request);
          this.result.set(response);
          this.scheduleChartRender();
        },
        error: (error: unknown) => {
          if (requestVersion !== this.queryRequestVersion) {
            return;
          }
          if (clearExistingResult) {
            this.result.set(null);
            this.submittedQuery.set(null);
            this.clearChart();
          }
          this.handleError(error);
        },
      });
  }

  private queryObservable(request: EnvironmentQueryRequest): Observable<EnvironmentQueryResponse> {
    return request.chart_kind === 'scatter'
      ? this.service.queryNumericScatter(request)
      : this.service.queryCategoryBoxplot(request);
  }

  private downloadRequestFromQuery(
    query: EnvironmentQueryRequest,
    mode: EnvironmentDownloadMode,
  ): EnvironmentDownloadRequest {
    const base = {
      trait_code: query.trait_code,
      chart_kind: query.chart_kind,
      outcome_metric: query.outcome_metric,
      taxonomy_filters: query.taxonomy_filters,
      category_filters: query.category_filters,
      category_filter_logic: query.category_filter_logic,
      min_mapping_confidence_rank: query.min_mapping_confidence_rank,
      include_review_values: query.include_review_values,
      page_index: query.page_index,
      page_size: query.page_size,
      sort_field: query.sort_field,
      sort_order: query.sort_order,
      mode,
    };
    return query.chart_kind === 'scatter'
      ? {
          ...base,
          numeric_min: query.numeric_min,
          numeric_max: query.numeric_max,
          display_context_axis: null,
          display_category_ids: [],
          sort_categories_by: INITIAL_SORT_CATEGORIES_BY,
        }
      : {
          ...base,
          numeric_min: null,
          numeric_max: null,
          display_context_axis: query.display_context_axis,
          display_category_ids: query.display_category_ids,
          sort_categories_by: query.sort_categories_by,
        };
  }

  private loadOptions(): void {
    this.loadingOptions.set(true);
    this.errorMessage.set('');
    this.service
      .getOptions()
      .pipe(
        finalize(() => this.loadingOptions.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (options) => {
          const normalizedOptions = normalizeEnvironmentOptions(options);
          this.options.set(normalizedOptions);
          this.applyInitialRouteState(normalizedOptions);
        },
        error: (error: unknown) => this.handleError(error),
      });
  }

  private applyInitialRouteState(options: EnvironmentOptionsResponse): void {
    if (this.hasAppliedRouteInitialization) {
      return;
    }
    this.hasAppliedRouteInitialization = true;
    if (!options.traits.length) {
      this.handleError(new Error('Environment-G4 options did not include any trait definitions.'));
      return;
    }

    const traitCode = this.initialTraitCodeFromOptions(options);
    if (traitCode === null) {
      return;
    }
    this.applyTraitSelection(traitCode, false);

    const routeMetric = this.routeInitialization.outcomeMetric;
    const selectedTrait = this.selectedTrait();
    if (routeMetric !== null && selectedTrait?.allowed_outcome_metrics.includes(routeMetric)) {
      this.selectedOutcomeMetricSignal.set(routeMetric);
      this.form.controls.outcomeMetric.setValue(routeMetric);
    }
    this.form.controls.taxonomyRank.setValue(this.routeInitialization.taxonomyRank);
    this.form.controls.taxonomyKeyword.setValue(this.routeInitialization.taxon ?? '');
    const taxonomyRank = this.routeInitialization.taxonomyRank;
    if (this.routeInitialization.taxon !== null && taxonomyRank === ALL_TAXONOMY_RANK) {
      this.handleError(new Error('Environment-G4 taxon query param requires a specific rank.'));
      return;
    }
    const taxonomyFilters: EnvironmentTaxonomyFilter[] =
      this.routeInitialization.taxon === null
        ? []
        : [
            {
              rank: taxonomyRank as EnvironmentTaxonomyRank,
              value: this.routeInitialization.taxon,
            },
          ];
    this.taxonomyFiltersSignal.set(taxonomyFilters);

    this.runAnalysis();
  }

  private initialTraitCodeFromOptions(
    options: EnvironmentOptionsResponse,
  ): EnvironmentTraitCode | null {
    const routeTrait = this.routeInitialization.traitCode;
    if (routeTrait === null) {
      return options.traits[0].trait_code;
    }
    const trait = options.traits.find((candidate) => candidate.trait_code === routeTrait);
    if (!trait) {
      this.handleError(
        new Error(`Environment-G4 options do not include requested trait: ${routeTrait}.`),
      );
      return null;
    }
    return trait.trait_code;
  }

  private clearSubmittedResult(): void {
    this.result.set(null);
    this.submittedQuery.set(null);
    this.errorMessage.set('');
    this.chartError.set('');
    this.pageIndex.set(INITIAL_PAGE_INDEX);
    this.clearChart();
  }

  private scheduleChartRender(): void {
    setTimeout(() => {
      void this.renderChart();
    });
  }

  private async renderChart(): Promise<void> {
    const element = this.chartPlot?.nativeElement;
    const response = this.result();
    if (!element || !response) {
      return;
    }
    const width = this.vegaPlotWidth(element);
    const spec = isNumericResponse(response)
      ? this.numericScatterSpec(response, width)
      : this.categoryBoxplotSpec(response, width);
    if (spec === null) {
      this.clearChart();
      return;
    }
    this.clearChart();
    try {
      const { default: embed } = await import('vega-embed');
      const chart = await embed(element, spec, {
        actions: false,
        mode: 'vega',
        renderer: 'canvas',
      });
      this.chartCleanup = () => chart.view.finalize();
      this.chartError.set('');
    } catch (error) {
      this.chartError.set(extractErrorMessage(error));
    }
  }

  private numericScatterSpec(
    response: EnvironmentNumericScatterResponse,
    width: number,
  ): VisualizationSpec | null {
    const points = this.vegaPoints(response.scatter_points);
    if (!points.length) {
      return null;
    }
    const linePoints = this.vegaLinePoints(response.regression_line);
    const themeColors = this.resolveVegaThemeColors(this.uiThemeService.resolvedMode());
    const traitLabel = this.selectedTrait()?.display_name ?? response.summary.trait_code;
    const metricLabel =
      this.selectedOutcomeMetricOption()?.display_name ?? response.summary.outcome_metric;
    return {
      $schema: 'https://vega.github.io/schema/vega/v6.json',
      width,
      height: VEGA_CHART_HEIGHT,
      padding: VEGA_CHART_PADDING,
      background: 'transparent',
      config: this.vegaConfig(themeColors),
      data: [
        { name: 'points', values: points },
        { name: 'line', values: linePoints },
      ],
      scales: [
        {
          name: 'x',
          type: 'linear',
          domain: { data: 'points', field: 'x_value' },
          nice: true,
          range: 'width',
          zero: false,
        },
        {
          name: 'y',
          type: 'linear',
          domain: { data: 'points', field: 'y_value' },
          nice: true,
          range: 'height',
          zero: false,
        },
      ],
      axes: [
        { orient: 'bottom', scale: 'x', title: traitLabel, grid: true },
        { orient: 'left', scale: 'y', title: metricLabel, grid: true },
      ],
      marks: [
        {
          type: 'symbol',
          from: { data: 'points' },
          encode: {
            enter: {
              fillOpacity: { value: 0.74 },
              stroke: { value: '#1d3557' },
              strokeWidth: { value: 0.6 },
              tooltip: {
                signal: `{'Assembly': datum.assembly_accession, 'Species': datum.species, '${traitLabel}': datum.x_value, '${metricLabel}': datum.y_value, 'Genus': datum.genus}`,
              },
            },
            update: {
              x: { scale: 'x', field: 'x_value' },
              y: { scale: 'y', field: 'y_value' },
              fill: { value: '#3f7f8f' },
              size: { value: 72 },
            },
            hover: { size: { value: 118 }, fill: { value: '#b44e2d' } },
          },
        },
        {
          type: 'line',
          from: { data: 'line' },
          encode: {
            enter: {
              stroke: { value: '#b44e2d' },
              strokeWidth: { value: 3 },
            },
            update: {
              x: { scale: 'x', field: 'x_value' },
              y: { scale: 'y', field: 'y_value' },
            },
          },
        },
      ],
    };
  }

  private categoryBoxplotSpec(
    response: EnvironmentCategoryBoxplotResponse,
    width: number,
  ): VisualizationSpec | null {
    const rows = this.vegaBoxplotRows(response);
    if (!rows.length) {
      return null;
    }
    const themeColors = this.resolveVegaThemeColors(this.uiThemeService.resolvedMode());
    const metricLabel =
      this.selectedOutcomeMetricOption()?.display_name ?? response.summary.outcome_metric;
    return {
      $schema: 'https://vega.github.io/schema/vega/v6.json',
      width,
      height: VEGA_CHART_HEIGHT,
      padding: VEGA_CHART_PADDING,
      background: 'transparent',
      config: this.vegaConfig(themeColors),
      data: [{ name: 'boxplots', values: rows }],
      scales: [
        {
          name: 'x',
          type: 'band',
          domain: { data: 'boxplots', field: 'label' },
          range: 'width',
          padding: 0.26,
        },
        {
          name: 'y',
          type: 'linear',
          domain: { data: 'boxplots', fields: ['whisker_low', 'whisker_high'] },
          nice: true,
          range: 'height',
          zero: false,
        },
      ],
      axes: [
        { orient: 'bottom', scale: 'x', title: 'Canonical category', labelAngle: -30 },
        { orient: 'left', scale: 'y', title: metricLabel, grid: true },
      ],
      marks: [
        {
          type: 'rule',
          from: { data: 'boxplots' },
          encode: {
            update: {
              x: { scale: 'x', field: 'label', band: 0.5 },
              y: { scale: 'y', field: 'whisker_low' },
              y2: { scale: 'y', field: 'whisker_high' },
              stroke: { value: '#3f7f8f' },
              strokeWidth: { value: 2 },
            },
          },
        },
        {
          type: 'rect',
          from: { data: 'boxplots' },
          encode: {
            enter: {
              tooltip: {
                signal: `{'Category': datum.label, 'n assemblies': datum.n_assemblies, 'Median ${metricLabel}': datum.median, 'Q1': datum.q1, 'Q3': datum.q3}`,
              },
            },
            update: {
              x: { scale: 'x', field: 'label', band: 0.18 },
              width: { scale: 'x', band: 0.64 },
              y: { scale: 'y', field: 'q3' },
              y2: { scale: 'y', field: 'q1' },
              fill: { value: '#8fbf88' },
              stroke: { value: '#315f50' },
              strokeWidth: { value: 1 },
            },
          },
        },
        {
          type: 'rule',
          from: { data: 'boxplots' },
          encode: {
            update: {
              x: { scale: 'x', field: 'label', band: 0.18 },
              x2: { scale: 'x', field: 'label', band: 0.82 },
              y: { scale: 'y', field: 'median' },
              stroke: { value: '#1d3557' },
              strokeWidth: { value: 3 },
            },
          },
        },
      ],
    };
  }

  private vegaPoints(points: readonly EnvironmentNumericScatterPoint[]): VegaPointDatum[] {
    const metric = this.selectedOutcomeMetricSignal();
    return points.flatMap((point) => {
      const xValue = toFiniteNumber(point.numeric_midpoint);
      const yValue = toFiniteNumber(point[metric]);
      if (xValue === null || yValue === null) {
        return [];
      }
      return [
        {
          assembly_accession: point.assembly_accession,
          x_value: xValue,
          y_value: yValue,
          species: point.species,
          genus: point.genus,
        },
      ];
    });
  }

  private vegaLinePoints(
    linePoints: readonly { x_value: number | null; y_value: number | null }[],
  ): VegaLineDatum[] {
    return linePoints.flatMap((point) => {
      const xValue = toFiniteNumber(point.x_value);
      const yValue = toFiniteNumber(point.y_value);
      if (xValue === null || yValue === null) {
        return [];
      }
      return [{ x_value: xValue, y_value: yValue }];
    });
  }

  private vegaBoxplotRows(response: EnvironmentCategoryBoxplotResponse): VegaBoxplotDatum[] {
    const categoryLabels = new Map(
      this.categoryOptions().map((category) => [category.category_id, category.display_label]),
    );
    return response.boxplot_summary.flatMap((row) => {
      if (
        row.q1 === null ||
        row.median === null ||
        row.q3 === null ||
        row.whisker_low === null ||
        row.whisker_high === null
      ) {
        return [];
      }
      return [
        {
          category_id: row.category_id,
          label: categoryLabels.get(row.category_id) ?? row.canonical_value,
          n_assemblies: row.n_assemblies,
          q1: row.q1,
          median: row.median,
          q3: row.q3,
          whisker_low: row.whisker_low,
          whisker_high: row.whisker_high,
        },
      ];
    });
  }

  private vegaConfig(themeColors: VegaThemeColors): {
    axis: {
      labelColor: string;
      titleColor: string;
      domainColor: string;
      tickColor: string;
      gridColor: string;
    };
  } {
    return {
      axis: {
        labelColor: themeColors.axisText,
        titleColor: themeColors.axisText,
        domainColor: themeColors.axisLine,
        tickColor: themeColors.axisLine,
        gridColor: themeColors.gridLine,
      },
    };
  }

  private resolveVegaThemeColors(mode: UiThemeMode): VegaThemeColors {
    const defaultAxisText = mode === 'dark' ? '#e1e2e6' : '#1d1b20';
    const defaultAxisLine = mode === 'dark' ? '#8f9099' : '#74777f';
    const defaultGridLine = mode === 'dark' ? '#494a50' : '#c4c6d0';

    return {
      axisText: this.resolveCssColorVariable('--mat-sys-on-surface', defaultAxisText, mode),
      axisLine: this.resolveCssColorVariable('--mat-sys-outline', defaultAxisLine, mode),
      gridLine: this.resolveCssColorVariable('--mat-sys-outline-variant', defaultGridLine, mode),
    };
  }

  private resolveCssColorVariable(
    variableName: string,
    fallbackColor: string,
    mode: UiThemeMode,
  ): string {
    const rootElement = this.document.documentElement;
    const windowRef = this.document.defaultView;
    if (!windowRef) {
      return fallbackColor;
    }

    const resolvedValue = windowRef.getComputedStyle(rootElement).getPropertyValue(variableName);
    const colorValue = resolvedValue.trim();
    if (!colorValue) {
      return fallbackColor;
    }
    return resolveLightDarkColor(colorValue, mode) ?? colorValue;
  }

  private clearChart(): void {
    this.chartCleanup?.();
    this.chartCleanup = null;
    const element = this.chartPlot?.nativeElement;
    if (element) {
      element.innerHTML = '';
      element.className = 'vega-host';
      element.removeAttribute('style');
    }
  }

  private vegaPlotWidth(element: HTMLDivElement): number {
    const parentWidth = element.parentElement?.clientWidth ?? element.clientWidth;
    const horizontalPadding = VEGA_CHART_PADDING.left + VEGA_CHART_PADDING.right;
    return Math.max(parentWidth - horizontalPadding, MINIMUM_VEGA_PLOT_WIDTH);
  }

  private taxonomyKey(selection: EnvironmentTaxonomyFilter): string {
    return `${selection.rank}:${selection.value}`;
  }

  private saveBlob(blob: Blob, filename: string): void {
    const windowRef = this.document.defaultView;
    if (!windowRef) {
      throw new Error('Cannot save Environment-G4 download because window is unavailable.');
    }
    const url = windowRef.URL.createObjectURL(blob);
    const anchor = this.document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    windowRef.URL.revokeObjectURL(url);
  }

  private handleError(error: unknown): void {
    const message = extractErrorMessage(error);
    this.showNotice(message);
  }

  private showNotice(message: string): void {
    this.errorMessage.set(message);
    this.noticeDialogRef?.close();
    const dialogRef = this.noticeDialog.open(MicrobialEnvironmentNoticeDialogComponent, {
      data: { title: 'Action needed', message },
      role: 'alertdialog',
      width: ENVIRONMENT_NOTICE_DIALOG_WIDTH,
      maxWidth: ENVIRONMENT_NOTICE_DIALOG_MAX_WIDTH,
      ariaLabel: 'Environment-G4 notice',
    });
    this.noticeDialogRef = dialogRef;
    dialogRef
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (this.noticeDialogRef === dialogRef) {
          this.noticeDialogRef = null;
        }
      });
  }
}
