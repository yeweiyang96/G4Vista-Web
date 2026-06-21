import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  linkedSignal,
  signal,
} from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormField, form } from '@angular/forms/signals';
import {
  MatAutocompleteModule,
  MatAutocompleteSelectedEvent,
} from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { Sort } from '@angular/material/sort';
import { Observable, catchError, finalize, forkJoin, map, of, switchMap, timer } from 'rxjs';
import { GeneService } from '../../../gene/services/gene.service';
import {
  type G4ChartAxisFeatureRange,
  type G4ChartPointFocus,
  GenomeRangeChartComponent,
} from './chart/genome-range-chart.component';
import { G4TableComponent } from './g4-table/g4-table.component';
import { PositionDistributionComponent } from './position-distribution/position-distribution.component';
import { DEFAULT_POSITION_CATEGORY_KEYS } from './position-distribution/position-category-view';
import { PositionStatisticsPanelComponent } from './position-statistics-panel/position-statistics-panel.component';
import { GenomeAssemblyDetail, GenomeDetailService } from '../../services/genome-detail.service';
import {
  EMPTY_G4_PAGE,
  EMPTY_G4_POSITION_DISTRIBUTION,
  EMPTY_G4_POSITION_STATISTICS,
  G4DownloadColumn,
  G4FlankWindow,
  G4_FLANK_WINDOW_OPTIONS,
  G4ChartViewport,
  G4GeneCandidate,
  G4GeneCandidatesRequest,
  G4HistogramFilters,
  G4_GENE_POSITION_OPTIONS,
  G4_GENE_POSITION_OPTIONS_BY_TYPE,
  G4GenePosition,
  G4GeneRelationHit,
  G4GeneRelationsResponse,
  G4GeneSearchRequest,
  G4PageItem,
  G4PageRequest,
  G4PageResponse,
  G4PositionDistributionRequest,
  G4PositionDistributionResponse,
  G4PositionStatisticsRequest,
  G4PositionStatisticsResponse,
  G4Service,
  G4SortField,
  G4Type,
} from '../../services/g4.service';
import {
  GenomeViewerDefaultRegionResult,
  GenomeViewerConfigService,
  GenomeViewerStateService,
  JbrowseHostComponent,
} from '../../viewer';
import { UiThemeService } from '../../../theme/ui-theme.service';
import { geneBiotypeLabel } from '../../../shared/gene-biotype';
import { formatCompactCount, formatGenomeLength } from '../../utils/overview-format';
import type { GenomeAssemblyOverview } from '../../services/genome-search.service';

interface G4FilterModel {
  selectedTetrads: number[];
  selectedPosition: G4GenePosition;
  minScore: string;
  maxScore: string;
}

interface PositionDistributionFilterModel {
  selectedTetrads: number[];
  minScore: string;
  maxScore: string;
}

interface G4PageResourceRequest {
  mode: 'browse-single' | 'browse-whole' | 'gene-search';
  request: G4PageRequest | (G4PageRequest & { seqid: string }) | G4GeneSearchRequest;
}

interface G4FilterOptionsResourceRequest {
  mode: 'browse-single' | 'browse-whole';
  request: G4PageRequest | (G4PageRequest & { seqid: string });
}

interface GeneRelationBatchRequest {
  assemblyAccession: string;
  g4Type: G4Type;
  startsBySeqid: { seqid: string; starts: number[] }[];
}

interface GeneRelationBatchResponse {
  seqid: string;
  relations: G4GeneRelationsResponse;
}

interface GenomeViewportTarget {
  seqid: string;
  start: number;
  end: number;
}

interface GeneNavigationTarget {
  target: GenomeViewportTarget;
  source: 'selected-gene' | 'first-g4';
}

interface AccessionIdOption {
  value: BrowseScope;
  label: string;
  secondaryLabel?: string;
  searchText: string;
}

interface DisplayedRegionSummary {
  regionName: string;
  title: string;
  range: string;
  length: string;
  binSize: string;
}

interface ViewportApplyOptions {
  navigateViewer: boolean;
}

const DEFAULT_GENE_POSITION = G4_GENE_POSITION_OPTIONS_BY_TYPE.g4[0].value;
const DEFAULT_FLANK_WINDOW: G4FlankWindow = 1000;
const SORTABLE_COLUMNS: Record<string, G4SortField> = {
  start: 'start',
  end: 'end',
  length: 'length',
  tetrads: 'tetrads',
  score: 'score',
};
const NON_NEGATIVE_INTEGER_PATTERN = /^\d+$/;
const WHOLE_GENOME_SCOPE = 'whole-genome';
const ANY_GENE_RELATION = 'any-gene-relation';
const CHART_TARGET_BUCKETS = 100;
const BASE_PAIR_FORMAT = new Intl.NumberFormat('en-US');
const DEFAULT_TABLE_DOWNLOAD_COLUMNS: readonly G4DownloadColumn[] = [
  'start',
  'end',
  'length',
  'tetrads',
  'score',
  'sequence',
  'gene_relation:insideOf_gene_g4',
];

function isG4Type(value: unknown): value is G4Type {
  return value === 'g4' || value === 'i-motif';
}

function isG4GenePosition(value: unknown): value is G4GenePosition {
  return (
    typeof value === 'string' && G4_GENE_POSITION_OPTIONS.some((option) => option.value === value)
  );
}
const CHART_FOCUS_HALF_WINDOW_BP = 5000;
const TABLE_SEQUENCE_FOCUS_BIN_SIZE_BP = 100;
const GENE_SEARCH_FOCUS_HALF_WINDOW_BP = 1000;
const GENE_SEARCH_BIN_SIZE_BP = 100;
const GENE_CANDIDATE_MIN_CHARS = 2;
const GENE_CANDIDATE_LIMIT = 20;
const GENE_CANDIDATE_DEBOUNCE_MS = 300;
const RESULTS_TABLE_TAB_INDEX = 0;
const RESULTS_GENOME_BROWSER_TAB_INDEX = 2;

type BrowseScope = string;
type GeneRelationFilterValue = typeof ANY_GENE_RELATION | G4GenePosition;

function createInitialFilterModel(selectedPosition = DEFAULT_GENE_POSITION): G4FilterModel {
  return {
    selectedTetrads: [],
    selectedPosition,
    minScore: '',
    maxScore: '',
  };
}

function createInitialPositionDistributionFilterModel(): PositionDistributionFilterModel {
  return {
    selectedTetrads: [],
    minScore: '',
    maxScore: '',
  };
}

function parseOptionalInteger(rawValue: string): number | undefined {
  const normalized = rawValue.trim();
  if (!normalized) {
    return undefined;
  }

  if (!NON_NEGATIVE_INTEGER_PATTERN.test(normalized)) {
    return undefined;
  }

  const parsed = Number(normalized);
  return Number.isSafeInteger(parsed) ? parsed : undefined;
}

function normalizeIntegerInput(rawValue: string): string {
  const parsed = parseOptionalInteger(rawValue);
  return parsed === undefined ? '' : String(parsed);
}

function normalizeFilterModel(model: G4FilterModel): G4FilterModel {
  return {
    ...model,
    minScore: normalizeIntegerInput(model.minScore),
    maxScore: normalizeIntegerInput(model.maxScore),
  };
}

function normalizePositionDistributionFilterModel(
  model: PositionDistributionFilterModel,
): PositionDistributionFilterModel {
  return {
    ...model,
    minScore: normalizeIntegerInput(model.minScore),
    maxScore: normalizeIntegerInput(model.maxScore),
  };
}

function normalizeFlankWindow(value: number): G4FlankWindow {
  return G4_FLANK_WINDOW_OPTIONS.some((option) => option.value === value)
    ? (value as G4FlankWindow)
    : DEFAULT_FLANK_WINDOW;
}

function buildViewerLocation(seqid: string, start: number, end: number): string {
  return `${seqid}:${start}..${end}`;
}

function parseRegionLocation(region: string): GenomeViewportTarget | null {
  const match = region.match(/^(.*):([\d,]+)\.\.([\d,]+)$/);
  if (!match) {
    return null;
  }

  const start = Number(match[2].replaceAll(',', ''));
  const end = Number(match[3].replaceAll(',', ''));
  if (!Number.isFinite(start) || !Number.isFinite(end) || start < 1 || end < start) {
    return null;
  }

  return {
    seqid: match[1],
    start,
    end,
  };
}

