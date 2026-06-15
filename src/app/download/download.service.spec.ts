import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { DownloadService } from './download.service';

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

  it('posts package options and returns the server-provided filename', () => {
    const responseSpy = jasmine.createSpy();
    const blob = new Blob(['zip']);

    service
      .createG4Package({
        assembly_accessions: ['GCF_1'],
        taxon_ids: [],
        g4_types: ['g4'],
        tetrads: [2, 3],
        min_score: 10,
        max_score: 50,
        overlap: false,
        sort: 'start',
        order: 'asc',
        columns: ['seqid', 'start'],
      })
      .subscribe(responseSpy);

    const request = httpMock.expectOne('/api/v1/download/g4-package');

    expect(request.request.method).toBe('POST');
    expect(request.request.responseType).toBe('blob');
    expect(request.request.body).toEqual({
      assembly_accessions: ['GCF_1'],
      taxon_ids: [],
      g4_types: ['g4'],
      tetrads: [2, 3],
      min_score: 10,
      max_score: 50,
      overlap: false,
      sort: 'start',
      order: 'asc',
      columns: ['seqid', 'start'],
    });

    request.flush(blob, {
      headers: {
        'Content-Disposition': 'attachment; filename="g4-package.zip"',
      },
    });

    expect(responseSpy).toHaveBeenCalledWith({
      blob,
      filename: 'g4-package.zip',
    });
  });
});
