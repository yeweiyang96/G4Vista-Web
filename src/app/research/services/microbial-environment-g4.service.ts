import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export type MicrobialEnvironmentTrait = 'temperature' | 'ph';
export type MicrobialEnvironmentMode = 'growth' | 'optimum';
export type MicrobialTaxonomyRank =
  | 'domain'
  | 'phylum'
  | 'class'
  | 'order'
  | 'family'
  | 'genus'
  | 'species';
export type MicrobialAnalysisStatus = 'ok' | 'insufficient_data' | 'constant_input';

export interface MicrobialEnvironmentOption {
  value: string;
  label: string;
}

export interface MicrobialEnvironmentPlanOption {
  plan_id: string;
  trait: MicrobialEnvironmentTrait;
  mode: MicrobialEnvironmentMode;
  phenotype_label: string;
  phenotype_unit: string;
  eligible_assemblies: number;
}

export interface MicrobialEnvironmentG4Options {
  traits: MicrobialEnvironmentOption[];
  modes: MicrobialEnvironmentOption[];
  taxonomy_ranks: MicrobialEnvironmentOption[];
  plans: MicrobialEnvironmentPlanOption[];
}

export interface MicrobialTaxonomySelection {
  rank: MicrobialTaxonomyRank;
  value: string;
}

export interface MicrobialTaxonomySearchResult extends MicrobialTaxonomySelection {
  label: string;
  eligible_assembly_count: number;
}

export interface MicrobialTaxonomySearchResponse {
  results: MicrobialTaxonomySearchResult[];
}

export interface MicrobialEnvironmentG4Query {
  trait: MicrobialEnvironmentTrait;
  mode: MicrobialEnvironmentMode;
  taxonomy_selections: MicrobialTaxonomySelection[];
  page_index: number;
  page_size: number;
}

export interface MicrobialEnvironmentSummary {
  plan_id: string;
  assembly_count: number;
  phenotype_label: string;
  phenotype_unit: string;
}

export interface MicrobialEnvironmentCorrelation {
  method: 'spearman';
  n: number;
  rho: number | null;
  p_value: number | null;
  status: MicrobialAnalysisStatus;
}

export interface MicrobialRegressionLinePoint {
  phenotype_value: number;
  g4_density_per_mb: number;
}

export interface MicrobialEnvironmentRegression {
  method: 'ols';
  slope: number | null;
  intercept: number | null;
  r_squared: number | null;
  line_points: MicrobialRegressionLinePoint[];
  status: MicrobialAnalysisStatus;
}

export interface MicrobialEnvironmentTaxonomy {
  domain: string;
  phylum: string;
  class_name: string;
  order: string;
  family: string;
  genus: string;
  species: string;
}

export interface MicrobialEnvironmentScatterPoint {
  assembly_accession: string;
  phenotype_value: number;
  phenotype_min: number | null;
  phenotype_max: number | null;
  g4_density_per_mb: number | null;
  g4_count: number;
  gc_percent: number | null;
  genome_size: number | null;
  strain: string;
  taxonomy: MicrobialEnvironmentTaxonomy;
}

export interface MicrobialEnvironmentTableRow extends MicrobialEnvironmentScatterPoint {
  phenotype_record_count: number;
  raw_phenotype_values: string;
  assembly_level: string;
  g4_mean_score: number | null;
  gene_g4_density_per_mb: number | null;
  upstream_g4_density_per_mb: number | null;
  downstream_g4_density_per_mb: number | null;
  intergenic_g4_density_per_mb: number | null;
}

export interface MicrobialEnvironmentG4QueryResponse {
  summary: MicrobialEnvironmentSummary;
  correlation: MicrobialEnvironmentCorrelation;
  regression: MicrobialEnvironmentRegression;
  scatter_points: MicrobialEnvironmentScatterPoint[];
  table_preview: MicrobialEnvironmentTableRow[];
  preview_total: number;
  download_filename: string;
}

@Injectable({ providedIn: 'root' })
export class MicrobialEnvironmentG4Service {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/v1/research/microbial-environment-g4';

  getOptions(): Observable<MicrobialEnvironmentG4Options> {
    return this.http.get<MicrobialEnvironmentG4Options>(`${this.apiUrl}/options`);
  }

  searchTaxonomy(
    rank: MicrobialTaxonomyRank,
    keyword: string,
    trait: MicrobialEnvironmentTrait,
    mode: MicrobialEnvironmentMode,
  ): Observable<MicrobialTaxonomySearchResponse> {
    const params = new HttpParams()
      .set('rank', rank)
      .set('q', keyword.trim())
      .set('trait', trait)
      .set('mode', mode);
    return this.http.get<MicrobialTaxonomySearchResponse>(`${this.apiUrl}/taxonomy/search`, {
      params,
    });
  }

  query(request: MicrobialEnvironmentG4Query): Observable<MicrobialEnvironmentG4QueryResponse> {
    return this.http.post<MicrobialEnvironmentG4QueryResponse>(`${this.apiUrl}/query`, request);
  }

  downloadResults(request: MicrobialEnvironmentG4Query): Observable<Blob> {
    return this.http.post(`${this.apiUrl}/download/results`, request, { responseType: 'blob' });
  }
}
