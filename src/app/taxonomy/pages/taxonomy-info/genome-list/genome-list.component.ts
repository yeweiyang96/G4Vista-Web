import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  effect,
  input,
  ViewChild,
} from '@angular/core';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { RouterLink } from '@angular/router';

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
    MatFormFieldModule,
    MatInputModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    RouterLink,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssemblyListComponent implements AfterViewInit {
  displayedColumns: string[] = ['organism_name', 'asm_name', 'assembly_accession'];
  dataSource = new MatTableDataSource<AssemblySummary>([]);
  assemblies = input<AssemblySummary[]>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor() {
    effect(() => {
      const assemblies = this.assemblies();
      this.dataSource.data = assemblies;
      this.displayedColumns = hasAssemblyMetrics(assemblies)
        ? [
            'organism_name',
            'asm_name',
            'assembly_accession',
            'genome_length_bp',
            'g4_density_per_mb',
            'i_motif_density_per_mb',
          ]
        : ['organism_name', 'asm_name', 'assembly_accession'];

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

  formatGenomeLength(value: number | undefined): string {
    return value === undefined ? 'N/A' : formatGenomeLength(value);
  }

  formatDensity(value: number | null | undefined): string {
    return value === null || value === undefined ? 'N/A' : DENSITY_FORMATTER.format(value);
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
