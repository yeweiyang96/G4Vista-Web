import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface GenomeSearch {
  assembly_accession: string;
  asm_name: string;
  organism_name: string;
}

@Injectable({
  providedIn: 'root',
})
export class GenomeSearchService {
  private http = inject(HttpClient);
  private apiUrl = '/api/v1/genome';
  searchGenome(query: string): Observable<GenomeSearch[]> {
    return this.http.get<GenomeSearch[]>(`${this.apiUrl}/?query=${query}`);
  }
}
