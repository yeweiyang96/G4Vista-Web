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
import { ActivatedRoute, ParamMap } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { Sort } from '@angular/material/sort';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MtxGridColumn, MtxGridModule } from '@ng-matero/extensions/grid';
import embed, { VisualizationSpec } from 'vega-embed';
import { finalize } from 'rxjs';
import {
  MicrobialEnvironmentDensityMetric,
  MicrobialEnvironmentG4Options,
  MicrobialEnvironmentG4Query,
  MicrobialEnvironmentG4QueryResponse,
  MicrobialEnvironmentG4Service,
  MicrobialEnvironmentMode,
  MicrobialEnvironmentOption,
  MicrobialEnvironmentScatterPoint,
  MicrobialEnvironmentSortField,
  MicrobialEnvironmentSortOrder,
  MicrobialEnvironmentTableRow,
  MicrobialEnvironmentTrait,
  MicrobialTaxonomyRank,
  MicrobialTaxonomySearchResult,
  MicrobialTaxonomySelection,
} from '../../services/microbial-environment-g4.service';
import { UiThemeMode, UiThemeService } from '../../../theme/ui-theme.service';

interface SummaryMetric {
  label: string;
  value: string;
  hint: string;
  icon: string;
}

interface AxisSelection {
  readonly trait: MicrobialEnvironmentTrait;
  readonly mode: MicrobialEnvironmentMode;
}

interface TableSortState {
  readonly active: MicrobialEnvironmentSortField;
  readonly direction: MicrobialEnvironmentSortOrder;
}

interface DensityMetricOption {
  readonly value: MicrobialEnvironmentDensityMetric;
  readonly label: string;
}

interface VegaPointDatum {
  assembly_accession: string;
  phenotype_value: number;
  density_value: number;
  strain: string;
  genus: string;
  species: string;
}

interface VegaLineDatum {
  phenotype_value: number;
  density_value: number;
}

interface QueryExecutionBehavior {
  readonly clearExistingResult: boolean;
  readonly refreshChart: boolean;
  readonly showTableLoading: boolean;
  readonly preserveTablePayload: boolean;
}

interface MicrobialEnvironmentRouteInitialization {
  readonly trait: MicrobialEnvironmentTrait;
  readonly mode: MicrobialEnvironmentMode;
  readonly rank: MicrobialTaxonomyRank;
  readonly taxon: string | null;
  readonly run: boolean;
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
const STAT_FORMATTER = new Intl.NumberFormat('en-US', { maximumFractionDigits: 4 });
const INITIAL_AXIS_SELECTION: AxisSelection = {
  trait: 'temperature',
  mode: 'growth',
};
const INITIAL_DENSITY_METRIC: MicrobialEnvironmentDensityMetric = 'g4_density_per_mb';
const INITIAL_TAXONOMY_RANK: MicrobialTaxonomyRank = 'genus';
const INITIAL_PAGE_INDEX = 0;
const INITIAL_PAGE_SIZE = 10;
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];
const MINIMUM_ANALYSIS_STRAINS = 5;
const INITIAL_TABLE_SORT: TableSortState = {
  active: 'phenotype_value',
  direction: 'asc',
};
const ANALYSIS_QUERY_BEHAVIOR: QueryExecutionBehavior = {
  clearExistingResult: true,
  refreshChart: true,
  showTableLoading: true,
  preserveTablePayload: false,
};
const TABLE_QUERY_BEHAVIOR: QueryExecutionBehavior = {
  clearExistingResult: false,
  refreshChart: false,
  showTableLoading: true,
  preserveTablePayload: false,
};
const CHART_QUERY_BEHAVIOR: QueryExecutionBehavior = {
  clearExistingResult: false,
  refreshChart: true,
  showTableLoading: false,
  preserveTablePayload: true,
};
const VEGA_CHART_PADDING: VegaChartPadding = { left: 64, right: 24, top: 10, bottom: 36 };
const VEGA_CHART_HEIGHT = 360;
const MINIMUM_VEGA_PLOT_WIDTH = 320;
const DENSITY_METRIC_OPTIONS: readonly DensityMetricOption[] = [
  { value: 'g4_density_per_mb', label: 'G4 density' },
  { value: 'upstream_g4_density_per_mb', label: 'Upstream G4 density' },
  { value: 'downstream_g4_density_per_mb', label: 'Downstream G4 density' },
  { value: 'intergenic_g4_density_per_mb', label: 'Intergenic G4 density' },
];
const FALLBACK_OPTIONS: MicrobialEnvironmentG4Options = {
  traits: [
    { value: 'temperature', label: 'Temperature' },
    { value: 'ph', label: 'pH' },
  ],
  modes: [
    { value: 'growth', label: 'Growth' },
    { value: 'optimum', label: 'Optimum' },
  ],
  taxonomy_ranks: [
    { value: 'domain', label: 'Domain' },
    { value: 'phylum', label: 'Phylum' },
    { value: 'class', label: 'Class' },
    { value: 'order', label: 'Order' },
    { value: 'family', label: 'Family' },
    { value: 'genus', label: 'Genus' },
    { value: 'species', label: 'Species' },
  ],
  plans: [
    {
      plan_id: 'growth_temperature_g4',
      trait: 'temperature',
      mode: 'growth',
      phenotype_label: 'Growth temperature',
      phenotype_unit: 'celsius',
      eligible_assemblies: 0,
    },
    {
      plan_id: 'optimum_temperature_g4',
      trait: 'temperature',
      mode: 'optimum',
      phenotype_label: 'Optimum temperature',
      phenotype_unit: 'celsius',
      eligible_assemblies: 0,
    },
    {
      plan_id: 'growth_ph_g4',
      trait: 'ph',
      mode: 'growth',
      phenotype_label: 'Growth pH',
      phenotype_unit: 'pH',
      eligible_assemblies: 0,
    },
    {
      plan_id: 'optimum_ph_g4',
      trait: 'ph',
      mode: 'optimum',
      phenotype_label: 'Optimum pH',
      phenotype_unit: 'pH',
      eligible_assemblies: 0,
    },
  ],
};

