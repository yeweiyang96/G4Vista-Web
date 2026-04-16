import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { of } from 'rxjs';
import { G4_GENE_POSITION_OPTIONS } from '../../../genome/services/g4.service';
import { GeneDetail, GeneService } from '../../services/gene.service';

interface GeneRelationSummary {
  key: string;
  label: string;
  count: number;
}

const GENE_DETAIL_POSITION_FIELDS = [
  { key: 'insideOf_gene_normal', field: 'insideOf_gene_normal' },
  { key: 'insideOf_genes_upstream_1k_normal', field: 'insideOf_genes_upstream_1k_normal' },
  { key: 'insideOf_genes_upstream_2k_normal', field: 'insideOf_genes_upstream_2k_normal' },
  { key: 'insideOf_genes_upstream_3k_normal', field: 'insideOf_genes_upstream_3k_normal' },
  { key: 'insideOf_genes_upstream_4k_normal', field: 'insideOf_genes_upstream_4k_normal' },
  { key: 'insideOf_genes_upstream_5k_normal', field: 'insideOf_genes_upstream_5k_normal' },
  { key: 'insideOf_genes_downstream_1k_normal', field: 'insideOf_genes_downstream_1k_normal' },
  { key: 'insideOf_genes_downstream_2k_normal', field: 'insideOf_genes_downstream_2k_normal' },
  { key: 'insideOf_genes_downstream_3k_normal', field: 'insideOf_genes_downstream_3k_normal' },
  { key: 'insideOf_genes_downstream_4k_normal', field: 'insideOf_genes_downstream_4k_normal' },
  { key: 'insideOf_genes_downstream_5k_normal', field: 'insideOf_genes_downstream_5k_normal' },
  { key: 'insideOf_gene_revcomp', field: 'insideOf_gene_revcomp' },
  { key: 'insideOf_genes_upstream_1k_revcomp', field: 'insideOf_genes_upstream_1k_revcomp' },
  { key: 'insideOf_genes_upstream_2k_revcomp', field: 'insideOf_genes_upstream_2k_revcomp' },
  { key: 'insideOf_genes_upstream_3k_revcomp', field: 'insideOf_genes_upstream_3k_revcomp' },
  { key: 'insideOf_genes_upstream_4k_revcomp', field: 'insideOf_genes_upstream_4k_revcomp' },
  { key: 'insideOf_genes_upstream_5k_revcomp', field: 'insideOf_genes_upstream_5k_revcomp' },
  { key: 'insideOf_genes_downstream_1k_revcomp', field: 'insideOf_genes_downstream_1k_revcomp' },
  { key: 'insideOf_genes_downstream_2k_revcomp', field: 'insideOf_genes_downstream_2k_revcomp' },
  { key: 'insideOf_genes_downstream_3k_revcomp', field: 'insideOf_genes_downstream_3k_revcomp' },
  { key: 'insideOf_genes_downstream_4k_revcomp', field: 'insideOf_genes_downstream_4k_revcomp' },
  { key: 'insideOf_genes_downstream_5k_revcomp', field: 'insideOf_genes_downstream_5k_revcomp' },
] as const satisfies readonly {
  key: (typeof G4_GENE_POSITION_OPTIONS)[number]['value'];
  field: keyof GeneDetail;
}[];

@Component({
  selector: 'app-gene-info',
  imports: [MatCardModule, MatChipsModule, MatDividerModule, MatProgressSpinnerModule, RouterLink],
  templateUrl: './gene-info.component.html',
  styleUrl: './gene-info.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GeneInfoComponent {
  readonly assemblyAccession = input.required<string>();
  readonly seqid = input.required<string>();
  readonly featureId = input.required<string>();

  private readonly geneService = inject(GeneService);
  readonly geneResource = rxResource<
    GeneDetail | undefined,
    { assemblyAccession: string; seqid: string; featureId: string }
  >({
    params: () => ({
      assemblyAccession: this.assemblyAccession(),
      seqid: this.seqid(),
      featureId: this.featureId(),
    }),
    stream: ({ params }) =>
      params
        ? this.geneService.getGene(params.assemblyAccession, params.seqid, params.featureId)
        : of<GeneDetail | undefined>(undefined),
  });

  readonly geneDetail = computed<GeneDetail | undefined>(() => {
    const gene = this.geneResource.value();
    return gene?.feature_id === this.featureId() ? gene : undefined;
  });
  readonly relationSummaries = computed<GeneRelationSummary[]>(() => {
    const gene = this.geneDetail();
    if (!gene) {
      return [];
    }

    return GENE_DETAIL_POSITION_FIELDS.flatMap((item) => {
      const count = gene[item.field].length;
      if (!count) {
        return [];
      }
      const label =
        G4_GENE_POSITION_OPTIONS.find((option) => option.value === item.key)?.label ?? item.key;
      return [{ key: item.key, label, count }];
    });
  });
  readonly relatedStartCount = computed(() => {
    const gene = this.geneDetail();
    if (!gene) {
      return 0;
    }

    const starts = new Set<number>();
    for (const { field } of GENE_DETAIL_POSITION_FIELDS) {
      for (const start of gene[field]) {
        starts.add(start);
      }
    }
    return starts.size;
  });
}
