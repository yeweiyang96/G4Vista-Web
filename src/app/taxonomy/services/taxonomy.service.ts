import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
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
  assembly_taxon_id?: number;
  species_taxon_id?: number | null;
  genome_size?: number | null;
  genome_length_bp?: number;
  g4_count?: number;
  i_motif_count?: number;
  quadruplex_sequence_count?: number;
  g4_density_per_mb?: number | null;
  i_motif_density_per_mb?: number | null;
}

export interface Taxonomy {
  taxon_id: number;
  name: string;
  rank: string;
  assembly_count?: number;
  genome_length_bp?: number;
  g4_count?: number;
  i_motif_count?: number;
  quadruplex_sequence_count?: number;
  quadruplex_density_per_mb?: number | null;
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

export interface AssemblyAccessions {
  taxon_id: number;
  assembly_accessions: string[];
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
  species_name?: string;
  seq_rel_date?: string | null;
  taxon_id?: number | null;
  genome_length_bp: number;
  g4_count: number;
  i_motif_count: number;
  quadruplex_sequence_count?: number;
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
  rank?: string;
  assembly_count: number;
  genome_length_bp: number;
  genome_length_mb: number;
  g4_count?: number;
  i_motif_count?: number;
  quadruplex_sequence_count?: number;
  quadruplex_density_per_mb?: number | null;
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
}

interface AssemblySummaryApi {
  assembly_accession: string;
  organism_name: string;
  assembly_taxon_id: number;
  species_taxon_id: number | null;
  genome_size: number | null;
}

interface TaxonomyApi extends Omit<Taxonomy, 'assemblies'> {
  assemblies: AssemblySummaryApi[];
}

interface TaxonomyQuadruplexPositionStatsApi {
  count: number;
  denominator_bp: number;
  denominator_mode: string | null;
  density_per_mb: number | null;
}

interface TaxonomyQuadruplexPositionCategoryApi {
  key: string;
  label: string;
  quadruplex_types: Partial<Record<G4Type, TaxonomyQuadruplexPositionStatsApi>>;
}

interface TaxonomyQuadruplexAssemblySummaryApi extends AssemblySummaryApi {
  g4_count: number;
  i_motif_count: number;
  quadruplex_sequence_count: number;
  quadruplex_density_per_mb: number | null;
}

interface TaxonomyQuadruplexSummaryApi {
  taxon_id: number;
  rank: string;
  assembly_count: number;
  genome_length_bp: number;
  g4_count: number;
  i_motif_count: number;
  quadruplex_sequence_count: number;
  quadruplex_density_per_mb: number | null;
  position_categories: TaxonomyQuadruplexPositionCategoryApi[];
  assembly_summaries: TaxonomyQuadruplexAssemblySummaryApi[];
}

const TAXONOMY_POSITION_CATEGORY_ORDER: Record<string, number> = {
  gene_inside: 1,
  gene_upstream: 2,
  gene_downstream: 3,
  other: 4,
};

const EMPTY_POSITION_DISTRIBUTION_QUALITY: G4PositionDistributionQuality = {
  regions_total_count: 0,
  regions_status_ok_count: 0,
  regions_length_mismatch_count: 0,
  warnings: [],
};

const EMPTY_DENSITY_DISTRIBUTION: TaxonomyG4DensityDistribution = {
  min_density_per_mb: null,
  q1_density_per_mb: null,
  median_density_per_mb: null,
  q3_density_per_mb: null,
  max_density_per_mb: null,
};

function densityPerMb(count: number, genomeLengthBp: number): number | null {
  if (genomeLengthBp <= 0) {
    return null;
  }
  return count / (genomeLengthBp / 1_000_000);
}

function densityRatio(g4Density: number | null, iMotifDensity: number | null): number | null {
  if (g4Density === null || iMotifDensity === null || iMotifDensity === 0) {
    return null;
  }
  return g4Density / iMotifDensity;
}

function mapAssemblySummary(assembly: AssemblySummaryApi): AssemblySummary {
  return {
    assembly_accession: assembly.assembly_accession,
    organism_name: assembly.organism_name,
    asm_name: null,
    assembly_taxon_id: assembly.assembly_taxon_id,
    species_taxon_id: assembly.species_taxon_id,
    genome_size: assembly.genome_size,
    genome_length_bp: assembly.genome_size ?? undefined,
  };
}

function mapTaxonomy(taxonomy: TaxonomyApi): Taxonomy {
  return {
    ...taxonomy,
    assemblies: taxonomy.assemblies.map(mapAssemblySummary),
  };
}

function mapTaxonomyAssemblySummary(
  assembly: TaxonomyQuadruplexAssemblySummaryApi,
): TaxonomyG4AssemblySummary {
  const genomeLengthBp = assembly.genome_size ?? 0;
  const g4Density = densityPerMb(assembly.g4_count, genomeLengthBp);
  const iMotifDensity = densityPerMb(assembly.i_motif_count, genomeLengthBp);
  return {
    ...mapAssemblySummary(assembly),
    species_name: assembly.organism_name,
    seq_rel_date: null,
    taxon_id: assembly.assembly_taxon_id,
    genome_length_bp: genomeLengthBp,
    g4_count: assembly.g4_count,
    i_motif_count: assembly.i_motif_count,
    quadruplex_sequence_count: assembly.quadruplex_sequence_count,
    g4_density_per_mb: g4Density,
    i_motif_density_per_mb: iMotifDensity,
  };
}

function categoryDescription(categoryKey: string): string {
  if (categoryKey === 'gene_inside') {
    return 'Predicted motif sites that fall within annotated gene intervals.';
  }
  if (categoryKey === 'gene_upstream') {
    return 'Predicted motif sites in the selected upstream gene flank.';
  }
  if (categoryKey === 'gene_downstream') {
    return 'Predicted motif sites in the selected downstream gene flank.';
  }
  return 'Predicted motif sites outside genes and selected gene flanks.';
}

function mapPositionCategory(
  category: TaxonomyQuadruplexPositionCategoryApi,
  g4Type: G4Type,
  totalCount: number,
): G4PositionCategory {
  const stats = category.quadruplex_types[g4Type];
  const count = stats?.count ?? 0;
  return {
    key: category.key,
    label: category.label,
    count,
    ratio: totalCount > 0 ? count / totalCount : 0,
    precedence_rank: TAXONOMY_POSITION_CATEGORY_ORDER[category.key] ?? 99,
    description: categoryDescription(category.key),
  };
}

function mapTaxonomySummary(
  summary: TaxonomyQuadruplexSummaryApi,
  request: TaxonomyG4SummaryRequest,
): TaxonomyG4Summary {
  const g4Density = densityPerMb(summary.g4_count, summary.genome_length_bp);
  const iMotifDensity = densityPerMb(summary.i_motif_count, summary.genome_length_bp);
  const selectedTotal = request.g4Type === 'g4' ? summary.g4_count : summary.i_motif_count;
  return {
    taxon_id: summary.taxon_id,
    comparison_mode: summary.assembly_count === 1 ? 'single_assembly' : 'multi_assembly',
    rank: summary.rank,
    assembly_count: summary.assembly_count,
    genome_length_bp: summary.genome_length_bp,
    genome_length_mb: summary.genome_length_bp / 1_000_000,
    g4_count: summary.g4_count,
    i_motif_count: summary.i_motif_count,
    quadruplex_sequence_count: summary.quadruplex_sequence_count,
    quadruplex_density_per_mb: summary.quadruplex_density_per_mb,
    motifs: {
      g4: {
        count: summary.g4_count,
        density_per_mb: g4Density,
      },
      'i-motif': {
        count: summary.i_motif_count,
        density_per_mb: iMotifDensity,
      },
    },
    g4_i_motif_density_ratio: densityRatio(g4Density, iMotifDensity),
    density_distributions: {
      g4: EMPTY_DENSITY_DISTRIBUTION,
      'i-motif': EMPTY_DENSITY_DISTRIBUTION,
    },
    assembly_summaries: summary.assembly_summaries.map(mapTaxonomyAssemblySummary),
    position_distribution: {
      g4_type: request.g4Type,
      total_count: selectedTotal,
      categories: summary.position_categories.map((category) =>
        mapPositionCategory(category, request.g4Type, selectedTotal),
      ),
      gene_biotype_breakdown: [],
    },
    filters: {
      flank_window: request.flankWindow,
      counting_mode: 'exclusive',
    },
    quality: EMPTY_POSITION_DISTRIBUTION_QUALITY,
  };
}

function appendTaxonIds(params: HttpParams, taxonIds: readonly number[]): HttpParams {
  let nextParams = params;
  for (const taxonId of taxonIds) {
    nextParams = nextParams.append('taxon_ids', taxonId);
  }
  return nextParams;
}

@Injectable({
  providedIn: 'root',
})
export class TaxonomyService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/v1/taxa';

