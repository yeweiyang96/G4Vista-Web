import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Genome {
  assembly_accession: string;
  organism_name: string;
  g4_count?: number;
}

export interface Taxonomy {
  taxon_id: number;
  name: string;
  rank: string;
  lineage?: TaxonomyNode[];
  genomes?: Genome[];
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
  genome_count?: number;
  children?: TaxonomyNode[];
}

export interface GenomeCount {
  taxon_id: number;
  genome_count: number;
}

@Injectable({
  providedIn: 'root',
})
export class TaxonomyService {
  private http = inject(HttpClient);
  private apiUrl = '/api/v1/taxa';
  searchTaxonomy(query: string): Observable<TaxonomySearch[]> {
    return this.http.get<TaxonomySearch[]>(`${this.apiUrl}/?name=${query}`);
  }

  getLineage(taxon_id: number): Observable<TaxonomyNode> {
    return this.http.get<TaxonomyNode>(`${this.apiUrl}/lineage?taxon_id=${taxon_id}`);
  }

  getTaxonomyData(taxon_id: number): Observable<Taxonomy> {
    return this.http.get<Taxonomy>(`${this.apiUrl}/${taxon_id}`);
  }

  getGenomeCounts(taxon_ids: number[]): Observable<GenomeCount[]> {
    const params = taxon_ids.map((id) => `taxon_ids=${id}`).join('&');
    return this.http.get<GenomeCount[]>(`${this.apiUrl}/genomes/counts?${params}`);
  }
}
