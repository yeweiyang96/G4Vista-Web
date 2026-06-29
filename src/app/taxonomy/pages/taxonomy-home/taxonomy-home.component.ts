import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import {
  MatAutocompleteModule,
  MatAutocompleteSelectedEvent,
} from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, ParamMap, Router, RouterLink } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import {
  debounceTime,
  distinctUntilChanged,
  map,
  Observable,
  of,
  startWith,
  switchMap,
  tap,
} from 'rxjs';
import { AssemblyCount, TaxonomySearch, TaxonomyService } from '../../services/taxonomy.service';

interface BrowseTaxon {
  readonly name: string;
  readonly taxonId: number;
  readonly rank: string;
  readonly description: string;
  readonly icon: string;
  readonly accentClass: string;
}

interface BrowseTaxonView extends BrowseTaxon {
  readonly assemblyCount: number | undefined;
}

const COUNT_FORMATTER = new Intl.NumberFormat('en-US');
const SEARCH_DEBOUNCE_MS = 250;
const NUMERIC_TAXON_ID_PATTERN = /^\d+$/;
const BROWSE_TAXA: readonly BrowseTaxon[] = [
  {
    name: 'Eukaryota',
    taxonId: 2759,
    rank: 'superkingdom',
    description: 'Animals, plants, fungi, and other eukaryotic organisms.',
    icon: 'public',
    accentClass: 'browse-card-eukaryota',
  },
  {
    name: 'Viridiplantae',
    taxonId: 33090,
    rank: 'kingdom',
    description: 'Green plants, including major model organisms.',
    icon: 'eco',
    accentClass: 'browse-card-plant',
  },
  {
    name: 'Metazoa',
    taxonId: 33208,
    rank: 'kingdom',
    description: 'Animal lineages and their available genome assemblies.',
    icon: 'pets',
    accentClass: 'browse-card-metazoa',
  },
  {
    name: 'Bacteria',
    taxonId: 2,
    rank: 'superkingdom',
    description: 'Bacterial genomes with predicted G4 and i-motif data.',
    icon: 'hub',
    accentClass: 'browse-card-bacteria',
  },
  {
    name: 'Archaea',
    taxonId: 2157,
    rank: 'superkingdom',
    description: 'Archaeal taxa and their available genome assemblies.',
    icon: 'grain',
    accentClass: 'browse-card-archaea',
  },
];
const BROWSE_TAXON_IDS = BROWSE_TAXA.map((taxon) => taxon.taxonId);

function normalizeSearchValue(value: string | TaxonomySearch | null): string {
  if (typeof value === 'string') {
    return value.trim();
  }

  return value?.scientific_name.trim() ?? '';
}

function queryFromParamMap(params: ParamMap): string {
  return (params.get('query') ?? '').trim();
}

function formatNameClass(nameClass: string): string {
  return nameClass.replaceAll('_', ' ');
}

function getTaxonomyResultDescription(option: TaxonomySearch): string {
  const scientificName = option.scientific_name || option.name;
  if (option.name !== scientificName) {
    return option.name;
  }

  return formatNameClass(option.name_class);
}

function assemblyCountMapFromResponse(
  counts: readonly AssemblyCount[],
): ReadonlyMap<number, number> {
  const countByTaxonId = new Map<number, number>();
  counts.forEach((count) => countByTaxonId.set(count.taxon_id, count.assembly_count));
  return countByTaxonId;
}

