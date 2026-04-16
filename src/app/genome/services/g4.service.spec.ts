import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { G4Service } from './g4.service';

describe('G4Service', () => {
  let service: G4Service;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), G4Service],
    });

    service = TestBed.inject(G4Service);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('uses the canonical g4 type in page requests and keeps the response untouched', () => {
    const responseSpy = jasmine.createSpy();

    service
      .getG4Page({
        assemblyAccession: 'GCF_000021765.1',
        g4Type: 'revcomp',
        seqid: 'NC_000001.1',
        pageIndex: 0,
        pageSize: 10,
        sort: 'start',
        order: 'asc',
        tetrads: [2, 3],
        selectedPosition: 'insideOf_gene_revcomp',
        geneQuery: 'geneA',
        minGscore: 12,
        maxGscore: 44,
      })
      .subscribe(responseSpy);

    const request = httpMock.expectOne(
      '/api/v1/g4/GCF_000021765.1/NC_000001.1/revcomp?offset=0&limit=10&sort=start&order=asc&selected_position=insideOf_gene_revcomp&tetrad=2&tetrad=3&min_gscore=12&max_gscore=44&search_gene=geneA',
    );

    expect(request.request.method).toBe('GET');

    request.flush({
      count: 1,
      tetrads_list: [2, 3],
      max_gscore: 44,
      min_gscore: 12,
      g4s: [
        {
          assembly_accession: 'GCF_000021765.1',
          seqid: 'NC_000001.1',
          g4_type: 'revcomp',
          start: 100,
          end: 120,
          length: 20,
          tetrads: 3,
          y1: 1,
          y2: 2,
          y3: 1,
          gscore: 18,
          sequence: 'GGGTTAGGGTTAGGG',
        },
      ],
    });

    expect(responseSpy).toHaveBeenCalledWith(
      jasmine.objectContaining({
        g4s: [jasmine.objectContaining({ g4_type: 'revcomp' })],
      }),
    );
  });

  it('uses the canonical g4 type in gene relation requests', () => {
    service
      .getGeneRelations({
        assemblyAccession: 'GCF_000021765.1',
        g4Type: 'normal',
        seqid: 'NC_000001.1',
        starts: [10, 20],
      })
      .subscribe();

    const request = httpMock.expectOne(
      '/api/v1/g4/GCF_000021765.1/NC_000001.1/normal/gene-relations?start=10&start=20',
    );

    expect(request.request.method).toBe('GET');
    request.flush({ relations: [] });
  });
});
