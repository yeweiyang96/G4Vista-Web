import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

export const G4_GENE_POSITION_OPTIONS = [
  { value: 'insideOf_gene_normal', label: 'Inside gene (G4)' },
  { value: 'insideOf_genes_upstream_100bp_normal', label: '100 bp upstream (G4)' },
  { value: 'insideOf_genes_upstream_200bp_normal', label: '200 bp upstream (G4)' },
  { value: 'insideOf_genes_upstream_300bp_normal', label: '300 bp upstream (G4)' },
  { value: 'insideOf_genes_upstream_500bp_normal', label: '500 bp upstream (G4)' },
  { value: 'insideOf_genes_upstream_1k_normal', label: '1 kb upstream (G4)' },
  { value: 'insideOf_genes_upstream_2k_normal', label: '2 kb upstream (G4)' },
  { value: 'insideOf_genes_upstream_3k_normal', label: '3 kb upstream (G4)' },
  { value: 'insideOf_genes_upstream_4k_normal', label: '4 kb upstream (G4)' },
  { value: 'insideOf_genes_upstream_5k_normal', label: '5 kb upstream (G4)' },
  { value: 'insideOf_genes_downstream_100bp_normal', label: '100 bp downstream (G4)' },
  { value: 'insideOf_genes_downstream_200bp_normal', label: '200 bp downstream (G4)' },
  { value: 'insideOf_genes_downstream_300bp_normal', label: '300 bp downstream (G4)' },
  { value: 'insideOf_genes_downstream_500bp_normal', label: '500 bp downstream (G4)' },
  { value: 'insideOf_genes_downstream_1k_normal', label: '1 kb downstream (G4)' },
  { value: 'insideOf_genes_downstream_2k_normal', label: '2 kb downstream (G4)' },
  { value: 'insideOf_genes_downstream_3k_normal', label: '3 kb downstream (G4)' },
  { value: 'insideOf_genes_downstream_4k_normal', label: '4 kb downstream (G4)' },
  { value: 'insideOf_genes_downstream_5k_normal', label: '5 kb downstream (G4)' },
  { value: 'insideOf_gene_revcomp', label: 'Inside gene (i-motif)' },
  { value: 'insideOf_genes_upstream_100bp_revcomp', label: '100 bp upstream (i-motif)' },
  { value: 'insideOf_genes_upstream_200bp_revcomp', label: '200 bp upstream (i-motif)' },
  { value: 'insideOf_genes_upstream_300bp_revcomp', label: '300 bp upstream (i-motif)' },
  { value: 'insideOf_genes_upstream_500bp_revcomp', label: '500 bp upstream (i-motif)' },
  { value: 'insideOf_genes_upstream_1k_revcomp', label: '1 kb upstream (i-motif)' },
  { value: 'insideOf_genes_upstream_2k_revcomp', label: '2 kb upstream (i-motif)' },
  { value: 'insideOf_genes_upstream_3k_revcomp', label: '3 kb upstream (i-motif)' },
  { value: 'insideOf_genes_upstream_4k_revcomp', label: '4 kb upstream (i-motif)' },
  { value: 'insideOf_genes_upstream_5k_revcomp', label: '5 kb upstream (i-motif)' },
  { value: 'insideOf_genes_downstream_100bp_revcomp', label: '100 bp downstream (i-motif)' },
  { value: 'insideOf_genes_downstream_200bp_revcomp', label: '200 bp downstream (i-motif)' },
  { value: 'insideOf_genes_downstream_300bp_revcomp', label: '300 bp downstream (i-motif)' },
  { value: 'insideOf_genes_downstream_500bp_revcomp', label: '500 bp downstream (i-motif)' },
  { value: 'insideOf_genes_downstream_1k_revcomp', label: '1 kb downstream (i-motif)' },
  { value: 'insideOf_genes_downstream_2k_revcomp', label: '2 kb downstream (i-motif)' },
  { value: 'insideOf_genes_downstream_3k_revcomp', label: '3 kb downstream (i-motif)' },
  { value: 'insideOf_genes_downstream_4k_revcomp', label: '4 kb downstream (i-motif)' },
  { value: 'insideOf_genes_downstream_5k_revcomp', label: '5 kb downstream (i-motif)' },
] as const;

export type G4GenePosition = (typeof G4_GENE_POSITION_OPTIONS)[number]['value'];
export type G4SortField = 'start' | 'end' | 'length' | 'tetrads' | 'gscore' | 'y1' | 'y2' | 'y3';
export type G4Type = 'normal' | 'revcomp';
export type G4FlankWindow = 100 | 200 | 300 | 500 | 1000 | 2000 | 3000 | 4000 | 5000;

