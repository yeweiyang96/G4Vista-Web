import { BreakpointObserver } from '@angular/cdk/layout';
import { DOCUMENT, TitleCasePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  OnDestroy,
  signal,
  ViewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatStepperModule } from '@angular/material/stepper';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import embed, { VisualizationSpec } from 'vega-embed';
import { finalize } from 'rxjs';
import {
  MicrobialEnvironmentG4Options,
  MicrobialEnvironmentG4Query,
  MicrobialEnvironmentG4QueryResponse,
  MicrobialEnvironmentG4Service,
  MicrobialEnvironmentMode,
  MicrobialEnvironmentOption,
  MicrobialEnvironmentScatterPoint,
  MicrobialEnvironmentTableRow,
  MicrobialEnvironmentTrait,
  MicrobialTaxonomyRank,
  MicrobialTaxonomySearchResult,
  MicrobialTaxonomySelection,
} from '../../services/microbial-environment-g4.service';

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

interface VegaPointDatum {
  assembly_accession: string;
  phenotype_value: number;
  g4_density_per_mb: number;
  strain: string;
  genus: string;
  species: string;
}

interface VegaLineDatum {
  phenotype_value: number;
  g4_density_per_mb: number;
}

const COUNT_FORMATTER = new Intl.NumberFormat('en-US');
const NUMBER_FORMATTER = new Intl.NumberFormat('en-US', { maximumFractionDigits: 3 });
const STAT_FORMATTER = new Intl.NumberFormat('en-US', { maximumFractionDigits: 4 });
const INITIAL_AXIS_SELECTION: AxisSelection = {
  trait: 'temperature',
  mode: 'growth',
};
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

