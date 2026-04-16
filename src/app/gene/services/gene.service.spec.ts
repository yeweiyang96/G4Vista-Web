import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { GeneService } from './gene.service';

describe('GeneService', () => {
  let service: GeneService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), GeneService],
    });

    service = TestBed.inject(GeneService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('uses search_term in gene search requests and returns the payload', () => {
    const responseSpy = jasmine.createSpy();

    service.searchGenes('ATP6').subscribe(responseSpy);

    const request = httpMock.expectOne(
      (req) => req.url === '/api/v1/gene/' && req.params.get('search_term') === 'ATP6',
    );

    expect(request.request.method).toBe('GET');

    request.flush([
      {
        assembly_accession: 'GCF_000001405.39',
        organism_name: 'Homo sapiens',
        seqid: 'NC_012920.1',
        feature_id: 'gene-ATP6',
        gene_id: 'ATP6',
        gene_name: null,
        gene_biotype: 'protein_coding',
        insideOf_gene_normal_count: 0,
        insideOf_genes_upstream_1k_normal_count: 0,
        insideOf_genes_downstream_1k_normal_count: 0,
      },
    ]);

    expect(responseSpy).toHaveBeenCalledWith([
      jasmine.objectContaining({
        assembly_accession: 'GCF_000001405.39',
        feature_id: 'gene-ATP6',
      }),
    ]);
  });
});
