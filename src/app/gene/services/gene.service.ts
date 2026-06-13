import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

export interface GeneDetail {
  assembly_accession: string;
  seqid: string;
  source: string | null;
  feature: string | null;
  feature_start: number | null;
  feature_end: number | null;
  strand: string | null;
  phase: number | null;
  feature_id: string | null;
  gene_name: string | null;
  gene_id: string | null;
  parent_id: string | null;
  locus_tag: string | null;
  description: string | null;
  gene_biotype: string | null;
  feature_key: string;
  insideOf_gene_g4: number[];
  insideOf_genes_upstream_100bp_g4: number[];
  insideOf_genes_downstream_100bp_g4: number[];
  insideOf_genes_upstream_200bp_g4: number[];
  insideOf_genes_downstream_200bp_g4: number[];
  insideOf_genes_upstream_300bp_g4: number[];
  insideOf_genes_downstream_300bp_g4: number[];
  insideOf_genes_upstream_500bp_g4: number[];
  insideOf_genes_downstream_500bp_g4: number[];
  insideOf_genes_upstream_1k_g4: number[];
  insideOf_genes_upstream_2k_g4: number[];
  insideOf_genes_upstream_3k_g4: number[];
  insideOf_genes_upstream_4k_g4: number[];
  insideOf_genes_upstream_5k_g4: number[];
  insideOf_genes_downstream_1k_g4: number[];
  insideOf_genes_downstream_2k_g4: number[];
  insideOf_genes_downstream_3k_g4: number[];
  insideOf_genes_downstream_4k_g4: number[];
  insideOf_genes_downstream_5k_g4: number[];
  insideOf_gene_i_motif: number[];
  insideOf_genes_upstream_100bp_i_motif: number[];
  insideOf_genes_downstream_100bp_i_motif: number[];
  insideOf_genes_upstream_200bp_i_motif: number[];
  insideOf_genes_downstream_200bp_i_motif: number[];
  insideOf_genes_upstream_300bp_i_motif: number[];
  insideOf_genes_downstream_300bp_i_motif: number[];
  insideOf_genes_upstream_500bp_i_motif: number[];
  insideOf_genes_downstream_500bp_i_motif: number[];
  insideOf_genes_upstream_1k_i_motif: number[];
  insideOf_genes_upstream_2k_i_motif: number[];
  insideOf_genes_upstream_3k_i_motif: number[];
  insideOf_genes_upstream_4k_i_motif: number[];
  insideOf_genes_upstream_5k_i_motif: number[];
  insideOf_genes_downstream_1k_i_motif: number[];
  insideOf_genes_downstream_2k_i_motif: number[];
  insideOf_genes_downstream_3k_i_motif: number[];
  insideOf_genes_downstream_4k_i_motif: number[];
  insideOf_genes_downstream_5k_i_motif: number[];
}

export interface GeneSearchItem {
  assembly_accession: string;
  organism_name: string;
  seqid: string;
  feature_start: number | null;
  feature_end: number | null;
  strand: string | null;
  feature_id: string | null;
  gene_id: string | null;
  gene_name: string | null;
  gene_biotype: string | null;
  insideOf_gene_g4_count: number;
  insideOf_genes_upstream_1k_g4_count: number;
  insideOf_genes_downstream_1k_g4_count: number;
}

@Injectable({
  providedIn: 'root',
})
export class GeneService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/v1/gene';

  searchGenes(searchTerm: string, assemblyAccession?: string): Observable<GeneSearchItem[]> {
    let params = new HttpParams().set('search_term', searchTerm);
    if (assemblyAccession) {
      params = params.set('assembly_accession', assemblyAccession);
    }
    return this.http.get<GeneSearchItem[]>(`${this.apiUrl}/`, { params });
  }

  getGene(assemblyAccession: string, seqid: string, featureId: string): Observable<GeneDetail> {
    return this.http.get<GeneDetail>(
      `${this.apiUrl}/${encodeURIComponent(assemblyAccession)}/${encodeURIComponent(seqid)}/${encodeURIComponent(featureId)}`,
    );
  }
}
