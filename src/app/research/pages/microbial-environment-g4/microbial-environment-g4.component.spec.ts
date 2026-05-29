import { HttpErrorResponse } from '@angular/common/http';
import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NEVER, of, throwError } from 'rxjs';
import {
  MicrobialEnvironmentG4Options,
  MicrobialEnvironmentG4Query,
  MicrobialEnvironmentG4QueryResponse,
  MicrobialEnvironmentG4Service,
  MicrobialTaxonomySearchResult,
} from '../../services/microbial-environment-g4.service';
import { MicrobialEnvironmentG4Component } from './microbial-environment-g4.component';

interface ChartRenderScheduler {
  scheduleChartRender(): void;
}

interface VegaWidthCalculator {
  vegaPlotWidth(element: HTMLDivElement): number;
}

describe('MicrobialEnvironmentG4Component', () => {
  let fixture: ComponentFixture<MicrobialEnvironmentG4Component>;
  let component: MicrobialEnvironmentG4Component;
  let service: jasmine.SpyObj<MicrobialEnvironmentG4Service>;

  const options: MicrobialEnvironmentG4Options = {
    traits: [
      { value: 'temperature', label: 'Temperature' },
      { value: 'ph', label: 'pH' },
    ],
    modes: [
      { value: 'growth', label: 'Growth' },
      { value: 'optimum', label: 'Optimum' },
    ],
    taxonomy_ranks: [
      { value: 'domain', label: 'Domain' },
      { value: 'phylum', label: 'Phylum' },
      { value: 'class', label: 'Class' },
      { value: 'order', label: 'Order' },
      { value: 'family', label: 'Family' },
      { value: 'genus', label: 'Genus' },
      { value: 'species', label: 'Species' },
    ],
    plans: [
      {
        plan_id: 'growth_temperature_g4',
        trait: 'temperature',
        mode: 'growth',
        phenotype_label: 'Growth temperature',
        phenotype_unit: 'celsius',
        eligible_assemblies: 6,
      },
      {
        plan_id: 'optimum_ph_g4',
        trait: 'ph',
        mode: 'optimum',
        phenotype_label: 'Optimum pH',
        phenotype_unit: 'pH',
        eligible_assemblies: 7,
      },
    ],
  };

  const response: MicrobialEnvironmentG4QueryResponse = {
    summary: {
      plan_id: 'growth_temperature_g4',
      assembly_count: 6,
      phenotype_label: 'Growth temperature',
      phenotype_unit: 'celsius',
    },
    correlation: { method: 'spearman', n: 2, rho: 0.8, p_value: 0.01, status: 'ok' },
    regression: {
      method: 'ols',
      slope: 0.2,
      intercept: 1,
      r_squared: 0.7,
      line_points: [
        { phenotype_value: 20, density_value: 5 },
        { phenotype_value: 40, density_value: 9 },
      ],
      status: 'ok',
    },
    scatter_points: [
      {
        assembly_accession: 'GCF_1',
        phenotype_value: 25,
        phenotype_min: 20,
        phenotype_max: 30,
        g4_density_per_mb: 5,
        upstream_g4_density_per_mb: 1,
        downstream_g4_density_per_mb: 1,
        intergenic_g4_density_per_mb: 3,
        g4_count: 10,
        gc_percent: 50,
        genome_size: 1_000_000,
        strain: 'Alpha strain',
        taxonomy: {
          domain: 'Bacteria',
          phylum: 'Firmicutes',
          class_name: 'Bacilli',
          order: 'Bacillales',
          family: 'Bacillaceae',
          genus: 'Alpha',
          species: 'Alpha one',
        },
      },
    ],
    table_preview: [
      {
        assembly_accession: 'GCF_1',
        phenotype_value: 25,
        phenotype_min: 20,
        phenotype_max: 30,
        g4_density_per_mb: 5,
        upstream_g4_density_per_mb: 1,
        downstream_g4_density_per_mb: 1,
        intergenic_g4_density_per_mb: 3,
        g4_count: 10,
        gc_percent: 50,
        genome_size: 1_000_000,
        strain: 'Alpha strain',
        taxonomy: {
          domain: 'Bacteria',
          phylum: 'Firmicutes',
          class_name: 'Bacilli',
          order: 'Bacillales',
          family: 'Bacillaceae',
          genus: 'Alpha',
          species: 'Alpha one',
        },
        phenotype_record_count: 1,
        raw_phenotype_values: '["25"]',
        assembly_level: 'Complete Genome',
        g4_mean_score: 12,
        gene_g4_density_per_mb: 2,
      },
    ],
    preview_total: 6,
    download_filename: 'microbial_environment_g4_growth_temperature_results.csv',
  };

  beforeEach(async () => {
    service = jasmine.createSpyObj<MicrobialEnvironmentG4Service>('MicrobialEnvironmentG4Service', [
      'getOptions',
      'searchTaxonomy',
      'query',
      'downloadResults',
    ]);
    service.getOptions.and.returnValue(of(options));
    service.searchTaxonomy.and.returnValue(
      of({
        results: [{ rank: 'genus', value: 'Alpha', label: 'Alpha', eligible_assembly_count: 6 }],
      }),
    );
    service.query.and.returnValue(of(response));
    service.downloadResults.and.returnValue(NEVER);

    await TestBed.configureTestingModule({
      imports: [MicrobialEnvironmentG4Component],
      providers: [
        provideZonelessChangeDetection(),
        { provide: MicrobialEnvironmentG4Service, useValue: service },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MicrobialEnvironmentG4Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads options but does not run analysis until Search is submitted', () => {
    expect(service.getOptions).toHaveBeenCalledTimes(1);
    expect(service.query).not.toHaveBeenCalled();

    component.form.controls.trait.setValue('ph');
    component.form.controls.mode.setValue('optimum');
    component.onAxisChange();
    fixture.detectChanges();

    expect(service.query).not.toHaveBeenCalled();

    component.search();

    expect(service.query).toHaveBeenCalledTimes(1);
    const request = service.query.calls.mostRecent().args[0] as MicrobialEnvironmentG4Query;
    expect(request.trait).toBe('ph');
    expect(request.mode).toBe('optimum');
    expect(request.page_index).toBe(0);
    expect(request.page_size).toBe(10);
    expect(request.sort_field).toBe('phenotype_value');
    expect(request.sort_order).toBe('asc');
    expect(request.density_metric).toBe('g4_density_per_mb');
    expect(component.submittedQuery()).toEqual(request);
  });

  it('renders the workflow and correlation result surfaces', () => {
    component.search();
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain('Microbial G4 Environment Research');
    expect(text).toContain('Environment condition');
    expect(text).toContain('Strain set');
    expect(text).toContain('Analysis Results');
    expect(text).not.toContain('分析结果');
    expect(fixture.nativeElement.querySelector('.axis-note')).toBeNull();
    expect(fixture.nativeElement.querySelector('.condition-count')).toBeNull();
    expect(text).not.toContain('Current condition has');
    expect(text).not.toContain('Run analysis');
    expect(text).toContain('Spearman rho');
    expect(text).toContain('p-value');
    expect(text).toContain('Regression R2');
    expect(text).toContain('Upstream G4 density');
    expect(text).toContain('Downstream G4 density');
    expect(text).toContain('Intergenic G4 density');
    expect(text).toContain('Download table');
    expect(text).not.toContain('Download CSV');
    expect(text).not.toContain('Submitted');
    expect(text).toContain('Alpha strain');
    expect(text.toLowerCase()).not.toContain('bin statistics');
    expect(text.toLowerCase()).not.toContain('16s g4');
  });

  it('updates the study summary when the environment axis changes', () => {
    component.form.controls.trait.setValue('ph');
    component.form.controls.mode.setValue('optimum');
    component.onAxisChange();
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;

    expect(component.studySummary()).toBe('Correlate Optimum pH with genome-wide G4 density.');
    expect(text).toContain('Optimum pH');
  });

  it('uses explicit taxonomy Find and Add to build a strain collection', () => {
    component.form.controls.taxonomyRank.setValue('genus');
    component.form.controls.taxonomyKeyword.setValue('Alp');

    component.findTaxonomy();

    expect(service.searchTaxonomy).toHaveBeenCalledOnceWith(
      'genus',
      'Alp',
      'temperature',
      'growth',
    );
    expect(component.taxonomyCandidates().length).toBe(1);

    component.addTaxonomySelection(component.taxonomyCandidates()[0]);
    component.addTaxonomySelection(component.taxonomyCandidates()[0]);

    expect(component.assemblyCollection()).toEqual([{ rank: 'genus', value: 'Alpha' }]);
  });

  it('clears submitted results when trait or mode changes but keeps draft assembly collection', () => {
    component.addTaxonomySelection({ rank: 'genus', value: 'Alpha' });
    component.search();

    expect(component.result()).not.toBeNull();

    component.form.controls.mode.setValue('optimum');
    component.onAxisChange();

    expect(component.result()).toBeNull();
    expect(component.submittedQuery()).toBeNull();
    expect(component.assemblyCollection()).toEqual([{ rank: 'genus', value: 'Alpha' }]);
  });

  it('downloads CSV using the last submitted query', () => {
    component.search();
    component.downloadResults();

    expect(service.downloadResults).toHaveBeenCalledOnceWith(component.submittedQuery()!);
  });

  it('requests server-backed table pages and sorts', () => {
    const chartRenderSpy = spyOn(
      component as unknown as ChartRenderScheduler,
      'scheduleChartRender',
    );
    component.search();
    expect(chartRenderSpy).toHaveBeenCalledTimes(1);
    chartRenderSpy.calls.reset();

    component.onTablePageChange({ pageIndex: 1, pageSize: 10, length: 6, previousPageIndex: 0 });
    component.onTableSortChange({ active: 'species', direction: 'desc' });

    const pageRequest = service.query.calls.all()[1].args[0] as MicrobialEnvironmentG4Query;
    const sortRequest = service.query.calls.all()[2].args[0] as MicrobialEnvironmentG4Query;

    expect(pageRequest.page_index).toBe(1);
    expect(pageRequest.page_size).toBe(10);
    expect(pageRequest.density_metric).toBe('g4_density_per_mb');
    expect(sortRequest.page_index).toBe(0);
    expect(sortRequest.page_size).toBe(10);
    expect(sortRequest.sort_field).toBe('species');
    expect(sortRequest.sort_order).toBe('desc');
    expect(chartRenderSpy).not.toHaveBeenCalled();
  });

  it('refreshes chart statistics when the density metric changes', () => {
    const upstreamResponse: MicrobialEnvironmentG4QueryResponse = {
      ...response,
      correlation: { ...response.correlation, rho: -0.25, p_value: 0.02 },
      regression: {
        ...response.regression,
        r_squared: 0.42,
        line_points: [
          { phenotype_value: 20, density_value: 2 },
          { phenotype_value: 40, density_value: 4 },
        ],
      },
      scatter_points: [
        {
          ...response.scatter_points[0],
          upstream_g4_density_per_mb: 2,
        },
      ],
      table_preview: [
        {
          ...response.table_preview[0],
          strain: 'Unexpected table refresh',
        },
      ],
      preview_total: 999,
      download_filename: 'unexpected_table_refresh.csv',
    };
    service.query.and.callFake((request) =>
      of(request.density_metric === 'upstream_g4_density_per_mb' ? upstreamResponse : response),
    );
    const chartRenderSpy = spyOn(
      component as unknown as ChartRenderScheduler,
      'scheduleChartRender',
    );
    component.search();
    component.onTablePageChange({ pageIndex: 1, pageSize: 10, length: 6, previousPageIndex: 0 });
    const tablePreviewBeforeMetricChange = component.result()!.table_preview;
    service.query.calls.reset();
    chartRenderSpy.calls.reset();

    component.onDensityMetricChange('upstream_g4_density_per_mb');

    const request = service.query.calls.mostRecent().args[0] as MicrobialEnvironmentG4Query;
    expect(request.density_metric).toBe('upstream_g4_density_per_mb');
    expect(request.page_index).toBe(1);
    expect(request.page_size).toBe(10);
    expect(component.submittedQuery()?.density_metric).toBe('upstream_g4_density_per_mb');
    expect(component.result()?.correlation.rho).toBe(-0.25);
    expect(component.result()?.regression.r_squared).toBe(0.42);
    expect(component.result()?.table_preview).toBe(tablePreviewBeforeMetricChange);
    expect(component.result()?.preview_total).toBe(6);
    expect(component.result()?.download_filename).toBe(
      'microbial_environment_g4_growth_temperature_results.csv',
    );
    expect(chartRenderSpy).toHaveBeenCalledTimes(1);

    fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('-0.25');
    expect(text).toContain('0.42');
    expect(text).toContain('Growth temperature vs Upstream G4 density');
  });

  it('keeps the strain grid out of loading state during chart-only metric refresh', () => {
    component.search();
    service.query.calls.reset();
    service.query.and.returnValue(NEVER);

    component.onDensityMetricChange('upstream_g4_density_per_mb');

    expect(component.loadingQuery()).toBeTrue();
    expect(component.tableLoading()).toBeFalse();
  });

  it('marks the strain grid as loading for server-backed table changes', () => {
    component.search();
    service.query.calls.reset();
    service.query.and.returnValue(NEVER);

    component.onTablePageChange({ pageIndex: 1, pageSize: 10, length: 6, previousPageIndex: 0 });

    expect(component.tableLoading()).toBeTrue();
  });

  it('accepts numeric string density values from API responses for chart points', () => {
    const stringDensityResponse: MicrobialEnvironmentG4QueryResponse = {
      ...response,
      scatter_points: [
        {
          ...response.scatter_points[0],
          upstream_g4_density_per_mb: '2.5' as unknown as number,
        },
      ],
      regression: {
        ...response.regression,
        line_points: [
          { phenotype_value: 20, density_value: '2.5' as unknown as number },
          { phenotype_value: 40, density_value: '4.5' as unknown as number },
        ],
      },
    };
    service.query.and.callFake((request) =>
      of(
        request.density_metric === 'upstream_g4_density_per_mb' ? stringDensityResponse : response,
      ),
    );

    component.search();
    component.onDensityMetricChange('upstream_g4_density_per_mb');

    expect(component.chartPointCount(component.result()!.scatter_points)).toBe(1);
  });

  it('uses the chart container width instead of the previous Vega element width', () => {
    const chartFrame = document.createElement('div');
    const host = document.createElement('div');
    Object.defineProperty(chartFrame, 'clientWidth', {
      configurable: true,
      value: 800,
    });
    Object.defineProperty(host, 'clientWidth', {
      configurable: true,
      value: 1200,
    });
    chartFrame.appendChild(host);

    const width = (component as unknown as VegaWidthCalculator).vegaPlotWidth(host);

    expect(width).toBe(712);
  });

  it('resets the analysis setup completely', () => {
    component.form.controls.trait.setValue('ph');
    component.form.controls.mode.setValue('optimum');
    component.onAxisChange();
    component.form.controls.taxonomyKeyword.setValue('Alpha');
    component.addTaxonomySelection({ rank: 'genus', value: 'Alpha' });
    component.search();

    component.resetAnalysisSetup();

    expect(component.form.getRawValue()).toEqual({
      trait: 'temperature',
      mode: 'growth',
      taxonomyRank: 'genus',
      taxonomyKeyword: '',
    });
    expect(component.assemblyCollection()).toEqual([]);
    expect(component.taxonomyCandidates()).toEqual([]);
    expect(component.result()).toBeNull();
    expect(component.submittedQuery()).toBeNull();
    expect(component.selectedDensityMetric()).toBe('g4_density_per_mb');
  });

  it('shows a snackbar and skips submit when the known strain count is below five', () => {
    const snackBar = (component as unknown as { snackBar: MatSnackBar }).snackBar;
    const openSpy = spyOn(snackBar, 'open');
    const smallSelection: MicrobialTaxonomySearchResult = {
      rank: 'genus',
      value: 'Tiny',
      label: 'Tiny',
      eligible_assembly_count: 4,
    };
    component.addTaxonomySelection(smallSelection);
    service.query.calls.reset();

    component.search();

    expect(service.query).not.toHaveBeenCalled();
    expect(openSpy).toHaveBeenCalledWith(
      'At least 5 strains are required for analysis; current selection has 4 strains.',
      'Dismiss',
      { duration: 5000 },
    );
  });

  it('shows a lightweight unavailable state when options return 503', () => {
    fixture.destroy();
    service.getOptions.calls.reset();
    service.getOptions.and.returnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 503,
            error: { detail: 'g4vista.microbial_environment_g4_assembly_plan is not loaded.' },
          }),
      ),
    );

    fixture = TestBed.createComponent(MicrobialEnvironmentG4Component);
    component = fixture.componentInstance;
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(component.dataLayerUnavailable()).toBeTrue();
    expect(text).toContain('Research data unavailable');
  });
});
