import { AsyncPipe } from '@angular/common';
import {
  MatAutocompleteModule,
  MatAutocompleteSelectedEvent,
} from '@angular/material/autocomplete';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { Router } from '@angular/router';
import { debounceTime, distinctUntilChanged, Observable, of, startWith, switchMap } from 'rxjs';
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
  private readonly router = inject(Router);

  readonly searchControl = new FormControl<string>('', { nonNullable: true });
  readonly options: readonly GenomeSearch[] = EXAMPLE_DATA;
  readonly autocompleteOpen = signal(false);
  readonly filter_result$: Observable<GenomeSearch[]> = this.searchControl.valueChanges.pipe(
    startWith(''),
    debounceTime(300),
    distinctUntilChanged(),
    switchMap((value) => {
      const query = value.trim();
      return query ? this._filter(query) : of(Array.from(this.options));
    }),
  );

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
