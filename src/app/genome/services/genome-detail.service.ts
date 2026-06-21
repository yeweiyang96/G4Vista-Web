import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import type { GenomeAssemblyOverview, GenomeAssemblyOverviewApi } from './genome-search.service';
import { mapAssemblyOverview } from './genome-search.service';

export interface GenomeAssemblyDetail {
  assembly_accession: string;
  organism_name: string;
  asm_name: string | null;
  species_name: string;
  seq_rel_date: string | null;
  region_ids?: string[];
  region_lengths?: Record<string, number>;
  seqids: string[];
  seqid_lengths: Record<string, number>;
  regions?: GenomeAssemblyRegion[];
  taxon_id: number | null;
  species_taxon_id?: number | null;
  genome_size?: number | null;
  default_gene_flank_window: number;
}

export interface GenomeAssemblyRegion {
  region_id?: string;
  name?: string;
  length?: number | null;
  source?: string;
  strand?: string;
  is_circular?: boolean;
  has_quadruplex_sequence?: boolean;
  status?: string;
  seqid: string;
  accession_name: string;
  fna_header: string;
  region_length: number | null;
}

interface GenomeAssemblyRegionApi {
  region_id: string;
  name: string;
  fna_header: string;
  length: number | null;
  source: string;
  strand: string;
  is_circular: boolean;
  has_quadruplex_sequence: boolean;
  status: string;
}

interface GenomeAssemblyDetailApi {
  assembly_accession: string;
  organism_name: string;
  asm_name: string | null;
  species_name: string;
  seq_rel_date: string | null;
  region_ids: string[];
  region_lengths: Record<string, number>;
  regions: GenomeAssemblyRegionApi[];
  taxon_id: number | null;
  species_taxon_id: number | null;
  genome_size: number | null;
  default_gene_flank_window: number;
}

function mapAssemblyRegion(region: GenomeAssemblyRegionApi): GenomeAssemblyRegion {
  return {
    ...region,
    seqid: region.region_id,
    accession_name: region.name,
    region_length: region.length,
  };
}

function mapAssemblyDetail(detail: GenomeAssemblyDetailApi): GenomeAssemblyDetail {
  return {
    ...detail,
    seqids: detail.region_ids,
    seqid_lengths: detail.region_lengths,
    regions: detail.regions.map(mapAssemblyRegion),
  };
}

@Injectable({
  providedIn: 'root',
})
export class GenomeDetailService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/v1/genome';

  getAssembly(assemblyAccession: string): Observable<GenomeAssemblyDetail> {
    return this.http
      .get<GenomeAssemblyDetailApi>(`${this.apiUrl}/${encodeURIComponent(assemblyAccession)}`)
      .pipe(map(mapAssemblyDetail));
  }

  getAssemblyOverview(assemblyAccession: string): Observable<GenomeAssemblyOverview> {
    return this.http
      .get<GenomeAssemblyOverviewApi>(
        `${this.apiUrl}/${encodeURIComponent(assemblyAccession)}/overview`,
      )
      .pipe(map(mapAssemblyOverview));
  }
}
