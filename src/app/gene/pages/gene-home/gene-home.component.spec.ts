import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { GeneSearchItem, GeneService } from '../../services/gene.service';
import { GeneHomeComponent } from './gene-home.component';

describe('GeneHomeComponent', () => {
  let fixture: ComponentFixture<GeneHomeComponent>;
  let component: GeneHomeComponent;
  let geneService: jasmine.SpyObj<GeneService>;

  beforeEach(async () => {
    geneService = jasmine.createSpyObj<GeneService>('GeneService', ['searchGenes']);
    geneService.searchGenes.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [GeneHomeComponent],
      providers: [provideRouter([]), { provide: GeneService, useValue: geneService }],
    }).compileComponents();

    fixture = TestBed.createComponent(GeneHomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('calls search service when a non-empty query is submitted', async () => {
    component.searchControl.setValue('ATP6');

    component.onSubmit();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(geneService.searchGenes).toHaveBeenCalledWith('ATP6');
  });

  it('renders search results with species, export, and row navigation', async () => {
    const rows: GeneSearchItem[] = [
      {
        assembly_accession: 'GCF_000001405.39',
        organism_name: 'Homo sapiens',
        seqid: 'NC_012920.1',
        feature_id: 'gene-ATP6',
        feature_start: 1,
        feature_end: 200,
        strand: '+',
        gene_id: 'ATP6',
        gene_name: 'ATP6',
        gene_biotype: 'protein_coding',
        insideOf_gene_g4_count: 1,
        insideOf_genes_upstream_1k_g4_count: 2,
        insideOf_genes_downstream_1k_g4_count: 3,
      },
      {
        assembly_accession: 'GCF_000146045.2',
        organism_name: 'Saccharomyces cerevisiae',
        seqid: 'NC_001133.9',
        feature_id: 'gene-YAL001C',
        feature_start: 300,
        feature_end: 900,
        strand: '-',
        gene_id: 'YAL001C',
        gene_name: 'TFC3',
        gene_biotype: 'protein_coding',
        insideOf_gene_g4_count: 4,
        insideOf_genes_upstream_1k_g4_count: 5,
        insideOf_genes_downstream_1k_g4_count: 6,
      },
    ];

    geneService.searchGenes.and.returnValue(of(rows));
    component.searchControl.setValue('gene');

    component.onSubmit();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.textContent).toContain('Species');
    expect(host.textContent).toContain('Homo sapiens');
    expect(host.textContent).toContain('Gene');
    expect(host.textContent).toContain('Feature ID');
    expect(host.textContent).toContain('Internal G4 count');
    expect(host.textContent).not.toContain('Gene / feature');
    expect(host.textContent).not.toContain('Gene ID');
    expect(host.querySelector('button.export-button')).not.toBeNull();

    const featureLinks = host.querySelectorAll('a.feature-link');
    expect(featureLinks.length).toBe(2);

    const assemblyHref = host.querySelector('a.assembly-link')?.getAttribute('href');
    expect(assemblyHref).toContain('/genome/GCF_000001405.39');

    expect(host.querySelector('a.gene-link')).toBeNull();
    expect(host.querySelector('a.internal-count')).toBeNull();
    expect(host.querySelector('span.internal-count')?.textContent?.trim()).toBe('1');

    const detailHref = host.querySelector('a.detail-action-link')?.getAttribute('href');
    expect(detailHref).toContain('/gene/GCF_000001405.39/NC_012920.1/gene-ATP6');
  });
});
