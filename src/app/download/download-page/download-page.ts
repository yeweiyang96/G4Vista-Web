import { DOCUMENT } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxChange, MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import {
  AssemblyDownloadSetItem,
  AssemblyDownloadSetService,
} from '../assembly-download-set.service';
import { DownloadService } from '../download.service';
import type { G4DownloadColumn, G4SortField, G4Type } from '../../genome/services/g4.service';

interface ColumnOption {
  readonly value: G4DownloadColumn;
  readonly label: string;
}

interface SortOption {
  readonly value: G4SortField;
  readonly label: string;
}

const MOTIF_TYPE_OPTIONS: readonly { value: G4Type; label: string }[] = [
  { value: 'g4', label: 'G4' },
  { value: 'i-motif', label: 'i-motif' },
];
const COLUMN_OPTIONS: readonly ColumnOption[] = [
  { value: 'seqid', label: 'Sequence / region' },
  { value: 'start', label: 'Start' },
  { value: 'end', label: 'End' },
  { value: 'length', label: 'Length' },
  { value: 'tetrads', label: 'G-tetrads' },
  { value: 'score', label: 'Score' },
  { value: 'sequence', label: 'Sequence' },
  { value: 'gene_relation:insideOf_gene_g4', label: 'Inside gene relation (G4)' },
];
const DEFAULT_COLUMNS: readonly G4DownloadColumn[] = [
  'seqid',
  'start',
  'end',
  'length',
  'tetrads',
  'score',
  'sequence',
];
const SORT_OPTIONS: readonly SortOption[] = [
  { value: 'start', label: 'Sequence and start' },
  { value: 'score', label: 'Score' },
  { value: 'tetrads', label: 'G-tetrads' },
  { value: 'length', label: 'Length' },
];
const INTEGER_LIST_PATTERN = /^\d+(?:[\s,]+\d+)*$/;
const NON_NEGATIVE_INTEGER_PATTERN = /^\d+$/;

function parseIntegerList(rawValue: string): number[] {
  const value = rawValue.trim();
  if (!value) {
    return [];
  }
  if (!INTEGER_LIST_PATTERN.test(value)) {
    throw new Error('Tetrads must be a comma-separated list of non-negative integers.');
  }
  return value.split(/[\s,]+/).map((item) => Number(item));
}

function parseOptionalInteger(rawValue: string, label: string): number | null {
  const value = rawValue.trim();
  if (!value) {
    return null;
  }
  if (!NON_NEGATIVE_INTEGER_PATTERN.test(value)) {
    throw new Error(`${label} must be a non-negative integer.`);
  }
  return Number(value);
}

function downloadErrorMessage(error: unknown): string {
  if (!(error instanceof HttpErrorResponse)) {
    return 'Package download failed. Check the selected assemblies and package options.';
  }
  if (error.status === 422) {
    return 'Package request was rejected (422). Check selected assemblies, motif types, filters, and columns.';
  }
  if (error.status === 503) {
    return 'Package generation is unavailable (503). Refresh the gene relation source before downloading relation columns.';
  }
  return `Package download failed with HTTP ${error.status}.`;
}

@Component({
  selector: 'app-download-page',
  imports: [
    FormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    RouterLink,
  ],
  templateUrl: './download-page.html',
  styleUrl: './download-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DownloadPage {
  private readonly document = inject(DOCUMENT);
  private readonly downloadService = inject(DownloadService);
  readonly assemblySet = inject(AssemblyDownloadSetService);

  readonly motifTypeOptions = MOTIF_TYPE_OPTIONS;
  readonly columnOptions = COLUMN_OPTIONS;
  readonly sortOptions = SORT_OPTIONS;
  readonly selectedMotifTypes = signal<readonly G4Type[]>(['g4', 'i-motif']);
  readonly selectedColumns = signal<readonly G4DownloadColumn[]>(DEFAULT_COLUMNS);
  readonly tetradsInput = signal('');
  readonly minScoreInput = signal('');
  readonly maxScoreInput = signal('');
  readonly sortField = signal<G4SortField>('start');
  readonly sortOrder = signal<'asc' | 'desc'>('asc');
  readonly isDownloading = signal(false);
  readonly errorMessage = signal('');
  readonly canCreatePackage = computed(
    () =>
      this.assemblySet.count() > 0 &&
      this.selectedMotifTypes().length > 0 &&
      this.selectedColumns().length > 0 &&
      !this.isDownloading(),
  );

  removeAssembly(item: AssemblyDownloadSetItem): void {
    this.assemblySet.removeAccessions([item.assembly_accession]);
  }

  clearSet(): void {
    this.assemblySet.clear();
  }

  toggleMotifType(value: G4Type, event: MatCheckboxChange): void {
    this.selectedMotifTypes.set(
      this.toggledValues(this.selectedMotifTypes(), value, event.checked),
    );
  }

  toggleColumn(value: G4DownloadColumn, event: MatCheckboxChange): void {
    this.selectedColumns.set(this.toggledValues(this.selectedColumns(), value, event.checked));
  }

  isMotifTypeSelected(value: G4Type): boolean {
    return this.selectedMotifTypes().includes(value);
  }

  isColumnSelected(value: G4DownloadColumn): boolean {
    return this.selectedColumns().includes(value);
  }

  createPackage(): void {
    if (!this.canCreatePackage()) {
      throw new Error(
        'Cannot create a G4 package until assemblies, motif types, and columns are selected.',
      );
    }

    let tetrads: number[];
    let minScore: number | null;
    let maxScore: number | null;
    try {
      tetrads = parseIntegerList(this.tetradsInput());
      minScore = parseOptionalInteger(this.minScoreInput(), 'Minimum score');
      maxScore = parseOptionalInteger(this.maxScoreInput(), 'Maximum score');
    } catch (error) {
      this.errorMessage.set(
        error instanceof Error ? error.message : 'Package filters are invalid.',
      );
      return;
    }

    this.errorMessage.set('');
    this.isDownloading.set(true);
    this.downloadService
      .createG4Package({
        assembly_accessions: this.assemblySet.accessions(),
        taxon_ids: [],
        g4_types: this.selectedMotifTypes(),
        tetrads,
        min_score: minScore,
        max_score: maxScore,
        sort: this.sortField(),
        order: this.sortOrder(),
        columns: this.selectedColumns(),
      })
      .pipe(finalize(() => this.isDownloading.set(false)))
      .subscribe({
        next: (download) => this.saveBlob(download.blob, download.filename),
        error: (error: unknown) => this.errorMessage.set(downloadErrorMessage(error)),
      });
  }

  private toggledValues<T extends string>(
    values: readonly T[],
    value: T,
    checked: boolean,
  ): readonly T[] {
    if (checked) {
      return values.includes(value) ? values : [...values, value];
    }
    return values.filter((item) => item !== value);
  }

  private saveBlob(blob: Blob, filename: string): void {
    const view = this.document.defaultView;
    if (!view) {
      throw new Error('Cannot save G4 package because the browser window is unavailable.');
    }
    const body = this.document.body;
    if (!body) {
      throw new Error('Cannot save G4 package because the document body is unavailable.');
    }
    const objectUrl = view.URL.createObjectURL(blob);
    const link = this.document.createElement('a');
    link.href = objectUrl;
    link.download = filename;

    try {
      body.appendChild(link);
      link.click();
    } finally {
      link.remove();
      view.URL.revokeObjectURL(objectUrl);
    }
  }
}
