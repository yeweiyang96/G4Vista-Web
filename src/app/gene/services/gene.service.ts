import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

export interface GeneDetail {
  assembly_accession: string;
  region_id: string;
  region_name: string | null;
  feature_id: string;
  gene_id: string | null;
  gene_name: string | null;
  locus_tag: string | null;
  biotype: string | null;
  start: number | null;
  end: number | null;
  strand: string | null;
  attributes_raw: string;
  counts: GeneQuadruplexCounts;
  relations: GeneQuadruplexRelation[];
}

export interface GeneSearchItem {
  assembly_accession: string;
  organism_name: string;
  region_id: string;
  feature_id: string;
  gene_id: string | null;
  gene_name: string | null;
  locus_tag: string | null;
  biotype: string | null;
  start: number | null;
  end: number | null;
  strand: string | null;
  g4_count: number;
  i_motif_count: number;
  quadruplex_sequence_count: number;
}

export interface GeneQuadruplexCounts {
  g4_count: number;
  i_motif_count: number;
  quadruplex_sequence_count: number;
}

export interface GeneQuadruplexRelation {
  assembly_accession: string;
  region_id: string;
  quadruplex_sequence_id: string;
  quadruplex_type: string;
  start: number;
  end: number;
  length: number;
  score: number;
  relation_category: string;
  distance_bp: number;
  overlap_bp: number;
  overlap_fraction: number;
  relation_mode: string;
  gene_id: string;
  gene_biotype: string;
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
  private readonly apiUrl = '/api/v1/genes';

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

  getGene(
    assemblyAccession: string,
    regionId: string,
    featureId: string,
  ): Observable<GeneDetail> {
    return this.http.get<GeneDetail>(
      `${this.apiUrl}/${encodeURIComponent(assemblyAccession)}/${encodeURIComponent(regionId)}/${encodeURIComponent(featureId)}`,
    );
  }
}
