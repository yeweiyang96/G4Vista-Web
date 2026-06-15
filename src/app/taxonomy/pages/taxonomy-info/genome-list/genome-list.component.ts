import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  signal,
  ViewChild,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxChange, MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { RouterLink } from '@angular/router';
import {
  AssemblyDownloadSetItem,
  AssemblyDownloadSetService,
} from '../../../../download/assembly-download-set.service';

export interface AssemblySummary {
  assembly_accession: string;
  asm_name: string | null;
  organism_name: string;
  genome_length_bp?: number;
  g4_count?: number;
  i_motif_count?: number;
  g4_density_per_mb?: number | null;
  i_motif_density_per_mb?: number | null;
}

/**
 * @title Data table with sorting, pagination, and filtering.
 */
@Component({
  selector: 'app-assembly-list',
  styleUrl: './genome-list.component.scss',
  templateUrl: './genome-list.component.html',
  imports: [
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    RouterLink,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssemblyListComponent implements AfterViewInit {
  displayedColumns: string[] = ['select', 'organism_name', 'asm_name', 'assembly_accession'];
  dataSource = new MatTableDataSource<AssemblySummary>([]);
  assemblies = input<AssemblySummary[]>([]);
  taxonId = input<number | null>(null);
  taxonName = input<string | null>(null);
  selectedAccessions = signal<readonly string[]>([]);
  readonly downloadSet = inject(AssemblyDownloadSetService);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor() {
    effect(() => {
      const assemblies = this.assemblies();
      this.dataSource.data = assemblies;
      this.displayedColumns = hasAssemblyMetrics(assemblies)
        ? [
            'select',
            'organism_name',
            'asm_name',
            'assembly_accession',
            'genome_length_bp',
            'g4_density_per_mb',
            'i_motif_density_per_mb',
          ]
        : ['select', 'organism_name', 'asm_name', 'assembly_accession'];
      this.pruneSelection(assemblies);

      if (this.dataSource.paginator) {
        this.dataSource.paginator.firstPage();
      }
    });
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  isSelected(assemblyAccession: string): boolean {
    return this.selectedAccessions().includes(assemblyAccession);
  }

  isInDownloadSet(assemblyAccession: string): boolean {
    return this.downloadSet.has(assemblyAccession);
  }

  selectedCount(): number {
    return this.selectedAccessions().length;
  }

  visibleRowsSelected(): boolean {
    const visibleRows = this.visibleRows();
    return (
      visibleRows.length > 0 && visibleRows.every((row) => this.isSelected(row.assembly_accession))
    );
  }

  visibleRowsPartiallySelected(): boolean {
    const visibleRows = this.visibleRows();
    return (
      visibleRows.some((row) => this.isSelected(row.assembly_accession)) &&
      !this.visibleRowsSelected()
    );
  }

  toggleAssembly(row: AssemblySummary, event: MatCheckboxChange): void {
    const current = new Set(this.selectedAccessions());
    if (event.checked) {
      current.add(row.assembly_accession);
    } else {
      current.delete(row.assembly_accession);
    }
    this.selectedAccessions.set(Array.from(current));
  }

  toggleVisibleRows(event: MatCheckboxChange): void {
    const current = new Set(this.selectedAccessions());
    for (const row of this.visibleRows()) {
      if (event.checked) {
        current.add(row.assembly_accession);
      } else {
        current.delete(row.assembly_accession);
      }
    }
    this.selectedAccessions.set(Array.from(current));
  }

  addSelectedAssemblies(): void {
    const selectedRows = this.selectedRows();
    if (!selectedRows.length) {
      throw new Error('Cannot add assemblies because no assembly rows are selected.');
    }
    this.downloadSet.addItems(selectedRows.map((row) => this.downloadItem(row)));
  }

  addAllAssemblies(): void {
    const assemblies = this.assemblies();
    if (!assemblies.length) {
      throw new Error('Cannot add assemblies because the current taxon has no assembly rows.');
    }
    this.downloadSet.addItems(assemblies.map((row) => this.downloadItem(row)));
  }

  removeSelectedFromSet(): void {
    const selectedAccessions = this.selectedAccessions();
    if (!selectedAccessions.length) {
      throw new Error('Cannot remove assemblies because no assembly rows are selected.');
    }
    this.downloadSet.removeAccessions(selectedAccessions);
  }

  formatGenomeLength(value: number | undefined): string {
    return value === undefined ? 'N/A' : formatGenomeLength(value);
  }

  formatDensity(value: number | null | undefined): string {
    return value === null || value === undefined ? 'N/A' : DENSITY_FORMATTER.format(value);
  }

  private selectedRows(): readonly AssemblySummary[] {
    const selected = new Set(this.selectedAccessions());
    return this.assemblies().filter((row) => selected.has(row.assembly_accession));
  }

  private visibleRows(): readonly AssemblySummary[] {
    if (this.dataSource.filter) {
      return this.dataSource.filteredData;
    }
    return this.dataSource.data;
  }

  private pruneSelection(assemblies: readonly AssemblySummary[]): void {
    const availableAccessions = new Set(assemblies.map((assembly) => assembly.assembly_accession));
    const selectedAccessions = this.selectedAccessions().filter((accession) =>
      availableAccessions.has(accession),
    );
    if (selectedAccessions.length !== this.selectedAccessions().length) {
      this.selectedAccessions.set(selectedAccessions);
    }
  }

  private downloadItem(row: AssemblySummary): AssemblyDownloadSetItem {
    return {
      assembly_accession: row.assembly_accession,
      organism_name: row.organism_name,
      asm_name: row.asm_name,
      source_taxon_id: this.taxonId(),
      source_taxon_name: this.taxonName(),
    };
  }
}

const DENSITY_FORMATTER = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 2,
  minimumFractionDigits: 0,
});

function hasAssemblyMetrics(assemblies: readonly AssemblySummary[]): boolean {
  return assemblies.some((assembly) => assembly.genome_length_bp !== undefined);
}

function formatGenomeLength(value: number): string {
  if (value >= 1_000_000_000) {
    return `${DENSITY_FORMATTER.format(value / 1_000_000_000)} Gb`;
  }
  if (value >= 1_000_000) {
    return `${DENSITY_FORMATTER.format(value / 1_000_000)} Mb`;
  }
  if (value >= 1_000) {
    return `${DENSITY_FORMATTER.format(value / 1_000)} kb`;
  }
  return `${DENSITY_FORMATTER.format(value)} bp`;
}
