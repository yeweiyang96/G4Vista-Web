import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface GenomeSearch {
  assembly_accession: string;
  asm_name: string | null;
  organism_name: string;
  matched_taxonomy_name?: string | null;
  matched_taxonomy_taxon_id?: number | null;
  matched_taxonomy_rank?: string | null;
  species_name?: string | null;
  species_taxon_id?: number | null;
  strain_name?: string | null;
  strain_taxon_id?: number | null;
}

export interface GenomeDatabaseStatus {
  assembly_count: number;
  taxon_count: number;
  g4_count: number;
  i_motif_count: number;
  assembly_data_loaded_at: string;
}

export interface GenomeRecommendedAssembly {
  organism_name: string;
  assembly_accession: string;
  asm_name: string | null;
  species_name: string;
  seqid_count: number;
  genome_length_bp: number;
  g4_count: number;
  i_motif_count: number;
}

export interface GenomeAssemblyOverview extends GenomeRecommendedAssembly {
  seq_rel_date: string | null;
  taxon_id: number | null;
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

  getDatabaseStatus(): Observable<GenomeDatabaseStatus> {
    return this.http.get<GenomeDatabaseStatus>(`${this.apiUrl}/status`);
  }

  getRecommendedAssemblies(): Observable<GenomeRecommendedAssembly[]> {
    return this.http.get<GenomeRecommendedAssembly[]>(`${this.apiUrl}/recommended-assemblies`);
  }
}