function optionLabel(options: readonly MicrobialEnvironmentOption[], value: string): string {
  return options.find((option) => option.value === value)?.label ?? value;
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

function formatStat(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return 'NA';
  }
  return STAT_FORMATTER.format(value);
}

function formatPValue(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return 'NA';
  }
  if (value > 0 && value < 0.001) {
    return value.toExponential(2);
  }
  return STAT_FORMATTER.format(value);
}

function preserveTablePayload(
  response: MicrobialEnvironmentG4QueryResponse,
  currentResult: MicrobialEnvironmentG4QueryResponse | null,
): MicrobialEnvironmentG4QueryResponse {
  if (!currentResult) {
    return response;
  }
  return {
    ...response,
    table_preview: currentResult.table_preview,
    preview_total: currentResult.preview_total,
    download_filename: currentResult.download_filename,
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
  return 'Environment-G4 research query failed.';
}

function isResearchTableError(message: string, error: unknown): boolean {
  return (
    message.includes('microbial_environment_g4_assembly_plan') ||
    message.includes('microbial_environment_g4_taxonomy_index') ||
    message.includes('environment-G4 data') ||
    (error instanceof HttpErrorResponse && error.status === 503)
  );
}

function selectionKey(selection: MicrobialTaxonomySelection): string {
  return `${selection.rank}:${selection.value}`;
}

function isMicrobialEnvironmentTrait(value: string): value is MicrobialEnvironmentTrait {
  return value === 'temperature' || value === 'ph';
}

function isMicrobialEnvironmentMode(value: string): value is MicrobialEnvironmentMode {
  return value === 'growth' || value === 'optimum';
}

function isMicrobialTaxonomyRank(value: string): value is MicrobialTaxonomyRank {
  return (
    value === 'domain' ||
    value === 'phylum' ||
    value === 'class' ||
    value === 'order' ||
    value === 'family' ||
    value === 'genus' ||
    value === 'species'
  );
}

function queryParamValue(params: ParamMap, key: string): string | null {
  const value = params.get(key)?.trim();
  return value ? value : null;
}

function routeTraitFromParamMap(params: ParamMap): MicrobialEnvironmentTrait {
  const value = queryParamValue(params, 'trait');
  if (value === null) {
    return INITIAL_AXIS_SELECTION.trait;
  }
  if (isMicrobialEnvironmentTrait(value)) {
    return value;
  }
  throw new Error(`Invalid microbial environment trait query param: ${value}.`);
}

function routeModeFromParamMap(params: ParamMap): MicrobialEnvironmentMode {
  const value = queryParamValue(params, 'mode');
  if (value === null) {
    return INITIAL_AXIS_SELECTION.mode;
  }
  if (isMicrobialEnvironmentMode(value)) {
    return value;
  }
  throw new Error(`Invalid microbial environment mode query param: ${value}.`);
}

function routeRankFromParamMap(params: ParamMap): MicrobialTaxonomyRank {
  const value = queryParamValue(params, 'rank');
  if (value === null) {
    return INITIAL_TAXONOMY_RANK;
  }
  if (isMicrobialTaxonomyRank(value)) {
    return value;
  }
  throw new Error(`Invalid microbial taxonomy rank query param: ${value}.`);
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
  throw new Error(`Invalid microbial run query param: ${value}.`);
}

function routeInitializationFromParamMap(
  params: ParamMap,
): MicrobialEnvironmentRouteInitialization {
  return {
    trait: routeTraitFromParamMap(params),
    mode: routeModeFromParamMap(params),
    rank: routeRankFromParamMap(params),
    taxon: queryParamValue(params, 'taxon'),
    run: routeRunFromParamMap(params),
  };
}

@Component({
  selector: 'app-microbial-environment-g4',
  imports: [
    MatButtonModule,
    MatButtonToggleModule,
    MatChipsModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatTooltipModule,
    MtxGridModule,
    ReactiveFormsModule,
    DecimalPipe,
    TitleCasePipe,
  ],
  templateUrl: './microbial-environment-g4.component.html',
  styleUrl: './microbial-environment-g4.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MicrobialEnvironmentG4Component implements AfterViewInit, OnDestroy {
  @ViewChild('scatterPlot') private scatterPlot?: ElementRef<HTMLDivElement>;

  private readonly service = inject(MicrobialEnvironmentG4Service);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly document = inject(DOCUMENT);
  private readonly uiThemeService = inject(UiThemeService);
  private readonly routeInitialization = routeInitializationFromParamMap(
    this.route.snapshot.queryParamMap,
  );
  private readonly axisSelection = signal<AxisSelection>(INITIAL_AXIS_SELECTION);
  private readonly taxonomySelectionCounts = signal<Record<string, number>>({});
  private readonly pageIndex = signal(INITIAL_PAGE_INDEX);
  private readonly pageSize = signal(INITIAL_PAGE_SIZE);
  private readonly sortStateSignal = signal<TableSortState>(INITIAL_TABLE_SORT);
  private readonly densityMetric =
    signal<MicrobialEnvironmentDensityMetric>(INITIAL_DENSITY_METRIC);
  private readonly resultDensityMetric =
    signal<MicrobialEnvironmentDensityMetric>(INITIAL_DENSITY_METRIC);

  private chartCleanup: (() => void) | null = null;
  private taxonomyRequestVersion = 0;
  private queryRequestVersion = 0;
  private tableLoadingRequestVersion = 0;
  private hasAppliedRouteInitialization = false;

  readonly options = signal<MicrobialEnvironmentG4Options | null>(null);
  readonly result = signal<MicrobialEnvironmentG4QueryResponse | null>(null);
  readonly taxonomyCandidates = signal<MicrobialTaxonomySearchResult[]>([]);
  readonly assemblyCollection = signal<MicrobialTaxonomySelection[]>([]);
  readonly submittedQuery = signal<MicrobialEnvironmentG4Query | null>(null);
  readonly loadingOptions = signal(false);
  readonly loadingTaxonomy = signal(false);
  readonly loadingQuery = signal(false);
  readonly tableLoading = signal(false);
  readonly downloading = signal(false);
  readonly dataLayerUnavailable = signal(false);
  readonly errorMessage = signal('');
  readonly chartError = signal('');

  readonly form = new FormGroup({
    trait: new FormControl<MicrobialEnvironmentTrait>(INITIAL_AXIS_SELECTION.trait, {
      nonNullable: true,
    }),
    mode: new FormControl<MicrobialEnvironmentMode>(INITIAL_AXIS_SELECTION.mode, {
      nonNullable: true,
    }),
    taxonomyRank: new FormControl<MicrobialTaxonomyRank>(INITIAL_TAXONOMY_RANK, {
      nonNullable: true,
    }),
    taxonomyKeyword: new FormControl('', { nonNullable: true }),
  });

  readonly pageSizeOptions = PAGE_SIZE_OPTIONS;
  readonly densityMetricOptions = DENSITY_METRIC_OPTIONS;
  readonly tablePageIndex = this.pageIndex.asReadonly();
  readonly tablePageSize = this.pageSize.asReadonly();
  readonly tableSortState = this.sortStateSignal.asReadonly();
  readonly selectedDensityMetric = this.densityMetric.asReadonly();

  readonly canSearch = computed(
    () =>
      Boolean(this.options()) &&
      !this.loadingOptions() &&
      !this.loadingQuery() &&
      !this.dataLayerUnavailable(),
  );

  readonly currentPlan = computed(() => {
    const { trait, mode } = this.axisSelection();
    return (
      this.options()?.plans.find((plan) => plan.trait === trait && plan.mode === mode) ??
      FALLBACK_OPTIONS.plans.find((plan) => plan.trait === trait && plan.mode === mode) ??
      FALLBACK_OPTIONS.plans[0]
    );
  });

  readonly dataStatusLabel = computed(() =>
    this.dataLayerUnavailable() ? 'Research data unavailable' : 'Ready for correlation queries',
  );

  readonly studySummary = computed(() => {
    const plan = this.currentPlan();
    return `Correlate ${plan.phenotype_label} with genome-wide G4 density.`;
  });

  readonly collectionSummary = computed(() => {
    const count = this.assemblyCollection().length;
    if (!count) {
      return 'All eligible strains will be used.';
    }
    return `${count} taxonomy ${count === 1 ? 'selection' : 'selections'} will be unioned into one strain set.`;
  });

  readonly summaryMetrics = computed<SummaryMetric[]>(() => {
    const response = this.result();
    if (!response) {
      return [];
    }
    return [
      {
        label: 'strains',
        value: COUNT_FORMATTER.format(response.summary.assembly_count),
        hint: 'Strains in the submitted set',
        icon: 'groups',
      },
      {
        label: 'Spearman r',
        value: formatStat(response.correlation.rho),
        hint: `${response.correlation.n} complete pairs`,
        icon: 'query_stats',
      },
      {
        label: 'p-value',
        value: formatPValue(response.correlation.p_value),
        hint: response.correlation.method,
        icon: 'notifications_none',
      },
      {
        label: 'G4 density metric',
        value: 'sites/Mb',
        hint: this.densityMetricLabel(),
        icon: 'biotech',
      },
    ];
  });

  readonly tableColumns = computed<MtxGridColumn<MicrobialEnvironmentTableRow>[]>(() => [
    {
      header: 'Organism',
      field: 'taxonomy.species',
      sortable: true,
      sortProp: { id: 'species' },
    },
    { header: 'Assembly accession', field: 'assembly_accession', sortable: false },
    {
      header: `${this.phenotypeLabel()} (${this.phenotypeUnitLabel()})`,
      field: 'phenotype_value',
      sortable: true,
      type: 'number',
      formatter: (row) => this.formatValue(row.phenotype_value),
    },
    {
      header: 'G4 density',
      field: 'g4_density_per_mb',
      sortable: true,
      type: 'number',
      formatter: (row) => this.formatValue(row.g4_density_per_mb),
    },
    {
      header: 'Genome size (Mb)',
      field: 'genome_size',
      sortable: true,
      type: 'number',
      formatter: (row) => this.formatValue(row.genome_size),
    },
    {
      header: 'Taxonomy',
      field: 'taxonomy.genus',
      sortable: false,
    },
  ]);

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
  }

  reloadOptions(): void {
    this.loadOptions();
  }

  onAxisChange(): void {
    const axisSelection: AxisSelection = {
      trait: this.form.controls.trait.value,
      mode: this.form.controls.mode.value,
    };
    this.axisSelection.set(axisSelection);
    this.taxonomyCandidates.set([]);
    this.taxonomySelectionCounts.set({});
    this.clearSubmittedResult();
  }

  findTaxonomy(): void {
    if (!this.options() || this.dataLayerUnavailable()) {
      this.showNotice('Load research data before searching taxonomy.');
      return;
    }
    const rank = this.form.controls.taxonomyRank.value;
    const keyword = this.form.controls.taxonomyKeyword.value;
    const requestVersion = ++this.taxonomyRequestVersion;
    this.loadingTaxonomy.set(true);
    this.service
      .searchTaxonomy(rank, keyword, this.form.controls.trait.value, this.form.controls.mode.value)
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
          if (!response.results.length) {
            this.showNotice('No taxonomy matches for the current axis.');
          }
        },
        error: (error: unknown) => {
          if (requestVersion === this.taxonomyRequestVersion) {
            this.handleError(error);
          }
        },
      });
  }

  addTaxonomySelection(selection: MicrobialTaxonomySelection): void {
    const normalizedSelection: MicrobialTaxonomySelection = {
      rank: selection.rank,
      value: selection.value,
    };
    const key = selectionKey(normalizedSelection);
    this.assemblyCollection.update((items) =>
      items.some((item) => selectionKey(item) === key) ? items : [...items, normalizedSelection],
    );
    const eligibleAssemblyCount = (selection as Partial<MicrobialTaxonomySearchResult>)
      .eligible_assembly_count;
    if (typeof eligibleAssemblyCount === 'number') {
      this.taxonomySelectionCounts.update((counts) => ({
        ...counts,
        [key]: eligibleAssemblyCount,
      }));
    }
  }

  removeTaxonomySelection(selection: MicrobialTaxonomySelection): void {
    const key = selectionKey(selection);
    this.assemblyCollection.update((items) => items.filter((item) => selectionKey(item) !== key));
    this.taxonomySelectionCounts.update((counts) => {
      const next = { ...counts };
      delete next[key];
      return next;
    });
  }

  clearAssemblyCollection(): void {
    this.assemblyCollection.set([]);
    this.taxonomySelectionCounts.set({});
  }

  resetAnalysisSetup(): void {
    this.taxonomyRequestVersion++;
    this.queryRequestVersion++;
    this.tableLoadingRequestVersion++;
    this.form.setValue({
      trait: INITIAL_AXIS_SELECTION.trait,
      mode: INITIAL_AXIS_SELECTION.mode,
      taxonomyRank: INITIAL_TAXONOMY_RANK,
      taxonomyKeyword: '',
    });
    this.axisSelection.set(INITIAL_AXIS_SELECTION);
    this.taxonomyCandidates.set([]);
    this.clearAssemblyCollection();
    this.result.set(null);
    this.submittedQuery.set(null);
    this.loadingTaxonomy.set(false);
    this.loadingQuery.set(false);
    this.tableLoading.set(false);
    this.downloading.set(false);
    this.errorMessage.set('');
    this.chartError.set('');
    this.pageIndex.set(INITIAL_PAGE_INDEX);
    this.pageSize.set(INITIAL_PAGE_SIZE);
    this.sortStateSignal.set(INITIAL_TABLE_SORT);
    this.densityMetric.set(INITIAL_DENSITY_METRIC);
    this.resultDensityMetric.set(INITIAL_DENSITY_METRIC);
    this.clearChart();
  }

  search(): void {
    if (!this.options()) {
      this.showNotice('Load research options before Search.');
      return;
    }
    if (this.dataLayerUnavailable()) {
      this.showNotice('Environment-G4 data is not available yet.');
      return;
    }
    const knownStrainCount = this.knownSelectedStrainCount();
    if (knownStrainCount !== null && knownStrainCount < MINIMUM_ANALYSIS_STRAINS) {
      this.showNotice(
        `At least ${MINIMUM_ANALYSIS_STRAINS} strains are required for analysis; current selection has ${knownStrainCount} strains.`,
      );
      this.result.set(null);
      this.submittedQuery.set(null);
      this.clearChart();
      return;
    }
    this.pageIndex.set(INITIAL_PAGE_INDEX);
    const request = this.buildQuery();
    this.runQuery(request, ANALYSIS_QUERY_BEHAVIOR);
  }

  onTablePageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.runSubmittedQuery();
  }

  onTableSortChange(sort: Sort): void {
    const sortField = this.tableSortField(sort.active);
    if (!sortField || !sort.direction) {
      return;
    }
    this.sortStateSignal.set({
      active: sortField,
      direction: sort.direction as MicrobialEnvironmentSortOrder,
    });
    this.pageIndex.set(INITIAL_PAGE_INDEX);
    this.runSubmittedQuery();
  }

  onDensityMetricChange(metric: MicrobialEnvironmentDensityMetric): void {
    if (metric === this.densityMetric()) {
      return;
    }
    this.densityMetric.set(metric);
    const submittedQuery = this.submittedQuery();
    if (!submittedQuery) {
      return;
    }
    const request: MicrobialEnvironmentG4Query = {
      ...submittedQuery,
      density_metric: metric,
      page_index: this.pageIndex(),
      page_size: this.pageSize(),
      sort_field: this.sortStateSignal().active,
      sort_order: this.sortStateSignal().direction,
    };
    this.runQuery(request, CHART_QUERY_BEHAVIOR);
  }

  private runSubmittedQuery(): void {
    const submittedQuery = this.submittedQuery();
    if (!submittedQuery) {
      return;
    }
    const request: MicrobialEnvironmentG4Query = {
      ...submittedQuery,
      page_index: this.pageIndex(),
      page_size: this.pageSize(),
      sort_field: this.sortStateSignal().active,
      sort_order: this.sortStateSignal().direction,
      density_metric: this.densityMetric(),
    };
    this.runQuery(request, TABLE_QUERY_BEHAVIOR);
  }

  private runQuery(request: MicrobialEnvironmentG4Query, behavior: QueryExecutionBehavior): void {
    const requestVersion = ++this.queryRequestVersion;
    const tableLoadingRequestVersion = behavior.showTableLoading
      ? ++this.tableLoadingRequestVersion
      : this.tableLoadingRequestVersion;
    this.loadingQuery.set(true);
    if (behavior.showTableLoading) {
      this.tableLoading.set(true);
    }
    this.errorMessage.set('');
    this.chartError.set('');
    if (behavior.clearExistingResult) {
      this.result.set(null);
      this.submittedQuery.set(null);
      this.clearChart();
    }
    this.service
      .query(request)
      .pipe(
        finalize(() => {
          if (requestVersion === this.queryRequestVersion) {
            this.loadingQuery.set(false);
          }
          if (
            behavior.showTableLoading &&
            tableLoadingRequestVersion === this.tableLoadingRequestVersion
          ) {
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
          this.resultDensityMetric.set(request.density_metric);
          this.result.set(
            behavior.preserveTablePayload
              ? preserveTablePayload(response, this.result())
              : response,
          );
          if (behavior.refreshChart) {
            this.scheduleChartRender();
          }
        },
        error: (error: unknown) => {
          if (requestVersion !== this.queryRequestVersion) {
            return;
          }
          if (behavior.clearExistingResult) {
            this.result.set(null);
            this.submittedQuery.set(null);
            this.clearChart();
          }
          this.densityMetric.set(
            this.submittedQuery()?.density_metric ?? this.resultDensityMetric(),
          );
          this.handleError(error);
        },
      });
  }

  downloadResults(): void {
    const request = this.submittedQuery();
    const response = this.result();
    if (!request || !response) {
      this.showNotice('Run Search before downloading CSV.');
      return;
    }
    this.downloading.set(true);
    this.service
      .downloadResults(request)
      .pipe(
        finalize(() => this.downloading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (blob) => this.saveBlob(blob, response.download_filename),
        error: (error: unknown) => this.handleError(error),
      });
  }

  currentTraitLabel(): string {
    return optionLabel(
      this.options()?.traits ?? FALLBACK_OPTIONS.traits,
      this.axisSelection().trait,
    );
  }

  currentModeLabel(): string {
    return optionLabel(this.options()?.modes ?? FALLBACK_OPTIONS.modes, this.axisSelection().mode);
  }

  taxonomyRankLabel(rank: string): string {
    return optionLabel(this.options()?.taxonomy_ranks ?? FALLBACK_OPTIONS.taxonomy_ranks, rank);
  }

  phenotypeLabel(): string {
    return this.currentPlan().phenotype_label;
  }

  phenotypeUnitLabel(): string {
    const unit = this.currentPlan().phenotype_unit;
    return unit === 'celsius' ? '°C' : unit;
  }

  eligibleStrainLabel(): string {
    return `${COUNT_FORMATTER.format(this.currentPlan().eligible_assemblies)} eligible strains`;
  }

  densityMetricLabel(): string {
    return optionLabel(DENSITY_METRIC_OPTIONS, this.resultDensityMetric());
  }

  chartPointCount(points: MicrobialEnvironmentScatterPoint[]): number {
    const metric = this.resultDensityMetric();
    return points.filter((point) => toFiniteNumber(point[metric]) !== null).length;
  }

  formatValue(value: string | number | null): string {
    if (typeof value === 'number') {
      return formatNumber(value);
    }
    return value ?? 'NA';
  }

  private buildQuery(): MicrobialEnvironmentG4Query {
    return {
      trait: this.form.controls.trait.value,
      mode: this.form.controls.mode.value,
      taxonomy_selections: this.assemblyCollection(),
      page_index: this.pageIndex(),
      page_size: this.pageSize(),
      sort_field: this.sortStateSignal().active,
      sort_order: this.sortStateSignal().direction,
      density_metric: this.densityMetric(),
    };
  }

  private knownSelectedStrainCount(): number | null {
    const selections = this.assemblyCollection();
    if (!selections.length) {
      return this.currentPlan().eligible_assemblies;
    }
    if (selections.length === 1) {
      return this.taxonomySelectionCounts()[selectionKey(selections[0])] ?? null;
    }
    return null;
  }

  private tableSortField(field: string): MicrobialEnvironmentSortField | null {
    const fields: Record<string, MicrobialEnvironmentSortField> = {
      species: 'species',
      strain: 'strain',
      phenotype_value: 'phenotype_value',
      g4_density_per_mb: 'g4_density_per_mb',
      upstream_g4_density_per_mb: 'upstream_g4_density_per_mb',
      downstream_g4_density_per_mb: 'downstream_g4_density_per_mb',
      intergenic_g4_density_per_mb: 'intergenic_g4_density_per_mb',
      genome_size: 'genome_size',
      gc_percent: 'gc_percent',
    };
    return fields[field] ?? null;
  }

  private loadOptions(): void {
    this.loadingOptions.set(true);
    this.errorMessage.set('');
    this.dataLayerUnavailable.set(false);
    this.service
      .getOptions()
      .pipe(
        finalize(() => this.loadingOptions.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (options) => {
          this.options.set(options);
          this.dataLayerUnavailable.set(false);
          this.applyInitialRouteState();
        },
        error: (error: unknown) => {
          const message = extractErrorMessage(error);
          if (isResearchTableError(message, error)) {
            this.options.set(FALLBACK_OPTIONS);
            this.result.set(null);
            this.submittedQuery.set(null);
            this.taxonomyCandidates.set([]);
            this.errorMessage.set('');
            this.dataLayerUnavailable.set(true);
            this.clearChart();
            return;
          }
          this.handleError(error);
        },
      });
  }

  private applyInitialRouteState(): void {
    if (this.hasAppliedRouteInitialization) {
      return;
    }
    this.hasAppliedRouteInitialization = true;

    const initialization = this.routeInitialization;
    this.form.setValue({
      trait: initialization.trait,
      mode: initialization.mode,
      taxonomyRank: initialization.rank,
      taxonomyKeyword: initialization.taxon ?? '',
    });
    this.axisSelection.set({
      trait: initialization.trait,
      mode: initialization.mode,
    });
    this.taxonomyCandidates.set([]);
    this.taxonomySelectionCounts.set({});
    this.assemblyCollection.set(
      initialization.taxon === null
        ? []
        : [{ rank: initialization.rank, value: initialization.taxon }],
    );

    if (initialization.run) {
      this.search();
    }
  }

  private clearSubmittedResult(): void {
    this.result.set(null);
    this.submittedQuery.set(null);
    this.errorMessage.set('');
    this.chartError.set('');
    this.clearChart();
  }

  private scheduleChartRender(): void {
    setTimeout(() => {
      void this.renderChart();
    });
  }

  private async renderChart(): Promise<void> {
    const element = this.scatterPlot?.nativeElement;
    const response = this.result();
    if (!element || !response) {
      return;
    }
    const points = this.vegaPoints(response.scatter_points);
    if (!points.length) {
      this.clearChart();
      return;
    }
    const linePoints = this.vegaLinePoints(response.regression.line_points);
    const width = this.vegaPlotWidth(element);
    this.clearChart();
    const spec = this.vegaSpec(points, linePoints, width);
    try {
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

  private vegaPoints(points: MicrobialEnvironmentScatterPoint[]): VegaPointDatum[] {
    const metric = this.resultDensityMetric();
    return points.flatMap((point) => {
      const densityValue = point[metric];
      const normalizedDensityValue = toFiniteNumber(densityValue);
      const normalizedPhenotypeValue = toFiniteNumber(point.phenotype_value);
      if (normalizedDensityValue === null || normalizedPhenotypeValue === null) {
        return [];
      }
      return [
        {
          assembly_accession: point.assembly_accession,
          phenotype_value: normalizedPhenotypeValue,
          density_value: normalizedDensityValue,
          strain: point.strain,
          genus: point.taxonomy.genus,
          species: point.taxonomy.species,
        },
      ];
    });
  }

  private vegaLinePoints(linePoints: VegaLineDatum[]): VegaLineDatum[] {
    return linePoints.flatMap((point) => {
      const phenotypeValue = toFiniteNumber(point.phenotype_value);
      const densityValue = toFiniteNumber(point.density_value);
      if (phenotypeValue === null || densityValue === null) {
        return [];
      }
      return [{ phenotype_value: phenotypeValue, density_value: densityValue }];
    });
  }

  private vegaSpec(
    points: VegaPointDatum[],
    linePoints: VegaLineDatum[],
    width: number,
  ): VisualizationSpec {
    const densityLabel = this.densityMetricLabel();
    const themeColors = this.resolveVegaThemeColors(this.uiThemeService.resolvedMode());
    return {
      $schema: 'https://vega.github.io/schema/vega/v6.json',
      width,
      height: VEGA_CHART_HEIGHT,
      padding: VEGA_CHART_PADDING,
      background: 'transparent',
      config: {
        axis: {
          labelColor: themeColors.axisText,
          titleColor: themeColors.axisText,
          domainColor: themeColors.axisLine,
          tickColor: themeColors.axisLine,
          gridColor: themeColors.gridLine,
        },
      },
      data: [
        { name: 'points', values: points },
        { name: 'line', values: linePoints },
      ],
      scales: [
        {
          name: 'x',
          type: 'linear',
          domain: { data: 'points', field: 'phenotype_value' },
          nice: true,
          range: 'width',
          zero: false,
        },
        {
          name: 'y',
          type: 'linear',
          domain: { data: 'points', field: 'density_value' },
          nice: true,
          range: 'height',
          zero: false,
        },
      ],
      axes: [
        {
          orient: 'bottom',
          scale: 'x',
          title: `${this.phenotypeLabel()} (${this.phenotypeUnitLabel()})`,
          grid: true,
        },
        { orient: 'left', scale: 'y', title: `${densityLabel} per Mb`, grid: true },
      ],
      marks: [
        {
          type: 'symbol',
          from: { data: 'points' },
          encode: {
            enter: {
              fillOpacity: { value: 0.72 },
              stroke: { value: '#1d3557' },
              strokeWidth: { value: 0.6 },
              tooltip: {
                signal: `{'Strain accession': datum.assembly_accession, 'Strain': datum.strain, 'Phenotype': datum.phenotype_value, '${densityLabel}': datum.density_value, 'Genus': datum.genus, 'Species': datum.species}`,
              },
            },
            update: {
              x: { scale: 'x', field: 'phenotype_value' },
              y: { scale: 'y', field: 'density_value' },
              fill: { value: '#4f7cac' },
              size: { value: 62 },
            },
            hover: { size: { value: 110 }, fill: { value: '#c7522a' } },
          },
        },
        {
          type: 'line',
          from: { data: 'line' },
          encode: {
            enter: {
              stroke: { value: '#c7522a' },
              strokeWidth: { value: 3 },
            },
            update: {
              x: { scale: 'x', field: 'phenotype_value' },
              y: { scale: 'y', field: 'density_value' },
            },
          },
        },
      ],
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
    const element = this.scatterPlot?.nativeElement;
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

  private saveBlob(blob: Blob, filename: string): void {
    const windowRef = this.document.defaultView;
    if (!windowRef) {
      return;
    }
    const url = windowRef.URL.createObjectURL(blob);
    const anchor = this.document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    windowRef.URL.revokeObjectURL(url);
  }

  private handleError(error: unknown): void {
    const rawMessage = extractErrorMessage(error);
    const unavailable = isResearchTableError(rawMessage, error);
    const message = unavailable ? 'Environment-G4 data is not available yet.' : rawMessage;
    this.dataLayerUnavailable.set(unavailable);
    this.errorMessage.set(message);
    this.showNotice(message);
  }

  private showNotice(message: string): void {
    this.errorMessage.set(message);
  }
}
