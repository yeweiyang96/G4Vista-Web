import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ArcElement, Legend, PieController, Tooltip } from 'chart.js';
import { provideCharts } from 'ng2-charts';
import { of } from 'rxjs';
import { Taxonomy, TaxonomyG4Summary, TaxonomyService } from '../../services/taxonomy.service';
import type { G4GeneBiotypePositionBreakdown } from '../../../genome/services/g4.service';
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

  function geneBiotypeBreakdownRow(
    bioType: string | null,
    insideCount: number,
    upstreamCount: number,
    downstreamCount: number,
  ): G4GeneBiotypePositionBreakdown {
    const totalCount = insideCount + upstreamCount + downstreamCount;
    return {
      bio_type: bioType,
      display_label: bioType ?? 'Unspecified gene biotype',
      total_count: totalCount,
      categories: [
        {
          key: 'gene_inside',
          label: 'In genes',
          count: insideCount,
          ratio: 0,
          precedence_rank: 1,
          description: 'Inside genes',
        },
        {
          key: 'gene_upstream',
          label: 'Upstream flank',
          count: upstreamCount,
          ratio: 0,
          precedence_rank: 2,
          description: 'Upstream flank',
        },
        {
          key: 'gene_downstream',
          label: 'Downstream flank',
          count: downstreamCount,
          ratio: 0,
          precedence_rank: 3,
          description: 'Downstream flank',
        },
      ],
    };
  }

  function pagedGeneBiotypeRows(): G4GeneBiotypePositionBreakdown[] {
    return Array.from({ length: 15 }, (_, index) => {
      const rank = index + 1;
      const bioType = `rank_${String(rank).padStart(2, '0')}`;
      return geneBiotypeBreakdownRow(bioType, rank * 10, 0, 0);
    });
  }

  function renderedGeneBiotypeLabels(root: HTMLElement): string[] {
    return Array.from(root.querySelectorAll('.gene-biotype-summary tbody th')).map(
      (element) => element.textContent?.trim() ?? '',
    );
  }

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
      total_count: 20,
      categories: [
        {
          key: 'gene_inside',
          label: 'In genes',
          count: 6,
          ratio: 0.3,
          precedence_rank: 1,
          description: 'Inside genes',
          display_label: 'In genes',
          category_group: 'gene_context',
          is_default_chart_category: true,
          display_order: 1,
        },
        {
          key: 'gene_upstream',
          label: 'Upstream flank',
          count: 4,
          ratio: 0.2,
          precedence_rank: 2,
          description: 'Upstream flank',
          display_label: 'Upstream flank',
          category_group: 'gene_context',
          is_default_chart_category: true,
          display_order: 2,
        },
        {
          key: 'gene_downstream',
          label: 'Downstream flank',
          count: 2,
          ratio: 0.1,
          precedence_rank: 3,
          description: 'Downstream flank',
          display_label: 'Downstream flank',
          category_group: 'gene_context',
          is_default_chart_category: true,
          display_order: 3,
        },
        {
          key: 'other',
          label: 'Other',
          count: 8,
          ratio: 0.4,
          precedence_rank: 4,
          description: 'Outside genes and selected flanks',
          display_label: 'Other',
          category_group: 'background',
          is_default_chart_category: true,
          display_order: 4,
        },
      ],
      gene_biotype_breakdown: [
        {
          bio_type: 'protein_coding',
          display_label: 'protein_coding',
          total_count: 3_580_245,
          categories: [
            {
              key: 'gene_inside',
              label: 'In genes',
              count: 1_234_567,
              ratio: 0.5,
              precedence_rank: 1,
              description: 'Inside genes',
            },
            {
              key: 'gene_upstream',
              label: 'Upstream flank',
              count: 2_000_000,
              ratio: 0.3,
              precedence_rank: 2,
              description: 'Upstream flank',
            },
            {
              key: 'gene_downstream',
              label: 'Downstream flank',
              count: 345_678,
              ratio: 0.2,
              precedence_rank: 3,
              description: 'Downstream flank',
            },
          ],
        },
        {
          bio_type: null,
          display_label: 'Unspecified gene biotype',
          total_count: 12,
          categories: [
            {
              key: 'gene_inside',
              label: 'In genes',
              count: 1,
              ratio: 0.08,
              precedence_rank: 1,
              description: 'Inside genes',
            },
            {
              key: 'gene_upstream',
              label: 'Upstream flank',
              count: 2,
              ratio: 0.17,
              precedence_rank: 2,
              description: 'Upstream flank',
            },
            {
              key: 'gene_downstream',
              label: 'Downstream flank',
              count: 1,
              ratio: 0.08,
              precedence_rank: 3,
              description: 'Downstream flank',
            },
          ],
        },
      ],
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
        provideCharts({
          registerables: [PieController, ArcElement, Tooltip, Legend],
        }),
        { provide: TaxonomyService, useValue: service },
      ],
    }).compileComponents();
  });

  async function createComponent(
    summary: TaxonomyG4Summary,
  ): Promise<ComponentFixture<TaxonomyInfoComponent>> {
    service.getTaxonomyG4Summary.and.returnValue(of(summary));
    const fixture = TestBed.createComponent(TaxonomyInfoComponent);
    fixture.componentRef.setInput('taxonId', 3702);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  it('loads taxon-level summary statistics by default', async () => {
    const fixture = await createComponent(singleSummary);
    const text = fixture.nativeElement.textContent as string;

    expect(service.getTaxonomyG4Summary).toHaveBeenCalledWith({
      taxonId: 3702,
      g4Type: 'g4',
      flankWindow: 1000,
      tetrads: [],
      minScore: null,
      maxScore: null,
      overlap: false,
    });
    expect(text).toContain('Taxon-level G4 position context');
    expect(text).not.toContain('Load context');
    expect(text).not.toContain('Context statistics are loaded on demand.');
    expect(text).not.toContain('Available assemblies');
    expect(text).not.toContain('Taxon-level G4 statistics');
    expect(text).not.toContain('IQR');
    expect(text).not.toContain('Highest G4 density');
  });

  it('reloads the position context when switching motif type', async () => {
    const fixture = await createComponent(singleSummary);

    fixture.componentInstance.setG4Type('i-motif');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(service.getTaxonomyG4Summary).toHaveBeenCalledWith({
      taxonId: 3702,
      g4Type: 'i-motif',
      flankWindow: 1000,
      tetrads: [],
      minScore: null,
      maxScore: null,
      overlap: false,
    });
    expect(text).toContain('Taxon-level i-motif position context');
  });

  it('renders gene-context pie categories and biotype table by default', async () => {
    const fixture = await createComponent(singleSummary);

    const text = fixture.nativeElement.textContent as string;

    expect(service.getTaxonomyG4Summary).toHaveBeenCalledWith({
      taxonId: 3702,
      g4Type: 'g4',
      flankWindow: 1000,
      tetrads: [],
      minScore: null,
      maxScore: null,
      overlap: false,
    });
    expect(text).toContain('Pie slices are G4 sequence counts by genomic context.');
    expect(text).toContain('Other means sequences outside genes and selected gene flanks.');
    expect(text).toContain('Legend values are count · percentage.');
    expect(text).toContain('G4 density (sequences/Mb)');
    expect(text).toContain('i-motif density (sequences/Mb)');
    expect(text).toContain('Table values are G4 gene-context sequence counts by gene biotype.');
    expect(text).toContain('Other means unspecified or source-annotated other gene biotype.');
    expect(text).toContain('Intragenic G4 sequences');
    expect(text).toContain('Upstream 1 kb G4 sequences');
    expect(text).toContain('Downstream 1 kb G4 sequences');
    expect(text).toContain('Total gene-context G4 sequences');
    expect(text).toContain('Other');
    expect(text).not.toContain('Gene biotype breakdown');
    expect(text).toContain('protein_coding');

    const tableText =
      (fixture.nativeElement as HTMLElement).querySelector('.gene-biotype-summary table')
        ?.textContent ?? '';
    expect(tableText).toContain('1,234,567');
    expect(tableText).toContain('2,000,000');
    expect(tableText).toContain('3,580,245');
    expect(tableText).not.toContain('1.2M');

    expect(text).not.toContain('Unspecified gene biotype');
    expect(text).not.toContain('Non-gene annotation feature');
    expect(text).not.toContain('No assigned feature');
  });

  it('paginates gene biotype rows sorted by total gene-context counts', async () => {
    const pagedSummary: TaxonomyG4Summary = {
      ...singleSummary,
      position_distribution: {
        ...singleSummary.position_distribution,
        gene_biotype_breakdown: pagedGeneBiotypeRows(),
      },
    };
    const fixture = await createComponent(pagedSummary);

    const root = fixture.nativeElement as HTMLElement;
    expect(renderedGeneBiotypeLabels(root)).toEqual([
      'rank_15',
      'rank_14',
      'rank_13',
      'rank_12',
      'rank_11',
      'rank_10',
      'rank_09',
      'rank_08',
      'rank_07',
      'rank_06',
    ]);
    expect(root.textContent).not.toContain('rank_05');

    const nextPageButton = root.querySelector(
      '.gene-biotype-paginator button[aria-label="Next page"]',
    ) as HTMLButtonElement | null;
    expect(nextPageButton).not.toBeNull();
    nextPageButton?.click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(renderedGeneBiotypeLabels(root)).toEqual([
      'rank_05',
      'rank_04',
      'rank_03',
      'rank_02',
      'rank_01',
    ]);
    expect(root.textContent).not.toContain('rank_06');
  });

  it('does not render multi-assembly comparison data in the position context view', async () => {
    const fixture = await createComponent(multiSummary);

    const text = fixture.nativeElement.textContent as string;
    expect(text).not.toContain('Assembly density distribution');
    expect(text).not.toContain('IQR');
    expect(text).not.toContain('Highest G4 density');
    expect(text).not.toContain('Lowest G4 density');
  });
});
