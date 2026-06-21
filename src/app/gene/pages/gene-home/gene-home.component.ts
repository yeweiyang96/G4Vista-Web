import { AsyncPipe, DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  ViewChild,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, ParamMap, Router, RouterLink } from '@angular/router';
import {
  MatAutocompleteModule,
  MatAutocompleteSelectedEvent,
} from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { PageEvent } from '@angular/material/paginator';
import { MtxGridColumn, MtxGridModule } from '@ng-matero/extensions/grid';
import {
  debounceTime,
  distinctUntilChanged,
  finalize,
  map,
  Observable,
  of,
  startWith,
  switchMap,
} from 'rxjs';
import { GeneSearchItem, GeneSearchPage, GeneService } from '../../services/gene.service';
import { geneBiotypeLabel } from '../../../shared/gene-biotype';
import {
  AssemblyCount,
  TaxonomyNode,
  TaxonomySearch,
  TaxonomyService,
} from '../../../taxonomy/services/taxonomy.service';

const COUNT_FORMATTER = new Intl.NumberFormat('en-US');
const TAXON_SEARCH_DEBOUNCE_MS = 250;

interface GeneSearchParams {
  readonly searchTerm: string;
  readonly taxonId: number | null;
}

interface GeneSearchPageParams extends GeneSearchParams {
  readonly pageIndex: number;
  readonly pageSize: number;
}

interface GeneTaxonScope {
  readonly taxon_id: number;
  readonly name: string;
  readonly rank: string;
}

function internalG4SiteCount(row: GeneSearchItem): number {
  return row.g4_count;
}

function normalizeTaxonSearchValue(value: string | TaxonomySearch | null): string {
  if (typeof value === 'string') {
    return value.trim();
  }

  return value?.scientific_name.trim() ?? '';
}

function taxonIdFromParamMap(params: ParamMap): number | null {
  const rawTaxonId = params.get('taxonId');
  if (rawTaxonId === null) {
    return null;
  }

  const taxonId = Number(rawTaxonId);
  return Number.isInteger(taxonId) && taxonId >= 0 ? taxonId : null;
}

function taxonScopeFromSearch(option: TaxonomySearch): GeneTaxonScope {
  return {
    taxon_id: option.taxon_id,
    name: option.scientific_name || option.name,
    rank: option.rank,
  };
}

function taxonScopeFallback(taxonId: number): GeneTaxonScope {
  return {
    taxon_id: taxonId,
    name: `Taxon ${taxonId}`,
    rank: 'taxon',
  };
}

function taxonScopeFromLineage(node: TaxonomyNode, taxonId: number): GeneTaxonScope | null {
  if (node.taxon_id === taxonId) {
    return {
      taxon_id: node.taxon_id,
      name: node.name,
      rank: node.rank,
    };
  }

  for (const child of node.children ?? []) {
    const match = taxonScopeFromLineage(child, taxonId);
    if (match !== null) {
      return match;
    }
  }

  return null;
}

function assemblyCountFromResponse(counts: readonly AssemblyCount[]): number {
  return counts[0]?.assembly_count ?? 0;
}

function sameGeneSearchParams(
  current: GeneSearchParams | null,
  next: GeneSearchParams | null,
): boolean {
  if (current === null || next === null) {
    return current === next;
  }

  return current.searchTerm === next.searchTerm && current.taxonId === next.taxonId;
}

function geneSearchRequestFromParams(params: GeneSearchParams): {
  readonly searchTerm: string;
  readonly taxonId?: number;
} {
  if (params.taxonId === null) {
    return { searchTerm: params.searchTerm };
  }

  return { searchTerm: params.searchTerm, taxonId: params.taxonId };
}

function geneSearchPageRequestFromParams(params: GeneSearchPageParams): {
  readonly searchTerm: string;
  readonly taxonId?: number;
  readonly pageIndex: number;
  readonly pageSize: number;
} {
  const baseRequest = geneSearchRequestFromParams(params);
  return {
    ...baseRequest,
    pageIndex: params.pageIndex,
    pageSize: params.pageSize,
  };
}

