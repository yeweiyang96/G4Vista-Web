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

    service.searchGenes({ searchTerm: 'ATP6' }).subscribe(responseSpy);

    const request = httpMock.expectOne(
      (req) => req.url === '/api/v1/genes/' && req.params.get('search_term') === 'ATP6',
    );

    expect(request.request.method).toBe('GET');

    request.flush([
      {
        assembly_accession: 'GCF_000001405.39',
        organism_name: 'Homo sapiens',
        region_id: 'NC_012920.1',
        feature_id: 'gene-ATP6',
        gene_id: 'ATP6',
        gene_name: null,
        locus_tag: null,
        biotype: 'protein_coding',
        start: 1,
        end: 200,
        strand: '+',
        g4_count: 0,
        i_motif_count: 0,
        quadruplex_sequence_count: 0,
      },
    ]);

    expect(responseSpy).toHaveBeenCalledWith([
      jasmine.objectContaining({
        assembly_accession: 'GCF_000001405.39',
        feature_id: 'gene-ATP6',
      }),
    ]);
  });

  it('adds assembly_accession when provided in gene search', () => {
    service.searchGenes({ searchTerm: 'dnaK', assemblyAccession: 'GCF_1' }).subscribe();

    const request = httpMock.expectOne(
      (req) =>
        req.url === '/api/v1/genes/' &&
        req.params.get('search_term') === 'dnaK' &&
        req.params.get('assembly_accession') === 'GCF_1',
    );

    expect(request.request.method).toBe('GET');
    request.flush([]);
  });

  it('adds taxon_id when provided in gene search', () => {
    service.searchGenes({ searchTerm: 'TP53', taxonId: 9606 }).subscribe();

    const request = httpMock.expectOne(
      (req) =>
        req.url === '/api/v1/genes/' &&
        req.params.get('search_term') === 'TP53' &&
        req.params.get('taxon_id') === '9606',
    );

    expect(request.request.method).toBe('GET');
    request.flush([]);
  });

  it('uses paginated gene search endpoint with offset and limit', () => {
    const responseSpy = jasmine.createSpy();

    service
      .searchGenesPage({ searchTerm: 'dnaK', pageIndex: 2, pageSize: 25 })
      .subscribe(responseSpy);

    const request = httpMock.expectOne(
      (req) =>
        req.url === '/api/v1/genes/page' &&
        req.params.get('search_term') === 'dnaK' &&
        req.params.get('offset') === '2' &&
        req.params.get('limit') === '25',
    );

    expect(request.request.method).toBe('GET');
    request.flush({ genes: [], count: 123 });

    expect(responseSpy).toHaveBeenCalledWith({ genes: [], count: 123 });
  });

  it('downloads the full gene search result set as a blob', () => {
    const responseSpy = jasmine.createSpy();
    const blob = new Blob(['gene,csv']);

    service.downloadGeneSearch({ searchTerm: 'TP53', taxonId: 9606 }).subscribe(responseSpy);

    const request = httpMock.expectOne(
      (req) =>
        req.url === '/api/v1/genes/download' &&
        req.params.get('search_term') === 'TP53' &&
        req.params.get('taxon_id') === '9606',
    );

    expect(request.request.method).toBe('GET');
    expect(request.request.responseType).toBe('blob');
    request.flush(blob, {
      headers: {
        'Content-Disposition': 'attachment; filename="tp53-genes.csv"',
      },
    });

    expect(responseSpy).toHaveBeenCalledWith({
      blob,
      filename: 'tp53-genes.csv',
    });
  });
});
