import { AsyncPipe } from '@angular/common';
import {
  MatAutocompleteModule,
  MatAutocompleteSelectedEvent,
} from '@angular/material/autocomplete';
import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import {
  debounceTime,
  defer,
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
    asm_name: 'ASM369716v2',
    assembly_accession: 'GCA_003697165.2',
    organism_name: 'Escherichia coli DSM 30083 = JCM 1649 = ATCC 11775',
  },
];

function compactGenomeContext(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function taxonomyContextLabel(match: GenomeSearch): string | null {
  const taxonomyName = compactGenomeContext(match.matched_taxonomy_name);
  if (!taxonomyName) {
    return null;
  }
  const rank = compactGenomeContext(match.matched_taxonomy_rank);
  return rank ? `${rank}: ${taxonomyName}` : taxonomyName;
}

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
  private readonly routeQuery = toSignal(
    this.route.queryParamMap.pipe(map((params) => queryFromParamMap(params))),
    { initialValue: '' },
  );
  readonly filter_result$: Observable<GenomeSearch[]> = defer(() =>
    this.searchControl.valueChanges.pipe(
      startWith(this.searchControl.value),
      debounceTime(300),
      distinctUntilChanged(),
      switchMap((value) => {
        const query = value.trim();
        return query ? this._filter(query) : of(Array.from(this.options));
      }),
    ),
  );

  constructor() {
    effect(() => {
      const query = this.routeQuery();
      if (this.searchControl.value !== query) {
        this.searchControl.setValue(query);
      }
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
    void this.router.navigate(['/genome']);
  }

  onOptionSelected(event: MatAutocompleteSelectedEvent): void {
    const assemblyAccession = String(event.option.value);
    void this.router.navigate(['/genome', assemblyAccession]);
  }

  submitSearch(event: Event): void {
    event.preventDefault();
  }

  optionContextLabels(match: GenomeSearch): readonly string[] {
    const labels: string[] = [];
    const speciesName = compactGenomeContext(match.species_name);
    const strainName = compactGenomeContext(match.strain_name);
    const taxonomyLabel = taxonomyContextLabel(match);

    if (speciesName && speciesName !== match.organism_name) {
      labels.push(`Species: ${speciesName}`);
    }
    if (strainName) {
      labels.push(`Strain: ${strainName}`);
    }
    if (taxonomyLabel && taxonomyLabel !== speciesName && taxonomyLabel !== strainName) {
      labels.push(`Matched taxonomy: ${taxonomyLabel}`);
    }
    return labels;
  }
}
