import { Component, input } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  EMPTY_G4_POSITION_STATISTICS,
  G4PositionMotifStats,
  G4PositionStatisticsGeneBiotypeBreakdown,
  G4PositionStatisticsGeneBiotypeCategory,
  G4PositionStatisticsResponse,
} from '../../../services/g4.service';
import {
  StrengthBoxPlotDatum,
  StrengthBoxPlotVegaComponent,
} from '../position-distribution/strength-box-plot-vega.component';
import { PositionStatisticsPanelComponent } from './position-statistics-panel.component';

@Component({
  selector: 'app-strength-box-plot-vega',
  template: '<section class="boxplot-stub">{{ title() }}</section>',
})
class StrengthBoxPlotStubComponent {
  readonly title = input.required<string>();
  readonly rows = input.required<readonly StrengthBoxPlotDatum[]>();
  readonly tooltip = input.required<string>();
}

describe('PositionStatisticsPanelComponent', () => {
  const geneStats: G4PositionMotifStats = {
    count: 2,
    density_per_mb: 2000,
    expected_vs_genome: 1,
    fold_vs_genome: 2,
    fold_vs_other: 3,
    fold_vs_non_feature: 3,
    min_score: 10,
    q1_score: 14,
    median_score: 20,
    p75_score: 30,
    max_score: 40,
    min_tetrads: 2,
    q1_tetrads: 2,
    median_tetrads: 3,
    p75_tetrads: 4,
    max_tetrads: 5,
    min_length: 18,
    q1_length: 20,
    median_length: 24,
    p75_length: 32,
    max_length: 38,
  };
  const upstreamStats: G4PositionMotifStats = {
    ...geneStats,
    count: 1,
    density_per_mb: 1000,
    median_score: 16,
    p75_score: 18,
    median_length: 20,
    p75_length: 22,
  };
  const downstreamStats: G4PositionMotifStats = {
    ...geneStats,
    count: 1,
    density_per_mb: 500,
    median_score: 18,
    p75_score: 19,
    median_length: 22,
    p75_length: 24,
  };

  function biotypeCategory(
    key: 'gene_inside' | 'gene_upstream' | 'gene_downstream',
    count: number,
    lengthMb: number,
    stats: G4PositionMotifStats,
  ): G4PositionStatisticsGeneBiotypeCategory {
    const displayLabels = {
      gene_inside: 'In genes',
      gene_upstream: 'Upstream flank',
      gene_downstream: 'Downstream flank',
    } as const;
    return {
      key,
      label: key,
      description: key,
      precedence_rank: key === 'gene_inside' ? 1 : key === 'gene_upstream' ? 2 : 3,
      display_label: displayLabels[key],
      display_description: displayLabels[key],
      category_group: 'gene_context',
      is_default_chart_category: true,
      display_order: key === 'gene_inside' ? 1 : key === 'gene_upstream' ? 2 : 3,
      count,
      merged_interval_length_bp: lengthMb * 1_000_000,
      length_mb: lengthMb,
      motifs: { g4: { ...stats, count } },
    };
  }

  function biotypeRow(
    bioType: string,
    displayLabel: string,
    totalCount: number,
    categories: readonly G4PositionStatisticsGeneBiotypeCategory[],
  ): G4PositionStatisticsGeneBiotypeBreakdown {
    return {
      bio_type: bioType,
      display_label: displayLabel,
      total_count: totalCount,
      categories: [...categories],
    };
  }

  const extraBiotypeRows: readonly G4PositionStatisticsGeneBiotypeBreakdown[] = Array.from(
    { length: 12 },
    (_value, index) =>
      biotypeRow(`extra_${index + 1}`, `extra_${index + 1}`, 1, [
        biotypeCategory('gene_inside', 1, 0.001, geneStats),
        biotypeCategory('gene_upstream', 0, 0.001, upstreamStats),
        biotypeCategory('gene_downstream', 0, 0.001, downstreamStats),
      ]),
  );
  const statistics: G4PositionStatisticsResponse = {
    ...EMPTY_G4_POSITION_STATISTICS,
    assembly_accession: 'GCF_1',
    genome_length_bp: 10_000,
    genome_length_mb: 0.01,
    filters: {
      windows: [1000],
      g4_type: 'g4',
      tetrads: [],
      min_score: null,
      max_score: null,
      overlap: false,
    },
    windows: [
      {
        window_bp: 1000,
        categories: [
          {
            key: 'gene_inside',
            label: 'Gene inside',
            description: 'Inside gene',
            precedence_rank: 1,
            display_label: 'In genes',
            display_description: 'Predicted motif sites in genes.',
            category_group: 'gene_context',
            is_default_chart_category: true,
            display_order: 1,
            merged_interval_length_bp: 1000,
            length_mb: 0.001,
            motifs: { g4: geneStats },
            asymmetry: {
              g4_fraction: null,
              i_motif_fraction: null,
              fraction_delta: null,
              count_delta: 0,
              density_ratio_g4_over_i_motif: null,
            },
          },
          {
            key: 'gene_upstream',
            label: 'Gene upstream',
            description: 'Upstream gene',
            precedence_rank: 2,
            display_label: 'Upstream flank',
            display_description: 'Predicted motif sites in upstream flanks.',
            category_group: 'gene_context',
            is_default_chart_category: true,
            display_order: 2,
            merged_interval_length_bp: 1000,
            length_mb: 0.001,
            motifs: { g4: upstreamStats },
            asymmetry: {
              g4_fraction: null,
              i_motif_fraction: null,
              fraction_delta: null,
              count_delta: 0,
              density_ratio_g4_over_i_motif: null,
            },
          },
          {
            key: 'gene_downstream',
            label: 'Gene downstream',
            description: 'Downstream gene',
            precedence_rank: 3,
            display_label: 'Downstream flank',
            display_description: 'Predicted motif sites in downstream flanks.',
            category_group: 'gene_context',
            is_default_chart_category: true,
            display_order: 3,
            merged_interval_length_bp: 2000,
            length_mb: 0.002,
            motifs: { g4: downstreamStats },
            asymmetry: {
              g4_fraction: null,
              i_motif_fraction: null,
              fraction_delta: null,
              count_delta: 0,
              density_ratio_g4_over_i_motif: null,
            },
          },
          {
            key: 'other',
            label: 'Other',
            description: 'Outside genes and selected flanks',
            precedence_rank: 4,
            display_label: 'Other',
            display_description: 'Predicted motif sites outside genes and selected gene flanks.',
            category_group: 'background',
            is_default_chart_category: true,
            display_order: 4,
            merged_interval_length_bp: 1000,
            length_mb: 0.001,
            motifs: { g4: geneStats },
            asymmetry: {
              g4_fraction: null,
              i_motif_fraction: null,
              fraction_delta: null,
              count_delta: 0,
              density_ratio_g4_over_i_motif: null,
            },
          },
        ],
        gene_biotype_breakdown: [
          biotypeRow('protein_coding', 'protein_coding', 4, [
            biotypeCategory('gene_inside', 2, 0.001, geneStats),
            biotypeCategory('gene_upstream', 1, 0.001, upstreamStats),
            biotypeCategory('gene_downstream', 1, 0.002, downstreamStats),
          ]),
          biotypeRow('other', 'Unspecified gene biotype', 1, [
            biotypeCategory('gene_inside', 1, 0.001, geneStats),
            biotypeCategory('gene_upstream', 0, 0.001, upstreamStats),
            biotypeCategory('gene_downstream', 0, 0.001, downstreamStats),
          ]),
          ...extraBiotypeRows,
        ],
      },
    ],
  };

  let fixture: ComponentFixture<PositionStatisticsPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PositionStatisticsPanelComponent],
    })
      .overrideComponent(PositionStatisticsPanelComponent, {
        remove: { imports: [StrengthBoxPlotVegaComponent] },
        add: { imports: [StrengthBoxPlotStubComponent] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(PositionStatisticsPanelComponent);
    fixture.componentRef.setInput('statistics', statistics);
    fixture.componentRef.setInput('isLoading', false);
    fixture.componentRef.setInput('errorMessage', '');
    fixture.componentRef.setInput('g4Type', 'g4');
    fixture.componentRef.setInput('selectedCategoryKeys', [
      'gene_inside',
      'gene_upstream',
      'gene_downstream',
      'other',
    ]);
    fixture.detectChanges();
  });

  function renderedText(): string {
    return fixture.nativeElement.textContent as string;
  }

  it('renders the gene biotype density table without repeated overview summary content', () => {
    const text = renderedText();

    expect(text).toContain('Gene biotype density');
    expect(text).toContain('Density table');
    expect(text).toContain('protein_coding');
    expect(text).toContain('Other');
    expect(text).toContain('sites/Mb');
    expect(text).toContain('2 sites / 0.001 Mb');
    expect(text).toContain('Score and length distributions');
    expect(text).toContain('Additional gene biotypes');
    expect(text).not.toContain('Density by position category');
    expect(text).not.toContain('Counts, denominator size, and normalized density');
    expect(text).not.toContain('sequences/Mb');
    expect(text.toLowerCase()).not.toContain('enrichment');
    expect(text).not.toContain('Other annotations');
    expect(text).not.toContain('Outside annotations');
    expect(text).not.toContain('Non-feature');
    expect(text).not.toContain('No assigned feature');
    expect(text).not.toContain('Unspecified gene biotype');
    expect(fixture.nativeElement.querySelector('.density-track')).toBeNull();
    expect(fixture.nativeElement.querySelector('.density-bar')).toBeNull();
  });

  it('keeps Other visible and moves lower-ranked non-Other biotypes into a collapsed table', () => {
    const component = fixture.componentInstance;

    expect(component.visibleBiotypeDensityRows().map((row) => row.key)).toEqual([
      'other',
      'protein_coding',
      'extra_1',
      'extra_2',
      'extra_3',
      'extra_4',
      'extra_5',
      'extra_6',
      'extra_7',
      'extra_8',
      'extra_9',
      'extra_10',
    ]);
    expect(component.additionalBiotypeDensityRows().map((row) => row.key)).toEqual([
      'extra_11',
      'extra_12',
    ]);
  });

  it('keeps score and length plots collapsed until requested', async () => {
    expect(fixture.nativeElement.querySelector('.boxplot-stub')).toBeNull();
    expect(fixture.nativeElement.querySelector('.mat-expansion-panel.mat-expanded')).toBeNull();

    const header = fixture.nativeElement.querySelector(
      '.statistics-details mat-expansion-panel-header',
    ) as HTMLElement;
    header.click();
    fixture.detectChanges();
    await fixture.whenStable();

    const text = renderedText();
    expect(text).toContain('G-score distribution');
    expect(text).toContain('Length distribution');
  });

  it('keeps the density table independent from selected overview categories', () => {
    const component = fixture.componentInstance;

    fixture.componentRef.setInput('selectedCategoryKeys', ['gene_inside']);
    fixture.detectChanges();

    expect(component.visibleBiotypeDensityRows()[0].cells.map((cell) => cell.key)).toEqual([
      'gene_inside',
      'gene_upstream',
      'gene_downstream',
    ]);
    expect(component.strengthBoxPlots()[0].rows.map((row) => row.key)).toEqual(['gene_inside']);
    expect(component.strengthBoxPlots()[1].rows.map((row) => row.key)).toEqual(['gene_inside']);
  });
});
