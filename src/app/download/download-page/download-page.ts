import { AsyncPipe, DOCUMENT } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  MatAutocompleteModule,
  MatAutocompleteSelectedEvent,
} from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCheckboxChange, MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { RouterLink } from '@angular/router';
import {
  Observable,
  catchError,
  debounceTime,
  distinctUntilChanged,
  finalize,
  of,
  startWith,
  switchMap,
  tap,
} from 'rxjs';
import type { GenomeSearch } from '../../genome/services/genome-search.service';
import { GenomeSearchService } from '../../genome/services/genome-search.service';
import {
  AssemblyDownloadSetItem,
  AssemblyDownloadSetService,
} from '../assembly-download-set.service';
import {
  DownloadColumn,
  DownloadColumnCatalog,
  DownloadColumnSelection,
  DownloadGeneRelationCategory,
  DownloadMode,
  DownloadQuadruplexType,
  DownloadRequest,
  DownloadService,
  DownloadSortOrder,
} from '../download.service';

interface ColumnGroup {
  readonly category: string;
  readonly columns: readonly DownloadColumn[];
}

interface Option<T extends string | number> {
  readonly value: T;
  readonly label: string;
}

type ColumnSelectionMode = 'default' | 'all' | 'custom';
type DataScopeMode = 'assembly_set' | 'taxon_or_region' | 'all_records';
type DownloadSortField =
  | 'assembly_accession'
  | 'region_id'
  | 'start'
  | 'end'
  | 'length'
  | 'tetrads'
  | 'score'
  | 'quadruplex_type';

const MOTIF_TYPE_OPTIONS: readonly Option<DownloadQuadruplexType>[] = [
  { value: 'g4', label: 'G4' },
  { value: 'i-motif', label: 'i-motif' },
];
const RELATION_CATEGORY_OPTIONS: readonly Option<DownloadGeneRelationCategory>[] = [
  { value: 'gene_inside', label: 'Inside genes' },
  { value: 'gene_upstream', label: 'Upstream of genes' },
  { value: 'gene_downstream', label: 'Downstream of genes' },
];
const FLANK_WINDOW_OPTIONS: readonly Option<number>[] = [
  { value: 0, label: '0 bp' },
  { value: 100, label: '100 bp' },
  { value: 200, label: '200 bp' },
  { value: 300, label: '300 bp' },
  { value: 500, label: '500 bp' },
  { value: 1000, label: '1 kb' },
  { value: 2000, label: '2 kb' },
  { value: 3000, label: '3 kb' },
  { value: 4000, label: '4 kb' },
  { value: 5000, label: '5 kb' },
];
const SORT_OPTIONS: readonly Option<DownloadSortField>[] = [
  { value: 'assembly_accession', label: 'Assembly accession' },
  { value: 'region_id', label: 'Region' },
  { value: 'start', label: 'Start coordinate' },
  { value: 'end', label: 'End coordinate' },
  { value: 'length', label: 'Length' },
  { value: 'tetrads', label: 'Tetrads' },
  { value: 'score', label: 'Score' },
  { value: 'quadruplex_type', label: 'Quadruplex type' },
];
const COLUMN_SELECTION_MODE_OPTIONS: readonly Option<ColumnSelectionMode>[] = [
  { value: 'default', label: 'Default columns' },
  { value: 'all', label: 'All columns' },
  { value: 'custom', label: 'Custom columns' },
];
const DOWNLOAD_MODE_OPTIONS: readonly Option<DownloadMode>[] = [
  { value: 'zip', label: 'ZIP package' },
  { value: 'tsv', label: 'Single TSV' },
];
const DATA_SCOPE_MODE_OPTIONS: readonly Option<DataScopeMode>[] = [
  { value: 'assembly_set', label: 'Selected assembly set' },
  { value: 'taxon_or_region', label: 'Taxonomy or region filters' },
  { value: 'all_records', label: 'All matching records' },
];
const INTEGER_LIST_PATTERN = /^\d+(?:[\s,]+\d+)*$/;
const NON_NEGATIVE_INTEGER_PATTERN = /^\d+$/;
const LIST_SEPARATOR_PATTERN = /[\s,]+/;

