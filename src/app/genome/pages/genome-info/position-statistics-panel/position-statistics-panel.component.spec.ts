import { Component, input } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  EMPTY_G4_POSITION_STATISTICS,
  G4PositionCategoryStats,
  G4PositionStatisticsBiotypeCategory,
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
  const geneStats: G4PositionCategoryStats = {
    count: 2,
    denominator_bp: 1000,
    denominator_mode: 'gene',
    density_per_mb: 2000,
    min_score: 10,
    q1_score: 14,
    median_score: 20,
    p75_score: 30,
    max_score: 40,
    min_length: 18,
    q1_length: 20,
    median_length: 24,
    p75_length: 32,
    max_length: 38,
  };
  const upstreamStats: G4PositionCategoryStats = {
    ...geneStats,
    count: 1,
    denominator_mode: 'flank',
    density_per_mb: 1000,
    median_score: 16,
    p75_score: 18,
    median_length: 20,
    p75_length: 22,
  };
  const downstreamStats: G4PositionCategoryStats = {
    ...geneStats,
    count: 1,
    denominator_bp: 2000,
    denominator_mode: 'flank',
    density_per_mb: 500,
    median_score: 18,
    p75_score: 19,
    median_length: 22,
    p75_length: 24,
  };
  const highCountGeneStats: G4PositionCategoryStats = {
    ...geneStats,
    count: 4,
    density_per_mb: 4000,
  };
  const lowCountGeneStats: G4PositionCategoryStats = {
    ...geneStats,
    count: 0,
    density_per_mb: 0,
  };

  function biotypeCategory(
    biotype: string,
    key: 'gene_inside' | 'gene_upstream' | 'gene_downstream',
    stats: G4PositionCategoryStats,
  ): G4PositionStatisticsBiotypeCategory {
    return {
      biotype,
      category: key,
      quadruplex_types: { g4: stats },
    };
  }

  function biotypeCategories(
    bioType: string,
    categories: readonly [
      'gene_inside' | 'gene_upstream' | 'gene_downstream',
      G4PositionCategoryStats,
    ][],
  ): readonly G4PositionStatisticsBiotypeCategory[] {
    return categories.map(([category, stats]) => biotypeCategory(bioType, category, stats));
  }

  const extraBiotypeRows: readonly G4PositionStatisticsBiotypeCategory[] = Array.from(
    { length: 12 },
    (_value, index) =>
      biotypeCategories(`extra_${index + 1}`, [
        ['gene_inside', geneStats],
        ['gene_upstream', upstreamStats],
        ['gene_downstream', downstreamStats],
      ]),
  ).flat();
  const statistics: G4PositionStatisticsResponse = {
    ...EMPTY_G4_POSITION_STATISTICS,
    assembly_accession: 'GCF_1',
    genome_length_bp: 10_000,
    genome_length_mb: 0.01,
    filters: {
      windows: [1000],
      quadruplex_type: 'g4',
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
            display_description: 'Predicted G4 or i-motif-forming sequences in genes.',
            category_group: 'gene_context',
            is_default_chart_category: true,
            display_order: 1,
            merged_interval_length_bp: 1000,
            length_mb: 0.001,
            quadruplex_types: { g4: geneStats },
          },
          {
            key: 'gene_upstream',
            label: 'Gene upstream',
            description: 'Upstream gene',
            precedence_rank: 2,
            display_label: 'Upstream flank',
            display_description: 'Predicted G4 or i-motif-forming sequences in upstream flanks.',
            category_group: 'gene_context',
            is_default_chart_category: true,
            display_order: 2,
            merged_interval_length_bp: 1000,
            length_mb: 0.001,
            quadruplex_types: { g4: upstreamStats },
          },
          {
            key: 'gene_downstream',
            label: 'Gene downstream',
            description: 'Downstream gene',
            precedence_rank: 3,
            display_label: 'Downstream flank',
            display_description: 'Predicted G4 or i-motif-forming sequences in downstream flanks.',
            category_group: 'gene_context',
            is_default_chart_category: true,
            display_order: 3,
            merged_interval_length_bp: 2000,
            length_mb: 0.002,
            quadruplex_types: { g4: downstreamStats },
          },
          {
            key: 'other',
            label: 'Other',
            description: 'Outside genes and selected flanks',
            precedence_rank: 4,
            display_label: 'Other',
            display_description:
              'Predicted G4 or i-motif-forming sequences outside genes and selected gene flanks.',
            category_group: 'background',
            is_default_chart_category: true,
            display_order: 4,
            merged_interval_length_bp: 1000,
            length_mb: 0.001,
            quadruplex_types: { g4: geneStats },
          },
        ],
        biotype_categories: [
          ...biotypeCategories('protein_coding', [
            ['gene_inside', highCountGeneStats],
            ['gene_upstream', upstreamStats],
            ['gene_downstream', downstreamStats],
          ]),
          ...biotypeCategories('other', [
            ['gene_inside', lowCountGeneStats],
            ['gene_upstream', upstreamStats],
            ['gene_downstream', downstreamStats],
          ]),
          ...extraBiotypeRows,
        ],
      },
    ],
  };
  const statisticsWithoutStrengthQuantiles: G4PositionStatisticsResponse = {
    ...EMPTY_G4_POSITION_STATISTICS,
    assembly_accession: 'GCF_1',
    genome_length_bp: 10_000,
    genome_length_mb: 0.01,
    filters: {
      windows: [1000],
      quadruplex_type: 'g4',
    },
    windows: [
      {
        window_bp: 1000,
        categories: [
          {
            key: 'gene_inside',
            label: 'Gene inside',
            quadruplex_types: {
              g4: {
                count: 2,
                denominator_bp: 1000,
                denominator_mode: 'gene',
                density_per_mb: 2000,
              },
            },
          },
        ],
        biotype_categories: [
          {
            biotype: 'protein_coding',
            category: 'gene_inside',
            quadruplex_types: {
              g4: {
                count: 2,
                denominator_bp: 1000,
                denominator_mode: 'gene',
                density_per_mb: 2000,
              },
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
      'other',
    ]);
    fixture.detectChanges();
  });

  function renderedText(): string {
    return fixture.nativeElement.textContent as string;
  }

  async function expandDensityTable(): Promise<void> {
    const header = fixture.nativeElement.querySelector(
      '.biotype-density mat-expansion-panel-header',
    ) as HTMLElement | null;
    if (!header) {
      throw new Error('Density table expansion header was not rendered.');
    }

    header.click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  async function expandStrengthDistributions(): Promise<void> {
    const header = fixture.nativeElement.querySelector(
      '.statistics-details mat-expansion-panel-header',
    ) as HTMLElement | null;
    if (!header) {
      throw new Error('Score and length distributions expansion header was not rendered.');
    }

    header.click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  it('keeps the gene biotype density table collapsed by default', () => {
    const text = renderedText();

    expect(text).toContain('Gene biotype density');
    expect(text).toContain('Density table');
    expect(text).toContain('Sites per megabase for gene bodies and selected gene flanks.');
    expect(text).toContain('Score and length distributions');
    expect(text).not.toContain('protein_coding');
    expect(text).not.toContain('sites/Mb');
    expect(fixture.nativeElement.querySelector('.biotype-density .density-table')).toBeNull();
    expect(
      fixture.nativeElement.querySelector('.biotype-density .mat-expansion-panel.mat-expanded'),
    ).toBeNull();
  });

  it('renders the gene biotype density table after expansion without repeated overview summary content', async () => {
    await expandDensityTable();

    const text = renderedText();

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

  it('sorts gene biotype density rows by site count descending', () => {
    const component = fixture.componentInstance;

    fixture.componentRef.setInput('statistics', {
      ...statistics,
      windows: [
        {
          ...statistics.windows[0],
          biotype_categories: [
            ...biotypeCategories('low_count', [
              ['gene_inside', { ...geneStats, count: 1 }],
              ['gene_upstream', { ...upstreamStats, count: 0 }],
              ['gene_downstream', { ...downstreamStats, count: 0 }],
            ]),
            ...biotypeCategories('high_count', [
              ['gene_inside', { ...geneStats, count: 9 }],
              ['gene_upstream', { ...upstreamStats, count: 0 }],
              ['gene_downstream', { ...downstreamStats, count: 0 }],
            ]),
            ...biotypeCategories('mid_count', [
              ['gene_inside', { ...geneStats, count: 5 }],
              ['gene_upstream', { ...upstreamStats, count: 0 }],
              ['gene_downstream', { ...downstreamStats, count: 0 }],
            ]),
          ],
        },
      ],
    });
    fixture.detectChanges();

    expect(component.biotypeDensityRows().map((row) => row.key)).toEqual([
      'high_count',
      'mid_count',
      'low_count',
    ]);
  });

  it('moves rows after the sorted density table limit into a collapsed table', () => {
    const component = fixture.componentInstance;

    expect(component.visibleBiotypeDensityRows().map((row) => row.key)).toEqual([
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
      'extra_11',
    ]);
    expect(component.additionalBiotypeDensityRows().map((row) => row.key)).toEqual([
      'extra_12',
      'other',
    ]);
  });

  it('keeps score and length plots collapsed until requested', async () => {
    expect(fixture.nativeElement.querySelector('.boxplot-stub')).toBeNull();
    expect(fixture.nativeElement.querySelector('.mat-expansion-panel.mat-expanded')).toBeNull();

    await expandStrengthDistributions();

    const text = renderedText();
    expect(text).toContain('G-score distribution');
    expect(text).toContain('Length distribution');
  });

  it('shows a single state when current position statistics omit strength quantiles', async () => {
    const component = fixture.componentInstance;

    fixture.componentRef.setInput('statistics', statisticsWithoutStrengthQuantiles);
    fixture.componentRef.setInput('selectedCategoryKeys', ['gene_inside']);
    fixture.detectChanges();

    expect(component.hasStrengthBoxPlotData()).toBeFalse();

    await expandStrengthDistributions();

    const text = renderedText();
    expect(text).toContain(
      'No score or length distribution data are available for the selected motif type.',
    );
    expect(text).not.toContain('No G-score distribution box plot data.');
    expect(text).not.toContain('No Length distribution box plot data.');
    expect(fixture.nativeElement.querySelector('.boxplot-stub')).toBeNull();
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
