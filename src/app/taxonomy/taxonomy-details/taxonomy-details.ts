import { AsyncPipe } from '@angular/common';
import { Observable } from 'rxjs';
import { ChangeDetectionStrategy, Component, inject, Input, OnInit } from '@angular/core';
import { Taxonomy, TaxonomyService } from '../taxonomy.service';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { TaxonomyNode } from '../taxonomy.service';

import { MatTooltipModule } from '@angular/material/tooltip';
import { GenomeListComponent } from './genome-list/genome-list.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-taxonomy-details',
  imports: [
    MatProgressSpinnerModule,
    MatGridListModule,
    MatCardModule,
    MatButtonModule,
    MatListModule,
    MatTooltipModule,
    AsyncPipe,
    GenomeListComponent,
  ],
  templateUrl: './taxonomy-details.html',
  styleUrl: './taxonomy-details.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaxonomyDetails implements OnInit {
  @Input()
  taxon_id!: number;
  taxonomy$!: Observable<Taxonomy>;
  lineage: [TaxonomyNode] = [{ name: 'root', rank: 'no rank', taxon_id: 1 }];
  hasTemp = true;
  hasG4 = true;

  private readonly taxonomyService = inject(TaxonomyService);

  ngOnInit(): void {
    this.fetchTaxonomyData();
  }

  fetchTaxonomyData(): void {
    this.taxonomy$ = this.taxonomyService.getTaxonomyData(this.taxon_id);
  }
}
