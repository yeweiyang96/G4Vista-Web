import { HttpErrorResponse } from '@angular/common/http';
import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NEVER, of, throwError } from 'rxjs';
import {
  MicrobialEnvironmentG4Options,
  MicrobialEnvironmentG4Query,
  MicrobialEnvironmentG4QueryResponse,
  MicrobialEnvironmentG4Service,
} from '../../services/microbial-environment-g4.service';
import { MicrobialEnvironmentG4Component } from './microbial-environment-g4.component';

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
        eligible_assemblies: 2,
      },
      {
        plan_id: 'optimum_ph_g4',
        trait: 'ph',
        mode: 'optimum',
        phenotype_label: 'Optimum pH',
        phenotype_unit: 'pH',
        eligible_assemblies: 3,
      },
    ],
  };

  const response: MicrobialEnvironmentG4QueryResponse = {
    summary: {
      plan_id: 'growth_temperature_g4',
      assembly_count: 2,
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
        { phenotype_value: 20, g4_density_per_mb: 5 },
        { phenotype_value: 40, g4_density_per_mb: 9 },
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
        g4_count: 10,
        gc_percent: 50,
        genome_size: 1_000_000,
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
        g4_count: 10,
        gc_percent: 50,
        genome_size: 1_000_000,
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
        upstream_g4_density_per_mb: 1,
        downstream_g4_density_per_mb: 1,
        intergenic_g4_density_per_mb: 3,
      },
    ],
    preview_total: 2,
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
        results: [{ rank: 'genus', value: 'Alpha', label: 'Alpha', eligible_assembly_count: 2 }],
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
    expect(component.submittedQuery()).toEqual(request);
  });

  it('renders the workflow and correlation result surfaces', () => {
    component.search();
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain('Microbial G4 Environment Research');
    expect(text).toContain('Environment condition');
    expect(text).toContain('Assembly set');
    expect(text).toContain('Run analysis');
    expect(text).toContain('Spearman rho');
    expect(text).toContain('Regression R2');
    expect(text).toContain('Download CSV');
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

  it('uses explicit taxonomy Find and Add to build an assembly collection', () => {
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
