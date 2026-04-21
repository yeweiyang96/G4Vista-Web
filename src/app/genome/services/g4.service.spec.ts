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

  it('uses the canonical g4 type in seqid browse requests and keeps the response untouched', () => {
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
        minGscore: 12,
        maxGscore: 44,
      })
      .subscribe(responseSpy);

    const request = httpMock.expectOne(
      '/api/v1/g4/GCF_000021765.1/NC_000001.1/revcomp?offset=0&limit=10&sort=start&order=asc&tetrads=2&tetrads=3&min_gscore=12&max_gscore=44',
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

  it('uses the canonical g4 type in assembly browse requests and keeps the response untouched', () => {
    const responseSpy = jasmine.createSpy();

    service
      .getAssemblyG4Page({
        assemblyAccession: 'GCF_000021765.1',
        g4Type: 'revcomp',
        pageIndex: 0,
        pageSize: 10,
        sort: 'start',
        order: 'asc',
        tetrads: [2, 3],
        minGscore: 12,
        maxGscore: 44,
      })
      .subscribe(responseSpy);

    const request = httpMock.expectOne(
      '/api/v1/g4/GCF_000021765.1/revcomp?offset=0&limit=10&sort=start&order=asc&tetrads=2&tetrads=3&min_gscore=12&max_gscore=44',
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

  it('uses the assembly-scoped gene search endpoint and keeps the response untouched', () => {
    const responseSpy = jasmine.createSpy();

    service
      .getGeneSearchPage({
        assemblyAccession: 'GCF_000021765.1',
        g4Type: 'normal',
        pageIndex: 2,
        pageSize: 20,
        sort: 'gscore',
        order: 'desc',
        tetrads: [3],
        minGscore: 17,
        maxGscore: 90,
        selectedFeatureId: 'geneA',
        selectedPosition: 'insideOf_gene_normal',
      })
      .subscribe(responseSpy);

    const request = httpMock.expectOne(
      '/api/v1/g4/GCF_000021765.1/normal/gene-search?offset=2&limit=20&sort=gscore&order=desc&tetrads=3&min_gscore=17&max_gscore=90&selected_feature_id=geneA&selected_position=insideOf_gene_normal',
    );

    expect(request.request.method).toBe('GET');

    request.flush({
      count: 0,
      tetrads_list: [3],
      max_gscore: 90,
      min_gscore: 17,
      g4s: [],
    });

    expect(responseSpy).toHaveBeenCalledWith(
      jasmine.objectContaining({
        count: 0,
        tetrads_list: [3],
      }),
    );
  });

  it('uses gene candidate endpoint with selected position and default limit', () => {
    const responseSpy = jasmine.createSpy();

    service
      .getGeneCandidates({
        assemblyAccession: 'GCF_000021765.1',
        g4Type: 'normal',
        selectedPosition: 'insideOf_gene_normal',
        searchTerm: 'dna',
      })
      .subscribe(responseSpy);

    const request = httpMock.expectOne(
      '/api/v1/g4/GCF_000021765.1/normal/gene-candidates?search_term=dna&selected_position=insideOf_gene_normal&limit=20',
    );

    expect(request.request.method).toBe('GET');

    request.flush([
      {
        feature_id: 'dnaK',
        seqid: 'chr2',
        gene_name: 'dnaK',
        locus_tag: 'LOC_001',
        gene_biotype: 'protein_coding',
      },
    ]);

    expect(responseSpy).toHaveBeenCalledWith([
      jasmine.objectContaining({
        feature_id: 'dnaK',
        seqid: 'chr2',
      }),
    ]);
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

  it('builds histogram requests with range and filter params', () => {
    service
      .getHistogram({
        assemblyAccession: 'GCF_000021765.1',
        seqid: 'NC_000001.1',
        g4Type: 'normal',
        viewport: {
          start: 1000,
          end: 5000,
          binSize: 200,
        },
        filters: {
          tetrads: [2, 4],
          minGscore: 12,
          maxGscore: 40,
          overlap: true,
        },
      })
      .subscribe();

    const request = httpMock.expectOne(
      '/api/v1/g4/GCF_000021765.1/NC_000001.1/normal/histogram?range_start=1000&range_end=5000&bin_size=200&tetrads=2&tetrads=4&min_gscore=12&max_gscore=40&overlap=true',
    );

    expect(request.request.method).toBe('GET');
    request.flush({
      bins: [],
      range_start: 1000,
      range_end: 5000,
      bin_size: 200,
      total_count: 0,
    });
  });

  it('builds position distribution requests with submitted filters', () => {
    service
      .getPositionDistribution({
        assemblyAccession: 'GCF_000021765.1',
        g4Type: 'normal',
        tetrads: [2, 4],
        minGscore: 12,
        maxGscore: 40,
        overlap: true,
        flankWindow: 500,
        includeFeatureBreakdown: false,
      })
      .subscribe();

    const request = httpMock.expectOne(
      '/api/v1/g4/GCF_000021765.1/normal/position-distribution?flank_window=500&include_feature_breakdown=false&tetrads=2&tetrads=4&min_gscore=12&max_gscore=40&overlap=true',
    );

    expect(request.request.method).toBe('GET');
    request.flush({
      assembly_accession: 'GCF_000021765.1',
      g4_type: 'normal',
      filters: {
        tetrads: [2, 4],
        min_gscore: 12,
        max_gscore: 40,
        overlap: true,
        flank_window: 500,
        counting_mode: 'exclusive',
      },
      total_count: 0,
      categories: [],
      feature_breakdown: [],
      quality: {
        regions_total_count: 0,
        regions_status_ok_count: 0,
        regions_length_mismatch_count: 0,
        warnings: [],
      },
    });
  });
});
