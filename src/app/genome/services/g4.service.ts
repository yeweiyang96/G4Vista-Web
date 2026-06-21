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
  quadruplex_sequence_id: string | null;
  assembly_accession: string;
  region_id: string;
  seqid: string;
  quadruplex_type: G4Type;
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
  strand: string;
  gene_ids: string;
  gene_names: string;
  gene_biotypes: string;
  relation_categories: string;
  feature_types: string;
  feature_ids: string;
}

export interface G4PageResponse {
  g4s: G4PageItem[];
  count: number;
  tetrads_list: number[];
  max_score: number;
  min_score: number;
}

interface QuadruplexSequenceApiItem {
  quadruplex_sequence_id: string | null;
  assembly_accession: string;
  region_id: string;
  quadruplex_type: G4Type;
  start: number;
  end: number;
  length: number;
  tetrads: number;
  y1: number | null;
  y2: number | null;
  y3: number | null;
  score: number;
  sequence: string;
  strand: string;
  gene_ids: string;
  gene_names: string;
  gene_biotypes: string;
  relation_categories: string;
  feature_types: string;
  feature_ids: string;
}

interface QuadruplexSequenceApiPage {
  quadruplex_sequences: QuadruplexSequenceApiItem[];
  count: number;
  tetrads_list: number[];
  max_score: number;
  min_score: number;
}

interface GeneSearchApiItem {
  assembly_accession: string;
  region_id: string;
  feature_id: string;
  gene_name: string | null;
  locus_tag: string | null;
  biotype: string | null;
}

interface GeneSearchApiPage {
  genes: GeneSearchApiItem[];
  count: number;
}

type G4DownloadRelationCategory = 'gene_inside' | 'gene_upstream' | 'gene_downstream';

interface G4DownloadApiFilters {
  assembly_accessions: readonly string[];
  taxon_ids: readonly number[];
  species_taxon_ids: readonly number[];
  region_ids: readonly string[];
  quadruplex_types: readonly G4Type[];
  gene_ids: readonly string[];
  gene_search_term: string | null;
  relation_categories: readonly G4DownloadRelationCategory[];
  flank_windows: readonly number[];
  min_overlap_bp: number | null;
  min_overlap_fraction: number | null;
  tetrads: readonly number[];
  min_score: number | null;
  max_score: number | null;
}

interface G4DownloadApiRequest {
  mode: 'tsv';
  columns: readonly string[] | 'default';
  filters: G4DownloadApiFilters;
  sort: string;
  order: 'asc' | 'desc';
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
  quadruplex_type: G4Type;
  filters: G4PositionDistributionFilters;
  total_count: number;
  categories: G4PositionCategory[];
  feature_breakdown: G4FeatureBreakdownItem[];
  gene_biotype_breakdown: G4GeneBiotypePositionBreakdown[];
  quality: G4PositionDistributionQuality;
}

