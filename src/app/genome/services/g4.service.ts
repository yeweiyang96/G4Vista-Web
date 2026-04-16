import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

export const G4_GENE_POSITION_OPTIONS = [
  { value: 'insideOf_gene_normal', label: 'Inside gene(G-rich)' },
  { value: 'insideOf_genes_upstream_100bp_normal', label: '100 bp upstream(G-rich)' },
  { value: 'insideOf_genes_upstream_200bp_normal', label: '200 bp upstream(G-rich)' },
  { value: 'insideOf_genes_upstream_300bp_normal', label: '300 bp upstream(G-rich)' },
  { value: 'insideOf_genes_upstream_500bp_normal', label: '500 bp upstream(G-rich)' },
  { value: 'insideOf_genes_upstream_1k_normal', label: '1 kb upstream(G-rich)' },
  { value: 'insideOf_genes_upstream_2k_normal', label: '2 kb upstream(G-rich)' },
  { value: 'insideOf_genes_upstream_3k_normal', label: '3 kb upstream(G-rich)' },
  { value: 'insideOf_genes_upstream_4k_normal', label: '4 kb upstream(G-rich)' },
  { value: 'insideOf_genes_upstream_5k_normal', label: '5 kb upstream(G-rich)' },
  { value: 'insideOf_genes_downstream_100bp_normal', label: '100 bp downstream(G-rich)' },
  { value: 'insideOf_genes_downstream_200bp_normal', label: '200 bp downstream(G-rich)' },
  { value: 'insideOf_genes_downstream_300bp_normal', label: '300 bp downstream(G-rich)' },
  { value: 'insideOf_genes_downstream_500bp_normal', label: '500 bp downstream(G-rich)' },
  { value: 'insideOf_genes_downstream_1k_normal', label: '1 kb downstream(G-rich)' },
  { value: 'insideOf_genes_downstream_2k_normal', label: '2 kb downstream(G-rich)' },
  { value: 'insideOf_genes_downstream_3k_normal', label: '3 kb downstream(G-rich)' },
  { value: 'insideOf_genes_downstream_4k_normal', label: '4 kb downstream(G-rich)' },
  { value: 'insideOf_genes_downstream_5k_normal', label: '5 kb downstream(G-rich)' },
  { value: 'insideOf_gene_revcomp', label: 'Inside gene(iMotif)' },
  { value: 'insideOf_genes_upstream_100bp_revcomp', label: '100 bp upstream(iMotif)' },
  { value: 'insideOf_genes_upstream_200bp_revcomp', label: '200 bp upstream(iMotif)' },
  { value: 'insideOf_genes_upstream_300bp_revcomp', label: '300 bp upstream(iMotif)' },
  { value: 'insideOf_genes_upstream_500bp_revcomp', label: '500 bp upstream(iMotif)' },
  { value: 'insideOf_genes_upstream_1k_revcomp', label: '1 kb upstream(iMotif)' },
  { value: 'insideOf_genes_upstream_2k_revcomp', label: '2 kb upstream(iMotif)' },
  { value: 'insideOf_genes_upstream_3k_revcomp', label: '3 kb upstream(iMotif)' },
  { value: 'insideOf_genes_upstream_4k_revcomp', label: '4 kb upstream(iMotif)' },
  { value: 'insideOf_genes_upstream_5k_revcomp', label: '5 kb upstream(iMotif)' },
  { value: 'insideOf_genes_downstream_100bp_revcomp', label: '100 bp downstream(iMotif)' },
  { value: 'insideOf_genes_downstream_200bp_revcomp', label: '200 bp downstream(iMotif)' },
  { value: 'insideOf_genes_downstream_300bp_revcomp', label: '300 bp downstream(iMotif)' },
  { value: 'insideOf_genes_downstream_500bp_revcomp', label: '500 bp downstream(iMotif)' },
  { value: 'insideOf_genes_downstream_1k_revcomp', label: '1 kb downstream(iMotif)' },
  { value: 'insideOf_genes_downstream_2k_revcomp', label: '2 kb downstream(iMotif)' },
  { value: 'insideOf_genes_downstream_3k_revcomp', label: '3 kb downstream(iMotif)' },
  { value: 'insideOf_genes_downstream_4k_revcomp', label: '4 kb downstream(iMotif)' },
  { value: 'insideOf_genes_downstream_5k_revcomp', label: '5 kb downstream(iMotif)' },
] as const;

