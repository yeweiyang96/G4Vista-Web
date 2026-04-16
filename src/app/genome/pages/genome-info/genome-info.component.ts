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
import { RouterLink } from '@angular/router';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormField, form } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { Sort } from '@angular/material/sort';
import { forkJoin, map, of } from 'rxjs';
import { G4TableComponent } from './g4-table/g4-table.component';
import { GenomeAssemblyDetail, GenomeDetailService } from '../../services/genome-detail.service';
import {
  EMPTY_G4_PAGE,
  G4_GENE_POSITION_OPTIONS_BY_TYPE,
  G4GeneSearchRequest,
  G4GeneRelationHit,
  G4GeneRelationsResponse,
  G4GenePosition,
  G4PageResponse,
  G4PageItem,
  G4PageRequest,
  G4SortField,
  G4Type,
  G4Service,
} from '../../services/g4.service';
import {
  GenomeViewerConfigService,
  GenomeViewerStateService,
  JbrowseHostComponent,
} from '../../viewer';

interface G4FilterModel {
  selectedTetrads: number[];
  selectedPosition: G4GenePosition;
  geneQuery: string;
  minGscore: string;
  maxGscore: string;
}

interface G4PageResourceRequest {
  mode: 'browse' | 'gene-search';
  request: G4PageRequest | G4GeneSearchRequest;
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

const DEFAULT_GENE_POSITION = G4_GENE_POSITION_OPTIONS_BY_TYPE.normal[0].value;
const SORTABLE_COLUMNS: Record<string, G4SortField> = {
  start: 'start',
  end: 'end',
  length: 'length',
  tetrads: 'tetrads',
  gscore: 'gscore',
};
const GENE_QUERY_DEBOUNCE_MS = 300;
const NON_NEGATIVE_INTEGER_PATTERN = /^\d+$/;

function createInitialFilterModel(): G4FilterModel {
  return {
    selectedTetrads: [],
    selectedPosition: DEFAULT_GENE_POSITION,
    geneQuery: '',
    minGscore: '',
    maxGscore: '',
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

function buildViewerLocation(seqid: string, start: number, end: number): string {
  const paddedStart = Math.max(1, start - 250);
  const paddedEnd = end + 250;
  return `${seqid}:${paddedStart}..${paddedEnd}`;
}

function buildSeqidStartLocation(seqid: string): string {
  return `${seqid}:1..1000`;
}

function buildG4RowKey(seqid: string, start: number): string {
  return `${seqid}:${start}`;
}

function formatGeneRelationLabel(label: string): string {
  return label.replace('(G-rich)', ' (G-rich)').replace('(iMotif)', ' (iMotif)');
}

function parseSeqidFromRegion(region: string): string | undefined {
  const match = region.match(/^(.*):[\d,]+\.\.[\d,]+$/);
  return match?.[1] || undefined;
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

@Component({
  selector: 'app-genome-info',
  imports: [
    FormField,
    G4TableComponent,
    JbrowseHostComponent,
    MatButtonModule,
    MatButtonToggleModule,
    MatCardModule,
    MatDividerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    RouterLink,
  ],
  templateUrl: './genome-info.component.html',
  styleUrl: './genome-info.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GenomeInfoComponent {
  readonly assemblyAccession = input.required<string>();
  readonly dataBaseUrl = input.required<string>();

  private readonly genomeDetailService = inject(GenomeDetailService);
  private readonly g4Service = inject(G4Service);
  private readonly viewerState = inject(GenomeViewerStateService);
  private readonly genomeViewerConfigService = inject(GenomeViewerConfigService);

  readonly g4Type = signal<G4Type>('normal');
  readonly genePositionOptions = computed(() =>
    G4_GENE_POSITION_OPTIONS_BY_TYPE[this.g4Type()].map((option) => ({
      ...option,
      label: formatGeneRelationLabel(option.label),
    })),
  );
  readonly pageSize = signal(10);
  readonly sortState = signal<{ active: G4SortField; direction: 'asc' | 'desc' }>({
    active: 'start',
    direction: 'asc',
  });
  readonly filterModel = signal(createInitialFilterModel());
  readonly filterForm = form(this.filterModel);
  readonly debouncedGeneQuery = signal('');

  readonly assemblyResource = rxResource<GenomeAssemblyDetail, string>({
    params: () => this.assemblyAccession(),
    stream: ({ params }) => this.genomeDetailService.getAssembly(params),
  });
  readonly assemblyDetail = computed<GenomeAssemblyDetail | undefined>(() => {
    const assembly = this.assemblyResource.value();
    return assembly?.assembly_accession === this.assemblyAccession() ? assembly : undefined;
  });
  readonly seqidSource = computed(() => ({
    assemblyAccession: this.assemblyAccession(),
    seqids: this.assemblyDetail()?.seqids ?? [],
    defaultRegion: this.defaultRegionResource.value(),
  }));
  readonly selectedSeqid = linkedSignal<
    { assemblyAccession: string; seqids: string[]; defaultRegion: string },
    string
  >({
    source: () => this.seqidSource(),
    computation: (source, previous) => {
      if (!source.seqids.length) {
        return '';
      }

      const defaultSeqid = parseSeqidFromRegion(source.defaultRegion);
      if (defaultSeqid && source.seqids.includes(defaultSeqid)) {
        return defaultSeqid;
      }

      const previousSeqid = previous?.value;
      return previousSeqid && source.seqids.includes(previousSeqid)
        ? previousSeqid
        : source.seqids[0];
    },
  });
  readonly viewerConfig = computed(() =>
    this.genomeViewerConfigService.createViewerConfig({
      assemblyAccession: this.assemblyAccession(),
      dataBaseUrl: this.dataBaseUrl(),
    }),
  );
  readonly defaultRegionResource = rxResource<
    string,
    { assemblyAccession: string; dataBaseUrl: string }
  >({
    params: () => ({
      assemblyAccession: this.assemblyAccession(),
      dataBaseUrl: this.dataBaseUrl(),
    }),
    stream: ({ params }) => this.genomeViewerConfigService.resolveDefaultRegion(params),
    defaultValue: '1..1000',
  });
  readonly browseFilters = computed(() => {
    const filters = this.filterForm().value();
    return {
      tetrads: filters.selectedTetrads,
      minGscore: parseOptionalInteger(filters.minGscore),
      maxGscore: parseOptionalInteger(filters.maxGscore),
    };
  });
  readonly isGeneSearchMode = computed(() => this.debouncedGeneQuery().length > 0);
  readonly pageIndex = linkedSignal({
    source: () => ({
      assemblyAccession: this.assemblyAccession(),
      g4Type: this.g4Type(),
      mode: this.isGeneSearchMode() ? 'gene-search' : 'browse',
      seqid: this.isGeneSearchMode() ? null : this.selectedSeqid(),
      query: this.debouncedGeneQuery(),
      selectedPosition: this.filterForm().value().selectedPosition,
      filters: this.browseFilters(),
      sort: this.sortState(),
      pageSize: this.pageSize(),
    }),
    computation: () => 0,
  });
  readonly browsePageRequest = computed<G4PageRequest | undefined>(() => {
    if (this.isGeneSearchMode()) {
      return undefined;
    }

    const seqid = this.selectedSeqid();
    if (!seqid) {
      return undefined;
    }

    const filters = this.browseFilters();
    return {
      assemblyAccession: this.assemblyAccession(),
      g4Type: this.g4Type(),
      seqid,
      pageIndex: this.pageIndex(),
      pageSize: this.pageSize(),
      sort: this.sortState().active,
      order: this.sortState().direction,
      tetrads: filters.tetrads,
      minGscore: filters.minGscore,
      maxGscore: filters.maxGscore,
    };
  });
  readonly geneSearchPageRequest = computed<G4GeneSearchRequest | undefined>(() => {
    const searchTerm = this.debouncedGeneQuery();
    if (!searchTerm) {
      return undefined;
    }

    const filters = this.browseFilters();
    return {
      assemblyAccession: this.assemblyAccession(),
      g4Type: this.g4Type(),
      pageIndex: this.pageIndex(),
      pageSize: this.pageSize(),
      sort: this.sortState().active,
      order: this.sortState().direction,
      tetrads: filters.tetrads,
      minGscore: filters.minGscore,
      maxGscore: filters.maxGscore,
      searchTerm,
      selectedPosition: this.filterForm().value().selectedPosition,
    };
  });
  readonly g4PageResource = rxResource<G4PageResponse, G4PageResourceRequest | undefined>({
    params: () => {
      const browseRequest = this.browsePageRequest();
      if (browseRequest) {
        return { mode: 'browse', request: browseRequest };
      }

      const geneSearchRequest = this.geneSearchPageRequest();
      if (geneSearchRequest) {
        return { mode: 'gene-search', request: geneSearchRequest };
      }

      return undefined;
    },
    stream: ({ params }) => {
      if (!params) {
        return of(EMPTY_G4_PAGE);
      }

      return params.mode === 'browse'
        ? this.g4Service.getG4Page(params.request as G4PageRequest)
        : this.g4Service.getGeneSearchPage(params.request as G4GeneSearchRequest);
    },
    defaultValue: EMPTY_G4_PAGE,
  });
  readonly g4Page = computed<G4PageResponse>(() => this.g4PageResource.value());
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
  readonly selectedPositionLabel = computed(
    () =>
      this.genePositionOptions().find(
        (option) => option.value === this.filterForm().value().selectedPosition,
      )?.label ?? 'Gene scope',
  );
  readonly explorerSubtitle = computed(() => {
    if (this.isGeneSearchMode()) {
      return `${this.g4Page().count} PQS matched in ${this.assemblyAccession()}`;
    }

    return `${this.g4Page().count} PQS on ${this.selectedSeqid() || 'current assembly'}`;
  });
  readonly geneSearchScopeHint = computed(() => {
    const label = this.selectedPositionLabel();
    return label === 'Gene scope'
      ? 'Matches genes within the selected scope in the current assembly.'
      : `Matches genes in ${label} across the current assembly.`;
  });
  readonly activeGeneSearchTerm = computed(() => this.debouncedGeneQuery());
  private lastViewerSessionKey: string | null = null;

  constructor() {
    effect((onCleanup) => {
      const rawGeneQuery = this.filterForm().value().geneQuery.trim();
      if (!rawGeneQuery) {
        this.debouncedGeneQuery.set('');
        return;
      }

      const timeoutId = window.setTimeout(() => {
        this.debouncedGeneQuery.set(rawGeneQuery);
      }, GENE_QUERY_DEBOUNCE_MS);

      onCleanup(() => window.clearTimeout(timeoutId));
    });

    effect(() => {
      const assemblyAccession = this.assemblyAccession();
      if (this.defaultRegionResource.isLoading()) {
        return;
      }

      const defaultRegion = this.defaultRegionResource.value();
      const sessionKey = `${assemblyAccession}::${defaultRegion}`;
      if (this.lastViewerSessionKey === sessionKey) {
        return;
      }

      this.lastViewerSessionKey = sessionKey;
      this.viewerState.resetSession(assemblyAccession, defaultRegion);
      this.viewerState.requestNavToLocation(defaultRegion);
    });
  }

  selectSeqid(seqid: string): void {
    this.selectedSeqid.set(seqid);
    this.viewerState.requestNavToLocation(buildSeqidStartLocation(seqid));
  }

  selectG4Type(type: G4Type): void {
    if (type === this.g4Type()) {
      return;
    }

    this.g4Type.set(type);
    const defaultPosition = G4_GENE_POSITION_OPTIONS_BY_TYPE[type][0]?.value;
    if (defaultPosition) {
      this.filterModel.update((current) => ({
        ...current,
        selectedPosition: defaultPosition,
      }));
    }
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

  resetFilters(): void {
    const defaultPosition = G4_GENE_POSITION_OPTIONS_BY_TYPE[this.g4Type()][0]?.value;
    this.filterModel.set({
      ...createInitialFilterModel(),
      selectedPosition: defaultPosition ?? DEFAULT_GENE_POSITION,
    });
  }

  resetBrowser(): void {
    const defaultRegion = this.defaultRegionResource.value();
    const defaultSeqid = parseSeqidFromRegion(defaultRegion);
    if (defaultSeqid && this.seqidSource().seqids.includes(defaultSeqid)) {
      this.selectedSeqid.set(defaultSeqid);
    }
    this.viewerState.requestNavToLocation(defaultRegion);
  }

  navigateToG4(item: G4PageItem): void {
    this.viewerState.requestNavToLocation(buildViewerLocation(item.seqid, item.start, item.end));
  }
}
