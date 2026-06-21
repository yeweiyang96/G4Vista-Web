import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { DownloadColumnCatalog, DownloadService } from './download.service';

const COLUMN_CATALOG: DownloadColumnCatalog = {
  catalog_version: '2026-06-15',
  schema_version: 'quadruplex-sequence-v1',
  index_table: 'quadruplex_sequence_download_index',
  default_columns: ['assembly_accession', 'start'],
  all_columns: ['assembly_accession', 'start', 'sequence'],
  columns: [
    {
      id: 'assembly_accession',
      label: 'Assembly accession',
      type: 'string',
      category: 'assembly',
      description: 'NCBI assembly accession.',
      default_visible: true,
      exportable: true,
      source_table: 'quadruplex_sequence_download_index',
      source_field: 'assembly_accession',
    },
  ],
};

describe('DownloadService', () => {
  let service: DownloadService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), DownloadService],
    });

    service = TestBed.inject(DownloadService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('loads the server-backed download column catalog', () => {
    const responseSpy = jasmine.createSpy();

    service.getColumnCatalog().subscribe(responseSpy);

    const request = httpMock.expectOne('/api/v1/download/columns');

    expect(request.request.method).toBe('GET');

    request.flush(COLUMN_CATALOG);

    expect(responseSpy).toHaveBeenCalledWith(COLUMN_CATALOG);
  });

  it('posts complete download options and returns the server-provided filename', () => {
    const responseSpy = jasmine.createSpy();
    const blob = new Blob(['tsv']);

    service
      .createDownload({
        mode: 'tsv',
        columns: ['assembly_accession', 'start'],
        filters: {
          assembly_accessions: ['GCF_1'],
          taxon_ids: [3702],
          species_taxon_ids: [3702],
          region_ids: ['chr1'],
          quadruplex_types: ['g4'],
          gene_ids: ['geneA'],
          gene_search_term: 'dnaA',
          relation_categories: ['gene_inside'],
          flank_windows: [0, 200],
          min_overlap_bp: 2,
          min_overlap_fraction: 0.5,
          tetrads: [2, 3],
          min_score: 10,
          max_score: 50,
        },
        sort: 'start',
        order: 'asc',
      })
      .subscribe(responseSpy);

    const request = httpMock.expectOne('/api/v1/download/');

    expect(request.request.method).toBe('POST');
    expect(request.request.responseType).toBe('blob');
    expect(request.request.body).toEqual({
      mode: 'tsv',
      columns: ['assembly_accession', 'start'],
      filters: {
        assembly_accessions: ['GCF_1'],
        taxon_ids: [3702],
        species_taxon_ids: [3702],
        region_ids: ['chr1'],
        quadruplex_types: ['g4'],
        gene_ids: ['geneA'],
        gene_search_term: 'dnaA',
        relation_categories: ['gene_inside'],
        flank_windows: [0, 200],
        min_overlap_bp: 2,
        min_overlap_fraction: 0.5,
        tetrads: [2, 3],
        min_score: 10,
        max_score: 50,
      },
      sort: 'start',
      order: 'asc',
    });

    request.flush(blob, {
      headers: {
        'Content-Disposition': 'attachment; filename="g4vista.tsv"',
      },
    });

    expect(responseSpy).toHaveBeenCalledWith({
      blob,
      filename: 'g4vista.tsv',
    });
  });
});
