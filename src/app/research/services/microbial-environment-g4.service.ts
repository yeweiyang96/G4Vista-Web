import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';

export type EnvironmentTraitCode =
  | 'growth_temperature'
  | 'growth_pH'
  | 'oxygen_tolerance'
  | 'spore_formation'
  | 'halophily_salt'
  | 'ecological_context';
export type EnvironmentChartKind = 'scatter' | 'boxplot';
export type EnvironmentOutcomeMetric =
  | 'g4_density_per_mb'
  | 'gene_quadruplex_density_per_mb'
  | 'upstream_quadruplex_density_per_mb'
  | 'downstream_quadruplex_density_per_mb'
  | 'intergenic_quadruplex_density_per_mb';
export type EnvironmentTaxonomyRank =
  | 'domain'
  | 'phylum'
  | 'class'
  | 'order'
  | 'family'
  | 'genus'
  | 'species';
export type EnvironmentSortOrder = 'asc' | 'desc';
export type EnvironmentSortCategoriesBy = 'median' | 'n_assemblies' | 'sort_order';
export type EnvironmentDownloadMode = 'csv' | 'tsv';
export type EnvironmentCategoryFilterLogic = 'intersection';

export interface EnvironmentOutcomeMetricOption {
  metric: EnvironmentOutcomeMetric;
  display_name: string;
  unit: string;
  description: string;
}

export interface EnvironmentTraitOption {
  trait_code: EnvironmentTraitCode;
  trait_group: string;
  display_name: string;
  value_kind: string;
  default_chart_kind: EnvironmentChartKind;
  allowed_outcome_metrics: EnvironmentOutcomeMetric[];
  default_outcome_metric: EnvironmentOutcomeMetric;
  category_selection_mode: string;
  default_context_axis: string | null;
  min_default_mapping_confidence_rank: number;
  requires_taxonomy_controls: boolean;
}

export interface EnvironmentContextAxisOption {
  trait_code: EnvironmentTraitCode;
  context_axis: string;
  display_label: string;
  category_count: number;
  is_default_context_axis: boolean;
}

export interface EnvironmentCategoryOption {
  trait_code: EnvironmentTraitCode;
  context_axis: string;
  category_id: string;
  canonical_value: string;
  display_label: string;
  parent_category_id: string | null;
  sort_order: number;
  is_default_visible: boolean;
  eligible_assembly_count: number;
}

export interface EnvironmentTaxonomyRankOption {
  rank: EnvironmentTaxonomyRank;
  display_label: string;
}

export interface EnvironmentOptionsResponse {
  traits: EnvironmentTraitOption[];
  outcome_metrics: EnvironmentOutcomeMetricOption[];
  context_axes: EnvironmentContextAxisOption[];
  categories: EnvironmentCategoryOption[];
  taxonomy_ranks: EnvironmentTaxonomyRankOption[];
  build_id: string;
  source_dataset_version: string;
}

export interface EnvironmentTaxonomyFilter {
  rank: EnvironmentTaxonomyRank;
  value: string;
}

export interface EnvironmentCategoryFilter {
  trait_code: EnvironmentTraitCode;
  context_axis: string;
  category_id: string;
}

export interface EnvironmentQueryBase {
  trait_code: EnvironmentTraitCode;
  chart_kind: EnvironmentChartKind;
  outcome_metric: EnvironmentOutcomeMetric;
  taxonomy_filters: EnvironmentTaxonomyFilter[];
  category_filters: EnvironmentCategoryFilter[];
  category_filter_logic: EnvironmentCategoryFilterLogic;
  min_mapping_confidence_rank: number;
  include_review_values: boolean;
  page_index: number;
  page_size: number;
  sort_field: string;
  sort_order: EnvironmentSortOrder;
}

export interface EnvironmentNumericScatterRequest extends EnvironmentQueryBase {
  chart_kind: 'scatter';
  numeric_min: number | null;
  numeric_max: number | null;
}

export interface EnvironmentCategoryBoxplotRequest extends EnvironmentQueryBase {
  chart_kind: 'boxplot';
  display_context_axis: string;
  display_category_ids: string[];
  sort_categories_by: EnvironmentSortCategoriesBy;
}

export interface EnvironmentDownloadRequest extends EnvironmentQueryBase {
  mode: EnvironmentDownloadMode;
  numeric_min: number | null;
  numeric_max: number | null;
  display_context_axis: string | null;
  display_category_ids: string[];
  sort_categories_by: EnvironmentSortCategoriesBy;
}

export type EnvironmentQueryRequest =
  | EnvironmentNumericScatterRequest
  | EnvironmentCategoryBoxplotRequest;

export interface EnvironmentTaxonomySearchResult {
  rank: EnvironmentTaxonomyRank;
  value: string;
  label: string;
  eligible_assembly_count: number;
}

export interface EnvironmentTaxonomySearchResponse {
  results: EnvironmentTaxonomySearchResult[];
}

export interface EnvironmentQuerySummary {
  trait_code: EnvironmentTraitCode;
  chart_kind: EnvironmentChartKind;
  outcome_metric: EnvironmentOutcomeMetric;
  assembly_count: number;
  row_count: number;
  filter_hash: string;
  build_id: string;
  source_dataset_version: string;
  description: string;
}

export interface EnvironmentSeriesPoint {
  series_kind: string;
  x_value: number | null;
  x_label: string | null;
  y_value: number | null;
  y_metric: EnvironmentOutcomeMetric;
  n_assemblies: number;
  payload_json: string;
}

export interface EnvironmentTaxonomyFields {
  domain: string;
  phylum: string;
  class_name: string;
  order: string;
  family: string;
  genus: string;
  species: string;
  full_scientific_name: string;
}