function parseNonNegativeIntegerList(rawValue: string, label: string): readonly number[] {
  const value = rawValue.trim();
  if (!value) {
    return [];
  }
  if (!INTEGER_LIST_PATTERN.test(value)) {
    throw new Error(`${label} must be a comma-separated list of non-negative integers.`);
  }
  return value.split(LIST_SEPARATOR_PATTERN).map((item) => Number(item));
}

function parseStringList(rawValue: string, label: string): readonly string[] {
  const value = rawValue.trim();
  if (!value) {
    return [];
  }
  const items = value.split(LIST_SEPARATOR_PATTERN).filter((item) => item.length > 0);
  if (!items.length) {
    throw new Error(`${label} must include at least one value.`);
  }
  return Array.from(new Set(items));
}

function parseOptionalNonNegativeInteger(rawValue: string, label: string): number | null {
  const value = rawValue.trim();
  if (!value) {
    return null;
  }
  if (!NON_NEGATIVE_INTEGER_PATTERN.test(value)) {
    throw new Error(`${label} must be a non-negative integer.`);
  }
  return Number(value);
}

function parseOptionalPositiveInteger(rawValue: string, label: string): number | null {
  const parsedValue = parseOptionalNonNegativeInteger(rawValue, label);
  if (parsedValue !== null && parsedValue < 1) {
    throw new Error(`${label} must be at least 1.`);
  }
  return parsedValue;
}

function parseOptionalFraction(rawValue: string, label: string): number | null {
  const value = rawValue.trim();
  if (!value) {
    return null;
  }
  const parsedValue = Number(value);
  if (!Number.isFinite(parsedValue) || parsedValue < 0 || parsedValue > 1) {
    throw new Error(`${label} must be a number between 0 and 1.`);
  }
  return parsedValue;
}

function assertOrderedRange(
  minimumValue: number | null,
  maximumValue: number | null,
  minimumLabel: string,
  maximumLabel: string,
): void {
  if (minimumValue !== null && maximumValue !== null && minimumValue > maximumValue) {
    throw new Error(`${minimumLabel} must be less than or equal to ${maximumLabel}.`);
  }
}

function uniqueSortedNumbers(values: readonly number[]): readonly number[] {
  return Array.from(new Set(values)).sort((left, right) => left - right);
}

function groupColumns(columns: readonly DownloadColumn[]): readonly ColumnGroup[] {
  const groups = new Map<string, DownloadColumn[]>();
  for (const column of columns) {
    const groupColumnsForCategory = groups.get(column.category) ?? [];
    groupColumnsForCategory.push(column);
    groups.set(column.category, groupColumnsForCategory);
  }
  return Array.from(groups.entries()).map(([category, categoryColumns]) => ({
    category,
    columns: categoryColumns,
  }));
}

function downloadErrorMessage(error: unknown): string {
  if (!(error instanceof HttpErrorResponse)) {
    return 'Download failed. Check the selected sources, filters, columns, and export mode.';
  }
  if (error.status === 422) {
    return 'Download request was rejected (422). Check IDs, relation filters, numeric ranges, sort field, and columns.';
  }
  if (error.status === 503) {
    return 'Download catalog or read-model data is unavailable (503). Refresh the download index before exporting.';
  }
  return `Download failed with HTTP ${error.status}.`;
}

function catalogErrorMessage(error: unknown): string {
  if (!(error instanceof HttpErrorResponse)) {
    return 'Column catalog could not be loaded.';
  }
  if (error.status === 503) {
    return 'Column catalog is unavailable (503). Install the Server with the G4Vista-Library dependency.';
  }
  return `Column catalog failed to load with HTTP ${error.status}.`;
}

function searchErrorMessage(error: unknown): string {
  if (!(error instanceof HttpErrorResponse)) {
    return 'Assembly search failed.';
  }
  return `Assembly search failed with HTTP ${error.status}.`;
}

function downloadItemFromGenomeSearch(result: GenomeSearch): AssemblyDownloadSetItem {
  return {
    assembly_accession: result.assembly_accession,
    organism_name: result.organism_name,
    asm_name: result.asm_name,
    source_taxon_id:
      result.matched_taxonomy_taxon_id ?? result.species_taxon_id ?? result.strain_taxon_id ?? null,
    source_taxon_name:
      result.matched_taxonomy_name ?? result.species_name ?? result.strain_name ?? null,
  };
}

function optionValues<T extends string | number>(options: readonly Option<T>[]): readonly T[] {
  return options.map((option) => option.value);
}

