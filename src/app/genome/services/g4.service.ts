import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

export const G4_GENE_POSITION_OPTIONS = [
  { value: 'insideOf_gene_g4', label: 'Inside gene (G4)' },
  { value: 'insideOf_genes_upstream_100bp_g4', label: '100 bp upstream (G4)' },
  { value: 'insideOf_genes_upstream_200bp_g4', label: '200 bp upstream (G4)' },
  { value: 'insideOf_genes_upstream_300bp_g4', label: '300 bp upstream (G4)' },
  { value: 'insideOf_genes_upstream_500bp_g4', label: '500 bp upstream (G4)' },
  { value: 'insideOf_genes_upstream_1k_g4', label: '1 kb upstream (G4)' },
  { value: 'insideOf_genes_upstream_2k_g4', label: '2 kb upstream (G4)' },
  { value: 'insideOf_genes_upstream_3k_g4', label: '3 kb upstream (G4)' },
  { value: 'insideOf_genes_upstream_4k_g4', label: '4 kb upstream (G4)' },
  { value: 'insideOf_genes_upstream_5k_g4', label: '5 kb upstream (G4)' },
  { value: 'insideOf_genes_downstream_100bp_g4', label: '100 bp downstream (G4)' },
  { value: 'insideOf_genes_downstream_200bp_g4', label: '200 bp downstream (G4)' },
  { value: 'insideOf_genes_downstream_300bp_g4', label: '300 bp downstream (G4)' },
  { value: 'insideOf_genes_downstream_500bp_g4', label: '500 bp downstream (G4)' },
  { value: 'insideOf_genes_downstream_1k_g4', label: '1 kb downstream (G4)' },
  { value: 'insideOf_genes_downstream_2k_g4', label: '2 kb downstream (G4)' },
  { value: 'insideOf_genes_downstream_3k_g4', label: '3 kb downstream (G4)' },
  { value: 'insideOf_genes_downstream_4k_g4', label: '4 kb downstream (G4)' },
  { value: 'insideOf_genes_downstream_5k_g4', label: '5 kb downstream (G4)' },
  { value: 'insideOf_gene_i_motif', label: 'Inside gene (i-motif)' },
  { value: 'insideOf_genes_upstream_100bp_i_motif', label: '100 bp upstream (i-motif)' },
  { value: 'insideOf_genes_upstream_200bp_i_motif', label: '200 bp upstream (i-motif)' },
  { value: 'insideOf_genes_upstream_300bp_i_motif', label: '300 bp upstream (i-motif)' },
  { value: 'insideOf_genes_upstream_500bp_i_motif', label: '500 bp upstream (i-motif)' },
  { value: 'insideOf_genes_upstream_1k_i_motif', label: '1 kb upstream (i-motif)' },
  { value: 'insideOf_genes_upstream_2k_i_motif', label: '2 kb upstream (i-motif)' },
  { value: 'insideOf_genes_upstream_3k_i_motif', label: '3 kb upstream (i-motif)' },
  { value: 'insideOf_genes_upstream_4k_i_motif', label: '4 kb upstream (i-motif)' },
  { value: 'insideOf_genes_upstream_5k_i_motif', label: '5 kb upstream (i-motif)' },
  { value: 'insideOf_genes_downstream_100bp_i_motif', label: '100 bp downstream (i-motif)' },
  { value: 'insideOf_genes_downstream_200bp_i_motif', label: '200 bp downstream (i-motif)' },
  { value: 'insideOf_genes_downstream_300bp_i_motif', label: '300 bp downstream (i-motif)' },
  { value: 'insideOf_genes_downstream_500bp_i_motif', label: '500 bp downstream (i-motif)' },
  { value: 'insideOf_genes_downstream_1k_i_motif', label: '1 kb downstream (i-motif)' },
  { value: 'insideOf_genes_downstream_2k_i_motif', label: '2 kb downstream (i-motif)' },
  { value: 'insideOf_genes_downstream_3k_i_motif', label: '3 kb downstream (i-motif)' },
  { value: 'insideOf_genes_downstream_4k_i_motif', label: '4 kb downstream (i-motif)' },
  { value: 'insideOf_genes_downstream_5k_i_motif', label: '5 kb downstream (i-motif)' },
] as const;