export interface G4PositionStatisticsFilters {
  windows: number[];
  quadruplex_type: G4Type | null;
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
  description?: string;
  precedence_rank?: number;
  display_label?: string;
  display_description?: string;
  category_group?: 'gene_context' | 'background';
  is_default_chart_category?: boolean;
  display_order?: number;
  merged_interval_length_bp?: number;
  length_mb?: number;
  motifs?: Partial<Record<G4Type, G4PositionMotifStats>>;
  asymmetry?: G4PositionAsymmetry;
  quadruplex_types?: Partial<Record<G4Type, G4PositionCategoryStats>>;
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

export interface G4PositionCategoryStats {
  count: number;
  denominator_bp: number;
  denominator_mode: string | null;
  density_per_mb: number | null;
}

export interface G4PositionStatisticsBiotypeCategory {
  biotype: string;
  category: string;
  quadruplex_types: Partial<Record<G4Type, G4PositionCategoryStats>>;
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
  biotype_categories?: G4PositionStatisticsBiotypeCategory[];
  gene_biotype_breakdown?: G4PositionStatisticsGeneBiotypeBreakdown[];
}

export interface G4PositionStatisticsResponse {
  assembly_accession: string;
  filters: G4PositionStatisticsFilters;
  genome_length_bp: number;
  genome_length_mb: number;
  windows: G4PositionStatisticsWindow[];
  quality: G4PositionDistributionQuality;
}

interface G4PositionStatisticsApiResponse
  extends Omit<G4PositionStatisticsResponse, 'quality'> {
  quality?: G4PositionDistributionQuality;
}

export interface G4PositionDistributionRequest {
  assemblyAccession: string;
  g4Type: G4Type;
  flankWindow: G4FlankWindow;
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
  quadruplex_type: 'g4',
  filters: {
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
    quadruplex_type: null,
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

function normalizePositionStatisticsResponse(
  response: G4PositionStatisticsApiResponse,
): G4PositionStatisticsResponse {
  return {
    ...response,
    quality: response.quality ?? EMPTY_G4_POSITION_STATISTICS.quality,
  };
}

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

function mapQuadruplexSequenceItem(item: QuadruplexSequenceApiItem): G4PageItem {
  return {
    quadruplex_sequence_id: item.quadruplex_sequence_id,
    assembly_accession: item.assembly_accession,
    region_id: item.region_id,
    seqid: item.region_id,
    quadruplex_type: item.quadruplex_type,
    g4_type: item.quadruplex_type,
    start: item.start,
    end: item.end,
    length: item.length,
    tetrads: item.tetrads,
    y1: item.y1 ?? 0,
    y2: item.y2 ?? 0,
    y3: item.y3 ?? 0,
    score: item.score,
    sequence: item.sequence,
    strand: item.strand,
    gene_ids: item.gene_ids,
    gene_names: item.gene_names,
    gene_biotypes: item.gene_biotypes,
    relation_categories: item.relation_categories,
    feature_types: item.feature_types,
    feature_ids: item.feature_ids,
  };
}

function mapQuadruplexSequencePage(response: QuadruplexSequenceApiPage): G4PageResponse {
  return {
    g4s: response.quadruplex_sequences.map(mapQuadruplexSequenceItem),
    count: response.count,
    tetrads_list: response.tetrads_list,
    max_score: response.max_score,
    min_score: response.min_score,
  };
}

function mapGeneSearchItemToCandidate(item: GeneSearchApiItem): G4GeneCandidate {
  return {
    feature_id: item.feature_id,
    seqid: item.region_id,
    gene_name: item.gene_name,
    locus_tag: item.locus_tag,
    gene_biotype: item.biotype,
  };
}

function appendArrayParams<T extends string | number>(
  params: HttpParams,
  name: string,
  values: readonly T[],
): HttpParams {
  let nextParams = params;
  for (const value of values) {
    nextParams = nextParams.append(name, value);
  }
  return nextParams;
}

function geneRelationFilterFromPosition(
  position: G4GenePosition | undefined,
): { relationCategory: G4DownloadRelationCategory; flankWindow?: number } | null {
  if (!position) {
    return null;
  }
  if (position.startsWith('insideOf_gene_')) {
    return { relationCategory: 'gene_inside' };
  }

  const upstreamMatch = /insideOf_genes_upstream_(\d+)(bp|k)_(?:g4|i_motif)/.exec(position);
  if (upstreamMatch?.[1]) {
    const rawWindow = Number(upstreamMatch[1]);
    return {
      relationCategory: 'gene_upstream',
      flankWindow: upstreamMatch[2] === 'k' ? rawWindow * 1000 : rawWindow,
    };
  }

  const downstreamMatch = /insideOf_genes_downstream_(\d+)(bp|k)_(?:g4|i_motif)/.exec(position);
  if (downstreamMatch?.[1]) {
    const rawWindow = Number(downstreamMatch[1]);
    return {
      relationCategory: 'gene_downstream',
      flankWindow: downstreamMatch[2] === 'k' ? rawWindow * 1000 : rawWindow,
    };
  }

  return null;
}

function appendGeneRelationParams(
  params: HttpParams,
  selectedPosition: G4GenePosition | undefined,
): HttpParams {
  const relationFilter = geneRelationFilterFromPosition(selectedPosition);
  if (relationFilter === null) {
    return params;
  }
  const nextParams = params.append('relation_categories', relationFilter.relationCategory);
  return relationFilter.flankWindow === undefined
    ? nextParams
    : nextParams.append('flank_windows', relationFilter.flankWindow);
}

function splitRelationText(value: string): readonly string[] {
  return value
    .split(/[;,|]/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function relationPositionFromCategory(category: string, g4Type: G4Type): G4GenePosition | null {
  const suffix = g4Type === 'g4' ? 'g4' : 'i_motif';
  if (category === 'gene_inside') {
    return `insideOf_gene_${suffix}` as G4GenePosition;
  }
  if (category === 'gene_upstream') {
    return `insideOf_genes_upstream_1k_${suffix}` as G4GenePosition;
  }
  if (category === 'gene_downstream') {
    return `insideOf_genes_downstream_1k_${suffix}` as G4GenePosition;
  }
  return null;
}

function relationHitsFromItem(item: G4PageItem): Partial<Record<G4GenePosition, G4GeneRelationHit[]>> {
  const relationCategories = splitRelationText(item.relation_categories);
  const featureIds = splitRelationText(item.feature_ids || item.gene_ids);
  const geneNames = splitRelationText(item.gene_names);
  const geneBiotypes = splitRelationText(item.gene_biotypes);
  const positions: Partial<Record<G4GenePosition, G4GeneRelationHit[]>> = {};

  relationCategories.forEach((category, index) => {
    const position = relationPositionFromCategory(category, item.g4_type);
    if (position === null) {
      return;
    }
    const featureId = featureIds[index] ?? featureIds[0] ?? item.gene_ids;
    if (!featureId) {
      return;
    }
    const label = geneNames[index] || featureId;
    const hit: G4GeneRelationHit = {
      feature_id: featureId,
      label,
      gene_biotype: geneBiotypes[index] ?? null,
    };
    positions[position] = [...(positions[position] ?? []), hit];
  });

  return positions;
}

function mergeGeneRelationPositions(
  left: Partial<Record<G4GenePosition, G4GeneRelationHit[]>>,
  right: Partial<Record<G4GenePosition, G4GeneRelationHit[]>>,
): Partial<Record<G4GenePosition, G4GeneRelationHit[]>> {
  const merged: Partial<Record<G4GenePosition, G4GeneRelationHit[]>> = { ...left };
  for (const key of Object.keys(right) as G4GenePosition[]) {
    merged[key] = [...(merged[key] ?? []), ...(right[key] ?? [])];
  }
  return merged;
}

function relationItemForStart(start: number, items: readonly G4PageItem[]): G4GeneRelationItem {
  const positions = items
    .filter((item) => item.start === start)
    .map(relationHitsFromItem)
    .reduce<Partial<Record<G4GenePosition, G4GeneRelationHit[]>>>(
      mergeGeneRelationPositions,
      {},
    );
  return { start, positions };
}

function mapDownloadColumn(column: G4DownloadColumn): string | null {
  if (column === 'seqid') {
    return 'region_id';
  }
  if (column.startsWith('gene_relation:')) {
    return null;
  }
  return column;
}

function mapDownloadColumns(columns: readonly G4DownloadColumn[]): readonly string[] | 'default' {
  const mappedColumns = Array.from(
    new Set(columns.map(mapDownloadColumn).filter((column): column is string => column !== null)),
  );
  return mappedColumns.length ? mappedColumns : 'default';
}

function createDownloadApiRequest(request: G4DownloadRequest): G4DownloadApiRequest {
  const relationFilter = geneRelationFilterFromPosition(request.selectedPosition);
  const geneSearchTerm = request.searchTerm || request.selectedFeatureId || null;
  return {
    mode: 'tsv',
    columns: mapDownloadColumns(request.columns),
    filters: {
      assembly_accessions: [request.assemblyAccession],
      taxon_ids: [],
      species_taxon_ids: [],
      region_ids: request.seqid ? [request.seqid] : [],
      quadruplex_types: [request.g4Type],
      gene_ids: [],
      gene_search_term: geneSearchTerm,
      relation_categories: relationFilter ? [relationFilter.relationCategory] : [],
      flank_windows: relationFilter?.flankWindow === undefined ? [] : [relationFilter.flankWindow],
      min_overlap_bp: null,
      min_overlap_fraction: null,
      tetrads: request.tetrads,
      min_score: request.minScore ?? null,
      max_score: request.maxScore ?? null,
    },
    sort: SORT_FIELD_PARAM_MAP[request.sort],
    order: request.order,
  };
}

@Injectable({
  providedIn: 'root',
})
export class G4Service {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/v1/quadruplex-sequences';
  private readonly downloadApiUrl = '/api/v1/download';

  private appendCommonFilterParams(
    params: HttpParams,
    filters: Pick<
      G4PageRequest | G4GeneSearchRequest | G4HistogramFilters,
      'tetrads' | 'minScore' | 'maxScore'
    >,
  ): HttpParams {
    let nextParams = appendArrayParams(params, 'tetrads', filters.tetrads);
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

  getAssemblyG4Page(request: G4PageRequest): Observable<G4PageResponse> {
    const params = this.buildCommonPageParams(request).set('quadruplex_type', request.g4Type);

    return this.http
      .get<QuadruplexSequenceApiPage>(
        `${this.apiUrl}/${encodeURIComponent(request.assemblyAccession)}`,
        { params },
      )
      .pipe(map(mapQuadruplexSequencePage));
  }

  getG4Page(request: G4PageRequest & { seqid: string }): Observable<G4PageResponse> {
    const params = this.buildCommonPageParams(request).set('quadruplex_type', request.g4Type);

    return this.http
      .get<QuadruplexSequenceApiPage>(
        `${this.apiUrl}/${encodeURIComponent(request.assemblyAccession)}/${encodeURIComponent(request.seqid)}`,
        { params },
      )
      .pipe(map(mapQuadruplexSequencePage));
  }

  getGeneSearchPage(request: G4GeneSearchRequest): Observable<G4PageResponse> {
    const params = appendGeneRelationParams(
      this.buildCommonPageParams(request).set('quadruplex_type', request.g4Type),
      request.selectedPosition,
    );
    const geneSearchTerm = request.searchTerm || request.selectedFeatureId;
    const searchParams = geneSearchTerm ? params.set('gene_search_term', geneSearchTerm) : params;

    return this.http
      .get<QuadruplexSequenceApiPage>(
        `${this.apiUrl}/${encodeURIComponent(request.assemblyAccession)}`,
        { params: searchParams },
      )
      .pipe(map(mapQuadruplexSequencePage));
  }

  downloadG4Table(request: G4DownloadRequest): Observable<G4DownloadResponse> {
    const apiRequest = createDownloadApiRequest(request);

    return this.http
      .post(`${this.downloadApiUrl}/`, apiRequest, {
        responseType: 'blob',
        observe: 'response',
      })
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
      .set('assembly_accession', request.assemblyAccession)
      .set('offset', 0)
      .set('limit', request.limit);

    return this.http
      .get<GeneSearchApiPage>('/api/v1/genes/page', { params })
      .pipe(map((response) => response.genes.map(mapGeneSearchItemToCandidate)));
  }

  getGeneRelations(request: G4GeneRelationsRequest): Observable<G4GeneRelationsResponse> {
    const params = new HttpParams()
      .set('quadruplex_type', request.g4Type)
      .set('offset', 0)
      .set('limit', 500)
      .set('sort', 'start')
      .set('order', 'asc');

    return this.http
      .get<QuadruplexSequenceApiPage>(
        `${this.apiUrl}/${encodeURIComponent(request.assemblyAccession)}/${encodeURIComponent(request.seqid)}`,
        {
          params,
        },
      )
      .pipe(
        map((response) => {
          const items = response.quadruplex_sequences.map(mapQuadruplexSequenceItem);
          return {
            relations: request.starts.map((start) => relationItemForStart(start, items)),
          };
        }),
      );
  }

  getHistogram(request: G4HistogramRequest): Observable<G4HistogramResponse> {
    const params = this.appendCommonFilterParams(
      new HttpParams()
        .set('quadruplex_type', request.g4Type)
        .set('range_start', request.viewport.start)
        .set('range_end', request.viewport.end)
        .set('bin_size', request.viewport.binSize),
      request.filters,
    );

    return this.http.get<G4HistogramResponse>(
      `${this.apiUrl}/${encodeURIComponent(request.assemblyAccession)}/${encodeURIComponent(request.seqid)}/histogram`,
      { params },
    );
  }

  getPositionDistribution(
    request: G4PositionDistributionRequest,
  ): Observable<G4PositionDistributionResponse> {
    const params = new HttpParams()
      .set('quadruplex_type', request.g4Type)
      .set('flank_window', request.flankWindow);

    return this.http.get<G4PositionDistributionResponse>(
      `${this.apiUrl}/${encodeURIComponent(request.assemblyAccession)}/position-distribution`,
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
      params = params.set('quadruplex_type', request.g4Type);
    }

    return this.http
      .get<G4PositionStatisticsApiResponse>(
        `${this.apiUrl}/${encodeURIComponent(request.assemblyAccession)}/position-statistics`,
        { params },
      )
      .pipe(map(normalizePositionStatisticsResponse));
  }
}
