import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, ParamMap, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';
import {
  EnvironmentCategoryBoxplotResponse,
  EnvironmentCategoryBoxplotRequest,
  EnvironmentNumericScatterRequest,
  EnvironmentNumericScatterResponse,
  EnvironmentOptionsResponse,
  MicrobialEnvironmentG4Service,
} from '../../services/microbial-environment-g4.service';
import { MicrobialEnvironmentG4Component } from './microbial-environment-g4.component';

describe('MicrobialEnvironmentG4Component', () => {
  let fixture: ComponentFixture<MicrobialEnvironmentG4Component>;
  let component: MicrobialEnvironmentG4Component;
  let service: jasmine.SpyObj<MicrobialEnvironmentG4Service>;
  let routeQueryParamMap: ParamMap;

  const options: EnvironmentOptionsResponse = {
    traits: [
      {
        trait_code: 'ecological_context',
        trait_group: 'ecology',
        display_name: 'Ecological context',
        value_kind: 'categorical_multi_label',
        default_chart_kind: 'boxplot',
        allowed_outcome_metrics: [
          'g4_density_per_mb',
          'gene_quadruplex_density_per_mb',
          'upstream_quadruplex_density_per_mb',
        ],
        default_outcome_metric: 'gene_quadruplex_density_per_mb',
        category_selection_mode: 'multi_label',
        default_context_axis: 'environment',
        min_default_mapping_confidence_rank: 1,
        requires_taxonomy_controls: true,
      },
      {
        trait_code: 'growth_temperature',
        trait_group: 'physiology',
        display_name: 'Growth temperature',
        value_kind: 'numeric',
        default_chart_kind: 'scatter',
        allowed_outcome_metrics: ['g4_density_per_mb', 'gene_quadruplex_density_per_mb'],
        default_outcome_metric: 'g4_density_per_mb',
        category_selection_mode: 'none',
        default_context_axis: null,
        min_default_mapping_confidence_rank: 1,
        requires_taxonomy_controls: true,
      },
    ],
    outcome_metrics: [
      {
        metric: 'g4_density_per_mb',
        display_name: 'G4 density',
        unit: 'sequences/Mb',
        description: 'Genome-wide quadruplex sequence density.',
      },
      {
        metric: 'gene_quadruplex_density_per_mb',
        display_name: 'Gene-overlapping G4 density',
        unit: 'sequences/Mb',
        description: 'Quadruplex sequence density in annotated gene intervals.',
      },
      {
        metric: 'upstream_quadruplex_density_per_mb',
        display_name: 'Upstream G4 density',
        unit: 'sequences/Mb',
        description: 'Quadruplex sequence density in upstream gene flanks.',
      },
    ],
    context_axes: [
      {
        trait_code: 'ecological_context',
        context_axis: 'environment',
        display_label: 'Environment',
        category_count: 2,
        is_default_context_axis: true,
      },
    ],
    categories: [
      {
        trait_code: 'ecological_context',
        context_axis: 'environment',
        category_id: 'soil',
        canonical_value: 'soil',
        display_label: 'Soil',
        parent_category_id: null,
        sort_order: 1,
        is_default_visible: true,
        eligible_assembly_count: 6,
      },
      {
        trait_code: 'ecological_context',
        context_axis: 'environment',
        category_id: 'host_associated',
        canonical_value: 'host-associated',
        display_label: 'Host-associated',
        parent_category_id: null,
        sort_order: 2,
        is_default_visible: true,
        eligible_assembly_count: 5,
      },
    ],
    taxonomy_ranks: [
      { rank: 'genus', display_label: 'Genus' },
      { rank: 'family', display_label: 'Family' },
      { rank: 'full_scientific_name', display_label: 'Full scientific name' },
    ],
    build_id: 'build-2026-06-21',
    source_dataset_version: 'bacdive-2026',
  };

  const numericResponse: EnvironmentNumericScatterResponse = {
    summary: {
      trait_code: 'growth_temperature',
      chart_kind: 'scatter',
      outcome_metric: 'g4_density_per_mb',
      assembly_count: 6,
      row_count: 6,
      filter_hash: 'hash',
      build_id: 'build-2026-06-21',
      source_dataset_version: 'bacdive-2026',
      description: 'Growth temperature association screen.',
    },
    scatter_points: [
      {
        assembly_accession: 'GCF_1',
        trait_code: 'growth_temperature',
        numeric_midpoint: 37,
        numeric_min: 35,
        numeric_max: 39,
        numeric_unit_canonical: 'celsius',
        g4_density_per_mb: 12,
        gene_quadruplex_density_per_mb: 6,
        upstream_quadruplex_density_per_mb: 2,
        downstream_quadruplex_density_per_mb: 2,
        intergenic_quadruplex_density_per_mb: 4,
        g4_count: 120,
        g4_mean_score: 28,
        genome_size: 5_000_000,
        gc_percent: 51,
        domain: 'Bacteria',
        phylum: 'Firmicutes',
        class_name: 'Bacilli',
        order: 'Bacillales',
        family: 'Bacillaceae',
        genus: 'Bacillus',
        species: 'Bacillus subtilis',
        full_scientific_name: 'Bacillus subtilis 168',
        assembly_level: 'Complete Genome',
      },
    ],
    regression_line: [],
    numeric_bins: [],
    analysis_results: [
      {
        run_id: 'run',
        result_id: 'ols-growth-temperature',
        trait_code: 'growth_temperature',
        outcome_metric: 'g4_density_per_mb',
        context_axis: null,
        category_id: null,
        predictor: 'numeric_midpoint',
        group_value: null,
        n_assemblies: 6,
        estimate: 0.12,
        effect_size: 0.34,
        p_value: 0.045,
        ci_low: 0.01,
        ci_high: 0.23,
        taxonomy_control_strategy: 'none',
        filter_hash: 'hash',
        status: 'ok',
        result_json: '{}',
      },
    ],
    table_preview: [],
    preview_total: 6,
    download_filename: 'numeric.csv',
    filter_hash: 'hash',
    build_id: 'build-2026-06-21',
    source_dataset_version: 'bacdive-2026',
  };

  const categoryResponse: EnvironmentCategoryBoxplotResponse = {
    summary: {
      trait_code: 'ecological_context',
      chart_kind: 'boxplot',
      outcome_metric: 'gene_quadruplex_density_per_mb',
      assembly_count: 6,
      row_count: 6,
      filter_hash: 'hash',
      build_id: 'build-2026-06-21',
      source_dataset_version: 'bacdive-2026',
      description: 'Ecological context distribution screen.',
    },
    boxplot_summary: [
      {
        run_id: 'run',
        filter_hash: 'hash',
        trait_code: 'ecological_context',
        context_axis: 'environment',
        category_id: 'soil',
        canonical_value: 'soil',
        outcome_metric: 'gene_quadruplex_density_per_mb',
        n_assemblies: 6,
        q1: 1,
        median: 2,
        q3: 3,
        whisker_low: 0.5,
        whisker_high: 4,
        min_value: 0.5,
        max_value: 4,
        outlier_count: 0,
        sort_value: 2,
        status: 'ok',
        build_id: 'build-2026-06-21',
        source_dataset_version: 'bacdive-2026',
      },
    ],
    raw_points_sample: [],
    table_preview: [],
    preview_total: 6,
    download_filename: 'category.csv',
    filter_hash: 'hash',
    build_id: 'build-2026-06-21',
    source_dataset_version: 'bacdive-2026',
  };

  beforeEach(async () => {
    service = jasmine.createSpyObj<MicrobialEnvironmentG4Service>('MicrobialEnvironmentG4Service', [
      'getOptions',
      'searchTaxonomy',
      'queryNumericScatter',
      'queryCategoryBoxplot',
      'downloadResults',
    ]);
    service.getOptions.and.returnValue(of(options));
    service.searchTaxonomy.and.returnValue(
      of({
        results: [{ rank: 'genus', value: 'Bacillus', label: 'Bacillus', eligible_assembly_count: 6 }],
      }),
    );
    service.queryNumericScatter.and.returnValue(of(numericResponse));
    service.queryCategoryBoxplot.and.returnValue(of(categoryResponse));
    service.downloadResults.and.returnValue(
      of({ blob: new Blob(['assembly_accession\n']), filename: 'environment_g4.csv' }),
    );
    routeQueryParamMap = convertToParamMap({});

    await TestBed.configureTestingModule({
      imports: [MicrobialEnvironmentG4Component],
      providers: [
        provideZonelessChangeDetection(),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              get queryParamMap(): ParamMap {
                return routeQueryParamMap;
              },
            },
          },
        },
        { provide: MicrobialEnvironmentG4Service, useValue: service },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MicrobialEnvironmentG4Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads Server options and automatically submits the default all-eligible query', () => {
    expect(service.getOptions).toHaveBeenCalledTimes(1);
    expect(component.selectedTraitCode()).toBe('ecological_context');
    expect(component.selectedOutcomeMetric()).toBe('gene_quadruplex_density_per_mb');

    const request = service.queryCategoryBoxplot.calls.mostRecent()
      .args[0] as EnvironmentCategoryBoxplotRequest;
    expect(request.trait_code).toBe('ecological_context');
    expect(request.chart_kind).toBe('boxplot');
    expect(request.outcome_metric).toBe('gene_quadruplex_density_per_mb');
    expect(request.display_context_axis).toBe('environment');
    expect(request.display_category_ids).toEqual(['soil', 'host_associated']);
    expect(request.category_filter_logic).toBe('intersection');
    expect(request.min_mapping_confidence_rank).toBe(1);
    expect(request.taxonomy_filters).toEqual([]);
    expect(component.form.controls.taxonomyRank.value).toBe('all');
    expect(component.submittedQuery()).toEqual(request);
  });

  it('uses new route query parameters for deep-linked analyses', () => {
    fixture.destroy();
    service.queryNumericScatter.calls.reset();
    routeQueryParamMap = convertToParamMap({
      trait: 'growth_temperature',
      metric: 'gene_quadruplex_density_per_mb',
      rank: 'genus',
      taxon: 'Bacillus',
      run: 'true',
    });

    fixture = TestBed.createComponent(MicrobialEnvironmentG4Component);
    component = fixture.componentInstance;
    fixture.detectChanges();

    const request = service.queryNumericScatter.calls.mostRecent()
      .args[0] as EnvironmentNumericScatterRequest;
    expect(request.trait_code).toBe('growth_temperature');
    expect(request.outcome_metric).toBe('gene_quadruplex_density_per_mb');
    expect(request.taxonomy_filters).toEqual([{ rank: 'genus', value: 'Bacillus' }]);
  });

  it('renders contract-driven controls and non-causal result copy', () => {
    component.runAnalysis();
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain('Microbial environment associations');
    expect(text).toContain('Ecological context');
    expect(text).toContain('Gene-overlapping G4 density');
    expect(text).toContain('Associations are descriptive');
    expect(text).toContain('Ecological context distribution screen.');
    expect(text).toContain('Filter hash');
    expect(text).toContain('hash');
    expect(text).toContain('build-2026-06-21');
    expect(text).toContain('Category status');
    expect(text).toContain('Soil');
    expect(text).toContain('Ok');
    expect(text).not.toContain('optimum');
  });

  it('renders Server analysis result fields for numeric traits without inventing R2', () => {
    component.selectTrait('growth_temperature');
    component.runAnalysis();
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain('Statistical summary');
    expect(text).toContain('numeric_midpoint');
    expect(text).toContain('0.045');
    expect(text).not.toContain('R2');
  });

  it('uses boxplot endpoint and canonical categories for categorical traits', () => {
    component.selectTrait('ecological_context');
    component.runAnalysis();

    const request = service.queryCategoryBoxplot.calls.mostRecent()
      .args[0] as EnvironmentCategoryBoxplotRequest;
    expect(request.trait_code).toBe('ecological_context');
    expect(request.chart_kind).toBe('boxplot');
    expect(request.outcome_metric).toBe('gene_quadruplex_density_per_mb');
    expect(request.display_context_axis).toBe('environment');
    expect(request.display_category_ids).toEqual(['soil', 'host_associated']);
    expect(request.category_filters).toEqual([]);
  });

  it('searches taxonomy with current trait code, chart kind, and context axis', () => {
    component.selectTrait('ecological_context');
    component.form.controls.taxonomyRank.setValue('genus');
    component.form.controls.taxonomyKeyword.setValue('Bac');

    component.findTaxonomy();

    expect(service.searchTaxonomy).toHaveBeenCalledOnceWith(
      'genus',
      'Bac',
      'ecological_context',
      'boxplot',
      'environment',
    );
    expect(component.taxonomyCandidates().length).toBe(1);
  });

  it('keeps All as a UI-only taxonomy scope and does not send rank=all to the Server', () => {
    component.form.controls.taxonomyKeyword.setValue('Bac');

    component.findTaxonomy();

    expect(service.searchTaxonomy).not.toHaveBeenCalled();
    expect(component.errorMessage()).toContain('Choose a specific microbial taxonomy rank');
  });

  it('imports checked visible taxonomy candidates into the submitted taxonomy filters', () => {
    component.selectTrait('ecological_context');
    component.form.controls.taxonomyRank.setValue('genus');
    component.form.controls.taxonomyKeyword.setValue('Bac');
    component.findTaxonomy();

    component.selectVisibleTaxonomyCandidates();
    component.importCheckedTaxonomyCandidates();
    component.runAnalysis();

    const request = service.queryCategoryBoxplot.calls.mostRecent()
      .args[0] as EnvironmentCategoryBoxplotRequest;
    expect(component.taxonomyFilters()).toEqual([{ rank: 'genus', value: 'Bacillus' }]);
    expect(request.taxonomy_filters).toEqual([{ rank: 'genus', value: 'Bacillus' }]);
  });

  it('exposes provenance and taxonomy columns in the result table model', () => {
    const headers = component.tableColumns().map((column) => column.header);

    expect(headers).toContain('Taxonomy summary');
    expect(headers).toContain('Assembly level');
    expect(headers).toContain('GC (%)');
    expect(headers).toContain('Raw BacDive values');
    expect(headers).toContain('Normalized values');
    expect(headers).toContain('Mapping methods');
  });

  it('downloads from the last submitted query', () => {
    spyOn(component as unknown as { saveBlob(blob: Blob, filename: string): void }, 'saveBlob');
    component.runAnalysis();

    component.downloadResults();

    expect(service.downloadResults).toHaveBeenCalled();
  });
});