export const G4_FLANK_WINDOW_OPTIONS: readonly { value: G4FlankWindow; label: string }[] = [
  { value: 100, label: '100 bp' },
  { value: 200, label: '200 bp' },
  { value: 300, label: '300 bp' },
  { value: 500, label: '500 bp' },
  { value: 1000, label: '1 kb' },
  { value: 2000, label: '2 kb' },
  { value: 3000, label: '3 kb' },
  { value: 4000, label: '4 kb' },
  { value: 5000, label: '5 kb' },
];

export interface G4GenePositionOption {
  value: G4GenePosition;
  label: string;
}

export const G4_GENE_POSITION_OPTIONS_BY_TYPE: Record<G4Type, readonly G4GenePositionOption[]> = {
  normal: G4_GENE_POSITION_OPTIONS.filter((option) => option.value.endsWith('_normal')),
  revcomp: G4_GENE_POSITION_OPTIONS.filter((option) => option.value.endsWith('_revcomp')),
};

export interface G4PageItem {
  assembly_accession: string;
  seqid: string;
  g4_type: G4Type;
  start: number;
  end: number;
  length: number;
  tetrads: number;
  y1: number;
  y2: number;
  y3: number;
  gscore: number;
  sequence: string;
}

export interface G4PageResponse {
  g4s: G4PageItem[];
  count: number;
  tetrads_list: number[];
  max_gscore: number;
  min_gscore: number;
}

export interface G4GeneRelationHit {
  feature_id: string;
  label: string;
  gene_biotype: string | null;
}

export interface G4GeneRelationItem {
  start: number;
  positions: Partial<Record<G4GenePosition, G4GeneRelationHit[]>>;
}

export interface G4GeneRelationsResponse {
  relations: G4GeneRelationItem[];
}

export interface G4PageRequest {
  assemblyAccession: string;
  g4Type: G4Type;
  pageIndex: number;
  pageSize: number;
  sort: G4SortField;
  order: 'asc' | 'desc';
  tetrads: number[];
  minGscore?: number;
  maxGscore?: number;
  overlap?: boolean;
}

export interface G4HistogramBin {
  start: number;
  end: number;
  count: number;
  density_per_bp: number;
  mean_gscore: number | null;
}

export interface G4HistogramResponse {
  bins: G4HistogramBin[];
  range_start: number;
  range_end: number;
  bin_size: number;
  total_count: number;
}

export interface G4HistogramFilters {
  tetrads: number[];
  minGscore?: number;
  maxGscore?: number;
  overlap?: boolean;
}

export interface G4ChartViewport {
  start: number;
  end: number;
  binSize: number;
}

export interface G4HistogramRequest {
  assemblyAccession: string;
  seqid: string;
  g4Type: G4Type;
  viewport: G4ChartViewport;
  filters: G4HistogramFilters;
}

export interface G4PositionDistributionFilters {
  tetrads: number[];
  min_gscore: number | null;
  max_gscore: number | null;
  overlap: boolean;
  flank_window: G4FlankWindow;
  counting_mode: 'exclusive';
}

export interface G4PositionCategory {
  key: string;
  label: string;
  count: number;
  ratio: number;
  precedence_rank: number;
  description: string;
}

export interface G4FeatureBreakdownItem {
  feature_type: string;
  unique_g4_count: number;
  relation_count: number;
  ratio_of_total: number;
  is_root_feature: boolean;
}

export interface G4GeneBiotypePositionBreakdown {
  bio_type: string | null;
  display_label: string;
  total_count: number;
  categories: G4PositionCategory[];
}

export interface G4PositionDistributionQuality {
  regions_total_count: number;
  regions_status_ok_count: number;
  regions_length_mismatch_count: number;
  warnings: string[];
}

export interface G4PositionDistributionResponse {
  assembly_accession: string;
  g4_type: G4Type;
  filters: G4PositionDistributionFilters;
  total_count: number;
  categories: G4PositionCategory[];
  feature_breakdown: G4FeatureBreakdownItem[];
  gene_biotype_breakdown: G4GeneBiotypePositionBreakdown[];
  quality: G4PositionDistributionQuality;
}

export interface G4PositionStatisticsFilters {
  windows: number[];
  tetrads: number[];
  min_gscore: number | null;
  max_gscore: number | null;
  overlap: boolean;
}

export interface G4PositionMotifStats {
  count: number;
  density_per_mb: number | null;
  expected_vs_genome: number | null;
  fold_vs_genome: number | null;
  fold_vs_non_feature: number | null;
  median_gscore: number | null;
  p95_gscore: number | null;
  median_tetrads: number | null;
  p95_tetrads: number | null;
  median_length: number | null;
  p95_length: number | null;
}

export interface G4PositionAsymmetry {
  normal_fraction: number | null;
  revcomp_fraction: number | null;
  fraction_delta: number | null;
  count_delta: number;
  density_ratio_normal_over_revcomp: number | null;
}

