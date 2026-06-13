import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import {
  Taxonomy,
  TaxonomyG4Summary,
  TaxonomyService,
} from '../../services/taxonomy.service';
import { TaxonomyInfoComponent } from './taxonomy-info';

describe('TaxonomyInfoComponent', () => {
  let service: jasmine.SpyObj<TaxonomyService>;

  const taxonomy: Taxonomy = {
    taxon_id: 3702,
    name: 'Arabidopsis thaliana',
    rank: 'species',
    lineage: [],
    assemblies: [
      {
        assembly_accession: 'GCF_SINGLE',
        organism_name: 'Arabidopsis thaliana',
        asm_name: 'TAIR10',
      },
    ],
  };

  const singleSummary: TaxonomyG4Summary = {
    taxon_id: 3702,
    comparison_mode: 'single_assembly',
    assembly_count: 1,
    genome_length_bp: 1_000_000,
    genome_length_mb: 1,
    motifs: {
      g4: { count: 12, density_per_mb: 12 },
      'i-motif': { count: 8, density_per_mb: 8 },
    },
    g4_i_motif_density_ratio: 1.5,
    density_distributions: {
      g4: {
        min_density_per_mb: 12,
        q1_density_per_mb: 12,
        median_density_per_mb: 12,
        q3_density_per_mb: 12,
        max_density_per_mb: 12,
      },
      'i-motif': {
        min_density_per_mb: 8,
        q1_density_per_mb: 8,
        median_density_per_mb: 8,
        q3_density_per_mb: 8,
        max_density_per_mb: 8,
      },
    },
    assembly_summaries: [
      {
        assembly_accession: 'GCF_SINGLE',
        organism_name: 'Arabidopsis thaliana',
        asm_name: 'TAIR10',
        species_name: 'Arabidopsis thaliana',
        seq_rel_date: '2017-03-15',
        taxon_id: 3702,
        genome_length_bp: 1_000_000,
        g4_count: 12,
        i_motif_count: 8,
        g4_density_per_mb: 12,
        i_motif_density_per_mb: 8,
      },
    ],
    position_distribution: {
      g4_type: 'g4',
      total_count: 12,
      categories: [],
      gene_biotype_breakdown: [],
    },
    filters: {
      tetrads: [],
      min_score: null,
      max_score: null,
      overlap: false,
      flank_window: 1000,
      counting_mode: 'exclusive',
    },
    quality: {
      regions_total_count: 1,
      regions_status_ok_count: 1,
      regions_length_mismatch_count: 0,
      warnings: [],
    },
  };

  const multiSummary: TaxonomyG4Summary = {
    ...singleSummary,
    comparison_mode: 'multi_assembly',
    assembly_count: 2,
    genome_length_bp: 3_000_000,
    genome_length_mb: 3,
    motifs: {
      g4: { count: 30, density_per_mb: 10 },
      'i-motif': { count: 15, density_per_mb: 5 },
    },
    g4_i_motif_density_ratio: 2,
    density_distributions: {
      g4: {
        min_density_per_mb: 5,
        q1_density_per_mb: 8.75,
        median_density_per_mb: 12.5,
        q3_density_per_mb: 16.25,
        max_density_per_mb: 20,
      },
      'i-motif': {
        min_density_per_mb: 5,
        q1_density_per_mb: 5,
        median_density_per_mb: 5,
        q3_density_per_mb: 5,
        max_density_per_mb: 5,
      },
    },
    assembly_summaries: [
      {
        assembly_accession: 'GCF_HIGH',
        organism_name: 'High density organism',
        asm_name: 'HIGH',
        species_name: 'High density organism',
        seq_rel_date: null,
        taxon_id: 2,
        genome_length_bp: 1_000_000,
        g4_count: 20,
        i_motif_count: 5,
        g4_density_per_mb: 20,
        i_motif_density_per_mb: 5,
      },
      {
        assembly_accession: 'GCF_LOW',
        organism_name: 'Low density organism',
        asm_name: 'LOW',
        species_name: 'Low density organism',
        seq_rel_date: null,
        taxon_id: 2,
        genome_length_bp: 2_000_000,
        g4_count: 10,
        i_motif_count: 10,
        g4_density_per_mb: 5,
        i_motif_density_per_mb: 5,
      },
    ],
  };

  beforeEach(async () => {
    service = jasmine.createSpyObj<TaxonomyService>('TaxonomyService', [
      'getTaxonomyData',
      'getTaxonomyG4Summary',
    ]);
    service.getTaxonomyData.and.returnValue(of(taxonomy));

    await TestBed.configureTestingModule({
      imports: [TaxonomyInfoComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: TaxonomyService, useValue: service },
      ],
    }).compileComponents();
  });

  async function createComponent(summary: TaxonomyG4Summary): Promise<ComponentFixture<TaxonomyInfoComponent>> {
    service.getTaxonomyG4Summary.and.returnValue(of(summary));
    const fixture = TestBed.createComponent(TaxonomyInfoComponent);
    fixture.componentRef.setInput('taxonId', 3702);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  it('renders single-assembly taxonomy as an assembly landscape without comparison text', async () => {
    const fixture = await createComponent(singleSummary);
    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain('Single-assembly landscape');
    expect(text).toContain('1 assembly available for this taxon');
    expect(text).toContain('Open genome');
    expect(text).not.toContain('IQR');
    expect(text).not.toContain('Highest G4 density');
  });

  it('renders multi-assembly taxonomy comparison sections', async () => {
    const fixture = await createComponent(multiSummary);
    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain('Multi-assembly comparison');
    expect(text).toContain('Assembly density distribution');
    expect(text).toContain('IQR');
    expect(text).toContain('Highest G4 density');
    expect(text).toContain('Lowest G4 density');
  });
});
