import { Component, signal, ChangeDetectionStrategy, inject, OnInit } from '@angular/core';

import { RouterLink } from '@angular/router';
import { TaxonomyService } from '../taxonomy.service';

interface TaxonomyStats {
  category: string;
  taxon_id: number;
  genomeCount: number;
}

// 分类名称到 taxon_id 的映射
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

@Component({
  selector: 'app-taxonomy-statistics',
  imports: [RouterLink],
  templateUrl: './taxonomy-statistics.component.html',
  styleUrl: './taxonomy-statistics.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaxonomyStatisticsComponent implements OnInit {
  private readonly taxonomyService = inject(TaxonomyService);

  readonly taxonomyStats = signal<TaxonomyStats[]>(
    TAXONOMY_CATEGORIES.map(({ category, taxon_id }) => ({
      category,
      taxon_id,
      genomeCount: 0,
    })),
  );

  ngOnInit() {
    this.loadGenomeCounts();
  }

  private loadGenomeCounts() {
    const taxon_ids = TAXONOMY_CATEGORIES.map(({ taxon_id }) => taxon_id);

    this.taxonomyService.getGenomeCounts(taxon_ids).subscribe({
      next: (counts) => {
        const countMap = new Map(counts.map((c) => [c.taxon_id, c.genome_count]));

        this.taxonomyStats.set(
          TAXONOMY_CATEGORIES.map(({ category, taxon_id }) => ({
            category,
            taxon_id,
            genomeCount: countMap.get(taxon_id) || 0,
          })),
        );
      },
      error: (err) => {
        console.error('Failed to load genome counts:', err);
      },
    });
  }
}