export interface G4PositionStatisticsCategory {
  key: string;
  label: string;
  description: string;
  precedence_rank: number;
  merged_interval_length_bp: number;
  length_mb: number;
  motifs: Record<G4Type, G4PositionMotifStats>;
  asymmetry: G4PositionAsymmetry;
}

export interface G4PositionStatisticsWindow {
  window_bp: number;
  categories: G4PositionStatisticsCategory[];
}

export interface G4PositionStatisticsResponse {
  assembly_accession: string;
  filters: G4PositionStatisticsFilters;
  genome_length_bp: number;
  genome_length_mb: number;
  windows: G4PositionStatisticsWindow[];
  quality: G4PositionDistributionQuality;
}

export interface G4PositionDistributionRequest {
  assemblyAccession: string;
  g4Type: G4Type;
  tetrads: number[];
  minGscore?: number;
  maxGscore?: number;
  overlap?: boolean;
  flankWindow: G4FlankWindow;
  includeFeatureBreakdown?: boolean;
  includeGeneBiotypeBreakdown?: boolean;
}

export interface G4PositionStatisticsRequest {
  assemblyAccession: string;
  windows?: number[];
  tetrads: number[];
  minGscore?: number;
  maxGscore?: number;
  overlap?: boolean;
}

export interface G4GeneSearchRequest {
  assemblyAccession: string;
  g4Type: G4Type;
  pageIndex: number;
  pageSize: number;
  sort: G4SortField;
  order: 'asc' | 'desc';
  tetrads: number[];
  minGscore?: number;
  maxGscore?: number;
  selectedFeatureId: string;
  selectedPosition: G4GenePosition;
  searchTerm?: string;
  overlap?: boolean;
}

export interface G4GeneRelationsRequest {
  assemblyAccession: string;
  g4Type: G4Type;
  seqid: string;
  starts: number[];
}

export interface G4GeneCandidate {
  feature_id: string;
  seqid: string;
  gene_name: string | null;
  locus_tag: string | null;
  gene_biotype: string | null;
}

export interface G4GeneCandidatesRequest {
  assemblyAccession: string;
  g4Type: G4Type;
  selectedPosition: G4GenePosition;
  searchTerm: string;
  limit?: number;
}

export const EMPTY_G4_PAGE: G4PageResponse = {
  g4s: [],
  count: 0,
  tetrads_list: [],
  max_gscore: 0,
  min_gscore: 0,
};

export const EMPTY_G4_GENE_RELATIONS: G4GeneRelationsResponse = {
  relations: [],
};

export const EMPTY_G4_HISTOGRAM: G4HistogramResponse = {
  bins: [],
  range_start: 1,
  range_end: 1,
  bin_size: 1,
  total_count: 0,
};

export const EMPTY_G4_POSITION_DISTRIBUTION: G4PositionDistributionResponse = {
  assembly_accession: '',
  g4_type: 'normal',
  filters: {
    tetrads: [],
    min_gscore: null,
    max_gscore: null,
    overlap: false,
    flank_window: 1000,
    counting_mode: 'exclusive',
  },
  total_count: 0,
  categories: [],
  feature_breakdown: [],
  gene_biotype_breakdown: [],
  quality: {
    regions_total_count: 0,
    regions_status_ok_count: 0,
    regions_length_mismatch_count: 0,
    warnings: [],
  },
};

export const EMPTY_G4_POSITION_STATISTICS: G4PositionStatisticsResponse = {
  assembly_accession: '',
  filters: {
    windows: [],
    tetrads: [],
    min_gscore: null,
    max_gscore: null,
    overlap: false,
  },
  genome_length_bp: 0,
  genome_length_mb: 0,
  windows: [],
  quality: {
    regions_total_count: 0,
    regions_status_ok_count: 0,
    regions_length_mismatch_count: 0,
    warnings: [],
  },
};

const SORT_FIELD_PARAM_MAP: Record<G4SortField, string> = {
  start: 'start',
  end: 'end',
  length: 'length',
  tetrads: 'tetrads',
  gscore: 'gscore',
  y1: 'y1',
  y2: 'y2',
  y3: 'y3',
};

@Injectable({
  providedIn: 'root',
})
export class G4Service {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/v1/g4';

  private appendCommonFilterParams(
    params: HttpParams,
    filters: Pick<
      G4PageRequest | G4GeneSearchRequest | G4HistogramFilters,
      'tetrads' | 'minGscore' | 'maxGscore' | 'overlap'
    >,
  ): HttpParams {
    let nextParams = params;
    for (const tetrad of filters.tetrads) {
      nextParams = nextParams.append('tetrads', tetrad);
    }
    if (filters.minGscore !== undefined) {
      nextParams = nextParams.set('min_gscore', filters.minGscore);
    }
    if (filters.maxGscore !== undefined) {
      nextParams = nextParams.set('max_gscore', filters.maxGscore);
    }
    if (filters.overlap) {
      nextParams = nextParams.set('overlap', true);
    }
    return nextParams;
  }

