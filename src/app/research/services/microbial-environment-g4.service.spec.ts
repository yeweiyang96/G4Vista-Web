import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import {
  EnvironmentCategoryBoxplotRequest,
  EnvironmentDownloadRequest,
  EnvironmentNumericScatterRequest,
  MicrobialEnvironmentG4Service,
} from './microbial-environment-g4.service';

describe('MicrobialEnvironmentG4Service', () => {
  let service: MicrobialEnvironmentG4Service;
  let httpMock: HttpTestingController;

  const numericRequest: EnvironmentNumericScatterRequest = {
    trait_code: 'growth_temperature',
    chart_kind: 'scatter',
    outcome_metric: 'g4_density_per_mb',
    taxonomy_filters: [{ rank: 'genus', value: 'Bacillus' }],
    category_filters: [],
    category_filter_logic: 'intersection',
    min_mapping_confidence_rank: 1,
    include_review_values: false,
    page_index: 0,
    page_size: 50,
    sort_field: 'numeric_midpoint',
    sort_order: 'asc',
    numeric_min: null,
    numeric_max: null,
  };

  const categoryRequest: EnvironmentCategoryBoxplotRequest = {
    trait_code: 'ecological_context',
    chart_kind: 'boxplot',
    outcome_metric: 'gene_quadruplex_density_per_mb',
    taxonomy_filters: [],
    category_filters: [
      {
        trait_code: 'ecological_context',
        context_axis: 'environment',
        category_id: 'soil',
      },
    ],
    category_filter_logic: 'intersection',
    min_mapping_confidence_rank: 1,
    include_review_values: false,
    page_index: 0,
    page_size: 20,
    sort_field: 'canonical_value',
    sort_order: 'asc',
    display_context_axis: 'environment',
    display_category_ids: ['soil'],
    sort_categories_by: 'sort_order',
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

  it('loads Environment-G4 options from the current research endpoint', () => {
    const responseSpy = jasmine.createSpy();

    service.getOptions().subscribe(responseSpy);

    const httpRequest = httpMock.expectOne('/api/v1/research/microbial-environment-g4/options');
    expect(httpRequest.request.method).toBe('GET');
    httpRequest.flush({
      traits: [],
      outcome_metrics: [],
      context_axes: [],
      categories: [],
      taxonomy_ranks: [],
      build_id: 'build-1',
      source_dataset_version: 'bacdive-2026',
    });

    expect(responseSpy).toHaveBeenCalled();
  });

  it('searches taxonomy candidates with trait code, chart kind, and optional context axis', () => {
    const responseSpy = jasmine.createSpy();

    service
      .searchTaxonomy('genus', 'Bac', 'ecological_context', 'boxplot', 'environment')
      .subscribe(responseSpy);

    const httpRequest = httpMock.expectOne((req) => {
      return (
        req.url === '/api/v1/research/microbial-environment-g4/taxonomy/search' &&
        req.params.get('rank') === 'genus' &&
        req.params.get('q') === 'Bac' &&
        req.params.get('trait_code') === 'ecological_context' &&
        req.params.get('chart_kind') === 'boxplot' &&
        req.params.get('context_axis') === 'environment'
      );
    });
    expect(httpRequest.request.method).toBe('GET');
    httpRequest.flush({ results: [] });

    expect(responseSpy).toHaveBeenCalled();
  });

  it('posts numeric scatter requests to the numeric query endpoint', () => {
    const responseSpy = jasmine.createSpy();

    service.queryNumericScatter(numericRequest).subscribe(responseSpy);

    const httpRequest = httpMock.expectOne(
      '/api/v1/research/microbial-environment-g4/query/numeric-scatter',
    );
    expect(httpRequest.request.method).toBe('POST');
    expect(httpRequest.request.body).toEqual(numericRequest);
    httpRequest.flush({
      summary: {
        trait_code: 'growth_temperature',
        chart_kind: 'scatter',
        outcome_metric: 'g4_density_per_mb',
        assembly_count: 0,
        row_count: 0,
        filter_hash: 'hash',
        build_id: 'build-1',
        source_dataset_version: 'bacdive-2026',
        description: 'Numeric scatter response.',
      },
      scatter_points: [],
      regression_line: [],
      numeric_bins: [],
      table_preview: [],
      preview_total: 0,
      download_filename: 'numeric.csv',
      filter_hash: 'hash',
      build_id: 'build-1',
      source_dataset_version: 'bacdive-2026',
    });

    expect(responseSpy).toHaveBeenCalled();
  });

  it('posts categorical trait requests to the category boxplot endpoint', () => {
    const responseSpy = jasmine.createSpy();

    service.queryCategoryBoxplot(categoryRequest).subscribe(responseSpy);

    const httpRequest = httpMock.expectOne(
      '/api/v1/research/microbial-environment-g4/query/category-boxplot',
    );
    expect(httpRequest.request.method).toBe('POST');
    expect(httpRequest.request.body).toEqual(categoryRequest);
    httpRequest.flush({
      summary: {
        trait_code: 'ecological_context',
        chart_kind: 'boxplot',
        outcome_metric: 'gene_quadruplex_density_per_mb',
        assembly_count: 0,
        row_count: 0,
        filter_hash: 'hash',
        build_id: 'build-1',
        source_dataset_version: 'bacdive-2026',
        description: 'Category boxplot response.',
      },
      boxplot_summary: [],
      raw_points_sample: [],
      table_preview: [],
      preview_total: 0,
      download_filename: 'category.csv',
      filter_hash: 'hash',
      build_id: 'build-1',
      source_dataset_version: 'bacdive-2026',
    });

    expect(responseSpy).toHaveBeenCalled();
  });

  it('downloads Environment-G4 results with the server-provided filename', () => {
    const responseSpy = jasmine.createSpy();
    const request: EnvironmentDownloadRequest = {
      ...numericRequest,
      mode: 'csv',
      numeric_min: null,
      numeric_max: null,
      display_context_axis: null,
      display_category_ids: [],
      sort_categories_by: 'sort_order',
    };
    const blob = new Blob(['assembly_accession\n']);

    service.downloadResults(request).subscribe(responseSpy);

    const httpRequest = httpMock.expectOne(
      '/api/v1/research/microbial-environment-g4/download/results',
    );
    expect(httpRequest.request.method).toBe('POST');
    expect(httpRequest.request.responseType).toBe('blob');
    expect(httpRequest.request.body).toEqual(request);
    httpRequest.flush(blob, {
      headers: {
        'Content-Disposition': 'attachment; filename="environment_g4.csv"',
      },
    });

    expect(responseSpy).toHaveBeenCalledWith({ blob, filename: 'environment_g4.csv' });
  });
});
