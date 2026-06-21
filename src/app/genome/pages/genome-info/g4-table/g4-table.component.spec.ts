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
    fixture.componentRef.setInput('filterScopeLabel', 'Inside gene (G4)');
    fixture.componentRef.setInput('filterSelectedGeneLabel', 'Any');
    fixture.componentRef.setInput('hasSelectedGene', false);
    fixture.componentRef.setInput('filterSelectedTetrads', []);
    fixture.componentRef.setInput('filterMinScore', undefined);
    fixture.componentRef.setInput('filterMaxScore', undefined);
    fixture.componentRef.setInput('showAccessionIdColumn', false);
    fixture.componentRef.setInput('sortState', { active: 'start', direction: 'asc' });
    fixture.componentRef.setInput('pageIndex', 0);
    fixture.componentRef.setInput('pageSize', 10);
    fixture.componentRef.setInput('geneRelationsByRowKey', new Map());
    fixture.componentRef.setInput('genePositionOptions', G4_GENE_POSITION_OPTIONS_BY_TYPE.g4);
    fixture.detectChanges();
  });

  it('binds custom cell templates and keeps default relation visibility', () => {
    const columns = component.columns();
    const sequenceColumn = columns.find((column) => column.field === 'sequence');
    const seqidColumn = columns.find((column) => column.field === 'seqid');
    const insideGeneColumn = columns.find(
      (column) => column.field === 'gene_relation:insideOf_gene_g4',
    );
    const upstreamGeneColumn = columns.find(
      (column) => column.field === 'gene_relation:insideOf_genes_upstream_100bp_g4',
    );

    expect(seqidColumn).toBeUndefined();
    expect(sequenceColumn?.cellTemplate).toEqual(jasmine.any(TemplateRef));
    expect(insideGeneColumn?.cellTemplate).toEqual(jasmine.any(TemplateRef));
    expect(insideGeneColumn?.show).toBeTrue();
    expect(upstreamGeneColumn?.show).toBeFalse();
  });

  it('shows the sequence region column only when requested', () => {
    fixture.componentRef.setInput('showAccessionIdColumn', true);
    fixture.detectChanges();

    const seqidColumn = component.columns().find((column) => column.field === 'seqid');

    expect(seqidColumn?.header).toBe('Sequence / region');
    expect(seqidColumn?.show).toBeTrue();
  });

  it('keeps base and relation column visibility changes from the grid column menu', () => {
    fixture.componentRef.setInput('showAccessionIdColumn', true);
    fixture.detectChanges();

    component.onColumnChange([
      {
        ...component.columns().find((column) => column.field === 'seqid')!,
        show: false,
      },
      {
        ...component.columns().find((column) => column.field === 'sequence')!,
        show: false,
      },
      {
        ...component
          .columns()
          .find((column) => column.field === 'gene_relation:insideOf_genes_upstream_100bp_g4')!,
        show: true,
      },
    ]);

    const columns = component.columns();

    expect(columns.find((column) => column.field === 'seqid')?.show).toBeFalse();
    expect(columns.find((column) => column.field === 'sequence')?.show).toBeFalse();
    expect(
      columns.find((column) => column.field === 'gene_relation:insideOf_genes_upstream_100bp_g4')
        ?.show,
    ).toBeTrue();
  });

  it('emits the current visible columns when downloading', () => {
    const emittedColumns: string[][] = [];
    component.downloadRequested.subscribe((columns) => emittedColumns.push([...columns]));

    component.onColumnChange([
      {
        ...component.columns().find((column) => column.field === 'sequence')!,
        show: false,
      },
      {
        ...component
          .columns()
          .find((column) => column.field === 'gene_relation:insideOf_genes_upstream_100bp_g4')!,
        show: true,
      },
    ]);
    component.onDownload();

    expect(emittedColumns.at(-1)).toContain('start');
    expect(emittedColumns.at(-1)).not.toContain('sequence');
    expect(emittedColumns.at(-1)).toContain('gene_relation:insideOf_genes_upstream_100bp_g4');
  });

  it('uses seqid:start composite keys for relation hits', () => {
    fixture.componentRef.setInput(
      'geneRelationsByRowKey',
      new Map([
        [
          'NC_000001.1:100',
          {
            insideOf_gene_g4: [
              { feature_id: 'geneA', label: 'Gene A', gene_biotype: 'protein_coding' },
            ],
          },
        ],
      ]),
    );
    fixture.detectChanges();

    expect(
      component.relationHits(
        {
          quadruplex_sequence_id: 'NC_000001.1-100',
          assembly_accession: 'GCF_1',
          region_id: 'NC_000001.1',
          seqid: 'NC_000001.1',
          quadruplex_type: 'g4',
          g4_type: 'g4',
          start: 100,
          end: 120,
          length: 21,
          tetrads: 3,
          y1: 1,
          y2: 1,
          y3: 1,
          score: 18,
          sequence: 'GGGTTAGGGTTAGGGTTAGGG',
          strand: '+',
          gene_ids: '',
          gene_names: '',
          gene_biotypes: '',
          relation_categories: '',
          feature_types: '',
          feature_ids: '',
        },
        'insideOf_gene_g4',
      ),
    ).toEqual([{ feature_id: 'geneA', label: 'Gene A', gene_biotype: 'protein_coding' }]);
  });

  it('derives default chip labels from the active filters and page stats', () => {
    fixture.componentRef.setInput('page', {
      ...EMPTY_G4_PAGE,
      min_score: 10,
      max_score: 55,
    });
    fixture.detectChanges();

    expect(component.geneChipLabel()).toBe('Any');
    expect(component.tetradsChipLabel()).toBe('All');
    expect(component.scoreChipLabel()).toBe('10-55');
  });

  it('hides the scope chip until a gene is selected', () => {
    expect(component.hasGeneSelection()).toBeFalse();
    expect(fixture.nativeElement.textContent).not.toContain('Scope:');

    fixture.componentRef.setInput('hasSelectedGene', true);
    fixture.componentRef.setInput('filterSelectedGeneLabel', 'dnaK (dnaK) [chr2]');
    fixture.detectChanges();

    expect(component.hasGeneSelection()).toBeTrue();
    expect(fixture.nativeElement.textContent).toContain('Scope: Inside gene (G4)');
  });

  it('shows close icons only for non-default chips', () => {
    const getCloseIconCount = () => fixture.nativeElement.querySelectorAll('.filter-chip-icon').length;

    expect(getCloseIconCount()).toBe(0);

    fixture.componentRef.setInput('hasSelectedGene', true);
    fixture.componentRef.setInput('filterSelectedGeneLabel', 'dnaK (dnaK) [chr2]');
    fixture.componentRef.setInput('filterSelectedTetrads', [2, 4]);
    fixture.componentRef.setInput('filterMinScore', 12);
    fixture.componentRef.setInput('filterMaxScore', 28);
    fixture.detectChanges();

    expect(getCloseIconCount()).toBe(4);
    expect(fixture.nativeElement.textContent).toContain('close');
  });
});