export type G4GenePosition = (typeof G4_GENE_POSITION_OPTIONS)[number]['value'];
export type G4SortField = 'start' | 'end' | 'length' | 'tetrads' | 'score' | 'y1' | 'y2' | 'y3';
export type G4Type = 'g4' | 'i-motif';
export type G4FlankWindow = 100 | 200 | 300 | 500 | 1000 | 2000 | 3000 | 4000 | 5000;
export type G4DownloadColumn =
  | 'seqid'
  | 'start'
  | 'end'
  | 'length'
  | 'tetrads'
  | 'score'
  | 'sequence'
  | `gene_relation:${G4GenePosition}`;

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
  g4: G4_GENE_POSITION_OPTIONS.filter((option) => option.value.endsWith('_g4')),
  'i-motif': G4_GENE_POSITION_OPTIONS.filter((option) => option.value.endsWith('_i_motif')),
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
  score: number;
  sequence: string;
}

export interface G4PageResponse {
  g4s: G4PageItem[];
  count: number;
  tetrads_list: number[];
  max_score: number;
  min_score: number;
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
  minScore?: number;
  maxScore?: number;
}

export interface G4HistogramBin {
  start: number;
  end: number;
  count: number;
  density_per_bp: number;
  mean_score: number | null;
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
  minScore?: number;
  maxScore?: number;
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
  min_score: number | null;
  max_score: number | null;
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
  display_label?: string;
  display_description?: string;
  category_group?: 'gene_context' | 'background';
  is_default_chart_category?: boolean;
  display_order?: number;
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
  g4_type: G4Type | null;
  tetrads: number[];
  min_score: number | null;
  max_score: number | null;
}

export interface G4PositionMotifStats {
  count: number;
  density_per_mb: number | null;
  expected_vs_genome: number | null;
  fold_vs_genome: number | null;
  fold_vs_other?: number | null;
  fold_vs_non_feature: number | null;
  min_score: number | null;
  q1_score: number | null;
  median_score: number | null;
  p75_score: number | null;
  max_score: number | null;
  min_tetrads: number | null;
  q1_tetrads: number | null;
  median_tetrads: number | null;
  p75_tetrads: number | null;
  max_tetrads: number | null;
  min_length: number | null;
  q1_length: number | null;
  median_length: number | null;
  p75_length: number | null;
  max_length: number | null;
}

export interface G4PositionAsymmetry {
  g4_fraction: number | null;
  i_motif_fraction: number | null;
  fraction_delta: number | null;
  count_delta: number;
  density_ratio_g4_over_i_motif: number | null;
}

export interface G4PositionStatisticsCategory {
  key: string;
  label: string;
  description: string;
  precedence_rank: number;
  display_label?: string;
  display_description?: string;
  category_group?: 'gene_context' | 'background';
  is_default_chart_category?: boolean;
  display_order?: number;
  merged_interval_length_bp: number;
  length_mb: number;
  motifs: Partial<Record<G4Type, G4PositionMotifStats>>;
  asymmetry: G4PositionAsymmetry;
}

export interface G4PositionStatisticsGeneBiotypeCategory {
  key: string;
  label: string;
  description: string;
  precedence_rank: number;
  display_label?: string;
  display_description?: string;
  category_group?: 'gene_context' | 'background';
  is_default_chart_category?: boolean;
  display_order?: number;
  count: number;
  merged_interval_length_bp: number;
  length_mb: number;
  motifs: Partial<Record<G4Type, G4PositionMotifStats>>;
}

export interface G4PositionStatisticsGeneBiotypeBreakdown {
  bio_type: string;
  display_label: string;
  total_count: number;
  categories: G4PositionStatisticsGeneBiotypeCategory[];
}

export interface G4PositionStatisticsWindow {
  window_bp: number;
  categories: G4PositionStatisticsCategory[];
  gene_biotype_breakdown: G4PositionStatisticsGeneBiotypeBreakdown[];
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
  minScore?: number;
  maxScore?: number;
  flankWindow: G4FlankWindow;
  includeFeatureBreakdown?: boolean;
  includeGeneBiotypeBreakdown?: boolean;
}