function buildG4RowKey(seqid: string, start: number): string {
  return `${seqid}:${start}`;
}

function normalizeSearchTerm(value: string): string {
  return value.trim().toLowerCase();
}

function formatGeneRelationLabel(label: string): string {
  return label.replace(/\s*\(iMotif\)/g, ' (i-motif)').replace(/\s*\(i-motif\)/g, ' (i-motif)');
}

function preferredGeneDisplayName(candidate: G4GeneCandidate): string {
  return candidate.gene_name?.trim() || candidate.locus_tag?.trim() || candidate.feature_id;
}

function formatGeneCandidateLabel(candidate: G4GeneCandidate): string {
  const name = preferredGeneDisplayName(candidate);
  const biotype = geneBiotypeLabel(candidate.gene_biotype);
  return `${name} (${candidate.feature_id}) [${candidate.seqid}] · ${biotype}`;
}

function formatBasePairCount(value: number): string {
  return `${BASE_PAIR_FORMAT.format(Math.max(1, Math.trunc(value)))} bp`;
}

function responseBodySummary(body: unknown): string {
  if (typeof body === 'string') {
    return body.trim();
  }
  if (body === null || body === undefined) {
    return '';
  }
  return JSON.stringify(body);
}

function assemblyRequestErrorMessage(assemblyAccession: string, error: unknown): string {
  const endpoint = `/api/v1/genome/${assemblyAccession}`;
  if (error instanceof HttpErrorResponse) {
    const statusText = error.statusText || 'Unknown status';
    const bodySummary = responseBodySummary(error.error);
    const bodySuffix = bodySummary ? ` Response: ${bodySummary}` : '';
    return `Genome detail request failed for ${assemblyAccession}. GET ${endpoint} returned ${error.status} ${statusText}.${bodySuffix}`;
  }
  return `Genome detail request failed for ${assemblyAccession}. GET ${endpoint} returned an unexpected client error.`;
}

function groupStartsBySeqid(items: readonly G4PageItem[]): { seqid: string; starts: number[] }[] {
  const groupedStarts = new Map<string, number[]>();

  for (const item of items) {
    const starts = groupedStarts.get(item.seqid);
    if (starts) {
      starts.push(item.start);
      continue;
    }
    groupedStarts.set(item.seqid, [item.start]);
  }

  return Array.from(groupedStarts.entries()).map(([seqid, starts]) => ({
    seqid,
    starts: Array.from(new Set(starts)),
  }));
}

function normalizedSeqidLength(rawLength: number | undefined): number {
  if (!rawLength || rawLength < 1) {
    return 1;
  }
  return Math.max(1, Math.trunc(rawLength));
}

function normalizedChartRange(
  start: number,
  end: number,
  seqidLength: number,
): { start: number; end: number } {
  const normalizedLength = normalizedSeqidLength(seqidLength);
  const nextStart = Math.max(1, Math.min(Math.trunc(start), normalizedLength));
  const nextEnd = Math.max(nextStart, Math.min(Math.trunc(end), normalizedLength));
  return {
    start: nextStart,
    end: nextEnd,
  };
}

function defaultBinSizeForLength(seqidLength: number): number {
  const normalizedLength = normalizedSeqidLength(seqidLength);
  return Math.max(1, Math.ceil(normalizedLength / CHART_TARGET_BUCKETS));
}

function focusWindowAroundCenter(
  center: number,
  seqidLength: number,
  halfWindowBp = CHART_FOCUS_HALF_WINDOW_BP,
): { start: number; end: number } {
  const normalizedLength = normalizedSeqidLength(seqidLength);
  return normalizedChartRange(center - halfWindowBp, center + halfWindowBp, normalizedLength);
}

