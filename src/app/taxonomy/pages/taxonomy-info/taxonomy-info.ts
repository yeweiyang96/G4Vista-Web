import { computed } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { ChangeDetectionStrategy, Component, inject, input, numberAttribute } from '@angular/core';
import { Taxonomy, TaxonomyService } from '../../services/taxonomy.service';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { TaxonomyNode } from '../../services/taxonomy.service';

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
    AssemblyListComponent,
    RouterLink,
  ],
  templateUrl: './taxonomy-info.html',
  styleUrl: './taxonomy-info.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaxonomyInfoComponent {
  readonly taxonId = input.required<number, string>({ transform: numberAttribute });
  readonly taxonomyResource = rxResource<Taxonomy, number>({
    params: () => this.taxonId(),
    stream: ({ params }) => this.taxonomyService.getTaxonomyData(params),
  });
  readonly taxonomy = computed<Taxonomy | undefined>(() => {
    const current = this.taxonomyResource.value();
    return current?.taxon_id === this.taxonId() ? current : undefined;
  });
  lineage: [TaxonomyNode] = [{ name: 'root', rank: 'no rank', taxon_id: 1 }];
  hasTemp = true;
  hasG4 = true;

  private readonly taxonomyService = inject(TaxonomyService);
}
