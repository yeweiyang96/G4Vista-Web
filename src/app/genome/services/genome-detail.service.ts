import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import type { GenomeAssemblyOverview } from './genome-search.service';

export interface GenomeAssemblyDetail {
  assembly_accession: string;
  organism_name: string;
  asm_name: string | null;
  species_name: string;
  seq_rel_date: string | null;
  seqids: string[];
  seqid_lengths: Record<string, number>;
  regions?: GenomeAssemblyRegion[];
  taxon_id: number | null;
  default_gene_flank_window: number;
}

export interface GenomeAssemblyRegion {
  seqid: string;
  accession_name: string;
  fna_header: string;
  region_length: number | null;
}

@Injectable({
  providedIn: 'root',
})
export class GenomeDetailService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/v1/genome';

  getAssembly(assemblyAccession: string): Observable<GenomeAssemblyDetail> {
    return this.http.get<GenomeAssemblyDetail>(
      `${this.apiUrl}/${encodeURIComponent(assemblyAccession)}`,
    );
  }

  getAssemblyOverview(assemblyAccession: string): Observable<GenomeAssemblyOverview> {
    return this.http.get<GenomeAssemblyOverview>(
      `${this.apiUrl}/${encodeURIComponent(assemblyAccession)}/overview`,
    );
  }
}