@Component({
  selector: 'app-genome-info',
  imports: [
    FormField,
    G4TableComponent,
    GenomeRangeChartComponent,
    JbrowseHostComponent,
    PositionDistributionComponent,
    PositionStatisticsPanelComponent,
    MatAutocompleteModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatSnackBarModule,
    MatTabsModule,
    RouterLink,
  ],
  templateUrl: './genome-info.component.html',
  styleUrl: './genome-info.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GenomeInfoComponent {
  readonly assemblyAccession = input.required<string>();
  readonly dataBaseUrl = input.required<string>();
  readonly wholeGenomeScope = WHOLE_GENOME_SCOPE;

  private readonly genomeDetailService = inject(GenomeDetailService);
  private readonly geneService = inject(GeneService);
  private readonly g4Service = inject(G4Service);
  private readonly snackBar = inject(MatSnackBar);
  private readonly viewerState = inject(GenomeViewerStateService);
  private readonly genomeViewerConfigService = inject(GenomeViewerConfigService);
  private readonly uiThemeService = inject(UiThemeService);

  readonly g4Type = signal<G4Type>('g4');
  readonly draftG4Type = signal<G4Type>('g4');
  readonly genePositionOptions = computed(() =>
    G4_GENE_POSITION_OPTIONS_BY_TYPE[this.g4Type()].map((option) => ({
      ...option,
      label: formatGeneRelationLabel(option.label),
    })),
  );
  readonly draftGenePositionOptions = computed(() =>
    G4_GENE_POSITION_OPTIONS_BY_TYPE[this.draftG4Type()].map((option) => ({
      ...option,
      label: formatGeneRelationLabel(option.label),
    })),
  );
  readonly draftGeneRelationOptions = computed<
    readonly {
      value: GeneRelationFilterValue;
      label: string;
    }[]
  >(() => [
    { value: ANY_GENE_RELATION, label: 'Any gene relation' },
    ...this.draftGenePositionOptions(),
  ]);
  readonly defaultGenePosition = computed(
    () => G4_GENE_POSITION_OPTIONS_BY_TYPE[this.g4Type()][0]?.value ?? DEFAULT_GENE_POSITION,
  );
  readonly defaultDraftGenePosition = computed(
    () => G4_GENE_POSITION_OPTIONS_BY_TYPE[this.draftG4Type()][0]?.value ?? DEFAULT_GENE_POSITION,
  );
  readonly pageSize = signal(10);
  readonly sortState = signal<{ active: G4SortField; direction: 'asc' | 'desc' }>({
    active: 'start',
    direction: 'asc',
  });
  readonly filterModel = signal(createInitialFilterModel());
  readonly submittedFilters = signal(createInitialFilterModel());
  readonly filterForm = form(this.filterModel);
  readonly draftGeneRelationValue = signal<GeneRelationFilterValue>(ANY_GENE_RELATION);
  readonly isDraftGeneSearchActive = computed(
    () => this.draftGeneRelationValue() !== ANY_GENE_RELATION,
  );
  readonly draftGeneInput = signal('');
  readonly draftSelectedGene = signal<G4GeneCandidate | null>(null);
  readonly submittedSelectedGene = signal<G4GeneCandidate | null>(null);
  readonly submittedSelectedGeneAssemblyAccession = signal<string | null>(null);
  readonly positionDistributionG4Type = signal<G4Type>('g4');
  readonly positionDistributionFlankWindow = signal<G4FlankWindow>(DEFAULT_FLANK_WINDOW);
  readonly positionDistributionFilterModel = signal(createInitialPositionDistributionFilterModel());
  readonly submittedPositionDistributionFilters = signal(
    createInitialPositionDistributionFilterModel(),
  );
  readonly selectedPositionDistributionCategoryKeys = signal<readonly string[]>([
    ...DEFAULT_POSITION_CATEGORY_KEYS,
  ]);
  readonly tableDownloadColumns = signal<readonly G4DownloadColumn[]>([
    ...DEFAULT_TABLE_DOWNLOAD_COLUMNS,
  ]);
  readonly isTableDownloadPending = signal(false);
  readonly geneInputError = signal<string | null>(null);
  readonly accessionFilter = signal('');

  readonly assemblyResource = rxResource<GenomeAssemblyDetail, string>({
    params: () => this.assemblyAccession(),
    stream: ({ params }) => this.genomeDetailService.getAssembly(params),
  });
  readonly assemblyErrorMessage = computed(() => {
    const error = this.assemblyResource.error();
    return error ? assemblyRequestErrorMessage(this.assemblyAccession(), error) : '';
  });
  readonly assemblyDetail = computed<GenomeAssemblyDetail | undefined>(() => {
    if (this.assemblyResource.error()) {
      return undefined;
    }
    const assembly = this.assemblyResource.value();
    return assembly?.assembly_accession === this.assemblyAccession() ? assembly : undefined;
  });
  readonly assemblyOverviewResource = rxResource<GenomeAssemblyOverview, string>({
    params: () => this.assemblyAccession(),
    stream: ({ params }) => this.genomeDetailService.getAssemblyOverview(params),
  });
  readonly assemblyOverview = computed<GenomeAssemblyOverview | undefined>(() => {
    const overview = this.assemblyOverviewResource.value();
    return overview?.assembly_accession === this.assemblyAccession() ? overview : undefined;
  });
  readonly viewerConfig = computed(() =>
    this.genomeViewerConfigService.createViewerConfig({
      assemblyAccession: this.assemblyAccession(),
      dataBaseUrl: this.dataBaseUrl(),
      g4Type: this.g4Type(),
      themeMode: this.uiThemeService.resolvedMode(),
    }),
  );
  readonly defaultRegionResource = rxResource<
    GenomeViewerDefaultRegionResult,
    { assemblyAccession: string; dataBaseUrl: string }
  >({
    params: () => ({
      assemblyAccession: this.assemblyAccession(),
      dataBaseUrl: this.dataBaseUrl(),
    }),
    stream: ({ params }) => this.genomeViewerConfigService.resolveDefaultRegion(params),
    defaultValue: { region: '1..1000', warning: null },
  });
  readonly viewerAssetWarning = computed(() => this.defaultRegionResource.value().warning);
  readonly browseScopeSource = computed(() => ({
    assemblyAccession: this.assemblyAccession(),
    seqids: this.assemblyDetail()?.seqids ?? [],
    defaultRegion: this.defaultRegionResource.value().region,
  }));
  readonly defaultBrowseScope = computed<BrowseScope>(() => WHOLE_GENOME_SCOPE);
  readonly browseScope = signal<BrowseScope>('');
  readonly draftBrowseScope = signal<BrowseScope>('');
  readonly chartSeqid = signal<string>('');
  readonly chartViewport = signal<G4ChartViewport>({
    start: 1,
    end: 1,
    binSize: 1,
  });
  readonly resultsTabIndex = signal(RESULTS_TABLE_TAB_INDEX);
  readonly selectedGeneAxisRange = signal<GenomeViewportTarget | null>(null);
  readonly chartAxisFeatureRange = computed<G4ChartAxisFeatureRange | null>(() => {
    const range = this.selectedGeneAxisRange();
    if (!range || range.seqid !== this.chartSeqid()) {
      return null;
    }
    return {
      start: range.start,
      end: range.end,
    };
  });
  readonly regionsBySeqid = computed(() => {
    const regions = this.assemblyDetail()?.regions ?? [];
    return new Map(regions.map((region) => [region.seqid, region]));
  });
  readonly allAccessionIdOptions = computed<AccessionIdOption[]>(() => [
    { value: WHOLE_GENOME_SCOPE, label: 'Whole genome', searchText: 'whole genome' },
    ...(this.assemblyDetail()?.seqids ?? []).map((seqid) => {
      const label = this.accessionNameForSeqid(seqid);
      return {
        value: seqid,
        label,
        secondaryLabel: label === seqid ? undefined : seqid,
        searchText: normalizeSearchTerm(`${label} ${seqid}`),
      };
    }),
  ]);
  readonly accessionIdOptions = computed(() => {
    const filter = normalizeSearchTerm(this.accessionFilter());
    const options = this.allAccessionIdOptions();
    return filter ? options.filter((option) => option.searchText.includes(filter)) : options;
  });
  readonly browseFilters = computed(() => {
    const filters = this.submittedFilters();
    return {
      tetrads: filters.selectedTetrads,
      minScore: parseOptionalInteger(filters.minScore),
      maxScore: parseOptionalInteger(filters.maxScore),
    };
  });
  readonly chartFilters = computed<G4HistogramFilters>(() => this.browseFilters());
  readonly positionDistributionFlankWindowLabel = computed(
    () =>
      G4_FLANK_WINDOW_OPTIONS.find(
        (option) => option.value === this.positionDistributionFlankWindow(),
      )?.label ?? '1 kb',
  );
  readonly positionDistributionFilters = computed(() => {
    const filters = this.submittedPositionDistributionFilters();
    return {
      tetrads: filters.selectedTetrads,
      minScore: parseOptionalInteger(filters.minScore),
      maxScore: parseOptionalInteger(filters.maxScore),
    };
  });
  readonly positionDistributionTetradOptions = computed(() =>
    this.g4Page()
      .tetrads_list.slice()
      .sort((left, right) => left - right),
  );
  readonly g4FilterTetradOptions = computed(() =>
    this.g4FilterOptions()
      .tetrads_list.slice()
      .sort((left, right) => left - right),
  );
  readonly draftPositionLabel = computed(
    () =>
      this.draftGenePositionOptions().find(
        (option) => option.value === this.filterForm().value().selectedPosition,
      )?.label ?? 'Gene scope',
  );
  readonly draftSelectedGeneLabel = computed(() => {
    const gene = this.draftSelectedGene();
    return gene ? formatGeneCandidateLabel(gene) : '';
  });
  readonly activeSubmittedSelectedGene = computed<G4GeneCandidate | null>(() => {
    const selectedGene = this.submittedSelectedGene();
    if (!selectedGene) {
      return null;
    }

    return this.submittedSelectedGeneAssemblyAccession() === this.assemblyAccession()
      ? selectedGene
      : null;
  });
  readonly hasSubmittedSelectedGene = computed(() => this.activeSubmittedSelectedGene() !== null);
  readonly submittedSelectedGeneLabel = computed(() => {
    const gene = this.activeSubmittedSelectedGene();
    return gene ? formatGeneCandidateLabel(gene) : 'Any';
  });
  readonly geneCandidatesResource = rxResource<
    G4GeneCandidate[],
    G4GeneCandidatesRequest | undefined
  >({
    params: () => {
      const searchTerm = this.draftGeneInput().trim();
      if (searchTerm.length < GENE_CANDIDATE_MIN_CHARS) {
        return undefined;
      }
      if (searchTerm === this.draftSelectedGeneLabel()) {
        return undefined;
      }

      return {
        assemblyAccession: this.assemblyAccession(),
        g4Type: this.draftG4Type(),
        selectedPosition: this.filterForm().value().selectedPosition,
        searchTerm,
        limit: GENE_CANDIDATE_LIMIT,
      };
    },
    stream: ({ params }) => {
      if (!params) {
        return of([]);
      }

      return timer(GENE_CANDIDATE_DEBOUNCE_MS).pipe(
        switchMap(() => this.g4Service.getGeneCandidates(params)),
        catchError(() => of([])),
      );
    },
    defaultValue: [],
  });
  readonly geneCandidates = computed(() => this.geneCandidatesResource.value());
  readonly showGeneCandidateEmptyState = computed(
    () =>
      this.draftGeneInput().trim().length >= GENE_CANDIDATE_MIN_CHARS &&
      !this.geneCandidatesResource.isLoading() &&
      this.geneCandidates().length === 0,
  );
  readonly submittedMinScore = computed(() =>
    parseOptionalInteger(this.submittedFilters().minScore),
  );
  readonly submittedMaxScore = computed(() =>
    parseOptionalInteger(this.submittedFilters().maxScore),
  );
  readonly isGeneSearchMode = computed(() => this.hasSubmittedSelectedGene());
  readonly displayedAccessionIdValue = computed(
    () => this.activeSubmittedSelectedGene()?.seqid ?? this.browseScope(),
  );
  readonly displayedAccessionIdLabel = computed(() =>
    this.accessionNameForSeqid(this.displayedAccessionIdValue()),
  );
  readonly draftAccessionIdValue = computed(() => this.draftBrowseScope() || this.browseScope());
  readonly draftAccessionIdLabel = computed(() =>
    this.accessionNameForSeqid(this.draftAccessionIdValue()),
  );
  readonly displayedRegionFnaHeader = computed(() => {
    const scope = this.displayedAccessionIdValue();
    if (!scope || scope === WHOLE_GENOME_SCOPE) {
      return '';
    }
    return this.regionsBySeqid().get(scope)?.fna_header?.trim() ?? '';
  });
  readonly showAccessionIdColumn = computed(
    () => this.isGeneSearchMode() || this.browseScope() === WHOLE_GENOME_SCOPE,
  );
  readonly pageIndex = linkedSignal({
    source: () => ({
      assemblyAccession: this.assemblyAccession(),
      g4Type: this.g4Type(),
      browseScope: this.browseScope(),
      mode: this.isGeneSearchMode() ? 'gene-search' : 'browse',
      selectedFeatureId: this.activeSubmittedSelectedGene()?.feature_id ?? '',
      selectedPosition: this.submittedFilters().selectedPosition,
      filters: this.browseFilters(),
      sort: this.sortState(),
      pageSize: this.pageSize(),
    }),
    computation: () => 0,
  });
  readonly g4PageResource = rxResource<G4PageResponse, G4PageResourceRequest | undefined>({
    params: () => {
      if (!this.assemblyDetail()) {
        return undefined;
      }

      const browseScope = this.browseScope();
      if (!browseScope) {
        return undefined;
      }

      const geneSearchRequest = this.buildGeneSearchRequest(this.pageIndex(), this.pageSize());
      if (geneSearchRequest) {
        return { mode: 'gene-search', request: geneSearchRequest };
      }

      if (browseScope === WHOLE_GENOME_SCOPE) {
        return {
          mode: 'browse-whole',
          request: this.buildWholeGenomeBrowseRequest(this.pageIndex(), this.pageSize()),
        };
      }

      return {
        mode: 'browse-single',
        request: this.buildSingleBrowseRequest(browseScope, this.pageIndex(), this.pageSize()),
      };
    },
    stream: ({ params }) => {
      if (!params) {
        return of(EMPTY_G4_PAGE);
      }

      switch (params.mode) {
        case 'browse-single':
          return this.g4Service.getG4Page(params.request as G4PageRequest & { seqid: string });
        case 'browse-whole':
          return this.g4Service.getAssemblyG4Page(params.request as G4PageRequest);
        case 'gene-search':
          return this.g4Service.getGeneSearchPage(params.request as G4GeneSearchRequest);
      }
    },
    defaultValue: EMPTY_G4_PAGE,
  });
  readonly g4Page = computed<G4PageResponse>(() => this.g4PageResource.value());
  readonly g4FilterOptionsResource = rxResource<
    G4PageResponse,
    G4FilterOptionsResourceRequest | undefined
  >({
    params: () => {
      if (!this.assemblyDetail()) {
        return undefined;
      }

      const browseScope = this.draftBrowseScope() || this.browseScope();
      if (!browseScope) {
        return undefined;
      }

      const request: G4PageRequest = {
        assemblyAccession: this.assemblyAccession(),
        g4Type: this.draftG4Type(),
        pageIndex: 0,
        pageSize: 1,
        sort: 'start',
        order: 'asc',
        tetrads: [],
      };

      if (browseScope === WHOLE_GENOME_SCOPE) {
        return { mode: 'browse-whole', request };
      }

      return {
        mode: 'browse-single',
        request: {
          ...request,
          seqid: browseScope,
        },
      };
    },
    stream: ({ params }) => {
      if (!params) {
        return of(EMPTY_G4_PAGE);
      }

      switch (params.mode) {
        case 'browse-single':
          return this.g4Service.getG4Page(params.request as G4PageRequest & { seqid: string });
        case 'browse-whole':
          return this.g4Service.getAssemblyG4Page(params.request as G4PageRequest);
      }
    },
    defaultValue: EMPTY_G4_PAGE,
  });
  readonly g4FilterOptions = computed<G4PageResponse>(() => this.g4FilterOptionsResource.value());
  readonly positionDistributionResource = rxResource<
    G4PositionDistributionResponse,
    G4PositionDistributionRequest | undefined
  >({
    params: () => {
      if (!this.assemblyDetail()) {
        return undefined;
      }

      return {
        assemblyAccession: this.assemblyAccession(),
        g4Type: this.positionDistributionG4Type(),
        flankWindow: this.positionDistributionFlankWindow(),
      };
    },
    stream: ({ params }) => {
      if (!params) {
        return of(EMPTY_G4_POSITION_DISTRIBUTION);
      }
      return this.g4Service.getPositionDistribution(params);
    },
    defaultValue: EMPTY_G4_POSITION_DISTRIBUTION,
  });
  readonly positionDistribution = computed<G4PositionDistributionResponse>(() =>
    this.positionDistributionResource.value(),
  );
  readonly positionStatisticsResource = rxResource<
    G4PositionStatisticsResponse,
    G4PositionStatisticsRequest | undefined
  >({
    params: () => {
      if (!this.assemblyDetail()) {
        return undefined;
      }

      return {
        assemblyAccession: this.assemblyAccession(),
        windows: [this.positionDistributionFlankWindow()],
        g4Type: this.positionDistributionG4Type(),
        tetrads: this.positionDistributionFilters().tetrads,
        minScore: this.positionDistributionFilters().minScore,
        maxScore: this.positionDistributionFilters().maxScore,
        includeGeneBiotypeBreakdown: true,
      };
    },
    stream: ({ params }) => {
      if (!params) {
        return of(EMPTY_G4_POSITION_STATISTICS);
      }
      return this.g4Service.getPositionStatistics(params);
    },
    defaultValue: EMPTY_G4_POSITION_STATISTICS,
  });
  readonly positionStatistics = computed<G4PositionStatisticsResponse>(() =>
    this.positionStatisticsResource.value(),
  );
  readonly positionDistributionStatus = computed(
    () => this.positionDistributionResource.snapshot().status,
  );
  readonly positionStatisticsStatus = computed(
    () => this.positionStatisticsResource.snapshot().status,
  );
  readonly positionDistributionErrorMessage = computed(() =>
    this.positionDistributionStatus() === 'error'
      ? 'Whole-genome G4/i-motif position summary unavailable.'
      : '',
  );
  readonly positionStatisticsErrorMessage = computed(() =>
    this.positionStatisticsStatus() === 'error' ? 'Position category statistics unavailable.' : '',
  );
  readonly geneRelationsResource = rxResource<
    GeneRelationBatchResponse[],
    GeneRelationBatchRequest | undefined
  >({
    params: () => {
      const page = this.g4Page();
      if (!page.g4s.length) {
        return undefined;
      }

      return {
        assemblyAccession: this.assemblyAccession(),
        g4Type: this.g4Type(),
        startsBySeqid: groupStartsBySeqid(page.g4s),
      };
    },
    stream: ({ params }) => {
      if (!params || !params.startsBySeqid.length) {
        return of([]);
      }

      return forkJoin(
        params.startsBySeqid.map((group) =>
          this.g4Service
            .getGeneRelations({
              assemblyAccession: params.assemblyAccession,
              g4Type: params.g4Type,
              seqid: group.seqid,
              starts: group.starts,
            })
            .pipe(map((relations) => ({ seqid: group.seqid, relations }))),
        ),
      );
    },
    defaultValue: [],
  });
  readonly geneRelationsByRowKey = computed(() => {
    const relationMap = new Map<string, Partial<Record<G4GenePosition, G4GeneRelationHit[]>>>();
    for (const batch of this.geneRelationsResource.value()) {
      for (const item of batch.relations.relations) {
        relationMap.set(buildG4RowKey(batch.seqid, item.start), item.positions);
      }
    }
    return relationMap;
  });
  readonly viewerRegion = this.viewerState.region;
  readonly navCommand = this.viewerState.navCommand;
  readonly chartSeqidLength = computed(() => this.seqidLengthFor(this.chartSeqid()));
  readonly canRenderChart = computed(
    () => this.chartSeqidLength() > 0 && this.chartSeqid().length > 0,
  );
  readonly displayedRegionSummary = computed<DisplayedRegionSummary>(() => {
    const seqid = this.chartSeqid();
    const viewport = this.chartViewport();
    const regionLabel = this.accessionNameForSeqid(seqid);
    const titleRegion = regionLabel === seqid ? seqid : `${regionLabel} (${seqid})`;
    const scopeLabel =
      this.browseScope() === WHOLE_GENOME_SCOPE ? 'Whole genome view' : 'Displayed region';
    const regionLength = Math.max(1, viewport.end - viewport.start + 1);

    return {
      regionName: titleRegion,
      title: `${scopeLabel}: ${titleRegion}`,
      range: `${formatBasePairCount(viewport.start)} - ${formatBasePairCount(viewport.end)}`,
      length: formatGenomeLength(regionLength),
      binSize: formatBasePairCount(viewport.binSize),
    };
  });
  readonly selectedPositionLabel = computed(
    () =>
      this.genePositionOptions().find(
        (option) => option.value === this.submittedFilters().selectedPosition,
      )?.label ?? 'Gene scope',
  );
  readonly submittedGeneRelationLabel = computed(() =>
    this.hasSubmittedSelectedGene() ? this.selectedPositionLabel() : 'Any gene relation',
  );
  readonly explorerSubtitle = computed(() => {
    const browseScope = this.browseScope();
    const gcType = this.g4Type() === 'i-motif' ? 'i-motif sites' : 'G4 sites';
    if (!browseScope || this.isGeneSearchMode() || browseScope === WHOLE_GENOME_SCOPE) {
      return `${this.g4Page().count} ${gcType} in ${this.assemblyAccession()}`;
    }

    return `${this.g4Page().count} ${gcType} in chr ${this.accessionNameForSeqid(browseScope)}`;
  });
  readonly currentSelectionRows = computed(() => [
    {
      label: 'Sequence / region',
      value: this.displayedAccessionIdLabel(),
    },
    {
      label: 'Motif type',
      value: this.g4Type() === 'i-motif' ? 'i-motif' : 'G4',
    },
    {
      label: 'Gene relation',
      value: this.submittedGeneRelationLabel(),
    },
    {
      label: 'Gene',
      value: this.submittedSelectedGeneLabel(),
    },
    {
      label: 'G-tetrads',
      value: this.submittedFilters().selectedTetrads.length
        ? this.submittedFilters().selectedTetrads.join(', ')
        : 'All',
    },
    {
      label: 'Score range',
      value: this.currentScoreRangeLabel(),
    },
  ]);
  readonly genomeLengthBp = computed(() => {
    const overviewLength = this.assemblyOverview()?.genome_length_bp;
    if (overviewLength !== undefined) {
      return overviewLength;
    }
    return Object.values(this.assemblyDetail()?.seqid_lengths ?? {}).reduce(
      (total, value) => total + value,
      0,
    );
  });
  readonly geneSearchScopeHint = computed(() => {
    const label = this.draftPositionLabel();
    return label === 'Gene scope'
      ? 'Matches genes within the selected scope across the current genome.'
      : `Matches genes in ${label} across the current genome.`;
  });
  private lastBrowseScopeSourceKey: string | null = null;
  private lastViewerSessionKey: string | null = null;
  private lastAssemblyAccessionForGeneSelection: string | null = null;
  private lastDefaultGeneFlankAssemblyAccession: string | null = null;
  private lastDraftPosition: G4GenePosition | null = null;
  private lastEmptyGeneSearchNoticeKey: string | null = null;
  private navigationRequestId = 0;

  constructor() {
    effect(() => {
      const source = this.browseScopeSource();
      const sourceKey = `${source.assemblyAccession}::${source.defaultRegion}::${source.seqids.join(',')}`;
      if (this.lastBrowseScopeSourceKey === sourceKey) {
        return;
      }

      this.lastBrowseScopeSourceKey = sourceKey;
      if (!source.seqids.length) {
        return;
      }
      const defaultScope = this.defaultBrowseScope();
      this.browseScope.set(defaultScope);
      this.draftBrowseScope.set(defaultScope);
    });

    effect(() => {
      const assemblyAccession = this.assemblyAccession();
      if (this.defaultRegionResource.isLoading()) {
        return;
      }

      const defaultRegion = this.defaultRegionResource.value().region;
      const browseScope = this.browseScope();
      if (!browseScope) {
        return;
      }

      const sessionKey = `${assemblyAccession}::${defaultRegion}::${browseScope}`;
      if (this.lastViewerSessionKey === sessionKey) {
        return;
      }

      this.lastViewerSessionKey = sessionKey;
      this.viewerState.resetSession(
        assemblyAccession,
        this.resolveInitialViewerRegion(defaultRegion, browseScope),
      );
      this.applyScopeViewport(browseScope, { navigateViewer: true });
    });

    effect(() => {
      const assembly = this.assemblyDetail();
      if (!assembly) {
        return;
      }
      if (this.lastDefaultGeneFlankAssemblyAccession === assembly.assembly_accession) {
        return;
      }

      this.lastDefaultGeneFlankAssemblyAccession = assembly.assembly_accession;
      this.positionDistributionFlankWindow.set(
        normalizeFlankWindow(assembly.default_gene_flank_window),
      );
    });

    effect(() => {
      const assemblyAccession = this.assemblyAccession();
      if (this.lastAssemblyAccessionForGeneSelection === null) {
        this.lastAssemblyAccessionForGeneSelection = assemblyAccession;
        return;
      }

      if (this.lastAssemblyAccessionForGeneSelection === assemblyAccession) {
        return;
      }

      this.lastAssemblyAccessionForGeneSelection = assemblyAccession;
      this.navigationRequestId += 1;
      this.accessionFilter.set('');
      this.clearGeneSelection();
    });

    effect(() => {
      const currentPosition = this.filterForm().value().selectedPosition;
      if (this.lastDraftPosition === null) {
        this.lastDraftPosition = currentPosition;
        return;
      }

      if (this.lastDraftPosition === currentPosition) {
        return;
      }

      this.lastDraftPosition = currentPosition;
      this.clearDraftGeneSelection();
    });

    effect(() => {
      const status = this.g4FilterOptionsResource.snapshot().status;
      if (status === 'loading' || status === 'reloading') {
        return;
      }

      const options = new Set(this.g4FilterTetradOptions());
      const current = this.filterForm().value().selectedTetrads;
      const pruned = current.filter((tetrad) => options.has(tetrad));
      if (current.length === pruned.length) {
        return;
      }

      this.filterModel.update((model) => ({
        ...model,
        selectedTetrads: pruned,
      }));
    });

    effect(() => {
      const selectedGene = this.activeSubmittedSelectedGene();
      if (!selectedGene) {
        this.lastEmptyGeneSearchNoticeKey = null;
        return;
      }
      if (this.g4PageResource.isLoading()) {
        return;
      }

      const page = this.g4Page();
      if (page.count > 0) {
        this.lastEmptyGeneSearchNoticeKey = null;
        return;
      }

      const filters = this.submittedFilters();
      const noticeKey = [
        this.assemblyAccession(),
        this.g4Type(),
        selectedGene.feature_id,
        filters.selectedPosition,
        filters.selectedTetrads.join(','),
        filters.minScore,
        filters.maxScore,
      ].join('::');
      if (noticeKey === this.lastEmptyGeneSearchNoticeKey) {
        return;
      }

      this.lastEmptyGeneSearchNoticeKey = noticeKey;
      const motifLabel = this.g4Type() === 'i-motif' ? 'i-motif' : 'G4';
      this.snackBar.open(
        `No ${motifLabel} matched the selected gene with the current filters.`,
        'Dismiss',
        {
          duration: 4000,
        },
      );
    });
  }

  submitFilters(event?: Event): void {
    event?.preventDefault();
    const shouldSearchGene = this.isDraftGeneSearchActive();
    const selectedGene = shouldSearchGene ? this.draftSelectedGene() : null;
    if (shouldSearchGene && !selectedGene) {
      this.geneInputError.set('Select a gene from the suggestions before searching.');
      return;
    }

    this.geneInputError.set(null);
    const submittedG4Type = this.draftG4Type();
    const submittedScope = this.draftBrowseScope() || this.browseScope();
    if (submittedG4Type !== this.g4Type()) {
      this.g4Type.set(submittedG4Type);
    }
    if (submittedScope && submittedScope !== this.browseScope()) {
      this.browseScope.set(submittedScope);
      if (!selectedGene) {
        this.applyScopeViewport(submittedScope, { navigateViewer: true });
      }
    }
    this.commitFilters(this.filterForm().value());
    this.submittedSelectedGene.set(selectedGene);
    this.submittedSelectedGeneAssemblyAccession.set(selectedGene ? this.assemblyAccession() : null);
    this.selectedGeneAxisRange.set(null);
    if (selectedGene) {
      this.navigateToFirstResultForGeneSearch();
    }
  }

  selectBrowseScope(scope: BrowseScope): void {
    const isGeneSearchMode = this.isGeneSearchMode();
    if (!isGeneSearchMode && scope === this.browseScope()) {
      return;
    }

    this.accessionFilter.set('');
    this.draftBrowseScope.set(scope);
    if (scope !== this.browseScope()) {
      this.browseScope.set(scope);
    }
    if (isGeneSearchMode) {
      this.clearGeneSelection();
    }
    this.applyScopeViewport(scope, { navigateViewer: true });
  }

  selectDraftBrowseScope(scope: BrowseScope): void {
    this.accessionFilter.set('');
    this.draftBrowseScope.set(scope);
  }

  selectDraftGeneRelation(value: unknown): void {
    if (value === ANY_GENE_RELATION) {
      this.draftGeneRelationValue.set(ANY_GENE_RELATION);
      this.clearDraftGeneSelection();
      return;
    }

    if (!isG4GenePosition(value)) {
      return;
    }

    this.draftGeneRelationValue.set(value);
    this.filterModel.update((current) => ({
      ...current,
      selectedPosition: value,
    }));
    this.lastDraftPosition = value;
    this.clearDraftGeneSelection();
  }

  onAccessionFilterInput(event: Event): void {
    const value = (event.target as HTMLInputElement | null)?.value ?? '';
    this.accessionFilter.set(value);
  }

  clearAccessionFilter(event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();
    this.accessionFilter.set('');
  }

  selectG4Type(type: unknown): void {
    if (!isG4Type(type)) {
      return;
    }

    if (type === this.g4Type()) {
      return;
    }

    this.g4Type.set(type);
    this.draftG4Type.set(type);
    const defaultPosition = this.defaultGenePosition();
    this.filterModel.update((current) => ({
      ...current,
      selectedPosition: defaultPosition,
    }));
    this.submittedFilters.update((current) => ({
      ...current,
      selectedPosition: defaultPosition,
    }));
    this.lastDraftPosition = defaultPosition;
    this.clearGeneSelection();
  }

  selectDraftG4Type(type: unknown): void {
    if (!isG4Type(type)) {
      return;
    }

    if (type === this.draftG4Type()) {
      return;
    }

    this.draftG4Type.set(type);
    const defaultPosition = this.defaultDraftGenePosition();
    this.filterModel.update((current) => ({
      ...current,
      selectedPosition: defaultPosition,
    }));
    this.lastDraftPosition = defaultPosition;
    this.draftGeneRelationValue.set(ANY_GENE_RELATION);
    this.clearDraftGeneSelection();
  }

  changeSort(sort: Sort): void {
    const active = SORTABLE_COLUMNS[sort.active];
    if (!active) {
      return;
    }

    this.sortState.set({
      active,
      direction: (sort.direction || 'asc') as 'asc' | 'desc',
    });
  }

  changePage(event: PageEvent): void {
    if (event.pageSize !== this.pageSize()) {
      this.pageSize.set(event.pageSize);
    }
    this.pageIndex.set(event.pageIndex);
  }

  setPositionDistributionG4Type(value: G4Type): void {
    this.positionDistributionG4Type.set(value);
  }

  setPositionDistributionFlankWindow(value: G4FlankWindow): void {
    this.positionDistributionFlankWindow.set(normalizeFlankWindow(value));
  }

  setPositionDistributionFilterModel(model: PositionDistributionFilterModel): void {
    this.positionDistributionFilterModel.set(model);
  }

  setSelectedPositionDistributionCategoryKeys(keys: readonly string[]): void {
    this.selectedPositionDistributionCategoryKeys.set(keys);
  }

  submitPositionDistributionFilters(): void {
    this.submittedPositionDistributionFilters.set(
      normalizePositionDistributionFilterModel(this.positionDistributionFilterModel()),
    );
  }

  resetPositionDistributionFilters(): void {
    const defaults = createInitialPositionDistributionFilterModel();
    this.positionDistributionFilterModel.set(defaults);
    this.submittedPositionDistributionFilters.set(defaults);
  }

  resetFilters(): void {
    this.draftG4Type.set('g4');
    this.g4Type.set('g4');
    const defaults = createInitialFilterModel(G4_GENE_POSITION_OPTIONS_BY_TYPE.g4[0].value);
    this.filterModel.set(defaults);
    this.submittedFilters.set(defaults);
    this.draftGeneRelationValue.set(ANY_GENE_RELATION);
    const defaultScope = this.defaultBrowseScope();
    this.browseScope.set(defaultScope);
    this.draftBrowseScope.set(defaultScope);
    this.lastDraftPosition = defaults.selectedPosition;
    this.clearGeneSelection();
    this.applyScopeViewport(defaultScope, { navigateViewer: true });
  }

  resetScopeFilter(): void {
    this.commitFilters({
      ...this.submittedFilters(),
      selectedPosition: this.defaultGenePosition(),
    });
    this.clearGeneSelection();
  }

  resetGeneFilter(): void {
    this.clearGeneSelection();
  }

  resetTetradsFilter(): void {
    this.commitFilters({
      ...this.submittedFilters(),
      selectedTetrads: [],
    });
  }

  resetScoreFilter(): void {
    this.commitFilters({
      ...this.submittedFilters(),
      minScore: '',
      maxScore: '',
    });
  }

  setTableDownloadColumns(columns: readonly G4DownloadColumn[]): void {
    if (columns.length === 0) {
      return;
    }
    this.tableDownloadColumns.set(columns);
  }

  downloadTable(columns: readonly G4DownloadColumn[]): void {
    if (this.isTableDownloadPending()) {
      return;
    }

    const selectedGene = this.activeSubmittedSelectedGene();
    const browseScope = this.browseScope();
    const filters = this.browseFilters();
    const downloadColumns = columns.length ? columns : this.tableDownloadColumns();

    this.isTableDownloadPending.set(true);
    this.g4Service
      .downloadG4Table({
        assemblyAccession: this.assemblyAccession(),
        g4Type: this.g4Type(),
        seqid: selectedGene || browseScope === WHOLE_GENOME_SCOPE ? undefined : browseScope,
        sort: this.sortState().active,
        order: this.sortState().direction,
        tetrads: filters.tetrads,
        minScore: filters.minScore,
        maxScore: filters.maxScore,
        selectedFeatureId: selectedGene?.feature_id,
        selectedPosition: selectedGene ? this.submittedFilters().selectedPosition : undefined,
        columns: downloadColumns,
      })
      .pipe(finalize(() => this.isTableDownloadPending.set(false)))
      .subscribe({
        next: (download) => this.saveDownloadBlob(download.blob, download.filename),
        error: () => {
          this.snackBar.open('Table download failed. Check the filters and try again.', 'Dismiss', {
            duration: 4000,
          });
        },
      });
  }

  onGeneInput(event: Event): void {
    this.activateDefaultGeneRelationForGeneSearch();
    const value = (event.target as HTMLInputElement | null)?.value ?? '';
    this.draftGeneInput.set(value);
    this.geneInputError.set(null);
    if (value.trim() !== this.draftSelectedGeneLabel()) {
      this.draftSelectedGene.set(null);
    }
  }

  onGeneCandidateSelected(event: MatAutocompleteSelectedEvent): void {
    const candidate = event.option.value as G4GeneCandidate;
    this.selectGeneCandidate(candidate);
  }

  selectGeneCandidate(candidate: G4GeneCandidate): void {
    this.activateDefaultGeneRelationForGeneSearch();
    this.draftSelectedGene.set(candidate);
    this.draftGeneInput.set(formatGeneCandidateLabel(candidate));
    this.geneInputError.set(null);
  }

  resetBrowser(): void {
    if (this.isGeneSearchMode()) {
      this.navigateToFirstResultForGeneSearch();
      return;
    }

    this.applyScopeViewport(this.browseScope(), { navigateViewer: true });
  }

  resetChartViewport(): void {
    this.resetBrowser();
  }

  setResultsTabIndex(index: number): void {
    if (
      !Number.isInteger(index) ||
      index < RESULTS_TABLE_TAB_INDEX ||
      index > RESULTS_GENOME_BROWSER_TAB_INDEX
    ) {
      throw new Error(`Invalid genome result tab index: ${index}.`);
    }
    this.resultsTabIndex.set(index);
  }

  focusChartPoint(point: G4ChartPointFocus): void {
    const normalizedTarget = this.normalizeViewportTarget({
      seqid: point.seqid,
      start: point.start,
      end: point.end,
    });
    if (!normalizedTarget) {
      this.snackBar.open(
        'Cannot navigate to this chart bin because it is outside the selected sequence record.',
        'Dismiss',
        { duration: 5000 },
      );
      return;
    }

    const seqidLength = this.seqidLengthFor(normalizedTarget.seqid);
    const focusedRange = normalizedChartRange(
      normalizedTarget.start,
      normalizedTarget.end,
      seqidLength,
    );
    this.updateChartViewport(normalizedTarget.seqid, {
      start: focusedRange.start,
      end: focusedRange.end,
      binSize: this.chartViewport().binSize,
    });
    this.navigateViewerToRange(normalizedTarget.seqid, focusedRange.start, focusedRange.end);
    this.resultsTabIndex.set(RESULTS_GENOME_BROWSER_TAB_INDEX);
  }

  navigateToG4(item: G4PageItem): void {
    const normalizedTarget = this.normalizeViewportTarget({
      seqid: item.seqid,
      start: item.start,
      end: item.end,
    });
    if (!normalizedTarget) {
      return;
    }

    const seqidLength = this.seqidLengthFor(normalizedTarget.seqid);
    const center = Math.round((normalizedTarget.start + normalizedTarget.end) / 2);
    const focusedRange = focusWindowAroundCenter(center, seqidLength);
    this.updateChartViewport(normalizedTarget.seqid, {
      start: focusedRange.start,
      end: focusedRange.end,
      binSize: TABLE_SEQUENCE_FOCUS_BIN_SIZE_BP,
    });
    this.navigateViewerToRange(normalizedTarget.seqid, focusedRange.start, focusedRange.end);
  }

  applyChartViewport(viewport: G4ChartViewport): void {
    if (!this.chartSeqid()) {
      return;
    }

    const seqidLength = this.seqidLengthFor(this.chartSeqid());
    const normalizedRange = normalizedChartRange(viewport.start, viewport.end, seqidLength);
    const normalizedViewport: G4ChartViewport = {
      ...normalizedRange,
      binSize: Math.max(1, Math.trunc(viewport.binSize)),
    };
    this.updateChartViewport(this.chartSeqid(), normalizedViewport);
    this.navigateViewerToRange(this.chartSeqid(), normalizedRange.start, normalizedRange.end);
  }

  handleViewerRegionChange(region: string): void {
    const normalizedRegion = this.normalizeRegionLocation(region);
    if (!normalizedRegion) {
      return;
    }
    this.viewerState.setRegion(normalizedRegion);

    const parsedRegion = parseRegionLocation(normalizedRegion);
    if (!parsedRegion) {
      return;
    }

    const availableSeqids = this.assemblyDetail()?.seqids ?? [];
    const currentBrowseScope = this.browseScope();
    if (
      !this.isGeneSearchMode() &&
      availableSeqids.includes(parsedRegion.seqid) &&
      currentBrowseScope !== WHOLE_GENOME_SCOPE &&
      parsedRegion.seqid !== currentBrowseScope
    ) {
      this.browseScope.set(parsedRegion.seqid);
    }

    const seqidLength = this.seqidLengthFor(parsedRegion.seqid);
    const normalizedRange = normalizedChartRange(parsedRegion.start, parsedRegion.end, seqidLength);
    const currentViewport = this.chartViewport();
    this.updateChartViewport(parsedRegion.seqid, {
      start: normalizedRange.start,
      end: normalizedRange.end,
      binSize:
        this.chartSeqid() === parsedRegion.seqid
          ? currentViewport.binSize
          : defaultBinSizeForLength(seqidLength),
    });
  }

  formatCount(value: number): string {
    return formatCompactCount(value);
  }

  formatLength(value: number): string {
    return value > 0 ? formatGenomeLength(value) : 'Unavailable';
  }

  private currentScoreRangeLabel(): string {
    const min = this.submittedMinScore();
    const max = this.submittedMaxScore();
    if (min !== undefined && max !== undefined) {
      return `${min} - ${max}`;
    }
    if (min !== undefined) {
      return `>= ${min}`;
    }
    if (max !== undefined) {
      return `<= ${max}`;
    }
    return 'All';
  }

  private saveDownloadBlob(blob: Blob, filename: string): void {
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = filename;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(objectUrl);
  }

  private commitFilters(model: G4FilterModel): void {
    const normalized = normalizeFilterModel(model);
    this.filterModel.set(normalized);
    this.submittedFilters.set(normalized);
  }

  private buildWholeGenomeBrowseRequest(pageIndex: number, pageSize: number): G4PageRequest {
    const filters = this.browseFilters();
    return {
      assemblyAccession: this.assemblyAccession(),
      g4Type: this.g4Type(),
      pageIndex,
      pageSize,
      sort: this.sortState().active,
      order: this.sortState().direction,
      tetrads: filters.tetrads,
      minScore: filters.minScore,
      maxScore: filters.maxScore,
    };
  }

  private buildSingleBrowseRequest(
    seqid: string,
    pageIndex: number,
    pageSize: number,
  ): G4PageRequest & { seqid: string } {
    return {
      ...this.buildWholeGenomeBrowseRequest(pageIndex, pageSize),
      seqid,
    };
  }

  private buildGeneSearchRequest(
    pageIndex: number,
    pageSize: number,
  ): G4GeneSearchRequest | undefined {
    const selectedGene = this.activeSubmittedSelectedGene();
    if (!selectedGene) {
      return undefined;
    }

    const filters = this.browseFilters();
    return {
      assemblyAccession: this.assemblyAccession(),
      g4Type: this.g4Type(),
      pageIndex,
      pageSize,
      sort: this.sortState().active,
      order: this.sortState().direction,
      tetrads: filters.tetrads,
      minScore: filters.minScore,
      maxScore: filters.maxScore,
      selectedFeatureId: selectedGene.feature_id,
      selectedPosition: this.submittedFilters().selectedPosition,
    };
  }

  private fetchFirstResultForGeneSearch(): Observable<G4PageResponse> {
    const request = this.buildGeneSearchRequest(0, 1);
    return request ? this.g4Service.getGeneSearchPage(request) : of(EMPTY_G4_PAGE);
  }

  private navigateToFirstResultForGeneSearch(): void {
    const requestId = ++this.navigationRequestId;
    this.fetchGeneCoordinateForSelectedGene()
      .pipe(
        switchMap((geneTarget) => {
          if (geneTarget) {
            return of<GeneNavigationTarget>({
              target: geneTarget,
              source: 'selected-gene',
            });
          }
          return this.fetchFirstResultForGeneSearch().pipe(
            map((page): GeneNavigationTarget | null => {
              const firstG4 = page.g4s[0];
              return firstG4
                ? {
                    target: {
                      seqid: firstG4.seqid,
                      start: firstG4.start,
                      end: firstG4.end,
                    },
                    source: 'first-g4',
                  }
                : null;
            }),
          );
        }),
      )
      .subscribe((navigationTarget) => {
        if (requestId !== this.navigationRequestId || !navigationTarget) {
          return;
        }

        const normalizedTarget = this.normalizeViewportTarget(navigationTarget.target);
        if (!normalizedTarget) {
          return;
        }
        this.selectedGeneAxisRange.set(
          navigationTarget.source === 'selected-gene' ? normalizedTarget : null,
        );
        const seqidLength = this.seqidLengthFor(normalizedTarget.seqid);
        const focusedRange = normalizedChartRange(
          normalizedTarget.start - GENE_SEARCH_FOCUS_HALF_WINDOW_BP,
          normalizedTarget.end + GENE_SEARCH_FOCUS_HALF_WINDOW_BP,
          seqidLength,
        );
        this.updateChartViewport(normalizedTarget.seqid, {
          start: focusedRange.start,
          end: focusedRange.end,
          binSize: GENE_SEARCH_BIN_SIZE_BP,
        });
        this.navigateViewerToRange(normalizedTarget.seqid, focusedRange.start, focusedRange.end);
      });
  }

  private fetchGeneCoordinateForSelectedGene(): Observable<GenomeViewportTarget | null> {
    const selectedGene = this.activeSubmittedSelectedGene();
    if (!selectedGene) {
      return of(null);
    }

    return this.geneService
      .getGene(this.assemblyAccession(), selectedGene.seqid, selectedGene.feature_id)
      .pipe(
        map((gene): GenomeViewportTarget | null => {
          if (gene.start === null || gene.end === null) {
            return null;
          }
          return {
            seqid: selectedGene.seqid,
            start: gene.start,
            end: gene.end,
          };
        }),
        catchError(() => of(null)),
      );
  }

  private clearGeneSelection(): void {
    this.clearDraftGeneSelection();
    this.submittedSelectedGene.set(null);
    this.submittedSelectedGeneAssemblyAccession.set(null);
    this.selectedGeneAxisRange.set(null);
  }

  private clearDraftGeneSelection(): void {
    this.draftGeneInput.set('');
    this.draftSelectedGene.set(null);
    this.geneInputError.set(null);
  }

  private activateDefaultGeneRelationForGeneSearch(): void {
    if (this.draftGeneRelationValue() !== ANY_GENE_RELATION) {
      return;
    }

    const defaultPosition = this.defaultDraftGenePosition();
    this.draftGeneRelationValue.set(defaultPosition);
    this.filterModel.update((current) => ({
      ...current,
      selectedPosition: defaultPosition,
    }));
    this.lastDraftPosition = defaultPosition;
  }

  geneOptionLabel(candidate: G4GeneCandidate): string {
    const name = preferredGeneDisplayName(candidate);
    const biotype = geneBiotypeLabel(candidate.gene_biotype);
    return `${name} · ${candidate.feature_id} · ${candidate.seqid} · ${biotype}`;
  }

  displayGeneCandidate(value: G4GeneCandidate | string | null): string {
    if (!value) {
      return '';
    }
    if (typeof value === 'string') {
      return value;
    }
    return formatGeneCandidateLabel(value);
  }

  trackByGeneCandidate(_index: number, candidate: G4GeneCandidate): string {
    return `${candidate.seqid}:${candidate.feature_id}`;
  }

  private accessionNameForSeqid(seqid: BrowseScope): string {
    if (seqid === WHOLE_GENOME_SCOPE) {
      return 'Whole genome';
    }
    return this.regionsBySeqid().get(seqid)?.accession_name?.trim() || seqid;
  }

  private applyScopeViewport(scope: BrowseScope, options: ViewportApplyOptions): void {
    if (!scope) {
      return;
    }
    if (scope === WHOLE_GENOME_SCOPE) {
      const firstSeqid = this.firstSeqid();
      if (!firstSeqid) {
        return;
      }
      this.applyFullSeqidViewport(firstSeqid, options);
      return;
    }

    this.applyFullSeqidViewport(scope, options);
  }

  private applyFullSeqidViewport(seqid: string, options: ViewportApplyOptions): void {
    const seqidLength = this.seqidLengthFor(seqid);
    const fullRange = normalizedChartRange(1, seqidLength, seqidLength);
    const nextViewport: G4ChartViewport = {
      start: fullRange.start,
      end: fullRange.end,
      binSize: defaultBinSizeForLength(seqidLength),
    };
    this.updateChartViewport(seqid, nextViewport);
    if (options.navigateViewer) {
      this.navigateViewerToRange(seqid, fullRange.start, fullRange.end);
    }
  }

  private updateChartViewport(seqid: string, viewport: G4ChartViewport): void {
    const normalizedTarget = this.normalizeViewportTarget({
      seqid,
      start: viewport.start,
      end: viewport.end,
    });
    if (!normalizedTarget) {
      return;
    }

    this.chartSeqid.set(normalizedTarget.seqid);
    this.chartViewport.set({
      start: normalizedTarget.start,
      end: normalizedTarget.end,
      binSize: Math.max(1, Math.trunc(viewport.binSize)),
    });
  }

  private navigateViewerToRange(seqid: string, start: number, end: number): void {
    const normalizedTarget = this.normalizeViewportTarget({ seqid, start, end });
    if (!normalizedTarget) {
      return;
    }

    this.viewerState.requestNavToLocation(
      buildViewerLocation(normalizedTarget.seqid, normalizedTarget.start, normalizedTarget.end),
    );
  }

  private seqidLengthFor(seqid: string): number {
    const detail = this.assemblyDetail();
    if (!detail || !seqid) {
      return 1;
    }
    return normalizedSeqidLength(detail.seqid_lengths[seqid]);
  }

  private resolveInitialViewerRegion(defaultRegion: string, browseScope: BrowseScope): string {
    if (browseScope === WHOLE_GENOME_SCOPE) {
      const firstSeqid = this.firstSeqid();
      if (firstSeqid) {
        const firstSeqidLength = this.seqidLengthFor(firstSeqid);
        const firstSeqidRange = normalizedChartRange(1, firstSeqidLength, firstSeqidLength);
        return buildViewerLocation(firstSeqid, firstSeqidRange.start, firstSeqidRange.end);
      }
    }

    const normalizedDefaultRegion = this.normalizeRegionLocation(defaultRegion);
    if (normalizedDefaultRegion) {
      return normalizedDefaultRegion;
    }

    const fallbackSeqid =
      browseScope !== WHOLE_GENOME_SCOPE
        ? this.resolveSafeSeqid(browseScope)
        : this.resolveSafeSeqid(this.defaultBrowseScope());
    if (!fallbackSeqid) {
      return defaultRegion;
    }

    const fallbackLength = this.seqidLengthFor(fallbackSeqid);
    const fallbackRange = normalizedChartRange(1, fallbackLength, fallbackLength);
    return buildViewerLocation(fallbackSeqid, fallbackRange.start, fallbackRange.end);
  }

  private firstSeqid(): string | null {
    return this.assemblyDetail()?.seqids[0] ?? null;
  }

  private normalizeRegionLocation(region: string): string | null {
    const parsedRegion = parseRegionLocation(region);
    if (!parsedRegion) {
      return null;
    }

    const normalizedTarget = this.normalizeViewportTarget(parsedRegion);
    if (!normalizedTarget) {
      return null;
    }

    return buildViewerLocation(
      normalizedTarget.seqid,
      normalizedTarget.start,
      normalizedTarget.end,
    );
  }

  private normalizeViewportTarget(target: GenomeViewportTarget): GenomeViewportTarget | null {
    const seqid = this.resolveSafeSeqid(target.seqid);
    if (!seqid) {
      return null;
    }

    const normalizedRange = normalizedChartRange(
      target.start,
      target.end,
      this.seqidLengthFor(seqid),
    );
    return {
      seqid,
      start: normalizedRange.start,
      end: normalizedRange.end,
    };
  }

  private resolveSafeSeqid(preferredSeqid: string): string | null {
    const seqids = this.assemblyDetail()?.seqids ?? [];
    if (!seqids.length) {
      return null;
    }
    if (preferredSeqid && seqids.includes(preferredSeqid)) {
      return preferredSeqid;
    }

    const chartSeqid = this.chartSeqid();
    if (chartSeqid && seqids.includes(chartSeqid)) {
      return chartSeqid;
    }

    const browseScope = this.browseScope();
    if (browseScope && browseScope !== WHOLE_GENOME_SCOPE && seqids.includes(browseScope)) {
      return browseScope;
    }

    const defaultBrowseScope = this.defaultBrowseScope();
    if (
      defaultBrowseScope &&
      defaultBrowseScope !== WHOLE_GENOME_SCOPE &&
      seqids.includes(defaultBrowseScope)
    ) {
      return defaultBrowseScope;
    }

    return seqids[0] ?? null;
  }
}
