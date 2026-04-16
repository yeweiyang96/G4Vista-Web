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
import { of } from 'rxjs';
import { G4TableComponent } from './g4-table/g4-table.component';
import { GenomeAssemblyDetail, GenomeDetailService } from '../../services/genome-detail.service';
import {
  EMPTY_G4_GENE_RELATIONS,
  EMPTY_G4_PAGE,
  G4_GENE_POSITION_OPTIONS_BY_TYPE,
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

const DEFAULT_GENE_POSITION = G4_GENE_POSITION_OPTIONS_BY_TYPE.normal[0].value;
const SORTABLE_COLUMNS: Record<string, G4SortField> = {
  start: 'start',
  end: 'end',
  length: 'length',
  tetrads: 'tetrads',
  gscore: 'gscore',
};
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

function formatGeneRelationLabel(label: string): string {
  return label.replace('(G-rich)', ' (G-rich)').replace('(iMotif)', ' (iMotif)');
}

function parseSeqidFromRegion(region: string): string | undefined {
  const match = region.match(/^(.*):[\d,]+\.\.[\d,]+$/);
  return match?.[1] || undefined;
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
  readonly pageIndex = linkedSignal({
    source: () => ({
      assemblyAccession: this.assemblyAccession(),
      g4Type: this.g4Type(),
      seqid: this.selectedSeqid(),
      filters: this.filterForm().value(),
      sort: this.sortState(),
      pageSize: this.pageSize(),
    }),
    computation: () => 0,
  });
  readonly g4PageRequest = computed<G4PageRequest | undefined>(() => {
    const seqid = this.selectedSeqid();
    if (!seqid) {
      return undefined;
    }

    const filters = this.filterForm().value();
    return {
      assemblyAccession: this.assemblyAccession(),
      g4Type: this.g4Type(),
      seqid,
      pageIndex: this.pageIndex(),
      pageSize: this.pageSize(),
      sort: this.sortState().active,
      order: this.sortState().direction,
      tetrads: filters.selectedTetrads,
      minGscore: parseOptionalInteger(filters.minGscore),
      maxGscore: parseOptionalInteger(filters.maxGscore),
      geneQuery: filters.geneQuery.trim() || undefined,
      selectedPosition: filters.selectedPosition,
    };
  });
  readonly g4PageResource = rxResource<G4PageResponse, G4PageRequest | undefined>({
    params: () => this.g4PageRequest(),
    stream: ({ params }) => (params ? this.g4Service.getG4Page(params) : of(EMPTY_G4_PAGE)),
    defaultValue: EMPTY_G4_PAGE,
  });
  readonly g4Page = computed<G4PageResponse>(() => this.g4PageResource.value());
  readonly geneRelationsResource = rxResource<
    G4GeneRelationsResponse,
    { assemblyAccession: string; g4Type: G4Type; seqid: string; starts: number[] } | undefined
  >({
    params: () => {
      const request = this.g4PageRequest();
      const starts = this.g4Page().g4s.map((item) => item.start);
      if (!request || !starts.length) {
        return undefined;
      }

      return {
        assemblyAccession: request.assemblyAccession,
        g4Type: request.g4Type,
        seqid: request.seqid,
        starts,
      };
    },
    stream: ({ params }) =>
      params ? this.g4Service.getGeneRelations(params) : of(EMPTY_G4_GENE_RELATIONS),
    defaultValue: EMPTY_G4_GENE_RELATIONS,
  });

  readonly geneRelationsByStart = computed(() => {
    const relationMap = new Map<string, Partial<Record<G4GenePosition, G4GeneRelationHit[]>>>();
    for (const item of this.geneRelationsResource.value().relations) {
      relationMap.set(String(item.start), item.positions);
    }
    return relationMap;
  });
  readonly visibleGenePositionOptions = computed(() => {
    const options = this.genePositionOptions();
    const relationMap = this.geneRelationsByStart();
    if (!relationMap.size) {
      return [];
    }

    const availablePositions = new Set<G4GenePosition>();
    for (const positions of relationMap.values()) {
      for (const option of options) {
        if (positions[option.value]?.length) {
          availablePositions.add(option.value);
        }
      }
    }

    return options.filter((option) => availablePositions.has(option.value));
  });
  readonly showGeneRelationFilter = computed(() => this.visibleGenePositionOptions().length > 0);
  readonly viewerRegion = this.viewerState.region;
  readonly navCommand = this.viewerState.navCommand;
  readonly selectedPositionLabel = computed(
    () =>
      this.genePositionOptions().find(
        (option) => option.value === this.filterForm().value().selectedPosition,
      )?.label ?? 'Gene scope',
  );
  readonly geneSearchScopeHint = computed(() => {
    const label = this.selectedPositionLabel();
    return label === 'Gene scope'
      ? 'Matches genes within the selected scope.'
      : `Matches genes in ${label}.`;
  });
  private lastViewerSessionKey: string | null = null;

  constructor() {
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
