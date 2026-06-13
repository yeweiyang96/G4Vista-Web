import { Component, input } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  EMPTY_G4_POSITION_STATISTICS,
  G4PositionMotifStats,
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
            key: 'non_feature',
            label: 'Non-feature',
            description: 'No feature',
            precedence_rank: 5,
            display_label: 'No assigned feature',
            display_description: 'Background category.',
            category_group: 'background',
            is_default_chart_category: false,
            display_order: 5,
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
    ]);
    fixture.detectChanges();
  });

  function renderedText(): string {
    return fixture.nativeElement.textContent as string;
  }

  it('renders a dedicated statistics section without background or enrichment wording', () => {
    const text = renderedText();

    expect(text).toContain('Gene-context position statistics');
    expect(text).toContain('Density by gene context');
    expect(text).toContain('Category summary');
    expect(text).toContain('sites/Mb');
    expect(text).toContain('G-score distribution');
    expect(text).toContain('Length distribution');
    expect(text.toLowerCase()).not.toContain('enrichment');
    expect(text).not.toContain('Other annotations');
    expect(text).not.toContain('Outside annotations');
    expect(text).not.toContain('Non-feature');
    expect(text).not.toContain('No assigned feature');
  });

  it('shows density rows only for selected gene-context categories', () => {
    const component = fixture.componentInstance;

    fixture.componentRef.setInput('selectedCategoryKeys', ['gene_inside', 'gene_downstream']);
    fixture.detectChanges();

    expect(component.densityRows().map((row) => row.key)).toEqual([
      'gene_inside',
      'gene_downstream',
    ]);
    expect(component.strengthBoxPlots()[0].rows.map((row) => row.key)).toEqual([
      'gene_inside',
      'gene_downstream',
    ]);
    expect(component.strengthBoxPlots()[1].rows.map((row) => row.key)).toEqual([
      'gene_inside',
      'gene_downstream',
    ]);
  });
});
