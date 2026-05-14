import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import {
  MicrobialEnvironmentG4Query,
  MicrobialEnvironmentG4Service,
} from './microbial-environment-g4.service';

describe('MicrobialEnvironmentG4Service', () => {
  let service: MicrobialEnvironmentG4Service;
  let httpMock: HttpTestingController;

  const request: MicrobialEnvironmentG4Query = {
    trait: 'temperature',
    mode: 'growth',
    taxonomy_selections: [{ rank: 'genus', value: 'Bacillus' }],
    page_index: 0,
    page_size: 50,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), MicrobialEnvironmentG4Service],
    });

    service = TestBed.inject(MicrobialEnvironmentG4Service);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('loads options from the microbial research endpoint', () => {
    const responseSpy = jasmine.createSpy();

    service.getOptions().subscribe(responseSpy);

    const httpRequest = httpMock.expectOne('/api/v1/research/microbial-environment-g4/options');
    expect(httpRequest.request.method).toBe('GET');
    httpRequest.flush({ traits: [], modes: [], taxonomy_ranks: [], metrics: [], bin_ranges: [] });

    expect(responseSpy).toHaveBeenCalled();
  });

  it('searches taxonomy candidates with explicit trait and mode', () => {
    const responseSpy = jasmine.createSpy();

    service.searchTaxonomy('genus', 'Bac', 'temperature', 'growth').subscribe(responseSpy);

    const httpRequest = httpMock.expectOne((req) => {
      return (
        req.url === '/api/v1/research/microbial-environment-g4/taxonomy/search' &&
        req.params.get('rank') === 'genus' &&
        req.params.get('q') === 'Bac' &&
        req.params.get('trait') === 'temperature' &&
        req.params.get('mode') === 'growth'
      );
    });
    expect(httpRequest.request.method).toBe('GET');
    httpRequest.flush({ results: [] });

    expect(responseSpy).toHaveBeenCalled();
  });

  it('posts bin-based query requests without changing the body', () => {
    const responseSpy = jasmine.createSpy();

    service.query(request).subscribe(responseSpy);

    const httpRequest = httpMock.expectOne('/api/v1/research/microbial-environment-g4/query');
    expect(httpRequest.request.method).toBe('POST');
    expect(httpRequest.request.body).toEqual(request);
    httpRequest.flush({
      summary: {},
      bin_stats: [],
      scatter_points: [],
      taxonomy_breakdown: [],
      genome_preview: [],
      sixteen_s_preview: [],
      preview_total: 0,
    });

    expect(responseSpy).toHaveBeenCalled();
  });

  it('downloads 16S CSV as a Blob', () => {
    const responseSpy = jasmine.createSpy();

    service.downloadSixteenS(request).subscribe(responseSpy);

    const httpRequest = httpMock.expectOne(
      '/api/v1/research/microbial-environment-g4/download/sixteen-s',
    );
    expect(httpRequest.request.method).toBe('POST');
    expect(httpRequest.request.responseType).toBe('blob');
    httpRequest.flush(new Blob(['genome_accession\n']));

    expect(responseSpy).toHaveBeenCalled();
  });
});