export interface EnvironmentMetricFields {
  g4_density_per_mb: number | null;
  gene_quadruplex_density_per_mb: number | null;
  upstream_quadruplex_density_per_mb: number | null;
  downstream_quadruplex_density_per_mb: number | null;
  intergenic_quadruplex_density_per_mb: number | null;
}

export interface EnvironmentNumericScatterPoint
  extends EnvironmentTaxonomyFields, EnvironmentMetricFields {
  assembly_accession: string;
  trait_code: EnvironmentTraitCode;
  numeric_midpoint: number | null;
  numeric_min: number | null;
  numeric_max: number | null;
  numeric_unit_canonical: string | null;
  g4_count: number;
  g4_mean_score: number | null;
  genome_size: number | null;
  gc_percent: number | null;
  assembly_level: string;
}

export interface EnvironmentNumericTableRow extends EnvironmentNumericScatterPoint {
  raw_values: string[];
  normalized_values: string[];
}

export interface EnvironmentNumericScatterResponse {
  summary: EnvironmentQuerySummary;
  scatter_points: EnvironmentNumericScatterPoint[];
  regression_line: EnvironmentSeriesPoint[];
  numeric_bins: EnvironmentSeriesPoint[];
  table_preview: EnvironmentNumericTableRow[];
  preview_total: number;
  download_filename: string;
  filter_hash: string;
  build_id: string;
  source_dataset_version: string;
}

export interface EnvironmentBoxplotSummaryRow {
  run_id: string;
  filter_hash: string;
  trait_code: EnvironmentTraitCode;
  context_axis: string;
  category_id: string;
  canonical_value: string;
  outcome_metric: EnvironmentOutcomeMetric;
  n_assemblies: number;
  q1: number | null;
  median: number | null;
  q3: number | null;
  whisker_low: number | null;
  whisker_high: number | null;
  min_value: number | null;
  max_value: number | null;
  outlier_count: number;
  sort_value: number | null;
  status: string;
  build_id: string;
  source_dataset_version: string;
}

export interface EnvironmentCategoryDatasetRow
  extends EnvironmentTaxonomyFields, EnvironmentMetricFields {
  assembly_accession: string;
  trait_code: EnvironmentTraitCode;
  trait_group: string;
  value_kind: string;
  context_axis: string;
  category_id: string;
  canonical_value: string;
  parent_category_id: string | null;
  mapping_methods: string[];
  mapping_confidences: string[];
  mapping_confidence_rank: number;
  include_in_default_analysis: boolean;
  raw_values: string[];
  normalized_values: string[];
  g4_count: number;
  g4_mean_score: number | null;
  genome_size: number | null;
  gc_percent: number | null;
  assembly_level: string;
}

export interface EnvironmentCategoryBoxplotResponse {
  summary: EnvironmentQuerySummary;
  boxplot_summary: EnvironmentBoxplotSummaryRow[];
  raw_points_sample: EnvironmentCategoryDatasetRow[];
  table_preview: EnvironmentCategoryDatasetRow[];
  preview_total: number;
  download_filename: string;
  filter_hash: string;
  build_id: string;
  source_dataset_version: string;
}

export type EnvironmentQueryResponse =
  | EnvironmentNumericScatterResponse
  | EnvironmentCategoryBoxplotResponse;

export type EnvironmentTableRow = EnvironmentNumericTableRow | EnvironmentCategoryDatasetRow;

export interface EnvironmentDownloadResponse {
  blob: Blob;
  filename: string;
}

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

@Injectable({ providedIn: 'root' })
export class MicrobialEnvironmentG4Service {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/v1/research/microbial-environment-g4';

  getOptions(): Observable<EnvironmentOptionsResponse> {
    return this.http.get<EnvironmentOptionsResponse>(`${this.apiUrl}/options`);
  }

  searchTaxonomy(
    rank: EnvironmentTaxonomyRank,
    keyword: string,
    traitCode: EnvironmentTraitCode,
    chartKind: EnvironmentChartKind,
    contextAxis: string | null,
  ): Observable<EnvironmentTaxonomySearchResponse> {
    let params = new HttpParams()
      .set('rank', rank)
      .set('q', keyword.trim())
      .set('trait_code', traitCode)
      .set('chart_kind', chartKind);
    if (contextAxis !== null) {
      params = params.set('context_axis', contextAxis);
    }
    return this.http.get<EnvironmentTaxonomySearchResponse>(`${this.apiUrl}/taxonomy/search`, {
      params,
    });
  }

  queryNumericScatter(
    request: EnvironmentNumericScatterRequest,
  ): Observable<EnvironmentNumericScatterResponse> {
    return this.http.post<EnvironmentNumericScatterResponse>(
      `${this.apiUrl}/query/numeric-scatter`,
      request,
    );
  }

  queryCategoryBoxplot(
    request: EnvironmentCategoryBoxplotRequest,
  ): Observable<EnvironmentCategoryBoxplotResponse> {
    return this.http.post<EnvironmentCategoryBoxplotResponse>(
      `${this.apiUrl}/query/category-boxplot`,
      request,
    );
  }

  downloadResults(request: EnvironmentDownloadRequest): Observable<EnvironmentDownloadResponse> {
    return this.http
      .post(`${this.apiUrl}/download/results`, request, {
        responseType: 'blob',
        observe: 'response',
      })
      .pipe(
        map((response: HttpResponse<Blob>) => {
          if (response.body === null) {
            throw new Error('Environment-G4 download response did not include a Blob body');
          }
          return {
            blob: response.body,
            filename:
              parseContentDispositionFilename(response.headers.get('Content-Disposition')) ??
              `microbial_environment_g4.${request.mode}`,
          };
        }),
      );
  }
}
