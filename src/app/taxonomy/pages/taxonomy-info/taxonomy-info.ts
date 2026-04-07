import { AsyncPipe } from '@angular/common';
import { Observable } from 'rxjs';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  numberAttribute,
  OnInit,
} from '@angular/core';
import { Taxonomy, TaxonomyService } from '../../service/taxonomy.service';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { TaxonomyNode } from '../../service/taxonomy.service';

import { MatTooltipModule } from '@angular/material/tooltip';
import { AssemblyListComponent } from './genome-list/genome-list.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-taxonomy-info',
  imports: [
    MatProgressSpinnerModule,
    MatGridListModule,
    MatCardModule,
    MatButtonModule,
    MatListModule,
    MatTooltipModule,
    AsyncPipe,
    AssemblyListComponent,
    RouterLink,
  ],
  templateUrl: './taxonomy-info.html',
  styleUrl: './taxonomy-info.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaxonomyInfoComponent implements OnInit {
  readonly taxonId = input.required<number, string>({ transform: numberAttribute });
  taxonomy$!: Observable<Taxonomy>;
  lineage: [TaxonomyNode] = [{ name: 'root', rank: 'no rank', taxon_id: 1 }];
  hasTemp = true;
  hasG4 = true;

  private readonly taxonomyService = inject(TaxonomyService);

  ngOnInit(): void {
    this.fetchTaxonomyData();
  }

  fetchTaxonomyData(): void {
    this.taxonomy$ = this.taxonomyService.getTaxonomyData(this.taxonId());
  }
}
