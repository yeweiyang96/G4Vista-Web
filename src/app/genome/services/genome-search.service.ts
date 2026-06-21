import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

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
  quadruplex_sequence_count?: number;
  assembly_data_loaded_at: string;
}

export interface GenomeRecommendedAssembly {
  organism_name: string;
  assembly_accession: string;
  asm_name: string | null;
  species_name: string;
  region_count?: number;
  seqid_count: number;
  genome_length_bp: number;
  g4_count: number;
  i_motif_count: number;
  quadruplex_sequence_count?: number;
}

export interface GenomeAssemblyOverview extends GenomeRecommendedAssembly {
  seq_rel_date: string | null;
  taxon_id: number | null;
  species_taxon_id?: number | null;
  quadruplex_density_per_mb?: number | null;
}

export interface GenomeRecommendedAssemblyApi {
  organism_name: string;
  assembly_accession: string;
  asm_name: string | null;
  species_name: string;
  region_count: number;
  genome_length_bp: number;
  g4_count: number;
  i_motif_count: number;
  quadruplex_sequence_count: number;
}

export interface GenomeAssemblyOverviewApi extends GenomeRecommendedAssemblyApi {
  seq_rel_date: string | null;
  taxon_id: number | null;
  species_taxon_id: number | null;
  quadruplex_density_per_mb: number | null;
}

function mapRecommendedAssembly(assembly: GenomeRecommendedAssemblyApi): GenomeRecommendedAssembly {
  return {
    ...assembly,
    seqid_count: assembly.region_count,
  };
}

export function mapAssemblyOverview(overview: GenomeAssemblyOverviewApi): GenomeAssemblyOverview {
  return {
    ...overview,
    seqid_count: overview.region_count,
  };
}

@Injectable({
  providedIn: 'root',
})
export class GenomeSearchService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/v1/genome';

  searchGenome(query: string): Observable<GenomeSearch[]> {
    const params = new HttpParams().set('query', query);
    return this.http.get<GenomeSearch[]>(`${this.apiUrl}/`, { params });
  }

  getDatabaseStatus(): Observable<GenomeDatabaseStatus> {
    return this.http.get<GenomeDatabaseStatus>(`${this.apiUrl}/status`);
  }

  getRecommendedAssemblies(): Observable<GenomeRecommendedAssembly[]> {
    return this.http
      .get<GenomeRecommendedAssemblyApi[]>(`${this.apiUrl}/recommended-assemblies`)
      .pipe(map((assemblies) => assemblies.map(mapRecommendedAssembly)));
  }
}
