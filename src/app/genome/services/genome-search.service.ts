import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface GenomeSearch {
  assembly_accession: string;
  asm_name: string;
  organism_name: string;
}

export interface GenomeDatabaseMetrics {
  assembly_count: number;
  taxon_count: number;
  g4_count: number;
  i_motif_count: number;
}

export interface GenomeOverviewAssembly {
  organism_name: string;
  assembly_accession: string;
  asm_name: string | null;
  species_name: string;
  seq_rel_date: string | null;
  taxon_id: number | null;
  seqid_count: number;
  genome_length_bp: number;
  g4_count: number;
  i_motif_count: number;
}

export interface GenomeOverview {
  metrics: GenomeDatabaseMetrics;
  recommended_assemblies: GenomeOverviewAssembly[];
}

@Injectable({
  providedIn: 'root',
})
export class GenomeSearchService {
  private http = inject(HttpClient);
  private apiUrl = '/api/v1/genome';

  searchGenome(query: string): Observable<GenomeSearch[]> {
    return this.http.get<GenomeSearch[]>(`${this.apiUrl}/?query=${encodeURIComponent(query)}`);
  }

  getOverview(): Observable<GenomeOverview> {
    return this.http.get<GenomeOverview>(`${this.apiUrl}/overview`);
  }
}
