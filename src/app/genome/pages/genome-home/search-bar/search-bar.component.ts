import { AsyncPipe } from '@angular/common';
import {
  MatAutocompleteModule,
  MatAutocompleteSelectedEvent,
} from '@angular/material/autocomplete';
import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, ParamMap, Router, RouterLink } from '@angular/router';
import {
  debounceTime,
  distinctUntilChanged,
  map,
  Observable,
  of,
  startWith,
  switchMap,
} from 'rxjs';
import { GenomeSearch, GenomeSearchService } from '../../../services/genome-search.service';

const EXAMPLE_DATA: GenomeSearch[] = [
  {
    asm_name: 'TAIR10.1',
    assembly_accession: 'GCF_000001735.4',
    organism_name: 'Arabidopsis thaliana',
  },
  { asm_name: 'GRCh38.p14', assembly_accession: 'GCF_000001405.40', organism_name: 'Homo sapiens' },
  {
    asm_name: 'ASM584v2',
    assembly_accession: 'GCF_000005845.2',
    organism_name: 'Escherichia coli K-12',
  },
];

function queryFromParamMap(params: ParamMap): string {
  return (params.get('query') ?? '').trim();
}

@Component({
  selector: 'app-search-bar',
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
  templateUrl: './search-bar.component.html',
  styleUrl: './search-bar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchBarComponent {
  private readonly genomeService = inject(GenomeSearchService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly searchControl = new FormControl<string>('', { nonNullable: true });
  readonly options: readonly GenomeSearch[] = EXAMPLE_DATA;
  readonly autocompleteOpen = signal(false);
  readonly submittedQuery = signal('');
  private readonly routeQuery = toSignal(
    this.route.queryParamMap.pipe(map((params) => queryFromParamMap(params))),
    { initialValue: '' },
  );
  readonly filter_result$: Observable<GenomeSearch[]> = this.searchControl.valueChanges.pipe(
    startWith(''),
    debounceTime(300),
    distinctUntilChanged(),
    switchMap((value) => {
      const query = value.trim();
      return query ? this._filter(query) : of(Array.from(this.options));
    }),
  );
  readonly searchResultsResource = rxResource<GenomeSearch[], string>({
    params: () => this.submittedQuery(),
    stream: ({ params }) => (params ? this.genomeService.searchGenome(params) : of([])),
    defaultValue: [],
  });

  constructor() {
    effect(() => {
      const query = this.routeQuery();
      if (this.searchControl.value !== query) {
        this.searchControl.setValue(query, { emitEvent: false });
      }
      this.submittedQuery.set(query);
    });
  }

  private _filter(name: string): Observable<GenomeSearch[]> {
    const filterValue = name.toLowerCase();
    return this.genomeService.searchGenome(filterValue);
  }

  setAutocompleteOpen(isOpen: boolean): void {
    this.autocompleteOpen.set(isOpen);
  }

  clearSearch(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.searchControl.setValue('');
    this.submittedQuery.set('');
    void this.router.navigate(['/genome']);
  }

  onOptionSelected(event: MatAutocompleteSelectedEvent): void {
    const assemblyAccession = String(event.option.value);
    void this.router.navigate(['/genome', assemblyAccession]);
  }

  submitSearch(event: Event): void {
    event.preventDefault();

    const query = this.searchControl.value.trim();
    if (!query) {
      return;
    }

    void this.router.navigate(['/genome'], { queryParams: { query } });
  }
}
