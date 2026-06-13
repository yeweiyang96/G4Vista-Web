import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { By } from '@angular/platform-browser';
import { MatTabGroupHarness } from '@angular/material/tabs/testing';
import { ArcElement, DoughnutController, Legend, Tooltip } from 'chart.js';
import type { TooltipItem, TooltipModel } from 'chart.js';
import { BaseChartDirective, provideCharts } from 'ng2-charts';
import {
  EMPTY_G4_POSITION_DISTRIBUTION,
  EMPTY_G4_POSITION_STATISTICS,
  G4PositionDistributionResponse,
  G4PositionMotifStats,
  G4PositionStatisticsResponse,
} from '../../../services/g4.service';
import { PositionDistributionComponent } from './position-distribution.component';

describe('PositionDistributionComponent', () => {
  const g4Stats: G4PositionMotifStats = {
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
    ...g4Stats,
    count: 1,
    density_per_mb: 1000,
    fold_vs_genome: 1,
    fold_vs_non_feature: null,
    min_score: 12,
    q1_score: 13,
    median_score: 16,
    p75_score: 18,
    max_score: 22,
    min_tetrads: 2,
    q1_tetrads: 2,
    median_tetrads: 2,
    p75_tetrads: 3,
    max_tetrads: 3,
    min_length: 18,
    q1_length: 19,
    median_length: 20,
    p75_length: 22,
    max_length: 24,
  };
  const distribution: G4PositionDistributionResponse = {
    ...EMPTY_G4_POSITION_DISTRIBUTION,
    assembly_accession: 'GCF_1',
    g4_type: 'g4',
    total_count: 5,
    categories: [
      {
        key: 'gene_inside',
        label: 'Gene inside',
        count: 2,
        ratio: 0.4,
        precedence_rank: 1,
        description: 'Inside gene',
      },
      {
        key: 'gene_upstream',
        label: 'Gene upstream',
        count: 1,
        ratio: 0.2,
        precedence_rank: 2,
        description: 'Upstream gene',
      },
      {
        key: 'gene_downstream',
        label: 'Gene downstream',
        count: 1,
        ratio: 0.2,
        precedence_rank: 3,
        description: 'Downstream gene',
      },
      {
        key: 'non_feature',
        label: 'Non-feature',
        count: 1,
        ratio: 0.25,
        precedence_rank: 5,
        description: 'No feature assignment',
      },
    ],
    gene_biotype_breakdown: [
      {
        bio_type: 'protein_coding',
        display_label: 'protein_coding',
        total_count: 4,
        categories: [
          {
            key: 'gene_inside',
            label: 'Gene inside',
            count: 2,
            ratio: 0.5,
            precedence_rank: 1,
            description: 'Inside gene',
          },
          {
            key: 'gene_upstream',
            label: 'Gene upstream',
            count: 1,
            ratio: 0.25,
            precedence_rank: 2,
            description: 'Upstream gene',
          },
          {
            key: 'gene_downstream',
            label: 'Gene downstream',
            count: 1,
            ratio: 0.25,
            precedence_rank: 3,
            description: 'Downstream gene',
          },
        ],
      },
      {
        bio_type: null,
        display_label: 'Unspecified gene biotype',
        total_count: 1,
        categories: [
          {
            key: 'non_feature',
            label: 'Non-feature',
            count: 1,
            ratio: 1,
            precedence_rank: 5,
            description: 'No feature assignment',
          },
        ],
      },
    ],
    feature_breakdown: [
      {
        feature_type: 'promoter',
        unique_g4_count: 1,
        relation_count: 2,
        ratio_of_total: 0.25,
        is_root_feature: true,
      },
    ],
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
            merged_interval_length_bp: 1000,
            length_mb: 0.001,
            motifs: {
              g4: g4Stats,
            },
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
            merged_interval_length_bp: 500,
            length_mb: 0.0005,
            motifs: {
              g4: upstreamStats,
            },
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

  let fixture: ComponentFixture<PositionDistributionComponent>;
  let tabGroup: MatTabGroupHarness;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PositionDistributionComponent],
      providers: [
        provideCharts({
          registerables: [DoughnutController, ArcElement, Tooltip, Legend],
        }),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PositionDistributionComponent);
    fixture.componentRef.setInput('distribution', distribution);
    fixture.componentRef.setInput('isLoading', false);
    fixture.componentRef.setInput('errorMessage', '');
    fixture.componentRef.setInput('statistics', statistics);
    fixture.componentRef.setInput('statisticsLoading', false);
    fixture.componentRef.setInput('statisticsErrorMessage', '');
    fixture.componentRef.setInput('flankWindow', 1000);
    fixture.componentRef.setInput('flankWindowLabel', '1 kb');
    fixture.componentRef.setInput('g4Type', 'g4');
    fixture.componentRef.setInput('tetradOptions', [2, 3]);
    fixture.componentRef.setInput('filterSelectedTetrads', []);
    fixture.componentRef.setInput('filterMinScore', '');
    fixture.componentRef.setInput('filterMaxScore', '');
    fixture.detectChanges();
    tabGroup = await TestbedHarnessEnvironment.loader(fixture).getHarness(MatTabGroupHarness);
  });

  async function selectTab(label: string): Promise<HTMLElement> {
    await tabGroup.selectTab({ label });
    fixture.detectChanges();
    await fixture.whenStable();
    await new Promise((resolve) => setTimeout(resolve, 180));
    fixture.detectChanges();
    return activeTabPanel();
  }

  function renderedText(): string {
    return fixture.nativeElement.textContent as string;
  }

  function headerElement(): HTMLElement {
    return fixture.nativeElement.querySelector('.position-card-header') as HTMLElement;
  }

  function activeTabPanel(): HTMLElement {
    return fixture.nativeElement.querySelector(
      '[role="tabpanel"][aria-hidden="false"], .mat-mdc-tab-body-active',
    ) as HTMLElement;
  }

  it('renders one global type selector and only the supported statistics tabs', () => {
    const text = renderedText();
    const header = headerElement();

    expect(text).toContain('Summary');
    expect(text).toContain('Density & Enrichment');
    expect(text).toContain('Strength');
    expect(text).not.toContain('G4 vs i-motif');
    expect(text).not.toContain('Window Sensitivity');
    expect(header.textContent).toContain('Motif type');
    expect(header.textContent).toContain('Gene flank size');
    expect(header.textContent).toContain('G4/i-motif filters');
    expect(header.querySelector('mat-button-toggle-group')).not.toBeNull();
    expect(header.querySelector('.gene-window-field')).not.toBeNull();
    expect(header.querySelector('.position-filter-form')).not.toBeNull();
  });

  it('renders the Summary doughnut with only visible gene-context categories', () => {
    const panel = activeTabPanel();
    const component = fixture.componentInstance;

    expect(panel.querySelector('.summary-doughnut canvas[basechart]')).not.toBeNull();
    expect(fixture.debugElement.queryAll(By.directive(BaseChartDirective)).length).toBeGreaterThan(
      1,
    );
    expect(component.summaryDoughnutData().labels).toEqual([
      'In genes',
      'Upstream flank',
      'Downstream flank',
    ]);

    component.changeSummaryCategoryVisibility('gene_upstream', false);
    fixture.detectChanges();

    expect(component.summaryDoughnutData().labels).toEqual([
      'In genes',
      'Downstream flank',
      'Other categories',
    ]);
    expect(component.summaryDoughnutData().datasets[0].data).toEqual([2, 1, 1]);
    expect(panel.textContent).toContain('Chart categories');
    expect(panel.textContent).toContain('In genes');
    expect(panel.textContent).toContain('Upstream flank');
    expect(panel.textContent).toContain('Downstream flank');
    expect(panel.textContent).not.toContain('Outside annotations');
    expect(panel.textContent).not.toContain('Other annotations');
    expect(panel.textContent).not.toContain('Unspecified gene biotype');
    expect(panel.textContent).not.toContain('Other annotation feature types');
  });

  it('shows Density columns for only the selected motif type', async () => {
    const panel = await selectTab('Density & Enrichment');
    const text = panel.textContent ?? '';

    expect(text).toContain('Category');
    expect(text).toContain('Region size (Mb)');
    expect(text).toContain('Density / Mb');
    expect(text).toContain('Genome enrichment');
    expect(text).toContain('2x');
    expect(text).not.toContain('vs genome');
    expect(text).not.toContain('vs outside annotations');
    expect(text).toContain('In genes');
    expect(text).toContain('2,000');
    expect(text).not.toContain('G4 density / Mb');
    expect(text).not.toContain('i-motif density / Mb');
  });

  it('renders selected-motif Vega Strength box plots and p75 table values', async () => {
    const panel = await selectTab('Strength');
    const text = panel.textContent ?? '';

    expect(panel.querySelectorAll('app-strength-box-plot-vega').length).toBe(2);
    expect(panel.querySelectorAll('.box-plot-svg').length).toBe(0);
    expect(text).toContain('These plots summarize G4 site properties by position category.');
    expect(text).toContain('Score plot compares G4 score distributions.');
    expect(text).toContain('Score median / p75');
    expect(text).toContain('Tetrads median / p75');
    expect(text).toContain('Length median / p75');
    expect(text).toContain('20 / 30');
    expect(text).toContain('3 / 4');
    expect(text).toContain('24 / 32');
    expect(text).not.toContain('Type');
    expect(text).not.toContain('Window');
    expect(text).not.toContain('p95');
  });

  it('derives simplified category labels and selected motif strength rows', () => {
    const component = fixture.componentInstance;

    expect(component.statisticsRows().map((row) => row.displayLabel)).toEqual([
      'In genes',
      'Upstream flank',
    ]);
    expect(component.strengthRows().map((row) => row.stats.count)).toEqual([2, 1]);
    expect(component.strengthBoxPlots().map((plot) => plot.title)).toEqual(['Score', 'Length']);
    expect(component.strengthBoxPlots()[0].rows[0].medianValue).toBe(20);
    expect(component.strengthBoxPlots()[0].rows[0].p75Value).toBe(30);
  });

  it('filters unspecified biotype rows and hidden biotype category columns', () => {
    const component = fixture.componentInstance;

    expect(component.geneBiotypeCategoryColumns.map((column) => column.label)).toEqual([
      'In genes',
      'Upstream flank',
      'Downstream flank',
    ]);
    expect(component.geneBiotypeBreakdown().map((row) => row.display_label)).toEqual([
      'protein_coding',
    ]);
    expect(component.geneBiotypeBreakdown()[0].total_count).toBe(4);
    expect(
      component.geneBiotypeBreakdown()[0].categories.map((category) => category.value),
    ).toEqual(['2 (50%)', '1 (25%)', '1 (25%)']);
  });

  it('uses biotype-only tooltip titles for the outer gene biotype ring', () => {
    const component = fixture.componentInstance;
    const tooltipOptions = component.geneBiotypeDoughnutOptions.plugins?.tooltip;
    if (!tooltipOptions || typeof tooltipOptions === 'boolean') {
      fail('Expected gene biotype tooltip options.');
      return;
    }

    const callbacks = tooltipOptions.callbacks;
    const outerContext = { datasetIndex: 0, dataIndex: 0 } as TooltipItem<'doughnut'>;
    const innerContext = { datasetIndex: 1, dataIndex: 1 } as TooltipItem<'doughnut'>;
    const tooltipModel = {} as TooltipModel<'doughnut'>;

    expect(callbacks?.title?.call(tooltipModel, [outerContext])).toBe('protein_coding');
    expect(callbacks?.label?.call(tooltipModel, outerContext)).toBe('Total: 4 (100%)');
    expect(callbacks?.title?.call(tooltipModel, [innerContext])).toBe(
      'protein_coding / Upstream flank',
    );
    expect(callbacks?.label?.call(tooltipModel, innerContext)).toBe('1 (25%)');
  });
});
