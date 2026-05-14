import { BreakpointObserver } from '@angular/cdk/layout';
import { DOCUMENT, LowerCasePipe, TitleCasePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
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
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ChartData, ChartDataset, ChartOptions } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { finalize } from 'rxjs';
import {
  MicrobialEnvironmentG4Options,
  MicrobialEnvironmentG4Query,
  MicrobialEnvironmentG4QueryResponse,
  MicrobialEnvironmentG4Service,
  MicrobialEnvironmentMode,
  MicrobialEnvironmentOption,
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

const COUNT_FORMATTER = new Intl.NumberFormat('en-US');
const NUMBER_FORMATTER = new Intl.NumberFormat('en-US', { maximumFractionDigits: 3 });
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
  metrics: [
    { value: 'g4_density_per_mb', label: 'G4 density per Mb' },
    { value: 'g4_count', label: 'G4 count' },
    { value: 'g4_mean_score', label: 'G4 mean score' },
  ],
  bin_ranges: [],
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
    message.includes('microbial_environment_g4') ||
    message.includes('environment-G4 data') ||
    (error instanceof HttpErrorResponse && error.status === 503)
  );
}

function selectionKey(selection: MicrobialTaxonomySelection): string {
  return `${selection.rank}:${selection.value}`;
}

function rangeLabel(min: number | null, max: number | null): string {
  if (min === null || max === null) {
    return 'Range pending';
  }
  return `${formatNumber(min)} to ${formatNumber(max)}`;
}

