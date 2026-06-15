import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

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

export interface GeneSearchRequest {
  readonly searchTerm: string;
  readonly assemblyAccession?: string;
  readonly taxonId?: number;
}

export interface GeneSearchPageRequest extends GeneSearchRequest {
  readonly pageIndex: number;
  readonly pageSize: number;
}

export interface GeneSearchPage {
  readonly genes: GeneSearchItem[];
  readonly count: number;
}

export interface GeneSearchDownloadResponse {
  readonly blob: Blob;
  readonly filename: string;
}

const GENE_SEARCH_DOWNLOAD_FALLBACK_FILENAME = 'g4vista-gene-results.csv';

function parseContentDispositionFilename(contentDisposition: string | null): string | null {
  if (!contentDisposition) {
    return null;
  }

  const encodedFilenameMatch = contentDisposition.match(/filename\*\s*=\s*UTF-8''([^;]+)/i);
  if (encodedFilenameMatch?.[1]) {
    return decodeURIComponent(encodedFilenameMatch[1].trim().replace(/^"|"$/g, ''));
  }

  const quotedFilenameMatch = contentDisposition.match(/filename\s*=\s*"([^"]+)"/i);
  if (quotedFilenameMatch?.[1]) {
    return quotedFilenameMatch[1].trim();
  }

  const plainFilenameMatch = contentDisposition.match(/filename\s*=\s*([^;]+)/i);
  if (plainFilenameMatch?.[1]) {
    return plainFilenameMatch[1].trim();
  }
  return null;
}

@Injectable({
  providedIn: 'root',
})
export class GeneService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/v1/gene';

  private geneSearchParams(request: GeneSearchRequest): HttpParams {
    let params = new HttpParams().set('search_term', request.searchTerm);
    if (request.assemblyAccession) {
      params = params.set('assembly_accession', request.assemblyAccession);
    }
    if (request.taxonId !== undefined) {
      params = params.set('taxon_id', request.taxonId);
    }
    return params;
  }

  searchGenes(request: GeneSearchRequest): Observable<GeneSearchItem[]> {
    const params = this.geneSearchParams(request);
    return this.http.get<GeneSearchItem[]>(`${this.apiUrl}/`, { params });
  }

  searchGenesPage(request: GeneSearchPageRequest): Observable<GeneSearchPage> {
    const params = this.geneSearchParams(request)
      .set('offset', request.pageIndex)
      .set('limit', request.pageSize);
    return this.http.get<GeneSearchPage>(`${this.apiUrl}/page`, { params });
  }

  downloadGeneSearch(request: GeneSearchRequest): Observable<GeneSearchDownloadResponse> {
    const params = this.geneSearchParams(request);
    return this.http
      .get(`${this.apiUrl}/download`, {
        params,
        responseType: 'blob',
        observe: 'response',
      })
      .pipe(
        map((response: HttpResponse<Blob>) => {
          if (response.body === null) {
            throw new Error('Gene search download response did not include a Blob body');
          }
          return {
            blob: response.body,
            filename:
              parseContentDispositionFilename(response.headers.get('Content-Disposition')) ??
              GENE_SEARCH_DOWNLOAD_FALLBACK_FILENAME,
          };
        }),
      );
  }

  getGene(assemblyAccession: string, seqid: string, featureId: string): Observable<GeneDetail> {
    return this.http.get<GeneDetail>(
      `${this.apiUrl}/${encodeURIComponent(assemblyAccession)}/${encodeURIComponent(seqid)}/${encodeURIComponent(featureId)}`,
    );
  }
}