@Component({
  selector: 'app-taxonomy',
  imports: [
    AsyncPipe,
    MatAutocompleteModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    ReactiveFormsModule,
    RouterLink,
  ],
  templateUrl: './taxonomy-home.component.html',
  styleUrl: './taxonomy-home.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaxonomyHomeComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly taxonomyService = inject(TaxonomyService);

  readonly searchControl = new FormControl<string | TaxonomySearch>('');
  readonly searchText = signal('');
  readonly autocompleteOpen = signal(false);
  readonly searchResults = signal<readonly TaxonomySearch[]>([]);
  readonly submittedQuery = signal('');
  private readonly routeQuery = toSignal(
    this.route.queryParamMap.pipe(map((params) => queryFromParamMap(params))),
    { initialValue: '' },
  );
  readonly browseCountsResource = rxResource<ReadonlyMap<number, number>, readonly number[]>({
    params: () => BROWSE_TAXON_IDS,
    stream: ({ params }) =>
      this.taxonomyService.getAssemblyCounts([...params]).pipe(map(assemblyCountMapFromResponse)),
    defaultValue: new Map<number, number>(),
  });
  readonly submittedSearchResource = rxResource<readonly TaxonomySearch[], string>({
    params: () => this.submittedQuery(),
    stream: ({ params }) =>
      params.length > 0 ? this.taxonomyService.searchTaxonomy(params) : of([]),
    defaultValue: [],
  });
  readonly browseTaxa = computed<readonly BrowseTaxonView[]>(() => {
    const countByTaxonId = this.browseCountsResource.value();
    return BROWSE_TAXA.map((taxon) => ({
      ...taxon,
      assemblyCount: countByTaxonId.get(taxon.taxonId),
    }));
  });
  readonly filteredOptions$: Observable<readonly TaxonomySearch[]> =
    this.searchControl.valueChanges.pipe(
      startWith(''),
      debounceTime(SEARCH_DEBOUNCE_MS),
      map((value) => normalizeSearchValue(value)),
      distinctUntilChanged(),
      switchMap((searchTerm) =>
        searchTerm.length > 0 ? this.taxonomyService.searchTaxonomy(searchTerm) : of([]),
      ),
      tap((options) => this.searchResults.set(options)),
    );

  constructor() {
    effect(() => {
      const query = this.routeQuery();
      if (this.searchControl.value !== query) {
        this.searchControl.setValue(query, { emitEvent: false });
      }
      this.searchText.set(query);
      this.submittedQuery.set(query);
      if (!query) {
        this.searchResults.set([]);
      }
    });
  }

  displayFn(taxon: string | TaxonomySearch | null): string {
    if (typeof taxon === 'string') {
      return taxon;
    }

    return taxon?.scientific_name ?? '';
  }

  onSearchInput(event: Event): void {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) {
      throw new TypeError('Expected taxonomy search input event target to be an HTMLInputElement.');
    }

    this.searchText.set(target.value);
  }

  clearSearch(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.searchText.set('');
    this.searchResults.set([]);
    this.submittedQuery.set('');
    this.searchControl.setValue('');
    void this.router.navigate(['/taxonomy']);
  }

  setAutocompleteOpen(isOpen: boolean): void {
    this.autocompleteOpen.set(isOpen);
  }

  selectTaxon(event: MatAutocompleteSelectedEvent): void {
    const selectedTaxon = event.option.value as TaxonomySearch;
    this.searchText.set(selectedTaxon.scientific_name);
    this.searchControl.setValue(selectedTaxon, { emitEvent: false });
    void this.openTaxon(selectedTaxon.taxon_id);
  }

  submitSearch(): void {
    const value = this.searchControl.value;
    if (value !== null && typeof value !== 'string') {
      void this.openTaxon(value.taxon_id);
      return;
    }

    const searchTerm = this.searchText().trim();
    if (NUMERIC_TAXON_ID_PATTERN.test(searchTerm)) {
      void this.openTaxon(Number(searchTerm));
      return;
    }

    const firstResult = this.searchResults()[0];
    if (firstResult) {
      this.searchText.set(firstResult.scientific_name);
      this.searchControl.setValue(firstResult, { emitEvent: false });
      void this.openTaxon(firstResult.taxon_id);
    }
  }

  canSubmitSearch(): boolean {
    const value = this.searchControl.value;
    return (value !== null && typeof value !== 'string') || this.searchText().trim().length > 0;
  }

  resultDescription(option: TaxonomySearch): string {
    return getTaxonomyResultDescription(option);
  }

  formatCount(value: number | undefined): string {
    return value === undefined ? 'Not available' : COUNT_FORMATTER.format(value);
  }

  private openTaxon(taxonId: number): Promise<boolean> {
    return this.router.navigate(['/taxonomy', taxonId]);
  }
}