@Component({
  selector: 'app-microbial-environment-g4',
  imports: [
    BaseChartDirective,
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
    MatTabsModule,
    MatTooltipModule,
    ReactiveFormsModule,
    LowerCasePipe,
    TitleCasePipe,
  ],
  templateUrl: './microbial-environment-g4.component.html',
  styleUrl: './microbial-environment-g4.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MicrobialEnvironmentG4Component {
  private readonly service = inject(MicrobialEnvironmentG4Service);
  private readonly destroyRef = inject(DestroyRef);
  private readonly snackBar = inject(MatSnackBar);
  private readonly document = inject(DOCUMENT);
  private readonly breakpointObserver = inject(BreakpointObserver);

  private readonly axisSelection = signal<AxisSelection>(INITIAL_AXIS_SELECTION);

  readonly options = signal<MicrobialEnvironmentG4Options | null>(null);
  readonly result = signal<MicrobialEnvironmentG4QueryResponse | null>(null);
  readonly taxonomyCandidates = signal<MicrobialTaxonomySearchResult[]>([]);
  readonly genomeCollection = signal<MicrobialTaxonomySelection[]>([]);
  readonly submittedQuery = signal<MicrobialEnvironmentG4Query | null>(null);
  readonly loadingOptions = signal(false);
  readonly loadingTaxonomy = signal(false);
  readonly loadingQuery = signal(false);
  readonly downloading = signal(false);
  readonly dataLayerUnavailable = signal(false);
  readonly errorMessage = signal('');
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

  readonly binStatColumns = [
    'bin',
    'genomes',
    'meanDensity',
    'medianDensity',
    'meanCount',
    'meanScore',
  ];
  readonly genomeColumns = ['genome', 'taxonomy', 'traitRange', 'density', 'count', 'score'];
  readonly sixteenSColumns = ['genome', 'accession', 'length', 'density', 'count', 'score'];

  readonly canSearch = computed(
    () =>
      Boolean(this.options()) &&
      !this.loadingOptions() &&
      !this.loadingQuery() &&
      !this.dataLayerUnavailable(),
  );

  readonly currentRange = computed(() => {
    const { trait, mode } = this.axisSelection();
    return (
      this.options()?.bin_ranges.find((range) => range.trait === trait && range.mode === mode) ??
      null
    );
  });

  readonly dataStatusLabel = computed(() =>
    this.dataLayerUnavailable() ? 'Research data unavailable' : 'Ready for bin queries',
  );

  readonly studySummary = computed(() => {
    const { trait, mode } = this.axisSelection();
    const traitText = trait === 'temperature' ? 'temperature' : 'pH';
    const modeText = mode === 'growth' ? 'growth interval' : 'optimum interval';
    return `Analyze whole-genome G4 density across ${traitText} bins using each genome's ${modeText}.`;
  });

  readonly collectionSummary = computed(() => {
    const count = this.genomeCollection().length;
    if (!count) {
      return 'All eligible genomes will be used.';
    }
    return `${count} taxonomy ${count === 1 ? 'selection' : 'selections'} will be unioned into one genome set.`;
  });

  readonly summaryMetrics = computed<SummaryMetric[]>(() => {
    const summary = this.result()?.summary;
    if (!summary) {
      return [];
    }
    return [
      {
        label: 'Genomes',
        value: COUNT_FORMATTER.format(summary.matching_genomes),
        hint: 'Unique genomes in the submitted set',
        icon: 'biotech',
      },
      {
        label: 'Bin rows',
        value: COUNT_FORMATTER.format(summary.bin_rows),
        hint: 'Expanded genome-bin records',
        icon: 'view_timeline',
      },
      {
        label: 'Bins',
        value: COUNT_FORMATTER.format(summary.bin_count),
        hint: 'Environment units represented',
        icon: 'data_array',
      },
      {
        label: '16S rows',
        value: COUNT_FORMATTER.format(summary.sixteen_s_rows),
        hint: 'Auxiliary 16S G4 records',
        icon: 'hub',
      },
    ];
  });

  readonly binChartData = computed<ChartData<'scatter'>>(() => {
    const result = this.result();
    const meanTrend: { x: number; y: number }[] =
      result?.bin_stats
        .filter((row) => row.g4_density_mean !== null)
        .map((row) => ({ x: row.bin_mid, y: row.g4_density_mean as number })) ?? [];
    const medianTrend: { x: number; y: number }[] =
      result?.bin_stats
        .filter((row) => row.g4_density_median !== null)
        .map((row) => ({ x: row.bin_mid, y: row.g4_density_median as number })) ?? [];
    const scatter: { x: number; y: number }[] =
      result?.scatter_points
        .filter((point) => point.g4_density_per_mb !== null)
        .map((point) => ({ x: point.bin_mid, y: point.g4_density_per_mb as number })) ?? [];
    const datasets: ChartDataset<'scatter'>[] = [
      {
        data: scatter,
        label: 'Genome-bin G4 density',
        pointBackgroundColor: '#577399',
        pointBorderColor: '#577399',
        pointRadius: 2.5,
        pointHoverRadius: 5,
      },
      {
        data: meanTrend,
        label: 'Mean density',
        borderColor: '#c2410c',
        backgroundColor: '#c2410c',
        pointRadius: 0,
        showLine: true,
        tension: 0.18,
      },
      {
        data: medianTrend,
        label: 'Median density',
        borderColor: '#047857',
        backgroundColor: '#047857',
        borderDash: [6, 5],
        pointRadius: 0,
        showLine: true,
        tension: 0.18,
      },
    ];
    return { datasets };
  });

  readonly chartOptions = computed<ChartOptions<'scatter'>>(() => ({
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        labels: { usePointStyle: true },
      },
      tooltip: {
        callbacks: {
          label: (context) =>
            `${context.dataset.label}: ${formatNumber(context.parsed.y)} at ${this.axisLabel()} ${formatNumber(context.parsed.x)}`,
        },
      },
    },
    responsive: true,
    scales: {
      x: { title: { display: true, text: this.axisLabel() } },
      y: { title: { display: true, text: 'G4 density per Mb' } },
    },
  }));

  readonly plottedPointCount = computed(() => this.binChartData().datasets[0]?.data.length ?? 0);

  constructor() {
    this.breakpointObserver
      .observe('(max-width: 980px)')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((state) => this.isNarrow.set(state.matches));
    this.loadOptions();
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
    this.genomeCollection.update((items) =>
      items.some((item) => selectionKey(item) === key) ? items : [...items, normalizedSelection],
    );
  }

  removeTaxonomySelection(selection: MicrobialTaxonomySelection): void {
    const key = selectionKey(selection);
    this.genomeCollection.update((items) => items.filter((item) => selectionKey(item) !== key));
  }

  clearGenomeCollection(): void {
    this.genomeCollection.set([]);
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
        },
        error: (error: unknown) => this.handleError(error),
      });
  }

  downloadGenomes(): void {
    this.download('genomes');
  }

  downloadBinStats(): void {
    this.download('bin-stats');
  }

  downloadBinRows(): void {
    this.download('bin-rows');
  }

  downloadSixteenS(): void {
    this.download('sixteen-s');
  }

  axisLabel(): string {
    return this.axisSelection().trait === 'temperature' ? 'Temperature bin' : 'pH bin';
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

  currentRangeLabel(): string {
    const range = this.currentRange();
    return range ? rangeLabel(range.min, range.max) : 'Range pending';
  }

  currentStepLabel(): string {
    const range = this.currentRange();
    if (!range) {
      return 'Step pending';
    }
    return this.axisSelection().trait === 'temperature'
      ? `${formatNumber(range.bin_step)} °C bins`
      : `${formatNumber(range.bin_step)} pH bins`;
  }

  formatValue(value: string | number | null): string {
    if (typeof value === 'number') {
      return formatNumber(value);
    }
    return value ?? 'NA';
  }

  formatBin(row: { bin_start: number; bin_end: number }): string {
    return `[${formatNumber(row.bin_start)}, ${formatNumber(row.bin_end)})`;
  }

  traitRange(row: { trait_min: number | null; trait_max: number | null }): string {
    return rangeLabel(row.trait_min, row.trait_max);
  }

  taxonomyLabel(row: {
    domain: string;
    phylum: string;
    class_name: string;
    order: string;
    family: string;
    genus: string;
    species: string;
  }): string {
    return [row.domain, row.phylum, row.class_name, row.order, row.family, row.genus, row.species]
      .filter((value) => value)
      .join(' / ');
  }

  private buildQuery(): MicrobialEnvironmentG4Query {
    return {
      trait: this.form.controls.trait.value,
      mode: this.form.controls.mode.value,
      taxonomy_selections: this.genomeCollection(),
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
  }

  private download(kind: 'genomes' | 'bin-stats' | 'bin-rows' | 'sixteen-s'): void {
    const request = this.submittedQuery();
    if (!request) {
      this.snackBar.open('Run Search before downloading CSV.', 'Dismiss', { duration: 3000 });
      return;
    }
    const call =
      kind === 'genomes'
        ? this.service.downloadGenomes(request)
        : kind === 'bin-stats'
          ? this.service.downloadBinStats(request)
          : kind === 'bin-rows'
            ? this.service.downloadBinRows(request)
            : this.service.downloadSixteenS(request);
    this.downloading.set(true);
    call
      .pipe(
        finalize(() => this.downloading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (blob) => this.saveBlob(blob, `microbial_environment_g4_${kind}.csv`),
        error: (error: unknown) => this.handleError(error),
      });
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
