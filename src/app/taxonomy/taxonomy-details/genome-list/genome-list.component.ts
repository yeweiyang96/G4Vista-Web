import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  input,
  OnInit,
  ViewChild,
} from '@angular/core';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';

export interface AssemblySummary {
  assembly_accession: string;
  organism_name: string;
  g4_count?: number;
}

/**
 * @title Data table with sorting, pagination, and filtering.
 */
@Component({
  selector: 'app-assembly-list',
  styleUrl: './genome-list.component.scss',
  templateUrl: './genome-list.component.html',
  imports: [MatFormFieldModule, MatInputModule, MatTableModule, MatSortModule, MatPaginatorModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssemblyListComponent implements AfterViewInit, OnInit {
  displayedColumns: string[] = ['organism_name', 'g4_count'];
  dataSource!: MatTableDataSource<AssemblySummary>;
  assemblies = input<AssemblySummary[]>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  ngOnInit() {
    this.dataSource = new MatTableDataSource(this.assemblies());
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }
  getTotalG4Count() {
    return this.assemblies()?.reduce((acc, assembly) => acc + (assembly.g4_count || 0), 0);
  }
}
