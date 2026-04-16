import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

export interface RelatedAssemblySummary {
  assembly_accession: string;
  organism_name: string;
  asm_name: string | null;
}

export interface GenomeAssemblyDetail {
  assembly_accession: string;
  organism_name: string;
  asm_name: string | null;
  species_name: string;
  seq_rel_date: string | null;
  seqids: string[];
  taxon_id: number | null;
  related_assemblies: RelatedAssemblySummary[];
  topt_ave: number | null;
}

@Injectable({
  providedIn: 'root',
})
export class GenomeDetailService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/v1/genome';

  getAssembly(assemblyAccession: string): Observable<GenomeAssemblyDetail> {
    return this.http.get<GenomeAssemblyDetail>(
      `${this.apiUrl}/${encodeURIComponent(assemblyAccession)}`,
    );
  }
}