export type G4GenePosition = (typeof G4_GENE_POSITION_OPTIONS)[number]['value'];
export type G4SortField = 'start' | 'end' | 'length' | 'tetrads' | 'gscore' | 'y1' | 'y2' | 'y3';
export type G4Type = 'normal' | 'revcomp';

export interface G4GenePositionOption {
  value: G4GenePosition;
  label: string;
}

export const G4_GENE_POSITION_OPTIONS_BY_TYPE: Record<G4Type, readonly G4GenePositionOption[]> = {
  normal: G4_GENE_POSITION_OPTIONS.filter((option) => option.value.endsWith('_normal')),
  revcomp: G4_GENE_POSITION_OPTIONS.filter((option) => option.value.endsWith('_revcomp')),
};

export interface G4PageItem {
  assembly_accession: string;
  seqid: string;
  g4_type: G4Type;
  start: number;
  end: number;
  length: number;
  tetrads: number;
  y1: number;
  y2: number;
  y3: number;
  gscore: number;
  sequence: string;
}

export interface G4PageResponse {
  g4s: G4PageItem[];
  count: number;
  tetrads_list: number[];
  max_gscore: number;
  min_gscore: number;
}

export interface G4GeneRelationHit {
  feature_id: string;
  label: string;
  gene_biotype: string | null;
}

export interface G4GeneRelationItem {
  start: number;
  positions: Partial<Record<G4GenePosition, G4GeneRelationHit[]>>;
}

export interface G4GeneRelationsResponse {
  relations: G4GeneRelationItem[];
}

export interface G4PageRequest {
  assemblyAccession: string;
  g4Type: G4Type;
  seqid: string;
  pageIndex: number;
  pageSize: number;
  sort: G4SortField;
  order: 'asc' | 'desc';
  tetrads: number[];
  minGscore?: number;
  maxGscore?: number;
  geneQuery?: string;
  selectedPosition: G4GenePosition;
  overlap?: boolean;
}

export interface G4GeneRelationsRequest {
  assemblyAccession: string;
  g4Type: G4Type;
  seqid: string;
  starts: number[];
}

export const EMPTY_G4_PAGE: G4PageResponse = {
  g4s: [],
  count: 0,
  tetrads_list: [],
  max_gscore: 0,
  min_gscore: 0,
};

export const EMPTY_G4_GENE_RELATIONS: G4GeneRelationsResponse = {
  relations: [],
};

const SORT_FIELD_PARAM_MAP: Record<G4SortField, string> = {
  start: 'start',
  end: 'end',
  length: 'length',
  tetrads: 'tetrads',
  gscore: 'gscore',
  y1: 'y1',
  y2: 'y2',
  y3: 'y3',
};

@Injectable({
  providedIn: 'root',
})
export class G4Service {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/v1/g4';

  getG4Page(request: G4PageRequest): Observable<G4PageResponse> {
    let params = new HttpParams()
      .set('offset', request.pageIndex)
      .set('limit', request.pageSize)
      .set('sort', SORT_FIELD_PARAM_MAP[request.sort])
      .set('order', request.order)
      .set('selected_position', request.selectedPosition);

    for (const tetrad of request.tetrads) {
      params = params.append('tetrad', tetrad);
    }
    if (request.minGscore !== undefined) {
      params = params.set('min_gscore', request.minGscore);
    }
    if (request.maxGscore !== undefined) {
      params = params.set('max_gscore', request.maxGscore);
    }
    if (request.geneQuery) {
      params = params.set('search_gene', request.geneQuery);
    }
    if (request.overlap) {
      params = params.set('overlap', false);
    }

    return this.http.get<G4PageResponse>(
      `${this.apiUrl}/${encodeURIComponent(request.assemblyAccession)}/${encodeURIComponent(request.seqid)}/${request.g4Type}`,
      { params },
    );
  }

  getGeneRelations(request: G4GeneRelationsRequest): Observable<G4GeneRelationsResponse> {
    let params = new HttpParams();
    for (const start of request.starts) {
      params = params.append('start', start);
    }

    return this.http.get<G4GeneRelationsResponse>(
      `${this.apiUrl}/${encodeURIComponent(request.assemblyAccession)}/${encodeURIComponent(request.seqid)}/${request.g4Type}/gene-relations`,
      { params },
    );
  }
}