const EMPTY_GENE_SEARCH_PAGE: GeneSearchPage = {
  genes: [],
  count: 0,
};

@Component({
  selector: 'app-gene-home',
  imports: [
    AsyncPipe,
    MatAutocompleteModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MtxGridModule,
    ReactiveFormsModule,
    RouterLink,
  ],
  templateUrl: './gene-home.component.html',
  styleUrl: './gene-home.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GeneHomeComponent {
  @ViewChild('assemblyTpl', { static: true }) assemblyTpl!: TemplateRef<unknown>;
  @ViewChild('detailActionTpl', { static: true }) detailActionTpl!: TemplateRef<unknown>;
  @ViewChild('featureTpl', { static: true }) featureTpl!: TemplateRef<unknown>;
  @ViewChild('geneTpl', { static: true }) geneTpl!: TemplateRef<unknown>;
  @ViewChild('internalG4Tpl', { static: true }) internalG4Tpl!: TemplateRef<unknown>;
  @ViewChild('rangeTpl', { static: true }) rangeTpl!: TemplateRef<unknown>;

  readonly searchControl = new FormControl('', { nonNullable: true });
  readonly taxonControl = new FormControl<string | TaxonomySearch>('');
  readonly pageSizeOptions = [10, 20, 50];
  readonly selectedTaxon = signal<GeneTaxonScope | null>(null);
  readonly pageIndex = signal(0);
  readonly pageSize = signal(10);
  readonly isExporting = signal(false);

  private readonly document = inject(DOCUMENT);
  private readonly geneService = inject(GeneService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly taxonomyService = inject(TaxonomyService);
  private readonly submittedSearch = signal<GeneSearchParams | null>(null);
  private readonly hasSubmitted = signal(false);
  private readonly routeTaxonId = toSignal(
    this.route.paramMap.pipe(map((params) => taxonIdFromParamMap(params))),
    { initialValue: null },
  );
  private readonly routeSearchTerm = toSignal(
    this.route.queryParamMap.pipe(map((params) => params.get('search') ?? '')),
    { initialValue: '' },
  );
  private readonly routeTaxonResource = rxResource<GeneTaxonScope | null, number | null>({
    params: () => this.routeTaxonId(),
    stream: ({ params }) =>
      params === null
        ? of(null)
        : this.taxonomyService
            .getLineage(params)
            .pipe(map((node) => taxonScopeFromLineage(node, params) ?? taxonScopeFallback(params))),
    defaultValue: null,
  });

  readonly selectedTaxonAssemblyCountResource = rxResource<number | null, number | null>({
    params: () => this.selectedTaxon()?.taxon_id ?? null,
    stream: ({ params }) =>
      params === null
        ? of(null)
        : this.taxonomyService.getAssemblyCounts([params]).pipe(map(assemblyCountFromResponse)),
    defaultValue: null,
  });
  readonly filteredTaxonOptions$: Observable<readonly TaxonomySearch[]> =
    this.taxonControl.valueChanges.pipe(
      startWith(''),
      debounceTime(TAXON_SEARCH_DEBOUNCE_MS),
      map((value) => normalizeTaxonSearchValue(value)),
      distinctUntilChanged(),
      switchMap((searchTerm) =>
        searchTerm.length > 0 ? this.taxonomyService.searchTaxonomy(searchTerm) : of([]),
      ),
    );
  readonly searchResultResource = rxResource<GeneSearchPage, GeneSearchPageParams | null>({
    params: () => {
      const search = this.submittedSearch();
      if (search === null) {
        return null;
      }
      return {
        ...search,
        pageIndex: this.pageIndex(),
        pageSize: this.pageSize(),
      };
    },
    stream: ({ params }) =>
      params
        ? this.geneService.searchGenesPage(geneSearchPageRequestFromParams(params))
        : of(EMPTY_GENE_SEARCH_PAGE),
    defaultValue: EMPTY_GENE_SEARCH_PAGE,
  });

  readonly submittedQuery = computed(() => this.submittedSearch()?.searchTerm ?? null);
  readonly submittedTaxonId = computed(() => this.submittedSearch()?.taxonId ?? null);
  readonly resultsPage = computed(() => this.searchResultResource.value());
  readonly results = computed(() => this.resultsPage().genes);
  readonly resultCount = computed(() => this.resultsPage().count);
  readonly isLoading = this.searchResultResource.isLoading;

  readonly showPromptMessage = computed(() => !this.hasSubmitted() || !this.submittedQuery());
  readonly showNoResultMessage = computed(
    () =>
      this.hasSubmitted() &&
      !!this.submittedQuery() &&
      !this.isLoading() &&
      this.resultCount() === 0,
  );
  readonly showResultsPanel = computed(
    () =>
      this.hasSubmitted() &&
      !!this.submittedQuery() &&
      (this.isLoading() || this.resultCount() > 0),
  );
  readonly showGlobalSearchWarning = computed(
    () => this.hasSubmitted() && !!this.submittedQuery() && this.submittedTaxonId() === null,
  );
  readonly selectedTaxonAssemblyCountLabel = computed(() => {
    if (this.selectedTaxonAssemblyCountResource.isLoading()) {
      return 'Loading assemblies';
    }

    const assemblyCount = this.selectedTaxonAssemblyCountResource.value();
    return assemblyCount === null
      ? 'Assemblies not available'
      : `${COUNT_FORMATTER.format(assemblyCount)} assemblies`;
  });
  readonly resultCountLabel = computed(() => {
    const resultCount = this.resultCount();
    if (this.isLoading() && this.results().length === 0) {
      return 'Loading results...';
    }
    if (resultCount === 0) {
      return 'Showing 0 results';
    }
    const start = this.pageIndex() * this.pageSize() + 1;
    const end = Math.min(start + this.results().length - 1, resultCount);
    return `Showing ${COUNT_FORMATTER.format(start)}-${COUNT_FORMATTER.format(end)} of ${COUNT_FORMATTER.format(resultCount)} results`;
  });

  readonly columns = computed<MtxGridColumn<GeneSearchItem>[]>(() => [
    {
      header: 'Species',
      field: 'organism_name',
    },
    {
      header: 'Gene',
      field: 'feature_id',
      cellTemplate: this.featureTpl as unknown as never,
    },
    {
      header: 'Feature ID',
      field: 'gene_id',
      cellTemplate: this.geneTpl as unknown as never,
    },
    {
      header: 'Assembly',
      field: 'assembly_accession',
      cellTemplate: this.assemblyTpl as unknown as never,
    },
    {
      header: 'Sequence record',
      field: 'region_id',
    },
    {
      header: 'Biotype',
      field: 'biotype',
      formatter: (row) => geneBiotypeLabel(row.biotype),
    },
    {
      header: 'Range',
      field: 'start',
      cellTemplate: this.rangeTpl as unknown as never,
    },
    {
      header: 'Internal G4 count',
      field: 'g4_count',
      cellTemplate: this.internalG4Tpl as unknown as never,
      sortable: true,
    },
    {
      header: '',
      field: 'detail_action',
      cellTemplate: this.detailActionTpl as unknown as never,
      width: '48px',
    },
  ]);

  constructor() {
    effect(() => {
      const routeTaxonId = this.routeTaxonId();
      if (routeTaxonId === null) {
        this.selectedTaxon.set(null);
        if (this.taxonControl.value !== '') {
          this.taxonControl.setValue('', { emitEvent: false });
        }
        return;
      }

      const taxon = this.routeTaxonResource.value() ?? taxonScopeFallback(routeTaxonId);
      this.selectedTaxon.set(taxon);
      this.taxonControl.setValue(taxon.name, { emitEvent: false });
    });

    effect(() => {
      const searchTerm = this.routeSearchTerm().trim();
      const taxonId = this.routeTaxonId();
      if (this.searchControl.value !== searchTerm) {
        this.searchControl.setValue(searchTerm, { emitEvent: false });
      }
      this.hasSubmitted.set(searchTerm.length > 0);
      this.setSubmittedSearch(searchTerm, taxonId);
    });
  }

  onSubmit(event?: Event): void {
    event?.preventDefault();
    this.hasSubmitted.set(true);

    const query = this.searchControl.value.trim();
    const taxon = this.selectedTaxon();
    const taxonId = taxon?.taxon_id ?? null;
    this.setSubmittedSearch(query, taxonId);
    void this.navigateToSearch(query, taxon);
  }

  taxonDisplayFn(taxon: string | TaxonomySearch | null): string {
    if (typeof taxon === 'string') {
      return taxon;
    }

    return taxon?.scientific_name ?? '';
  }

  selectTaxon(event: MatAutocompleteSelectedEvent): void {
    const selectedTaxon = taxonScopeFromSearch(event.option.value as TaxonomySearch);
    this.selectedTaxon.set(selectedTaxon);
    this.taxonControl.setValue(selectedTaxon.name, { emitEvent: false });
  }

  onTaxonInput(): void {
    if (typeof this.taxonControl.value === 'string') {
      this.selectedTaxon.set(null);
    }
  }

  clearSelectedTaxon(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.selectedTaxon.set(null);
    this.taxonControl.setValue('', { emitEvent: false });
    const query = this.searchControl.value.trim();
    this.setSubmittedSearch(query, null);
    void this.navigateToSearch(query, null);
  }

  formatRange(row: GeneSearchItem): string {
    if (row.start === null || row.end === null) {
      return 'Unavailable';
    }
    const strand = row.strand ? ` (${row.strand})` : '';
    return `${COUNT_FORMATTER.format(row.start)}..${COUNT_FORMATTER.format(row.end)}${strand}`;
  }

  internalG4Count(row: GeneSearchItem): string {
    return COUNT_FORMATTER.format(internalG4SiteCount(row));
  }

  changePage(event: PageEvent): void {
    if (event.pageSize !== this.pageSize()) {
      this.pageSize.set(event.pageSize);
    }
    this.pageIndex.set(event.pageIndex);
  }

  exportResults(): void {
    if (this.isExporting()) {
      return;
    }
    if (this.resultCount() === 0) {
      throw new Error('Cannot export gene search results because no matching results are loaded.');
    }

    const submittedSearch = this.submittedSearch();
    if (!submittedSearch) {
      throw new Error('Cannot export gene search results because no search query is active.');
    }

    const view = this.document.defaultView;
    if (!view) {
      throw new Error(
        'Cannot export gene search results because the browser window is unavailable.',
      );
    }

    const body = this.document.body;
    if (!body) {
      throw new Error(
        'Cannot export gene search results because the document body is unavailable.',
      );
    }

    this.isExporting.set(true);
    this.geneService
      .downloadGeneSearch(geneSearchRequestFromParams(submittedSearch))
      .pipe(finalize(() => this.isExporting.set(false)))
      .subscribe((download) => {
        const objectUrl = view.URL.createObjectURL(download.blob);
        const link = this.document.createElement('a');
        link.href = objectUrl;
        link.download = download.filename;

        try {
          body.appendChild(link);
          link.click();
        } finally {
          link.remove();
          view.URL.revokeObjectURL(objectUrl);
        }
      });
  }

  private setSubmittedSearch(searchTerm: string, taxonId: number | null): void {
    const normalizedSearchTerm = searchTerm.trim();
    const nextSearch =
      normalizedSearchTerm.length > 0
        ? {
            searchTerm: normalizedSearchTerm,
            taxonId,
          }
        : null;

    const currentSearch = untracked(() => this.submittedSearch());
    if (sameGeneSearchParams(currentSearch, nextSearch)) {
      return;
    }

    this.pageIndex.set(0);
    this.submittedSearch.set(nextSearch);
  }

  private navigateToSearch(searchTerm: string, taxon: GeneTaxonScope | null): Promise<boolean> {
    const queryParams = searchTerm ? { search: searchTerm } : {};
    const commands = taxon ? ['/gene', 'taxon', taxon.taxon_id] : ['/gene'];
    return this.router.navigate(commands, { queryParams });
  }
}
