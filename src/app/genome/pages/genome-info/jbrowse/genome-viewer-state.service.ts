import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class GenomeViewerStateService {
  private readonly assemblyNameSignal = signal('GCF_000001405.40');
  private readonly regionSignal = signal('NC_000001.11:1..100000');

  readonly assemblyName = this.assemblyNameSignal.asReadonly();
  readonly region = this.regionSignal.asReadonly();

  setAssemblyName(assemblyName: string): void {
    this.assemblyNameSignal.set(assemblyName);
  }

  setRegion(region: string): void {
    this.regionSignal.set(region);
  }

  resetSession(assemblyName = 'GCF_000001405.40', region = 'NC_000001.11:1..100000'): void {
    this.assemblyNameSignal.set(assemblyName);
    this.regionSignal.set(region);
  }
}
