import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

export type DownloadMode = 'tsv' | 'zip';
export type DownloadColumnSelection = 'default' | 'all' | readonly string[];
export type DownloadSortOrder = 'asc' | 'desc';
export type DownloadQuadruplexType = 'g4' | 'i-motif';
export type DownloadGeneRelationCategory = 'gene_inside' | 'gene_upstream' | 'gene_downstream';

export interface DownloadColumn {
  readonly id: string;
  readonly label: string;
  readonly type: 'string' | 'integer' | 'float' | 'boolean' | 'date';
  readonly category: string;
  readonly description: string;
  readonly default_visible: boolean;
  readonly exportable: boolean;
  readonly source_table: string;
  readonly source_field: string;
}

export interface DownloadColumnCatalog {
  readonly catalog_version: string;
  readonly schema_version: string;
  readonly index_table: string;
  readonly default_columns: readonly string[];
  readonly all_columns: readonly string[];
  readonly columns: readonly DownloadColumn[];
}

export interface DownloadFilters {
  readonly assembly_accessions: readonly string[];
  readonly taxon_ids: readonly number[];
  readonly species_taxon_ids: readonly number[];
  readonly region_ids: readonly string[];
  readonly quadruplex_types: readonly DownloadQuadruplexType[];
  readonly gene_ids: readonly string[];
  readonly gene_search_term: string | null;
  readonly relation_categories: readonly DownloadGeneRelationCategory[];
  readonly flank_windows: readonly number[];
  readonly min_overlap_bp: number | null;
  readonly min_overlap_fraction: number | null;
  readonly tetrads: readonly number[];
  readonly min_score: number | null;
  readonly max_score: number | null;
}

export interface DownloadRequest {
  readonly mode: DownloadMode;
  readonly columns: DownloadColumnSelection;
  readonly filters: DownloadFilters;
  readonly sort: string;
  readonly order: DownloadSortOrder;
}

export interface DownloadResponse {
  readonly blob: Blob;
  readonly filename: string;
}

const DOWNLOAD_FALLBACK_BASENAME = 'g4vista_quadruplex_sequences';

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
export class DownloadService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/v1/download';

  getColumnCatalog(): Observable<DownloadColumnCatalog> {
    return this.http.get<DownloadColumnCatalog>(`${this.apiUrl}/columns`);
  }

  createDownload(request: DownloadRequest): Observable<DownloadResponse> {
    return this.http
      .post(`${this.apiUrl}/`, request, {
        responseType: 'blob',
        observe: 'response',
      })
      .pipe(
        map((response: HttpResponse<Blob>) => {
          if (response.body === null) {
            throw new Error('Download response did not include a Blob body');
          }
          return {
            blob: response.body,
            filename:
              parseContentDispositionFilename(response.headers.get('Content-Disposition')) ??
              `${DOWNLOAD_FALLBACK_BASENAME}.${request.mode}`,
          };
        }),
      );
  }
}
