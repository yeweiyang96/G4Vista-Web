import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';

import { RouterLink } from '@angular/router';
import { AssemblyCount, TaxonomyService } from '../../../services/taxonomy.service';

interface TaxonomyStats {
  category: string;
  taxon_id: number;
  assemblyCount: number;
}

const TAXONOMY_CATEGORIES: { category: string; taxon_id: number }[] = [
  { category: 'Archaea', taxon_id: 2157 },
  { category: 'Bacteria', taxon_id: 2 },
  { category: 'Fungi', taxon_id: 4751 },
  { category: 'Arthropoda', taxon_id: 6656 },
  { category: 'Embryophyta', taxon_id: 3193 },
  { category: 'Eukaryota', taxon_id: 2759 },
  { category: 'Mammalia', taxon_id: 40674 },
  { category: 'Vertebrata', taxon_id: 7742 },
  { category: 'Viruses', taxon_id: 10239 },
];
const TAXON_IDS = TAXONOMY_CATEGORIES.map(({ taxon_id }) => taxon_id);

@Component({
  selector: 'app-taxonomy-statistics',
  imports: [RouterLink],
  templateUrl: './taxonomy-statistics.component.html',
  styleUrl: './taxonomy-statistics.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaxonomyStatisticsComponent {
  private readonly taxonomyService = inject(TaxonomyService);
  private readonly assemblyCounts = toSignal(
    this.taxonomyService.getAssemblyCounts(TAXON_IDS).pipe(
      catchError((error) => {
        console.error('Failed to load assembly counts:', error);
        return of([] as AssemblyCount[]);
      }),
    ),
    { initialValue: [] as AssemblyCount[] },
  );

  readonly taxonomyStats = computed<TaxonomyStats[]>(() => {
    const countMap = new Map(
      this.assemblyCounts().map((count) => [count.taxon_id, count.assembly_count]),
    );

    return TAXONOMY_CATEGORIES.map(({ category, taxon_id }) => ({
      category,
      taxon_id,
      assemblyCount: countMap.get(taxon_id) ?? 0,
    }));
  });
}
