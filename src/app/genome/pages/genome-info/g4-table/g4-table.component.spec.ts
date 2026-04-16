import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TemplateRef } from '@angular/core';
import { G4TableComponent } from './g4-table.component';
import { EMPTY_G4_PAGE, G4_GENE_POSITION_OPTIONS_BY_TYPE } from '../../../services/g4.service';

describe('G4TableComponent', () => {
  let fixture: ComponentFixture<G4TableComponent>;
  let component: G4TableComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [G4TableComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(G4TableComponent);
    component = fixture.componentInstance;

    fixture.componentRef.setInput('page', EMPTY_G4_PAGE);
    fixture.componentRef.setInput('selectedSeqid', '');
    fixture.componentRef.setInput('selectedPositionLabel', 'Inside gene(G-rich)');
    fixture.componentRef.setInput('sortState', { active: 'start', direction: 'asc' });
    fixture.componentRef.setInput('pageIndex', 0);
    fixture.componentRef.setInput('pageSize', 10);
    fixture.componentRef.setInput('geneRelationsByStart', new Map());
    fixture.componentRef.setInput('genePositionOptions', G4_GENE_POSITION_OPTIONS_BY_TYPE.normal);
    fixture.detectChanges();
  });

  it('binds custom cell templates even when the table is temporarily hidden', () => {
    const columns = component.columns();
    const sequenceColumn = columns.find((column) => column.field === 'sequence');
    const insideGeneColumn = columns.find(
      (column) => column.field === 'gene_relation:insideOf_gene_normal',
    );
    const upstreamGeneColumn = columns.find(
      (column) => column.field === 'gene_relation:insideOf_genes_upstream_100bp_normal',
    );

    expect(sequenceColumn?.cellTemplate).toEqual(jasmine.any(TemplateRef));
    expect(insideGeneColumn?.cellTemplate).toEqual(jasmine.any(TemplateRef));
    expect(insideGeneColumn?.show).toBeTrue();
    expect(upstreamGeneColumn?.show).toBeFalse();
  });

  it('keeps relation column visibility changes from the grid column menu', () => {
    component.onColumnChange([
      ...component
        .columns()
        .filter((column) => column.field !== 'gene_relation:insideOf_gene_normal'),
      {
        ...component
          .columns()
          .find((column) => column.field === 'gene_relation:insideOf_gene_normal')!,
        show: false,
      },
      {
        ...component
          .columns()
          .find((column) => column.field === 'gene_relation:insideOf_genes_upstream_100bp_normal')!,
        show: true,
      },
    ]);

    const columns = component.columns();
    const insideGeneColumn = columns.find(
      (column) => column.field === 'gene_relation:insideOf_gene_normal',
    );
    const upstreamGeneColumn = columns.find(
      (column) => column.field === 'gene_relation:insideOf_genes_upstream_100bp_normal',
    );

    expect(insideGeneColumn?.show).toBeFalse();
    expect(upstreamGeneColumn?.show).toBeTrue();
  });
});
