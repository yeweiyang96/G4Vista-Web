import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import type {
  G4FlankWindow,
  G4GeneBiotypePositionBreakdown,
  G4PositionCategory,
  G4PositionDistributionFilters,
  G4PositionDistributionQuality,
  G4Type,
} from '../../genome/services/g4.service';

export interface AssemblySummary {
  assembly_accession: string;
  organism_name: string;
  asm_name: string | null;
}

export interface Taxonomy {
  taxon_id: number;
  name: string;
  rank: string;
  lineage?: TaxonomyNode[];
  assemblies?: AssemblySummary[];
  image_url?: string;
  temperature?: number;
}

export interface TaxonomySearch {
  name: string;
  rank: string;
  taxon_id: number;
  name_class: string;
  scientific_name: string;
}

export interface TaxonomyNode {
  name: string;
  rank: string;
  taxon_id: number;
  assembly_count?: number;
  children?: TaxonomyNode[];
}

export interface AssemblyCount {
  taxon_id: number;
  assembly_count: number;
}

export type TaxonomyG4ComparisonMode = 'single_assembly' | 'multi_assembly';

export interface TaxonomyG4MotifSummary {
  count: number;
  density_per_mb: number | null;
}

export interface TaxonomyG4DensityDistribution {
  min_density_per_mb: number | null;
  q1_density_per_mb: number | null;
  median_density_per_mb: number | null;
  q3_density_per_mb: number | null;
  max_density_per_mb: number | null;
}

export interface TaxonomyG4AssemblySummary extends AssemblySummary {
  species_name: string;
  seq_rel_date: string | null;
  taxon_id: number | null;
  genome_length_bp: number;
  g4_count: number;
  i_motif_count: number;
  g4_density_per_mb: number | null;
  i_motif_density_per_mb: number | null;
}

export interface TaxonomyG4PositionSummary {
  g4_type: G4Type;
  total_count: number;
  categories: G4PositionCategory[];
  gene_biotype_breakdown: G4GeneBiotypePositionBreakdown[];
}

export interface TaxonomyG4Summary {
  taxon_id: number;
  comparison_mode: TaxonomyG4ComparisonMode;
  assembly_count: number;
  genome_length_bp: number;
  genome_length_mb: number;
  motifs: Record<G4Type, TaxonomyG4MotifSummary>;
  g4_i_motif_density_ratio: number | null;
  density_distributions: Record<G4Type, TaxonomyG4DensityDistribution>;
  assembly_summaries: TaxonomyG4AssemblySummary[];
  position_distribution: TaxonomyG4PositionSummary;
  filters: G4PositionDistributionFilters;
  quality: G4PositionDistributionQuality;
}

export interface TaxonomyG4SummaryRequest {
  taxonId: number;
  g4Type: G4Type;
  flankWindow: G4FlankWindow;
  tetrads: readonly number[];
  minScore: number | null;
  maxScore: number | null;
  overlap: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class TaxonomyService {
  private http = inject(HttpClient);
  private apiUrl = '/api/v1/taxa';
  searchTaxonomy(query: string): Observable<TaxonomySearch[]> {
    return this.http.get<TaxonomySearch[]>(`${this.apiUrl}/?query=${query}`);
  }

  getLineage(taxon_id: number): Observable<TaxonomyNode> {
    return this.http.get<TaxonomyNode>(`${this.apiUrl}/lineage?taxon_id=${taxon_id}`);
  }

  getTaxonomyData(taxon_id: number): Observable<Taxonomy> {
    return this.http.get<Taxonomy>(`${this.apiUrl}/${taxon_id}`);
  }

  getAssemblyCounts(taxon_ids: number[]): Observable<AssemblyCount[]> {
    const params = taxon_ids.map((id) => `taxon_ids=${id}`).join('&');
    return this.http.get<AssemblyCount[]>(`${this.apiUrl}/genomes/counts?${params}`);
  }

  getTaxonomyG4Summary(request: TaxonomyG4SummaryRequest): Observable<TaxonomyG4Summary> {
    let params = new HttpParams()
      .set('g4_type', request.g4Type)
      .set('flank_window', request.flankWindow)
      .set('overlap', request.overlap);

    for (const tetrad of request.tetrads) {
      params = params.append('tetrads', tetrad);
    }
    if (request.minScore !== null) {
      params = params.set('min_score', request.minScore);
    }
    if (request.maxScore !== null) {
      params = params.set('max_score', request.maxScore);
    }

    return this.http.get<TaxonomyG4Summary>(
      `${this.apiUrl}/${encodeURIComponent(request.taxonId)}/g4-summary`,
      { params },
    );
  }
}