  private buildCommonPageParams(
    request: Pick<
      G4PageRequest | G4GeneSearchRequest,
      | 'pageIndex'
      | 'pageSize'
      | 'sort'
      | 'order'
      | 'tetrads'
      | 'minGscore'
      | 'maxGscore'
      | 'overlap'
    >,
  ): HttpParams {
    const params = new HttpParams()
      .set('offset', request.pageIndex)
      .set('limit', request.pageSize)
      .set('sort', SORT_FIELD_PARAM_MAP[request.sort])
      .set('order', request.order);
    return this.appendCommonFilterParams(params, request);
  }

  getAssemblyG4Page(request: G4PageRequest): Observable<G4PageResponse> {
    const params = this.buildCommonPageParams(request);

    return this.http.get<G4PageResponse>(
      `${this.apiUrl}/${encodeURIComponent(request.assemblyAccession)}/${request.g4Type}`,
      { params },
    );
  }

  getG4Page(request: G4PageRequest & { seqid: string }): Observable<G4PageResponse> {
    const params = this.buildCommonPageParams(request);

    return this.http.get<G4PageResponse>(
      `${this.apiUrl}/${encodeURIComponent(request.assemblyAccession)}/${encodeURIComponent(request.seqid)}/${request.g4Type}`,
      { params },
    );
  }

  getGeneSearchPage(request: G4GeneSearchRequest): Observable<G4PageResponse> {
    const params = this.buildCommonPageParams(request)
      .set('selected_feature_id', request.selectedFeatureId)
      .set('selected_position', request.selectedPosition);
    const searchParams = request.searchTerm
      ? params.set('search_term', request.searchTerm)
      : params;

    return this.http.get<G4PageResponse>(
      `${this.apiUrl}/${encodeURIComponent(request.assemblyAccession)}/${request.g4Type}/gene-search`,
      { params: searchParams },
    );
  }

  getGeneCandidates(request: G4GeneCandidatesRequest): Observable<G4GeneCandidate[]> {
    const params = new HttpParams()
      .set('search_term', request.searchTerm)
      .set('selected_position', request.selectedPosition)
      .set('limit', request.limit ?? 20);

    return this.http.get<G4GeneCandidate[]>(
      `${this.apiUrl}/${encodeURIComponent(request.assemblyAccession)}/${request.g4Type}/gene-candidates`,
      { params },
    );
  }

  getGeneRelations(request: G4GeneRelationsRequest): Observable<G4GeneRelationsResponse> {
    let params = new HttpParams();
    for (const start of request.starts) {
      params = params.append('start', start);
    }

    return this.http.get<G4GeneRelationsResponse>(
      `${this.apiUrl}/${encodeURIComponent(request.assemblyAccession)}/${encodeURIComponent(request.seqid)}/${request.g4Type}/gene-relations`,
      { params },
    );
  }

  getHistogram(request: G4HistogramRequest): Observable<G4HistogramResponse> {
    const params = this.appendCommonFilterParams(
      new HttpParams()
        .set('range_start', request.viewport.start)
        .set('range_end', request.viewport.end)
        .set('bin_size', request.viewport.binSize),
      request.filters,
    );

    return this.http.get<G4HistogramResponse>(
      `${this.apiUrl}/${encodeURIComponent(request.assemblyAccession)}/${encodeURIComponent(request.seqid)}/${request.g4Type}/histogram`,
      { params },
    );
  }

  getPositionDistribution(
    request: G4PositionDistributionRequest,
  ): Observable<G4PositionDistributionResponse> {
    const params = this.appendCommonFilterParams(
      new HttpParams()
        .set('flank_window', request.flankWindow)
        .set('include_feature_breakdown', request.includeFeatureBreakdown ?? true)
        .set('include_gene_biotype_breakdown', request.includeGeneBiotypeBreakdown ?? true),
      request,
    );

    return this.http.get<G4PositionDistributionResponse>(
      `${this.apiUrl}/${encodeURIComponent(request.assemblyAccession)}/${request.g4Type}/position-distribution`,
      { params },
    );
  }

  getPositionStatistics(
    request: G4PositionStatisticsRequest,
  ): Observable<G4PositionStatisticsResponse> {
    let params = new HttpParams();
    for (const window of request.windows ?? [100, 500, 1000, 5000]) {
      params = params.append('windows', window);
    }
    params = this.appendCommonFilterParams(params, request);

    return this.http.get<G4PositionStatisticsResponse>(
      `${this.apiUrl}/${encodeURIComponent(request.assemblyAccession)}/position-statistics`,
      { params },
    );
  }
}
