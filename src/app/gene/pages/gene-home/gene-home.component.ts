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
import { MtxGridColumn, MtxGridModule } from '@ng-matero/extensions/grid';
import {
  debounceTime,
  distinctUntilChanged,
  map,
  Observable,
  of,
  startWith,
  switchMap,
} from 'rxjs';
import { GeneSearchItem, GeneService } from '../../services/gene.service';
import { geneBiotypeLabel } from '../../../shared/gene-biotype';
import {
  AssemblyCount,
  TaxonomyNode,
  TaxonomySearch,
  TaxonomyService,
} from '../../../taxonomy/services/taxonomy.service';

const COUNT_FORMATTER = new Intl.NumberFormat('en-US');
const TAXON_SEARCH_DEBOUNCE_MS = 250;

interface GeneSearchCsvColumn {
  readonly header: string;
  readonly value: (row: GeneSearchItem) => string | number | null;
}

interface GeneSearchParams {
  readonly searchTerm: string;
  readonly taxonId: number | null;
}

interface GeneTaxonScope {
  readonly taxon_id: number;
  readonly name: string;
  readonly rank: string;
}

function internalG4SiteCount(row: GeneSearchItem): number {
  return row.insideOf_gene_g4_count;
}

function geneFeatureLabel(row: GeneSearchItem): string | null {
  return row.gene_name || row.feature_id;
}

function csvCell(value: string | number | null): string {
  const text = value === null ? '' : String(value);
  const escapedText = text.replace(/"/g, '""');
  return /[",\n\r]/.test(escapedText) ? `"${escapedText}"` : escapedText;
}

const GENE_SEARCH_CSV_COLUMNS: readonly GeneSearchCsvColumn[] = [
  { header: 'Species', value: (row) => row.organism_name },
  { header: 'Gene', value: (row) => geneFeatureLabel(row) },
  { header: 'Feature ID', value: (row) => row.gene_id },
  { header: 'Assembly', value: (row) => row.assembly_accession },
  { header: 'Sequence record', value: (row) => row.seqid },
  { header: 'Biotype', value: (row) => geneBiotypeLabel(row.gene_biotype) },
  { header: 'Start', value: (row) => row.feature_start },
  { header: 'End', value: (row) => row.feature_end },
  { header: 'Strand', value: (row) => row.strand },
  { header: 'Internal G4 count', value: (row) => internalG4SiteCount(row) },
];

function geneSearchCsv(rows: readonly GeneSearchItem[]): string {
  const headerRow = GENE_SEARCH_CSV_COLUMNS.map((column) => csvCell(column.header)).join(',');
  const bodyRows = rows.map((row) =>
    GENE_SEARCH_CSV_COLUMNS.map((column) => csvCell(column.value(row))).join(','),
  );
  return [headerRow, ...bodyRows].join('\n');
}

function exportFileName(searchTerm: string, taxonId: number | null): string {
  const queryToken = searchTerm.trim().replace(/[<>:"/\\|?*\s]+/g, '_');
  const taxonToken = taxonId === null ? '' : `taxon-${taxonId}-`;
  return `g4vista-gene-results-${taxonToken}${queryToken}.csv`;
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
  readonly searchResultResource = rxResource<GeneSearchItem[], GeneSearchParams | null>({
    params: () => this.submittedSearch(),
    stream: ({ params }) =>
      params ? this.geneService.searchGenes(geneSearchRequestFromParams(params)) : of([]),
    defaultValue: [],
  });

  readonly submittedQuery = computed(() => this.submittedSearch()?.searchTerm ?? null);
  readonly submittedTaxonId = computed(() => this.submittedSearch()?.taxonId ?? null);
  readonly results = computed(() => this.searchResultResource.value());
  readonly isLoading = this.searchResultResource.isLoading;

  readonly showPromptMessage = computed(() => !this.hasSubmitted() || !this.submittedQuery());
  readonly showNoResultMessage = computed(
    () =>
      this.hasSubmitted() &&
      !!this.submittedQuery() &&
      !this.isLoading() &&
      this.results().length === 0,
  );
  readonly showResultsPanel = computed(
    () =>
      this.hasSubmitted() &&
      !!this.submittedQuery() &&
      (this.isLoading() || this.results().length > 0),
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
    const resultCount = this.results().length;
    if (this.isLoading() && resultCount === 0) {
      return 'Loading results...';
    }
    return `Showing 1-${resultCount} of ${resultCount} results`;
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
      field: 'seqid',
    },
    {
      header: 'Biotype',
      field: 'gene_biotype',
      formatter: (row) => geneBiotypeLabel(row.gene_biotype),
    },
    {
      header: 'Range',
      field: 'feature_start',
      cellTemplate: this.rangeTpl as unknown as never,
    },
    {
      header: 'Internal G4 count',
      field: 'insideOf_gene_g4_count',
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
    if (row.feature_start === null || row.feature_end === null) {
      return 'Unavailable';
    }
    const strand = row.strand ? ` (${row.strand})` : '';
    return `${COUNT_FORMATTER.format(row.feature_start)}..${COUNT_FORMATTER.format(row.feature_end)}${strand}`;
  }

  internalG4Count(row: GeneSearchItem): string {
    return COUNT_FORMATTER.format(internalG4SiteCount(row));
  }

  exportResults(): void {
    const rows = this.results();
    if (rows.length === 0) {
      throw new Error('Cannot export gene search results because the current result set is empty.');
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

    const blob = new Blob([geneSearchCsv(rows)], { type: 'text/csv;charset=utf-8' });
    const objectUrl = view.URL.createObjectURL(blob);
    const link = this.document.createElement('a');
    link.href = objectUrl;
    link.download = exportFileName(submittedSearch.searchTerm, submittedSearch.taxonId);

    try {
      body.appendChild(link);
      link.click();
    } finally {
      link.remove();
      view.URL.revokeObjectURL(objectUrl);
    }
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

    this.submittedSearch.set(nextSearch);
  }

  private navigateToSearch(searchTerm: string, taxon: GeneTaxonScope | null): Promise<boolean> {
    const queryParams = searchTerm ? { search: searchTerm } : {};
    const commands = taxon ? ['/gene', 'taxon', taxon.taxon_id] : ['/gene'];
    return this.router.navigate(commands, { queryParams });
  }
}