  searchTaxonomy(query: string): Observable<TaxonomySearch[]> {
    const params = new HttpParams().set('query', query);
    return this.http.get<TaxonomySearch[]>(`${this.apiUrl}/`, { params });
  }

  getLineage(taxon_id: number): Observable<TaxonomyNode> {
    const params = new HttpParams().set('taxon_id', taxon_id);
    return this.http.get<TaxonomyNode>(`${this.apiUrl}/lineage`, { params });
  }

  getTaxonomyData(taxon_id: number): Observable<Taxonomy> {
    return this.http.get<TaxonomyApi>(`${this.apiUrl}/${taxon_id}`).pipe(map(mapTaxonomy));
  }

  getAssemblyCounts(taxon_ids: number[]): Observable<AssemblyCount[]> {
    const params = appendTaxonIds(new HttpParams(), taxon_ids);
    return this.http.get<AssemblyCount[]>(`${this.apiUrl}/genomes/counts`, { params });
  }

  getAssemblyAccessions(taxon_ids: number[]): Observable<AssemblyAccessions[]> {
    const params = appendTaxonIds(new HttpParams(), taxon_ids);
    return this.http.get<AssemblyAccessions[]>(`${this.apiUrl}/genomes/accessions`, { params });
  }

  getTaxonomyG4Summary(request: TaxonomyG4SummaryRequest): Observable<TaxonomyG4Summary> {
    return this.http
      .get<TaxonomyQuadruplexSummaryApi>(
        `${this.apiUrl}/${encodeURIComponent(request.taxonId)}/quadruplex-summary`,
      )
      .pipe(map((summary) => mapTaxonomySummary(summary, request)));
  }
}
