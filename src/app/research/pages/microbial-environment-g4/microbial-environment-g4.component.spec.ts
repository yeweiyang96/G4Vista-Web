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
    metrics: [
      { value: 'g4_density_per_mb', label: 'G4 density per Mb' },
      { value: 'g4_count', label: 'G4 count' },
      { value: 'g4_mean_score', label: 'G4 mean score' },
    ],
    bin_ranges: [
      {
        trait: 'temperature',
        mode: 'growth',
        bin_step: 1,
        min: 20,
        max: 40,
        eligible_genomes: 2,
      },
    ],
  };

  const response: MicrobialEnvironmentG4QueryResponse = {
    summary: {
      matching_genomes: 2,
      bin_rows: 4,
      bin_count: 2,
      sixteen_s_genomes: 1,
      sixteen_s_rows: 1,
    },
    bin_stats: [
      {
        bin_start: 20,
        bin_end: 21,
        bin_mid: 20.5,
        genome_count: 2,
        g4_density_mean: 4,
        g4_density_median: 4,
        g4_count_mean: 10,
        g4_mean_score_mean: 12,
      },
    ],
    scatter_points: [
      {
        genome_accession: 'GCF_1',
        bin_mid: 20.5,
        g4_density_per_mb: 4,
        g4_count: 10,
        g4_mean_score: 12,
      },
    ],
    taxonomy_breakdown: [{ rank: 'genus', value: 'Alpha', genome_count: 2 }],
    genome_preview: [
      {
        genome_accession: 'GCF_1',
        domain: 'Bacteria',
        phylum: 'Firmicutes',
        class_name: 'Bacilli',
        order: 'Bacillales',
        family: 'Bacillaceae',
        genus: 'Alpha',
        species: 'Alpha one',
        trait_min: 20,
        trait_max: 21,
        genome_size: 1_000_000,
        gc_percent: 50,
        g4_count: 10,
        g4_density_per_mb: 4,
        g4_mean_score: 12,
      },
    ],
    sixteen_s_preview: [
      {
        genome_accession: 'GCF_1',
        sixteen_s_accession: 'NR_1',
        sixteen_s_gc: 55,
        sixteen_s_length: 1500,
        sixteen_s_g4_count: 2,
        sixteen_s_g4_density_per_kb: 1.33,
        sixteen_s_g4_mean_score: 11,
      },
    ],
    preview_total: 2,
  };

  beforeEach(async () => {
    service = jasmine.createSpyObj<MicrobialEnvironmentG4Service>('MicrobialEnvironmentG4Service', [
      'getOptions',
      'searchTaxonomy',
      'query',
      'downloadGenomes',
      'downloadBinStats',
      'downloadBinRows',
      'downloadSixteenS',
    ]);
    service.getOptions.and.returnValue(of(options));
    service.searchTaxonomy.and.returnValue(
      of({
        results: [{ rank: 'genus', value: 'Alpha', label: 'Alpha', eligible_genome_count: 2 }],
      }),
    );
    service.query.and.returnValue(of(response));
    service.downloadGenomes.and.returnValue(NEVER);
    service.downloadBinStats.and.returnValue(NEVER);
    service.downloadBinRows.and.returnValue(NEVER);
    service.downloadSixteenS.and.returnValue(NEVER);

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
    component.onAxisChange();
    fixture.detectChanges();

    expect(service.query).not.toHaveBeenCalled();

    component.search();

    expect(service.query).toHaveBeenCalledTimes(1);
    const request = service.query.calls.mostRecent().args[0] as MicrobialEnvironmentG4Query;
    expect(request.trait).toBe('ph');
    expect(request.mode).toBe('growth');
    expect(component.submittedQuery()).toEqual(request);
  });

  it('renders the redesigned workflow without removed terminology', () => {
    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain('Microbial G4 Environment Research');
    expect(text).toContain('Environment axis');
    expect(text).toContain('Genome collection');
    expect(text).toContain('Results');
    expect(text.toLowerCase()).not.toContain('assembly');
    expect(text.toLowerCase()).not.toContain('evidence class');
    expect(text.toLowerCase()).not.toContain('bounds');
  });

  it('updates the study summary when the environment axis changes', () => {
    component.form.controls.trait.setValue('ph');
    component.form.controls.mode.setValue('optimum');
    component.onAxisChange();
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;

    expect(component.studySummary()).toBe(
      "Analyze whole-genome G4 density across pH bins using each genome's optimum interval.",
    );
    expect(text).toContain("pH bins using each genome's optimum interval");
  });

  it('uses explicit taxonomy Find and Add to build a genome collection', () => {
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

    expect(component.genomeCollection()).toEqual([{ rank: 'genus', value: 'Alpha' }]);
  });

  it('clears submitted results when trait or mode changes but keeps draft genome collection', () => {
    component.addTaxonomySelection({ rank: 'genus', value: 'Alpha' });
    component.search();

    expect(component.result()).not.toBeNull();

    component.form.controls.mode.setValue('optimum');
    component.onAxisChange();

    expect(component.result()).toBeNull();
    expect(component.submittedQuery()).toBeNull();
    expect(component.genomeCollection()).toEqual([{ rank: 'genus', value: 'Alpha' }]);
  });

  it('downloads CSV using the last submitted query', () => {
    component.search();
    component.downloadBinStats();

    expect(service.downloadBinStats).toHaveBeenCalledOnceWith(component.submittedQuery()!);
  });

  it('shows a lightweight unavailable state when options return 503', () => {
    fixture.destroy();
    service.getOptions.calls.reset();
    service.getOptions.and.returnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 503,
            error: { detail: 'g4vista.microbial_environment_g4_genome is not loaded.' },
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