function isDownloadMode(value: unknown): value is DownloadMode {
  return optionValues(DOWNLOAD_MODE_OPTIONS).includes(value as DownloadMode);
}

function isColumnSelectionMode(value: unknown): value is ColumnSelectionMode {
  return optionValues(COLUMN_SELECTION_MODE_OPTIONS).includes(value as ColumnSelectionMode);
}

function isDataScopeMode(value: unknown): value is DataScopeMode {
  return optionValues(DATA_SCOPE_MODE_OPTIONS).includes(value as DataScopeMode);
}

function isDownloadSortField(value: unknown): value is DownloadSortField {
  return optionValues(SORT_OPTIONS).includes(value as DownloadSortField);
}

function isDownloadSortOrder(value: unknown): value is DownloadSortOrder {
  return value === 'asc' || value === 'desc';
}

@Component({
  selector: 'app-download-page',
  imports: [
    AsyncPipe,
    FormsModule,
    MatAutocompleteModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatRadioModule,
    MatSelectModule,
    ReactiveFormsModule,
    RouterLink,
  ],
  templateUrl: './download-page.html',
  styleUrl: './download-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DownloadPage {
  private readonly document = inject(DOCUMENT);
  private readonly downloadService = inject(DownloadService);
  private readonly genomeSearchService = inject(GenomeSearchService);

  readonly assemblySet = inject(AssemblyDownloadSetService);
  readonly assemblySearchControl = new FormControl<string>('', { nonNullable: true });
  readonly motifTypeOptions = MOTIF_TYPE_OPTIONS;
  readonly relationCategoryOptions = RELATION_CATEGORY_OPTIONS;
  readonly flankWindowOptions = FLANK_WINDOW_OPTIONS;
  readonly sortOptions = SORT_OPTIONS;
  readonly columnSelectionModeOptions = COLUMN_SELECTION_MODE_OPTIONS;
  readonly dataScopeModeOptions = DATA_SCOPE_MODE_OPTIONS;
  readonly downloadModeOptions = DOWNLOAD_MODE_OPTIONS;
  readonly selectedMotifTypes = signal<readonly DownloadQuadruplexType[]>(['g4', 'i-motif']);
  readonly selectedRelationCategories = signal<readonly DownloadGeneRelationCategory[]>([]);
  readonly selectedFlankWindows = signal<readonly number[]>([]);
  readonly selectedColumnIds = signal<readonly string[]>([]);
  readonly dataScopeMode = signal<DataScopeMode>('assembly_set');
  readonly allRecordsConfirmed = signal(false);
  readonly downloadMode = signal<DownloadMode>('zip');
  readonly columnSelectionMode = signal<ColumnSelectionMode>('default');
  readonly sortField = signal<DownloadSortField>('assembly_accession');
  readonly sortOrder = signal<DownloadSortOrder>('asc');
  readonly taxonIdsInput = signal('');
  readonly speciesTaxonIdsInput = signal('');
  readonly regionIdsInput = signal('');
  readonly geneIdsInput = signal('');
  readonly geneSearchTermInput = signal('');
  readonly tetradsInput = signal('');
  readonly minScoreInput = signal('');
  readonly maxScoreInput = signal('');
  readonly minOverlapBpInput = signal('');
  readonly minOverlapFractionInput = signal('');
  readonly isDownloading = signal(false);
  readonly isColumnCatalogLoading = signal(true);
  readonly columnCatalog = signal<DownloadColumnCatalog | null>(null);
  readonly errorMessage = signal('');
  readonly catalogError = signal('');
  readonly assemblySearchError = signal('');
  readonly latestAssemblySearchResults = signal<readonly GenomeSearch[]>([]);
  readonly exportableColumns = computed<readonly DownloadColumn[]>(() =>
    (this.columnCatalog()?.columns ?? []).filter((column) => column.exportable),
  );
  readonly columnGroups = computed<readonly ColumnGroup[]>(() =>
    groupColumns(this.exportableColumns()),
  );
  readonly selectedColumnCount = computed(() => {
    const mode = this.columnSelectionMode();
    if (mode === 'default') {
      return this.columnCatalog()?.default_columns.length ?? 0;
    }
    if (mode === 'all') {
      return this.columnCatalog()?.all_columns.length ?? 0;
    }
    return this.selectedColumnIds().length;
  });
  readonly hasTaxonomyOrRegionScope = computed(
    () =>
      this.taxonIdsInput().trim().length > 0 ||
      this.speciesTaxonIdsInput().trim().length > 0 ||
      this.regionIdsInput().trim().length > 0,
  );
  readonly isDataScopeValid = computed(() => {
    const mode = this.dataScopeMode();
    if (mode === 'assembly_set') {
      return this.assemblySet.count() > 0;
    }
    if (mode === 'taxon_or_region') {
      return this.hasTaxonomyOrRegionScope();
    }
    return this.allRecordsConfirmed();
  });
  readonly dataScopeProblem = computed(() => {
    const mode = this.dataScopeMode();
    if (mode === 'assembly_set' && this.assemblySet.count() === 0) {
      return 'Add at least one assembly or choose a different data scope.';
    }
    if (mode === 'taxon_or_region' && !this.hasTaxonomyOrRegionScope()) {
      return 'Enter at least one taxon, species taxon, or region ID.';
    }
    if (mode === 'all_records' && !this.allRecordsConfirmed()) {
      return 'Confirm all-record export before creating the download.';
    }
    return '';
  });
  readonly sourceScopeSummary = computed(() => {
    const mode = this.dataScopeMode();
    if (mode === 'assembly_set') {
      return this.assemblySet.count() > 0
        ? `${this.assemblySet.count()} selected assemblies`
        : 'selected assembly set is empty';
    }
    if (mode === 'all_records') {
      return 'all records matching sequence filters';
    }
    const sourceParts: string[] = [];
    if (this.taxonIdsInput().trim()) {
      sourceParts.push('taxon IDs');
    }
    if (this.speciesTaxonIdsInput().trim()) {
      sourceParts.push('species taxon IDs');
    }
    if (this.regionIdsInput().trim()) {
      sourceParts.push('region IDs');
    }
    return sourceParts.length ? sourceParts.join(', ') : 'taxonomy or region filters are empty';
  });
  readonly filterSummary = computed(() => {
    const filters: string[] = [];
    filters.push(`${this.selectedMotifTypes().length} motif type filters`);
    if (this.geneIdsInput().trim() || this.geneSearchTermInput().trim()) {
      filters.push('gene filter');
    }
    if (this.selectedRelationCategories().length > 0) {
      filters.push(`${this.selectedRelationCategories().length} relation categories`);
    }
    if (this.selectedFlankWindows().length > 0) {
      filters.push(`${this.selectedFlankWindows().length} flank windows`);
    }
    if (this.tetradsInput().trim()) {
      filters.push('tetrad filter');
    }
    if (this.minScoreInput().trim() || this.maxScoreInput().trim()) {
      filters.push('score range');
    }
    if (this.minOverlapBpInput().trim() || this.minOverlapFractionInput().trim()) {
      filters.push('overlap threshold');
    }
    return filters.join(' · ');
  });
  readonly outputSummary = computed(
    () =>
      `${this.downloadMode().toUpperCase()}, ${this.selectedColumnCount()} columns, sort by ${this.sortFieldLabel()} ${this.sortOrder()}`,
  );
  readonly sortFieldLabel = computed(
    () =>
      this.sortOptions.find((option) => option.value === this.sortField())?.label ??
      this.sortField(),
  );
  readonly canCreateDownload = computed(
    () =>
      !this.isColumnCatalogLoading() &&
      this.columnCatalog() !== null &&
      this.isDataScopeValid() &&
      this.selectedMotifTypes().length > 0 &&
      this.selectedColumnCount() > 0 &&
      !this.isDownloading(),
  );
  readonly assemblySearchResults$: Observable<readonly GenomeSearch[]> =
    this.assemblySearchControl.valueChanges.pipe(
      startWith(''),
      debounceTime(250),
      distinctUntilChanged(),
      switchMap((value) => this.searchAssemblies(value)),
      tap((results) => this.latestAssemblySearchResults.set(results)),
    );

  constructor() {
    this.downloadService
      .getColumnCatalog()
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: (catalog) => {
          this.columnCatalog.set(catalog);
          this.selectedColumnIds.set(catalog.default_columns);
          this.catalogError.set('');
          this.isColumnCatalogLoading.set(false);
        },
        error: (error: unknown) => {
          this.catalogError.set(catalogErrorMessage(error));
          this.isColumnCatalogLoading.set(false);
        },
      });
  }

  addAssemblyFromSearchResult(result: GenomeSearch): void {
    this.assemblySet.addItems([downloadItemFromGenomeSearch(result)]);
    this.assemblySearchControl.setValue('');
    this.latestAssemblySearchResults.set([]);
    this.assemblySearchError.set('');
  }

  onAssemblyOptionSelected(event: MatAutocompleteSelectedEvent): void {
    const assemblyAccession = String(event.option.value);
    const result = this.latestAssemblySearchResults().find(
      (candidate) => candidate.assembly_accession === assemblyAccession,
    );
    if (!result) {
      throw new Error(
        `Cannot add assembly because search result is missing: ${assemblyAccession}.`,
      );
    }
    this.addAssemblyFromSearchResult(result);
  }

  clearAssemblySearch(): void {
    this.assemblySearchControl.setValue('');
    this.latestAssemblySearchResults.set([]);
    this.assemblySearchError.set('');
  }

  removeAssembly(item: AssemblyDownloadSetItem): void {
    this.assemblySet.removeAccessions([item.assembly_accession]);
  }

  clearSet(): void {
    this.assemblySet.clear();
  }

  setDataScopeMode(value: unknown): void {
    if (value === undefined) {
      return;
    }
    if (!isDataScopeMode(value)) {
      throw new Error(`Unsupported data scope selected: ${String(value)}.`);
    }
    this.dataScopeMode.set(value);
    if (value !== 'all_records') {
      this.allRecordsConfirmed.set(false);
    }
  }

  setAllRecordsConfirmed(event: MatCheckboxChange): void {
    this.allRecordsConfirmed.set(event.checked);
  }

  setDownloadMode(value: unknown): void {
    if (value === undefined) {
      return;
    }
    if (!isDownloadMode(value)) {
      throw new Error(`Unsupported download mode selected: ${String(value)}.`);
    }
    this.downloadMode.set(value);
  }

  setColumnSelectionMode(value: unknown): void {
    if (value === undefined) {
      return;
    }
    if (!isColumnSelectionMode(value)) {
      throw new Error(`Unsupported column selection mode selected: ${String(value)}.`);
    }
    this.columnSelectionMode.set(value);
    const catalog = this.columnCatalog();
    if (catalog === null) {
      return;
    }
    if (value === 'default') {
      this.selectedColumnIds.set(catalog.default_columns);
    }
    if (value === 'all') {
      this.selectedColumnIds.set(catalog.all_columns);
    }
  }

  setSortField(value: unknown): void {
    if (value === undefined) {
      return;
    }
    if (!isDownloadSortField(value)) {
      throw new Error(`Unsupported download sort field selected: ${String(value)}.`);
    }
    this.sortField.set(value);
  }

  setSortOrder(value: unknown): void {
    if (value === undefined) {
      return;
    }
    if (!isDownloadSortOrder(value)) {
      throw new Error(`Unsupported download sort order selected: ${String(value)}.`);
    }
    this.sortOrder.set(value);
  }

  toggleMotifType(value: DownloadQuadruplexType, event: MatCheckboxChange): void {
    this.selectedMotifTypes.set(
      this.toggledValues(this.selectedMotifTypes(), value, event.checked),
    );
  }

  toggleRelationCategory(value: DownloadGeneRelationCategory, event: MatCheckboxChange): void {
    this.selectedRelationCategories.set(
      this.toggledValues(this.selectedRelationCategories(), value, event.checked),
    );
  }

  toggleFlankWindow(value: number, event: MatCheckboxChange): void {
    this.selectedFlankWindows.set(
      uniqueSortedNumbers(this.toggledValues(this.selectedFlankWindows(), value, event.checked)),
    );
  }

  toggleColumn(columnId: string, event: MatCheckboxChange): void {
    this.columnSelectionMode.set('custom');
    this.selectedColumnIds.set(
      this.toggledValues(this.selectedColumnIds(), columnId, event.checked),
    );
  }

  isMotifTypeSelected(value: DownloadQuadruplexType): boolean {
    return this.selectedMotifTypes().includes(value);
  }

  isRelationCategorySelected(value: DownloadGeneRelationCategory): boolean {
    return this.selectedRelationCategories().includes(value);
  }

  isFlankWindowSelected(value: number): boolean {
    return this.selectedFlankWindows().includes(value);
  }

  isColumnSelected(columnId: string): boolean {
    return this.selectedColumnIds().includes(columnId);
  }

  createDownload(): void {
    if (!this.canCreateDownload()) {
      throw new Error(
        'Cannot create a download until the data scope, column catalog, motif types, and columns are selected.',
      );
    }

    let request: DownloadRequest;
    try {
      request = this.createDownloadRequest();
    } catch (error) {
      this.errorMessage.set(
        error instanceof Error ? error.message : 'Download filters are invalid.',
      );
      return;
    }

    this.errorMessage.set('');
    this.isDownloading.set(true);
    this.downloadService
      .createDownload(request)
      .pipe(finalize(() => this.isDownloading.set(false)))
      .subscribe({
        next: (download) => this.saveBlob(download.blob, download.filename),
        error: (error: unknown) => this.errorMessage.set(downloadErrorMessage(error)),
      });
  }

  private searchAssemblies(rawQuery: string): Observable<readonly GenomeSearch[]> {
    const query = rawQuery.trim();
    if (!query) {
      this.assemblySearchError.set('');
      return of([]);
    }
    return this.genomeSearchService.searchGenome(query).pipe(
      tap(() => this.assemblySearchError.set('')),
      catchError((error: unknown) => {
        this.assemblySearchError.set(searchErrorMessage(error));
        return of([]);
      }),
    );
  }

  private createDownloadRequest(): DownloadRequest {
    const minScore = parseOptionalNonNegativeInteger(this.minScoreInput(), 'Minimum score');
    const maxScore = parseOptionalNonNegativeInteger(this.maxScoreInput(), 'Maximum score');
    assertOrderedRange(minScore, maxScore, 'Minimum score', 'maximum score');
    const mode = this.dataScopeMode();

    return {
      mode: this.downloadMode(),
      columns: this.createColumnSelection(),
      filters: {
        assembly_accessions: mode === 'assembly_set' ? this.assemblySet.accessions() : [],
        taxon_ids:
          mode === 'taxon_or_region'
            ? parseNonNegativeIntegerList(this.taxonIdsInput(), 'Taxon IDs')
            : [],
        species_taxon_ids:
          mode === 'taxon_or_region'
            ? parseNonNegativeIntegerList(this.speciesTaxonIdsInput(), 'Species taxon IDs')
            : [],
        region_ids:
          mode === 'taxon_or_region'
            ? parseStringList(this.regionIdsInput(), 'Region IDs')
            : [],
        quadruplex_types: this.selectedMotifTypes(),
        gene_ids: parseStringList(this.geneIdsInput(), 'Gene IDs'),
        gene_search_term: this.geneSearchTermInput().trim() || null,
        relation_categories: this.selectedRelationCategories(),
        flank_windows: this.selectedFlankWindows(),
        min_overlap_bp: parseOptionalPositiveInteger(
          this.minOverlapBpInput(),
          'Minimum overlap bp',
        ),
        min_overlap_fraction: parseOptionalFraction(
          this.minOverlapFractionInput(),
          'Minimum overlap fraction',
        ),
        tetrads: parseNonNegativeIntegerList(this.tetradsInput(), 'Tetrads'),
        min_score: minScore,
        max_score: maxScore,
      },
      sort: this.sortField(),
      order: this.sortOrder(),
    };
  }

  private createColumnSelection(): DownloadColumnSelection {
    const mode = this.columnSelectionMode();
    if (mode === 'default' || mode === 'all') {
      return mode;
    }
    return this.selectedColumnIds();
  }

  private toggledValues<T extends string | number>(
    values: readonly T[],
    value: T,
    checked: boolean,
  ): readonly T[] {
    if (checked) {
      return values.includes(value) ? values : [...values, value];
    }
    return values.filter((item) => item !== value);
  }

  private saveBlob(blob: Blob, filename: string): void {
    const view = this.document.defaultView;
    if (!view) {
      throw new Error('Cannot save download because the browser window is unavailable.');
    }
    const body = this.document.body;
    if (!body) {
      throw new Error('Cannot save download because the document body is unavailable.');
    }
    const objectUrl = view.URL.createObjectURL(blob);
    const link = this.document.createElement('a');
    link.href = objectUrl;
    link.download = filename;

    try {
      body.appendChild(link);
      link.click();
    } finally {
      link.remove();
      view.URL.revokeObjectURL(objectUrl);
    }
  }
}
