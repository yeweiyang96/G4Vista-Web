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

  it('uses the current region-scoped quadruplex endpoint and maps API fields', () => {
    const responseSpy = jasmine.createSpy();

    service
      .getG4Page({
        assemblyAccession: 'GCF_000021765.1',
        g4Type: 'i-motif',
        seqid: 'NC_000001.1',
        pageIndex: 0,
        pageSize: 10,
        sort: 'start',
        order: 'asc',
        tetrads: [2, 3],
        minScore: 12,
        maxScore: 44,
      })
      .subscribe(responseSpy);

    const request = httpMock.expectOne(
      '/api/v1/quadruplex-sequences/GCF_000021765.1/NC_000001.1?offset=0&limit=10&sort=start&order=asc&tetrads=2&tetrads=3&min_score=12&max_score=44&quadruplex_type=i-motif',
    );

    expect(request.request.method).toBe('GET');

    request.flush({
      count: 1,
      tetrads_list: [2, 3],
      max_score: 44,
      min_score: 12,
      quadruplex_sequences: [
        {
          quadruplex_sequence_id: 'qs1',
          assembly_accession: 'GCF_000021765.1',
          region_id: 'NC_000001.1',
          quadruplex_type: 'i-motif',
          start: 100,
          end: 120,
          length: 20,
          tetrads: 3,
          y1: null,
          y2: 2,
          y3: null,
          score: 18,
          sequence: 'GGGTTAGGGTTAGGG',
          strand: '+',
          gene_ids: 'geneA',
          gene_names: 'dnaA',
          gene_biotypes: 'protein_coding',
          relation_categories: 'gene_inside',
          feature_types: 'gene',
          feature_ids: 'featureA',
        },
      ],
    });

    expect(responseSpy).toHaveBeenCalledWith(
      jasmine.objectContaining({
        g4s: [
          jasmine.objectContaining({
            seqid: 'NC_000001.1',
            region_id: 'NC_000001.1',
            g4_type: 'i-motif',
            quadruplex_type: 'i-motif',
            y1: 0,
            y3: 0,
          }),
        ],
      }),
    );
  });

  it('uses the current assembly-scoped quadruplex endpoint', () => {
    service
      .getAssemblyG4Page({
        assemblyAccession: 'GCF_000021765.1',
        g4Type: 'g4',
        pageIndex: 0,
        pageSize: 10,
        sort: 'start',
        order: 'asc',
        tetrads: [],
      })
      .subscribe();

    const request = httpMock.expectOne(
      '/api/v1/quadruplex-sequences/GCF_000021765.1?offset=0&limit=10&sort=start&order=asc&quadruplex_type=g4',
    );

    expect(request.request.method).toBe('GET');
    request.flush({
      count: 0,
      tetrads_list: [],
      max_score: 0,
      min_score: 0,
      quadruplex_sequences: [],
    });
  });

  it('maps gene-position filters onto relation category query params', () => {
    service
      .getGeneSearchPage({
        assemblyAccession: 'GCF_000021765.1',
        g4Type: 'g4',
        pageIndex: 2,
        pageSize: 20,
        sort: 'score',
        order: 'desc',
        tetrads: [3],
        minScore: 17,
        maxScore: 90,
        selectedFeatureId: 'geneA',
        selectedPosition: 'insideOf_genes_upstream_1k_g4',
      })
      .subscribe();

    const request = httpMock.expectOne(
      '/api/v1/quadruplex-sequences/GCF_000021765.1?offset=2&limit=20&sort=score&order=desc&tetrads=3&min_score=17&max_score=90&quadruplex_type=g4&relation_categories=gene_upstream&flank_windows=1000&gene_search_term=geneA',
    );

    expect(request.request.method).toBe('GET');
    request.flush({
      count: 0,
      tetrads_list: [3],
      max_score: 90,
      min_score: 17,
      quadruplex_sequences: [],
    });
  });

  it('uses the gene page endpoint for gene candidates and maps current fields', () => {
    const responseSpy = jasmine.createSpy();

    service
      .getGeneCandidates({
        assemblyAccession: 'GCF_000021765.1',
        g4Type: 'g4',
        selectedPosition: 'insideOf_gene_g4',
        searchTerm: 'dna',
        limit: 20,
      })
      .subscribe(responseSpy);

    const request = httpMock.expectOne(
      '/api/v1/genes/page?search_term=dna&assembly_accession=GCF_000021765.1&offset=0&limit=20',
    );

    expect(request.request.method).toBe('GET');

    request.flush({
      count: 1,
      genes: [
        {
          assembly_accession: 'GCF_000021765.1',
          region_id: 'chr2',
          feature_id: 'dnaK',
          gene_name: 'dnaK',
          locus_tag: 'LOC_001',
          biotype: 'protein_coding',
        },
      ],
    });

    expect(responseSpy).toHaveBeenCalledWith([
      jasmine.objectContaining({
        feature_id: 'dnaK',
        seqid: 'chr2',
        gene_biotype: 'protein_coding',
      }),
    ]);
  });

  it('derives gene relation hits from current quadruplex rows', () => {
    const responseSpy = jasmine.createSpy();

    service
      .getGeneRelations({
        assemblyAccession: 'GCF_000021765.1',
        g4Type: 'g4',
        seqid: 'NC_000001.1',
        starts: [10, 20],
      })
      .subscribe(responseSpy);

    const request = httpMock.expectOne(
      '/api/v1/quadruplex-sequences/GCF_000021765.1/NC_000001.1?quadruplex_type=g4&offset=0&limit=500&sort=start&order=asc',
    );

    expect(request.request.method).toBe('GET');
    request.flush({
      count: 1,
      tetrads_list: [3],
      max_score: 20,
      min_score: 20,
      quadruplex_sequences: [
        {
          quadruplex_sequence_id: 'qs1',
          assembly_accession: 'GCF_000021765.1',
          region_id: 'NC_000001.1',
          quadruplex_type: 'g4',
          start: 10,
          end: 25,
          length: 15,
          tetrads: 3,
          y1: 1,
          y2: 1,
          y3: 1,
          score: 20,
          sequence: 'GGGTTAGGGTTAGGG',
          strand: '+',
          gene_ids: 'geneA',
          gene_names: 'dnaA',
          gene_biotypes: 'protein_coding',
          relation_categories: 'gene_inside',
          feature_types: 'gene',
          feature_ids: 'featureA',
        },
      ],
    });

    expect(responseSpy).toHaveBeenCalledWith({
      relations: [
        {
          start: 10,
          positions: {
            insideOf_gene_g4: [
              {
                feature_id: 'featureA',
                label: 'dnaA',
                gene_biotype: 'protein_coding',
              },
            ],
          },
        },
        { start: 20, positions: {} },
      ],
    });
  });

  it('creates downloads through the shared download API', () => {
    const responseSpy = jasmine.createSpy();
    const blob = new Blob(['test']);

    service
      .downloadG4Table({
        assemblyAccession: 'GCF_000021765.1',
        g4Type: 'g4',
        seqid: 'NC_000001.1',
        sort: 'start',
        order: 'asc',
        tetrads: [2, 3],
        minScore: 10,
        maxScore: 55,
        selectedFeatureId: 'Gene A',
        selectedPosition: 'insideOf_gene_g4',
        columns: ['seqid', 'start'],
      })
      .subscribe(responseSpy);

    const request = httpMock.expectOne('/api/v1/download/');

    expect(request.request.method).toBe('POST');
    expect(request.request.responseType).toBe('blob');
    expect(request.request.body).toEqual({
      mode: 'tsv',
      columns: ['region_id', 'start'],
      filters: {
        assembly_accessions: ['GCF_000021765.1'],
        taxon_ids: [],
        species_taxon_ids: [],
        region_ids: ['NC_000001.1'],
        quadruplex_types: ['g4'],
        gene_ids: [],
        gene_search_term: 'Gene A',
        relation_categories: ['gene_inside'],
        flank_windows: [],
        min_overlap_bp: null,
        min_overlap_fraction: null,
        tetrads: [2, 3],
        min_score: 10,
        max_score: 55,
      },
      sort: 'start',
      order: 'asc',
    });

    request.flush(blob, {
      headers: {
        'Content-Disposition':
          'attachment; filename="GCF_000021765.1_NC_000001.1_g4_gene-gene-a_rel-inside-gene_tetrads-2-3_score-10-55_sites.tsv"',
      },
    });

    const download = responseSpy.calls.mostRecent().args[0];
    expect(download.blob).toBe(blob);
    expect(download.filename).toBe(
      'GCF_000021765.1_NC_000001.1_g4_gene-gene-a_rel-inside-gene_tetrads-2-3_score-10-55_sites.tsv',
    );
  });

  it('builds histogram requests with current route and query params', () => {
    service
      .getHistogram({
        assemblyAccession: 'GCF_000021765.1',
        seqid: 'NC_000001.1',
        g4Type: 'g4',
        viewport: {
          start: 1000,
          end: 5000,
          binSize: 200,
        },
        filters: {
          tetrads: [2, 4],
          minScore: 12,
          maxScore: 40,
        },
      })
      .subscribe();

    const request = httpMock.expectOne(
      '/api/v1/quadruplex-sequences/GCF_000021765.1/NC_000001.1/histogram?quadruplex_type=g4&range_start=1000&range_end=5000&bin_size=200&tetrads=2&tetrads=4&min_score=12&max_score=40',
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

  it('builds position distribution requests with motif type and flank window', () => {
    service
      .getPositionDistribution({
        assemblyAccession: 'GCF_000021765.1',
        g4Type: 'g4',
        flankWindow: 500,
      })
      .subscribe();

    const request = httpMock.expectOne(
      '/api/v1/quadruplex-sequences/GCF_000021765.1/position-distribution?quadruplex_type=g4&flank_window=500',
    );

    expect(request.request.method).toBe('GET');
    request.flush({
      assembly_accession: 'GCF_000021765.1',
      quadruplex_type: 'g4',
      filters: {
        flank_window: 500,
        counting_mode: 'exclusive',
      },
      total_count: 0,
      categories: [],
      feature_breakdown: [],
      gene_biotype_breakdown: [],
      quality: {
        regions_total_count: 0,
        regions_status_ok_count: 0,
        regions_length_mismatch_count: 0,
        warnings: [],
      },
    });
  });

  it('builds position statistics requests with current query params only', () => {
    service
      .getPositionStatistics({
        assemblyAccession: 'GCF_000021765.1',
        windows: [1000],
        g4Type: 'g4',
        tetrads: [2, 4],
        minScore: 12,
        maxScore: 40,
        includeGeneBiotypeBreakdown: true,
      })
      .subscribe();

    const request = httpMock.expectOne(
      '/api/v1/quadruplex-sequences/GCF_000021765.1/position-statistics?windows=1000&quadruplex_type=g4',
    );

    expect(request.request.method).toBe('GET');
    request.flush({
      assembly_accession: 'GCF_000021765.1',
      filters: {
        windows: [1000],
        quadruplex_type: 'g4',
      },
      genome_length_bp: 0,
      genome_length_mb: 0,
      windows: [{ window_bp: 1000, categories: [], biotype_categories: [] }],
      quality: {
        regions_total_count: 0,
        regions_status_ok_count: 0,
        regions_length_mismatch_count: 0,
        warnings: [],
      },
    });
  });

  it('normalizes position statistics responses without quality metadata', () => {
    service
      .getPositionStatistics({
        assemblyAccession: 'GCF_000021765.1',
        windows: [1000],
        g4Type: 'g4',
        tetrads: [],
      })
      .subscribe((response) => {
        expect(response.quality.warnings).toEqual([]);
        expect(response.quality.regions_total_count).toBe(0);
      });

    const request = httpMock.expectOne(
      '/api/v1/quadruplex-sequences/GCF_000021765.1/position-statistics?windows=1000&quadruplex_type=g4',
    );

    request.flush({
      assembly_accession: 'GCF_000021765.1',
      filters: {
        windows: [1000],
        quadruplex_type: 'g4',
      },
      genome_length_bp: 0,
      genome_length_mb: 0,
      windows: [{ window_bp: 1000, categories: [], biotype_categories: [] }],
    });
  });
});
