import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatInputModule } from '@angular/material/input';
import {
  MatAutocompleteModule,
  MatAutocompleteSelectedEvent,
} from '@angular/material/autocomplete';
import { MatIconModule } from '@angular/material/icon';
import { AsyncPipe } from '@angular/common';
import { debounceTime, distinctUntilChanged, Observable, of, startWith, switchMap } from 'rxjs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { GenomeSearch, GenomeSearchService } from '../../../services/genome-search.service';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

const EXAMPLE_DATA: GenomeSearch[] = [
  { asm_name: 'GRCh38.p14', assembly_accession: 'GCF_000001405.40', organism_name: 'Homo sapiens' },
  {
    asm_name: 'TAIR10.1',
    assembly_accession: 'GCF_000001735.4',
    organism_name: 'Arabidopsis thaliana',
  },
];

@Component({
  selector: 'app-search-bar',
  imports: [
    MatInputModule,
    MatAutocompleteModule,
    MatIconModule,
    AsyncPipe,
    MatFormFieldModule,
    ReactiveFormsModule,
    RouterLink,
  ],
  templateUrl: './search-bar.component.html',
  styleUrl: './search-bar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchBarComponent {
  readonly searchControl = new FormControl<string | GenomeSearch>('');
  readonly options: GenomeSearch[] = EXAMPLE_DATA;
  readonly filter_result$: Observable<GenomeSearch[]> = this.searchControl.valueChanges.pipe(
    startWith(''),
    debounceTime(300),
    distinctUntilChanged(),
    switchMap((value) => {
      const query = typeof value === 'string' ? value.trim() : value?.organism_name;
      return query ? this._filter(query) : of(this.options.slice());
    }),
  );

  private readonly genomeService = inject(GenomeSearchService);
  private readonly router = inject(Router);

  private _filter(name: string): Observable<GenomeSearch[]> {
    const filterValue = name.toLowerCase();
    return this.genomeService.searchGenome(filterValue);
  }

  onClick(event: MatAutocompleteSelectedEvent): void {
    void this.router.navigate(['/genome', event.option.value]);
  }
}