function optionLabel(options: MicrobialEnvironmentOption[], value: string): string {
  return options.find((option) => option.value === value)?.label ?? value;
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

@Component({
  selector: 'app-microbial-environment-g4',
  imports: [
    MatButtonModule,
    MatButtonToggleModule,
    MatCardModule,
    MatChipsModule,
    MatDividerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatListModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatSidenavModule,
    MatSnackBarModule,
    MatStepperModule,
    MatTableModule,
    MatTooltipModule,
    ReactiveFormsModule,
    TitleCasePipe,
  ],
  templateUrl: './microbial-environment-g4.component.html',
  styleUrl: './microbial-environment-g4.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MicrobialEnvironmentG4Component implements AfterViewInit, OnDestroy {
  @ViewChild('scatterPlot') private scatterPlot?: ElementRef<HTMLDivElement>;

  private readonly service = inject(MicrobialEnvironmentG4Service);
  private readonly destroyRef = inject(DestroyRef);
  private readonly snackBar = inject(MatSnackBar);
  private readonly document = inject(DOCUMENT);
  private readonly breakpointObserver = inject(BreakpointObserver);
  private readonly axisSelection = signal<AxisSelection>(INITIAL_AXIS_SELECTION);

  private chartCleanup: (() => void) | null = null;

  readonly options = signal<MicrobialEnvironmentG4Options | null>(null);
  readonly result = signal<MicrobialEnvironmentG4QueryResponse | null>(null);
  readonly taxonomyCandidates = signal<MicrobialTaxonomySearchResult[]>([]);
  readonly assemblyCollection = signal<MicrobialTaxonomySelection[]>([]);
  readonly submittedQuery = signal<MicrobialEnvironmentG4Query | null>(null);
  readonly loadingOptions = signal(false);
  readonly loadingTaxonomy = signal(false);
  readonly loadingQuery = signal(false);
  readonly downloading = signal(false);
  readonly dataLayerUnavailable = signal(false);
  readonly errorMessage = signal('');
  readonly chartError = signal('');
  readonly isNarrow = signal(false);

  readonly form = new FormGroup({
    trait: new FormControl<MicrobialEnvironmentTrait>(INITIAL_AXIS_SELECTION.trait, {
      nonNullable: true,
    }),
    mode: new FormControl<MicrobialEnvironmentMode>(INITIAL_AXIS_SELECTION.mode, {
      nonNullable: true,
    }),
    taxonomyRank: new FormControl<MicrobialTaxonomyRank>('genus', { nonNullable: true }),
    taxonomyKeyword: new FormControl('', { nonNullable: true }),
  });

  readonly previewColumns = [
    'assembly',
    'strain',
    'phenotype',
    'density',
    'taxonomy',
    'gc',
    'genomeSize',
  ];

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
      return 'All eligible assemblies will be used.';
    }
    return `${count} taxonomy ${count === 1 ? 'selection' : 'selections'} will be unioned into one assembly set.`;
  });

  readonly summaryMetrics = computed<SummaryMetric[]>(() => {
    const response = this.result();
    if (!response) {
      return [];
    }
    return [
      {
        label: 'Assemblies',
        value: COUNT_FORMATTER.format(response.summary.assembly_count),
        hint: 'Assemblies in the submitted set',
        icon: 'biotech',
      },
      {
        label: 'Spearman rho',
        value: formatStat(response.correlation.rho),
        hint: `${response.correlation.n} complete pairs`,
        icon: 'query_stats',
      },
      {
        label: 'p-value',
        value: formatPValue(response.correlation.p_value),
        hint: response.correlation.status.replace('_', ' '),
        icon: 'functions',
      },
      {
        label: 'Regression R2',
        value: formatStat(response.regression.r_squared),
        hint: response.regression.status.replace('_', ' '),
        icon: 'show_chart',
      },
    ];
  });

  constructor() {
    this.breakpointObserver
      .observe('(max-width: 980px)')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((state) => this.isNarrow.set(state.matches));
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
    this.clearSubmittedResult();
  }

  findTaxonomy(): void {
    if (!this.options() || this.dataLayerUnavailable()) {
      this.snackBar.open('Load research data before searching taxonomy.', 'Dismiss', {
        duration: 3000,
      });
      return;
    }
    const rank = this.form.controls.taxonomyRank.value;
    const keyword = this.form.controls.taxonomyKeyword.value;
    this.loadingTaxonomy.set(true);
    this.service
      .searchTaxonomy(rank, keyword, this.form.controls.trait.value, this.form.controls.mode.value)
      .pipe(
        finalize(() => this.loadingTaxonomy.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (response) => {
          this.taxonomyCandidates.set(response.results);
          if (!response.results.length) {
            this.snackBar.open('No taxonomy matches for the current axis.', 'Dismiss', {
              duration: 3000,
            });
          }
        },
        error: (error: unknown) => this.handleError(error),
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
  }

  removeTaxonomySelection(selection: MicrobialTaxonomySelection): void {
    const key = selectionKey(selection);
    this.assemblyCollection.update((items) => items.filter((item) => selectionKey(item) !== key));
  }

  clearAssemblyCollection(): void {
    this.assemblyCollection.set([]);
  }

  search(): void {
    if (!this.options()) {
      this.snackBar.open('Load research options before Search.', 'Dismiss', { duration: 3000 });
      return;
    }
    if (this.dataLayerUnavailable()) {
      this.snackBar.open('Environment-G4 data is not available yet.', 'Dismiss', {
        duration: 3000,
      });
      return;
    }
    const request = this.buildQuery();
    this.loadingQuery.set(true);
    this.errorMessage.set('');
    this.chartError.set('');
    this.service
      .query(request)
      .pipe(
        finalize(() => this.loadingQuery.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (response) => {
          this.submittedQuery.set(request);
          this.result.set(response);
          this.scheduleChartRender();
        },
        error: (error: unknown) => this.handleError(error),
      });
  }

  downloadResults(): void {
    const request = this.submittedQuery();
    const response = this.result();
    if (!request || !response) {
      this.snackBar.open('Run Search before downloading CSV.', 'Dismiss', { duration: 3000 });
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
    return unit === 'celsius' ? 'deg C' : unit;
  }

  eligibleAssemblyLabel(): string {
    return `${COUNT_FORMATTER.format(this.currentPlan().eligible_assemblies)} eligible assemblies`;
  }

  formatValue(value: string | number | null): string {
    if (typeof value === 'number') {
      return formatNumber(value);
    }
    return value ?? 'NA';
  }

  phenotypeRange(row: { phenotype_min: number | null; phenotype_max: number | null }): string {
    if (row.phenotype_min === null || row.phenotype_max === null) {
      return 'NA';
    }
    return `${formatNumber(row.phenotype_min)} to ${formatNumber(row.phenotype_max)}`;
  }

  taxonomyLabel(row: MicrobialEnvironmentScatterPoint | MicrobialEnvironmentTableRow): string {
    return [
      row.taxonomy.domain,
      row.taxonomy.phylum,
      row.taxonomy.class_name,
      row.taxonomy.order,
      row.taxonomy.family,
      row.taxonomy.genus,
      row.taxonomy.species,
    ]
      .filter((value) => value)
      .join(' / ');
  }

  private buildQuery(): MicrobialEnvironmentG4Query {
    return {
      trait: this.form.controls.trait.value,
      mode: this.form.controls.mode.value,
      taxonomy_selections: this.assemblyCollection(),
      page_index: 0,
      page_size: 50,
    };
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
    this.clearChart();
    const width = Math.max(element.clientWidth - 24, 320);
    const spec = this.vegaSpec(points, response.regression.line_points, width);
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
    return points
      .filter((point) => point.g4_density_per_mb !== null)
      .map((point) => ({
        assembly_accession: point.assembly_accession,
        phenotype_value: point.phenotype_value,
        g4_density_per_mb: point.g4_density_per_mb as number,
        strain: point.strain,
        genus: point.taxonomy.genus,
        species: point.taxonomy.species,
      }));
  }

  private vegaSpec(
    points: VegaPointDatum[],
    linePoints: VegaLineDatum[],
    width: number,
  ): VisualizationSpec {
    return {
      $schema: 'https://vega.github.io/schema/vega/v6.json',
      width,
      height: 380,
      padding: { left: 64, right: 24, top: 24, bottom: 56 },
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
          domain: { data: 'points', field: 'g4_density_per_mb' },
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
        { orient: 'left', scale: 'y', title: 'G4 density per Mb', grid: true },
      ],
      marks: [
        {
          type: 'symbol',
          from: { data: 'points' },
          encode: {
            enter: {
              fill: { value: '#4f7cac' },
              fillOpacity: { value: 0.72 },
              stroke: { value: '#1d3557' },
              strokeWidth: { value: 0.6 },
              size: { value: 62 },
              tooltip: {
                signal:
                  "{'Assembly': datum.assembly_accession, 'Strain': datum.strain, 'Phenotype': datum.phenotype_value, 'G4 density': datum.g4_density_per_mb, 'Genus': datum.genus, 'Species': datum.species}",
              },
            },
            update: {
              x: { scale: 'x', field: 'phenotype_value' },
              y: { scale: 'y', field: 'g4_density_per_mb' },
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
              y: { scale: 'y', field: 'g4_density_per_mb' },
            },
          },
        },
      ],
    };
  }

  private clearChart(): void {
    this.chartCleanup?.();
    this.chartCleanup = null;
    const element = this.scatterPlot?.nativeElement;
    if (element) {
      element.innerHTML = '';
    }
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
    this.snackBar.open(message, 'Dismiss', { duration: unavailable ? 3000 : 5000 });
  }
}