export interface G4PositionStatisticsRequest {
  assemblyAccession: string;
  windows?: number[];
  g4Type?: G4Type;
  tetrads: number[];
  minScore?: number;
  maxScore?: number;
  includeGeneBiotypeBreakdown?: boolean;
}

export interface G4GeneSearchRequest {
  assemblyAccession: string;
  g4Type: G4Type;
  pageIndex: number;
  pageSize: number;
  sort: G4SortField;
  order: 'asc' | 'desc';
  tetrads: number[];
  minScore?: number;
  maxScore?: number;
  selectedFeatureId: string;
  selectedPosition: G4GenePosition;
  searchTerm?: string;
}

export interface G4DownloadRequest {
  assemblyAccession: string;
  g4Type: G4Type;
  seqid?: string;
  sort: G4SortField;
  order: 'asc' | 'desc';
  tetrads: number[];
  minScore?: number;
  maxScore?: number;
  selectedFeatureId?: string;
  selectedPosition?: G4GenePosition;
  searchTerm?: string;
  columns: readonly G4DownloadColumn[];
}

export interface G4DownloadResponse {
  blob: Blob;
  filename: string;
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
  limit: number;
}

export const EMPTY_G4_PAGE: G4PageResponse = {
  g4s: [],
  count: 0,
  tetrads_list: [],
  max_score: 0,
  min_score: 0,
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
  g4_type: 'g4',
  filters: {
    tetrads: [],
    min_score: null,
    max_score: null,
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
    g4_type: null,
    tetrads: [],
    min_score: null,
    max_score: null,
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
  score: 'score',
  y1: 'y1',
  y2: 'y2',
  y3: 'y3',
};

const DOWNLOAD_FILENAME_TOKEN_MAX_LENGTH = 80;
const DOWNLOAD_FILENAME_EMPTY_TOKEN = 'filter';

function sanitizeDownloadFilenameToken(value: string, lowercase: boolean): string {
  const rawToken = value.trim();
  const token = lowercase ? rawToken.toLowerCase() : rawToken;
  const safeToken = token
    .replace(/[^A-Za-z0-9._-]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^[-._]+|[-._]+$/g, '');
  const cappedToken = safeToken
    .slice(0, DOWNLOAD_FILENAME_TOKEN_MAX_LENGTH)
    .replace(/^[-._]+|[-._]+$/g, '');
  return cappedToken || DOWNLOAD_FILENAME_EMPTY_TOKEN;
}

function relationPositionFilenameLabel(position: G4GenePosition, g4Type: G4Type): string {
  const option = G4_GENE_POSITION_OPTIONS.find((candidate) => candidate.value === position);
  const motifLabel = g4Type === 'i-motif' ? '(i-motif)' : '(G4)';
  return (option?.label ?? position).replace(motifLabel, '').trim();
}

function scoreDownloadFilenameToken(
  minScore: number | undefined,
  maxScore: number | undefined,
): string | null {
  if (minScore === undefined && maxScore === undefined) {
    return null;
  }
  if (minScore !== undefined && maxScore !== undefined) {
    return `score-${minScore}-${maxScore}`;
  }
  if (minScore !== undefined) {
    return `score-ge${minScore}`;
  }
  if (maxScore !== undefined) {
    return `score-le${maxScore}`;
  }
  return null;
}

function fallbackG4DownloadFilename(request: G4DownloadRequest): string {
  const scope = request.seqid ?? 'whole-genome';
  const tokens: string[] = [
    sanitizeDownloadFilenameToken(request.assemblyAccession, false),
    sanitizeDownloadFilenameToken(scope, false),
    sanitizeDownloadFilenameToken(request.g4Type, true),
  ];
  const hasGeneFilter = request.selectedFeatureId !== undefined || request.searchTerm !== undefined;
  if (request.selectedFeatureId) {
    tokens.push(`gene-${sanitizeDownloadFilenameToken(request.selectedFeatureId, true)}`);
  } else if (request.searchTerm) {
    tokens.push(`gene-search-${sanitizeDownloadFilenameToken(request.searchTerm, true)}`);
  }
  if (hasGeneFilter && request.selectedPosition) {
    const relationLabel = relationPositionFilenameLabel(request.selectedPosition, request.g4Type);
    tokens.push(`rel-${sanitizeDownloadFilenameToken(relationLabel, true)}`);
  }
  if (request.tetrads.length > 0) {
    tokens.push(`tetrads-${sanitizeDownloadFilenameToken(request.tetrads.join('-'), true)}`);
  }

  const scoreToken = scoreDownloadFilenameToken(request.minScore, request.maxScore);
  if (scoreToken !== null) {
    tokens.push(sanitizeDownloadFilenameToken(scoreToken, true));
  }
  return `${tokens.join('_')}_sites.tsv`;
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
      'tetrads' | 'minScore' | 'maxScore'
    >,
  ): HttpParams {
    let nextParams = params;
    for (const tetrad of filters.tetrads) {
      nextParams = nextParams.append('tetrads', tetrad);
    }
    if (filters.minScore !== undefined) {
      nextParams = nextParams.set('min_score', filters.minScore);
    }
    if (filters.maxScore !== undefined) {
      nextParams = nextParams.set('max_score', filters.maxScore);
    }
    return nextParams;
  }

  private buildCommonPageParams(
    request: Pick<
      G4PageRequest | G4GeneSearchRequest,
      'pageIndex' | 'pageSize' | 'sort' | 'order' | 'tetrads' | 'minScore' | 'maxScore'
    >,
  ): HttpParams {
    const params = new HttpParams()
      .set('offset', request.pageIndex)
      .set('limit', request.pageSize)
      .set('sort', SORT_FIELD_PARAM_MAP[request.sort])
      .set('order', request.order);
    return this.appendCommonFilterParams(params, request);
  }

  private appendDownloadColumnParams(
    params: HttpParams,
    columns: readonly G4DownloadColumn[],
  ): HttpParams {
    let nextParams = params;
    for (const column of columns) {
      nextParams = nextParams.append('columns', column);
    }
    return nextParams;
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

  downloadG4Table(request: G4DownloadRequest): Observable<G4DownloadResponse> {
    const params = this.appendDownloadColumnParams(
      this.appendCommonFilterParams(
        new HttpParams()
          .set('sort', SORT_FIELD_PARAM_MAP[request.sort])
          .set('order', request.order),
        request,
      ),
      request.columns,
    );
    const scopedParams = request.seqid ? params.set('seqid', request.seqid) : params;
    const geneParams =
      request.selectedFeatureId && request.selectedPosition
        ? scopedParams
            .set('selected_feature_id', request.selectedFeatureId)
            .set('selected_position', request.selectedPosition)
        : scopedParams;
    const searchParams = request.searchTerm
      ? geneParams.set('search_term', request.searchTerm)
      : geneParams;

    return this.http
      .get(
        `${this.apiUrl}/${encodeURIComponent(request.assemblyAccession)}/${request.g4Type}/download`,
        {
          params: searchParams,
          responseType: 'blob',
          observe: 'response',
        },
      )
      .pipe(
        map((response: HttpResponse<Blob>) => {
          if (response.body === null) {
            throw new Error('G4 download response did not include a Blob body');
          }
          const headerFilename = parseContentDispositionFilename(
            response.headers.get('Content-Disposition'),
          );
          return {
            blob: response.body,
            filename: headerFilename ?? fallbackG4DownloadFilename(request),
          };
        }),
      );
  }

  getGeneCandidates(request: G4GeneCandidatesRequest): Observable<G4GeneCandidate[]> {
    const params = new HttpParams()
      .set('search_term', request.searchTerm)
      .set('selected_position', request.selectedPosition)
      .set('limit', request.limit);

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
    if (request.g4Type !== undefined) {
      params = params.set('g4_type', request.g4Type);
    }
    if (request.includeGeneBiotypeBreakdown !== undefined) {
      params = params.set('include_gene_biotype_breakdown', request.includeGeneBiotypeBreakdown);
    }
    params = this.appendCommonFilterParams(params, request);

    return this.http.get<G4PositionStatisticsResponse>(
      `${this.apiUrl}/${encodeURIComponent(request.assemblyAccession)}/position-statistics`,
      { params },
    );
  }
}
