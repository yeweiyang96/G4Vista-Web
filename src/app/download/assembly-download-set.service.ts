import { Injectable, computed, effect, signal } from '@angular/core';

const ASSEMBLY_DOWNLOAD_SET_STORAGE_KEY = 'g4vista.assemblyDownloadSet';

export interface AssemblyDownloadSetItem {
  readonly assembly_accession: string;
  readonly organism_name: string;
  readonly asm_name: string | null;
  readonly source_taxon_id: number | null;
  readonly source_taxon_name: string | null;
}

function isAssemblyDownloadSetItem(value: unknown): value is AssemblyDownloadSetItem {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const item = value as Partial<AssemblyDownloadSetItem>;
  return (
    typeof item.assembly_accession === 'string' &&
    typeof item.organism_name === 'string' &&
    (typeof item.asm_name === 'string' || item.asm_name === null) &&
    (typeof item.source_taxon_id === 'number' || item.source_taxon_id === null) &&
    (typeof item.source_taxon_name === 'string' || item.source_taxon_name === null)
  );
}

function readSavedItems(): readonly AssemblyDownloadSetItem[] {
  if (typeof window === 'undefined') {
    return [];
  }
  const rawValue = window.localStorage.getItem(ASSEMBLY_DOWNLOAD_SET_STORAGE_KEY);
  if (rawValue === null) {
    return [];
  }
  const parsedValue: unknown = JSON.parse(rawValue);
  if (!Array.isArray(parsedValue)) {
    throw new Error('Stored assembly download set is not an array.');
  }
  if (!parsedValue.every(isAssemblyDownloadSetItem)) {
    throw new Error('Stored assembly download set contains invalid items.');
  }
  return parsedValue;
}

function itemMap(items: readonly AssemblyDownloadSetItem[]): Map<string, AssemblyDownloadSetItem> {
  return new Map(items.map((item) => [item.assembly_accession, item]));
}

function sortedItems(items: Iterable<AssemblyDownloadSetItem>): readonly AssemblyDownloadSetItem[] {
  return Array.from(items).sort((left, right) =>
    left.assembly_accession.localeCompare(right.assembly_accession, 'en', {
      numeric: true,
      sensitivity: 'base',
    }),
  );
}

@Injectable({
  providedIn: 'root',
})
export class AssemblyDownloadSetService {
  private readonly selectedItems = signal<readonly AssemblyDownloadSetItem[]>(readSavedItems());

  readonly items = this.selectedItems.asReadonly();
  readonly count = computed(() => this.selectedItems().length);
  readonly accessions = computed(() => this.selectedItems().map((item) => item.assembly_accession));

  constructor() {
    effect(() => {
      if (typeof window === 'undefined') {
        return;
      }
      window.localStorage.setItem(
        ASSEMBLY_DOWNLOAD_SET_STORAGE_KEY,
        JSON.stringify(this.selectedItems()),
      );
    });
  }

  has(assemblyAccession: string): boolean {
    return itemMap(this.selectedItems()).has(assemblyAccession);
  }

  addItems(items: readonly AssemblyDownloadSetItem[]): void {
    const nextItems = itemMap(this.selectedItems());
    for (const item of items) {
      nextItems.set(item.assembly_accession, item);
    }
    this.selectedItems.set(sortedItems(nextItems.values()));
  }

  removeAccessions(assemblyAccessions: readonly string[]): void {
    const removeSet = new Set(assemblyAccessions);
    this.selectedItems.set(
      this.selectedItems().filter((item) => !removeSet.has(item.assembly_accession)),
    );
  }

  clear(): void {
    this.selectedItems.set([]);
  }
}
