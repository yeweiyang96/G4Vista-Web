import { AfterViewInit, Component, input, OnInit, ViewChild } from '@angular/core';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';

export interface Genome {
  assembly_name: string;
  name: string;
  g4_count?: number;
}

/**
 * @title Data table with sorting, pagination, and filtering.
 */
@Component({
  selector: 'app-genome-list',
  styleUrl: './genome-list.component.scss',
  templateUrl: './genome-list.component.html',
  imports: [MatFormFieldModule, MatInputModule, MatTableModule, MatSortModule, MatPaginatorModule],
})
export class GenomeListComponent implements AfterViewInit, OnInit {
  displayedColumns: string[] = ['name', 'g4_count'];
  dataSource!: MatTableDataSource<Genome>;
  genomes = input<Genome[]>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  ngOnInit() {
    this.dataSource = new MatTableDataSource(this.genomes());
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
    return this.genomes()?.reduce((acc, genome) => acc + (genome.g4_count || 0), 0);
  }
}
