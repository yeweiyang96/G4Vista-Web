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

export interface MicrobialEnvironmentOption {
  value: string;
  label: string;
}

export interface MicrobialTraitModeRange {
  trait: MicrobialEnvironmentTrait;
  mode: MicrobialEnvironmentMode;
  bin_step: number;
  min: number | null;
  max: number | null;
  eligible_genomes: number;
}

export interface MicrobialEnvironmentG4Options {
  traits: MicrobialEnvironmentOption[];
  modes: MicrobialEnvironmentOption[];
  taxonomy_ranks: MicrobialEnvironmentOption[];
  metrics: MicrobialEnvironmentOption[];
  bin_ranges: MicrobialTraitModeRange[];
}

export interface MicrobialTaxonomySelection {
  rank: MicrobialTaxonomyRank;
  value: string;
}

export interface MicrobialTaxonomySearchResult extends MicrobialTaxonomySelection {
  label: string;
  eligible_genome_count: number;
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
  matching_genomes: number;
  bin_rows: number;
  bin_count: number;
  sixteen_s_genomes: number;
  sixteen_s_rows: number;
}

export interface MicrobialEnvironmentBinStat {
  bin_start: number;
  bin_end: number;
  bin_mid: number;
  genome_count: number;
  g4_density_mean: number | null;
  g4_density_median: number | null;
  g4_count_mean: number | null;
  g4_mean_score_mean: number | null;
}

export interface MicrobialEnvironmentScatterPoint {
  genome_accession: string;
  bin_mid: number;
  g4_density_per_mb: number | null;
  g4_count: number | null;
  g4_mean_score: number | null;
}

export interface MicrobialTaxonomyBreakdown {
  rank: MicrobialTaxonomyRank;
  value: string;
  genome_count: number;
}

export interface MicrobialGenomePreviewRow {
  genome_accession: string;
  domain: string;
  phylum: string;
  class_name: string;
  order: string;
  family: string;
  genus: string;
  species: string;
  trait_min: number | null;
  trait_max: number | null;
  genome_size: number | null;
  gc_percent: number | null;
  g4_count: number;
  g4_density_per_mb: number | null;
  g4_mean_score: number | null;
}

export interface MicrobialSixteenSPreviewRow {
  genome_accession: string;
  sixteen_s_accession: string;
  sixteen_s_gc: number | null;
  sixteen_s_length: number | null;
  sixteen_s_g4_count: number;
  sixteen_s_g4_density_per_kb: number | null;
  sixteen_s_g4_mean_score: number | null;
}

export interface MicrobialEnvironmentG4QueryResponse {
  summary: MicrobialEnvironmentSummary;
  bin_stats: MicrobialEnvironmentBinStat[];
  scatter_points: MicrobialEnvironmentScatterPoint[];
  taxonomy_breakdown: MicrobialTaxonomyBreakdown[];
  genome_preview: MicrobialGenomePreviewRow[];
  sixteen_s_preview: MicrobialSixteenSPreviewRow[];
  preview_total: number;
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

  downloadGenomes(request: MicrobialEnvironmentG4Query): Observable<Blob> {
    return this.http.post(`${this.apiUrl}/download/genomes`, request, { responseType: 'blob' });
  }

  downloadBinStats(request: MicrobialEnvironmentG4Query): Observable<Blob> {
    return this.http.post(`${this.apiUrl}/download/bin-stats`, request, { responseType: 'blob' });
  }

  downloadBinRows(request: MicrobialEnvironmentG4Query): Observable<Blob> {
    return this.http.post(`${this.apiUrl}/download/bin-rows`, request, { responseType: 'blob' });
  }

  downloadSixteenS(request: MicrobialEnvironmentG4Query): Observable<Blob> {
    return this.http.post(`${this.apiUrl}/download/sixteen-s`, request, { responseType: 'blob' });
  }
}
