import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import type { G4DownloadColumn, G4SortField, G4Type } from '../genome/services/g4.service';

export interface G4PackageRequest {
  readonly assembly_accessions: readonly string[];
  readonly taxon_ids: readonly number[];
  readonly g4_types: readonly G4Type[];
  readonly tetrads: readonly number[];
  readonly min_score: number | null;
  readonly max_score: number | null;
  readonly overlap: boolean;
  readonly sort: G4SortField;
  readonly order: 'asc' | 'desc';
  readonly columns: readonly G4DownloadColumn[];
}

export interface G4PackageDownloadResponse {
  readonly blob: Blob;
  readonly filename: string;
}

const PACKAGE_DOWNLOAD_FALLBACK_FILENAME = 'g4vista-g4-package.zip';

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

  createG4Package(request: G4PackageRequest): Observable<G4PackageDownloadResponse> {
    return this.http
      .post(`${this.apiUrl}/g4-package`, request, {
        responseType: 'blob',
        observe: 'response',
      })
      .pipe(
        map((response: HttpResponse<Blob>) => {
          if (response.body === null) {
            throw new Error('G4 package response did not include a Blob body');
          }
          return {
            blob: response.body,
            filename:
              parseContentDispositionFilename(response.headers.get('Content-Disposition')) ??
              PACKAGE_DOWNLOAD_FALLBACK_FILENAME,
          };
        }),
      );
  }
}
