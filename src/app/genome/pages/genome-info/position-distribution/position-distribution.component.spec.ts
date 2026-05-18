import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatTabGroupHarness } from '@angular/material/tabs/testing';
import { MatTooltip } from '@angular/material/tooltip';
import { By } from '@angular/platform-browser';
import { ArcElement, DoughnutController, Legend, Tooltip, TooltipItem } from 'chart.js';
import { BaseChartDirective, provideCharts } from 'ng2-charts';
import {
  EMPTY_G4_POSITION_DISTRIBUTION,
  EMPTY_G4_POSITION_STATISTICS,
  G4PositionDistributionResponse,
  G4PositionStatisticsResponse,
} from '../../../services/g4.service';
import { PositionDistributionComponent } from './position-distribution.component';

describe('PositionDistributionComponent', () => {
  const distribution: G4PositionDistributionResponse = {
    ...EMPTY_G4_POSITION_DISTRIBUTION,
    assembly_accession: 'GCF_1',
    g4_type: 'g4',
    total_count: 3,
    categories: [
      {
        key: 'gene_inside',
        label: 'Gene inside',
        count: 2,
        ratio: 2 / 3,
        precedence_rank: 1,
        description: 'Inside gene',
      },
      {
        key: 'gene_upstream',
        label: 'Gene upstream',
        count: 1,
        ratio: 1 / 3,
        precedence_rank: 2,
        description: 'Upstream gene',
      },
    ],
    gene_biotype_breakdown: [
      {
        bio_type: 'protein_coding',
        display_label: 'protein_coding',
        total_count: 3,
        categories: [
          {
            key: 'gene_inside',
            label: 'Gene inside',
            count: 2,
            ratio: 2 / 3,
            precedence_rank: 1,
            description: 'Inside gene',
          },
          {
            key: 'gene_upstream',
            label: 'Gene upstream',
            count: 1,
            ratio: 1 / 3,
            precedence_rank: 2,
            description: 'Upstream gene',
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
  };
  const statistics: G4PositionStatisticsResponse = {
    ...EMPTY_G4_POSITION_STATISTICS,
    assembly_accession: 'GCF_1',
    genome_length_bp: 10_000,
    genome_length_mb: 0.01,
    filters: {
      windows: [100],
      tetrads: [],
      min_score: null,
      max_score: null,
      overlap: false,
    },
    windows: [
      {
        window_bp: 100,
        categories: [
          {
            key: 'gene_inside',
            label: 'Gene inside',
            description: 'Inside gene',
            precedence_rank: 1,
            merged_interval_length_bp: 1000,
            length_mb: 0.001,
            motifs: {
              g4: {
                count: 2,
                density_per_mb: 2000,
                expected_vs_genome: 1,
                fold_vs_genome: 2,
                fold_vs_non_feature: 3,
                median_score: 20,
                p95_score: 40,
                median_tetrads: 3,
                p95_tetrads: 4,
                median_length: 24,
                p95_length: 32,
              },
              'i-motif': {
                count: 1,
                density_per_mb: 1000,
                expected_vs_genome: 0.5,
                fold_vs_genome: 1,
                fold_vs_non_feature: 1.5,
                median_score: 18,
                p95_score: 30,
                median_tetrads: 2,
                p95_tetrads: 3,
                median_length: 20,
                p95_length: 28,
              },
            },
            asymmetry: {
              g4_fraction: 2 / 3,
              i_motif_fraction: 1 / 3,
              fraction_delta: 1 / 3,
              count_delta: 1,
              density_ratio_g4_over_i_motif: 2,
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
              g4: {
                count: 1,
                density_per_mb: 2000,
                expected_vs_genome: 0.5,
                fold_vs_genome: 2,
                fold_vs_non_feature: null,
                median_score: 16,
                p95_score: 16,
                median_tetrads: 2,
                p95_tetrads: 2,
                median_length: 20,
                p95_length: 20,
              },
              'i-motif': {
                count: 0,
                density_per_mb: 0,
                expected_vs_genome: 0,
                fold_vs_genome: 0,
                fold_vs_non_feature: null,
                median_score: null,
                p95_score: null,
                median_tetrads: null,
                p95_tetrads: null,
                median_length: null,
                p95_length: null,
              },
            },
            asymmetry: {
              g4_fraction: 1,
              i_motif_fraction: 0,
              fraction_delta: 1,
              count_delta: 1,
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

  async function selectTab(label: string): Promise<string> {
    await tabGroup.selectTab({ label });
    fixture.detectChanges();
    await fixture.whenStable();
    await new Promise((resolve) => setTimeout(resolve, 180));
    fixture.detectChanges();
    return renderedText();
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

  function tooltipMessages(): readonly string[] {
    return fixture.debugElement
      .queryAll(By.directive(MatTooltip))
      .map((debugElement) => debugElement.injector.get(MatTooltip).message);
  }

  it('renders research statistics tabs alongside the current summary tab', () => {
    const text = renderedText();

    expect(text).toContain('Summary');
    expect(text).toContain('Density & Enrichment');
    expect(text).toContain('Strength');
    expect(text).toContain('G4 vs i-motif');
    expect(text).toContain('Window Sensitivity');
  });

  it('keeps summary-only position controls inside the Summary tab', async () => {
    const header = headerElement();

    expect(header.querySelector('.position-filter-form')).not.toBeNull();
    expect(header.querySelector('mat-button-toggle-group')).toBeNull();
    expect(header.querySelector('.gene-window-field')).toBeNull();
    expect(header.textContent).toContain('Tetrads');
    expect(header.textContent).toContain('Min score');
    expect(header.textContent).toContain('Max score');
    expect(header.textContent).toContain('Submit');
    expect(header.textContent).toContain('Reset');

    let panel = activeTabPanel();
    expect(panel.querySelector('.summary-position-controls')).not.toBeNull();
    expect(panel.querySelector('mat-button-toggle-group')).not.toBeNull();
    expect(panel.querySelector('.gene-window-field')).not.toBeNull();
    expect(panel.textContent).toContain('Upstream/downstream gene window');

    for (const tabLabel of [
      'Density & Enrichment',
      'Strength',
      'G4 vs i-motif',
      'Window Sensitivity',
    ]) {
      await selectTab(tabLabel);
      panel = activeTabPanel();
      expect(panel.querySelector('.summary-position-controls')).toBeNull();
      expect(panel.querySelector('mat-button-toggle-group')).toBeNull();
      expect(panel.querySelector('.gene-window-field')).toBeNull();
      expect(header.textContent).toContain('Tetrads');
      expect(header.textContent).toContain('Submit');
      expect(header.textContent).toContain('Reset');
    }
  });

  it('renders the Summary position chart with an ng2-charts doughnut', () => {
    const panel = activeTabPanel();
    const summaryGrid = panel.querySelector('.summary-grid') as HTMLElement;

    expect(summaryGrid.querySelector('.summary-doughnut canvas[basechart]')).not.toBeNull();
    expect(summaryGrid.querySelector('.pie')).toBeNull();
    const chartDirectives = fixture.debugElement
      .queryAll(By.directive(BaseChartDirective))
      .map((debugElement) => debugElement.injector.get(BaseChartDirective));
    expect(chartDirectives.length).toBeGreaterThan(1);
    expect(chartDirectives.every((chart) => chart.legend === true)).toBe(true);

    const component = fixture.componentInstance;
    const chartData = component.summaryDoughnutData();
    expect(chartData.labels).toEqual(['Inside genes', 'Upstream']);
    expect(chartData.datasets.length).toBe(1);
    expect(chartData.datasets[0].label).toBe('G4');
    expect(chartData.datasets[0].data).toEqual([2, 1]);
    expect(component.summaryDoughnutPlugins.length).toBe(1);

    const tooltip = component.summaryDoughnutOptions.plugins?.tooltip;
    expect(tooltip).toBeDefined();
    const zeroTooltip = { parsed: 0 } as TooltipItem<'doughnut'>;
    const visibleTooltip = { parsed: 2 } as TooltipItem<'doughnut'>;
    expect(tooltip?.filter?.(zeroTooltip, 0, [zeroTooltip], chartData)).toBe(false);
    expect(tooltip?.filter?.(visibleTooltip, 0, [visibleTooltip], chartData)).toBe(true);
    const labelCallback = tooltip?.callbacks?.label as
      | ((context: TooltipItem<'doughnut'>) => string)
      | undefined;
    expect(labelCallback?.({ dataIndex: 0 } as TooltipItem<'doughnut'>)).toBe(
      'Inside annotated genes: 2 (66.7%)',
    );

    const legend = component.summaryDoughnutOptions.plugins?.legend;
    expect(legend?.position).toBe('bottom');
    const datalabels = component.summaryDoughnutOptions.plugins?.datalabels as {
      display?: (context: { dataset: { data: number[] }; dataIndex: number }) => 'auto' | false;
      formatter?: (value: number) => string;
    };
    expect(datalabels.display?.({ dataset: { data: [2] }, dataIndex: 0 })).toBe('auto');
    expect(datalabels.display?.({ dataset: { data: [0] }, dataIndex: 0 })).toBe(false);
    expect(datalabels.formatter?.(2)).toBe('2');
  });

  it('renders gene biotype position relationships in the Summary tab', () => {
    const panel = activeTabPanel();
    const text = panel.textContent ?? '';

    expect(text).toContain('Gene biotype position relationships');
    expect(text).toContain('Gene biotype');
    expect(text).toContain('Inside genes');
    expect(text).toContain('Root non-gene');
    expect(text).toContain('protein_coding');
    expect(text).toContain('Unspecified gene biotype');
    expect(text).toContain('2 (66.7%)');
    expect(text).toContain('1 (100%)');
    expect(panel.querySelector('canvas[basechart]')).not.toBeNull();
    expect(fixture.debugElement.query(By.directive(BaseChartDirective))).not.toBeNull();
    const layout = panel.querySelector('.gene-biotype-layout') as HTMLElement;
    expect(layout).not.toBeNull();
    expect(layout.children[0].classList).toContain('gene-biotype-chart');
    expect(layout.children[1].classList).toContain('gene-biotype-table');
    expect(layout.querySelector('.gene-biotype-table table')).not.toBeNull();
    expect(layout.querySelector('td.stats-category')).toBeNull();

    const component = fixture.componentInstance;
    const chartData = component.geneBiotypeDoughnutData();
    expect(chartData.datasets.length).toBe(2);
    expect(chartData.labels).toEqual([
      'protein_coding / Inside genes',
      'protein_coding / Upstream',
      'protein_coding / Downstream',
      'protein_coding / Root non-gene',
      'protein_coding / Non-feature',
      'Unspecified gene biotype / Inside genes',
      'Unspecified gene biotype / Upstream',
      'Unspecified gene biotype / Downstream',
      'Unspecified gene biotype / Root non-gene',
      'Unspecified gene biotype / Non-feature',
    ]);
    expect(chartData.datasets[0].label).toBe('Gene biotype');
    expect(chartData.datasets[0].data).toEqual([3, 0, 0, 0, 0, 1, 0, 0, 0, 0]);
    expect(chartData.datasets[1].label).toBe('Position category within gene biotype');
    expect(chartData.datasets[1].data).toEqual([2, 1, 0, 0, 0, 0, 0, 0, 0, 1]);
    expect(component.geneBiotypeBreakdown()[0].color).toBe('#3f6c8a');
    expect(component.geneBiotypeTotal()).toBe(4);

    const tooltip = component.geneBiotypeDoughnutOptions.plugins?.tooltip;
    expect(tooltip).toBeDefined();
    const zeroOuterTooltip = { datasetIndex: 0, parsed: 0 } as TooltipItem<'doughnut'>;
    const visibleOuterTooltip = { datasetIndex: 0, parsed: 3 } as TooltipItem<'doughnut'>;
    expect(tooltip?.filter?.(zeroOuterTooltip, 0, [zeroOuterTooltip], chartData)).toBe(false);
    expect(tooltip?.filter?.(visibleOuterTooltip, 0, [visibleOuterTooltip], chartData)).toBe(true);
    const legend = component.geneBiotypeDoughnutOptions.plugins?.legend;
    expect(legend?.position).toBe('bottom');
    const visibility = new Map<number, boolean>();
    const fakeChart = {
      getDataVisibility: (index: number) => visibility.get(index) ?? true,
      toggleDataVisibility: (index: number) =>
        visibility.set(index, !(visibility.get(index) ?? true)),
      update: jasmine.createSpy('update'),
    };
    const legendLabels = legend?.labels?.generateLabels?.(fakeChart as never) ?? [];
    expect(legendLabels.map((label) => label.text)).toEqual([
      'protein_coding',
      'Unspecified gene biotype',
    ]);
    expect(legendLabels.map((label) => label.index)).toEqual([0, 5]);
    expect(legendLabels[0].fillStyle).toBe('#3f6c8a');

    const legendClick = legend?.onClick as unknown as
      | ((event: unknown, legendItem: (typeof legendLabels)[number], legend: unknown) => void)
      | undefined;
    legendClick?.({}, legendLabels[0], { chart: fakeChart });
    expect(Array.from({ length: 5 }, (_, index) => visibility.get(index))).toEqual([
      false,
      false,
      false,
      false,
      false,
    ]);
    expect(visibility.get(5)).toBeUndefined();
    expect(fakeChart.update).toHaveBeenCalledTimes(1);

    expect(tooltipMessages()).toContain(
      'Ratios are within each gene biotype row; the same site can appear in multiple biotype rows when it has multiple gene relations.',
    );
    expect(tooltipMessages()).toContain(
      'Outer ring shows displayed gene biotype share; inner ring splits each biotype span by position category.',
    );
  });

  it('renders precise research table headers and removes ambiguous trend copy', async () => {
    let text = await selectTab('Density & Enrichment');
    expect(text).toContain('Interval length (Mb)');
    expect(text).toContain('G4 density / Mb');
    expect(text).toContain('G4 fold vs genome');
    expect(text).toContain('i-motif fold vs non-feature');
    expect(text).not.toContain('G4 density/Mb');
    expect(text).not.toContain('G4 fold genome');

    text = await selectTab('Strength');
    expect(text).toContain('score median / p95');
    expect(text).toContain('tetrads median / p95');
    expect(text).toContain('motif length median / p95');
    expect(text).not.toContain('Score median/p95');

    text = await selectTab('G4 vs i-motif');
    expect(text).toContain('G4 count');
    expect(text).toContain('G4 fraction');
    expect(text).toContain('Fraction delta');
    expect(text).toContain('Density ratio (G4 / i-motif)');
    expect(text).not.toContain('Delta');

    text = await selectTab('Window Sensitivity');
    expect(text).toContain('G4 relative density');
    expect(text).toContain('i-motif relative density');
    expect(text).not.toContain('G4 trend');
    expect(text).not.toContain('i-motif trend');
  });

  it('attaches explanatory tooltips to research table headers', async () => {
    const messages = new Set<string>();

    for (const tabLabel of [
      'Density & Enrichment',
      'Strength',
      'G4 vs i-motif',
      'Window Sensitivity',
    ]) {
      await selectTab(tabLabel);
      for (const message of tooltipMessages()) {
        messages.add(message);
      }
    }

    expect(messages).toContain(
      'Category denominator is the merged non-overlapping interval length.',
    );
    expect(messages).toContain('Motif count divided by merged interval length in megabases.');
    expect(messages).toContain('Category density divided by genome-wide density.');
    expect(messages).toContain('Category density divided by non-feature density.');
    expect(messages).toContain(
      'Median is the typical value; p95 is the 95th percentile, not the maximum.',
    );
    expect(messages).toContain('G4 fraction minus i-motif fraction in the same category.');
    expect(messages).toContain(
      'G4 density divided by i-motif density; N/A when denominator is zero or unavailable.',
    );
    expect(messages).toContain(
      'Bar scaled to the largest upstream/downstream density for that motif type across displayed windows; not a time trend.',
    );
  });

  it('derives density, strength, asymmetry, and window sensitivity rows', () => {
    const component = fixture.componentInstance;

    expect(component.statisticsRows()[0].displayLabel).toBe('Inside annotated genes');
    expect(component.statisticsRows()[0].motifs.g4.fold_vs_genome).toBe(2);
    expect(component.strengthRows().map((row) => row.motifLabel)).toContain('G4');
    expect(component.strengthRows().map((row) => row.motifLabel)).toContain('i-motif');
    expect(component.asymmetryRows()[0].asymmetry.count_delta).toBe(1);
    expect(component.windowSensitivityRows()[0].category.key).toBe('gene_upstream');
  });

  it('groups window sensitivity rows by label and sorts each label by window size', () => {
    const upstreamCategory = statistics.windows[0].categories[1];
    const downstreamCategory = {
      ...upstreamCategory,
      key: 'gene_downstream' as const,
      label: 'Gene downstream',
      description: 'Downstream gene',
    };

    fixture.componentRef.setInput('statistics', {
      ...statistics,
      windows: [
        {
          ...statistics.windows[0],
          window_bp: 500,
          categories: [
            {
              ...downstreamCategory,
              motifs: {
                ...downstreamCategory.motifs,
                g4: {
                  ...downstreamCategory.motifs.g4,
                  density_per_mb: 500,
                },
              },
            },
            {
              ...upstreamCategory,
              motifs: {
                ...upstreamCategory.motifs,
                g4: {
                  ...upstreamCategory.motifs.g4,
                  density_per_mb: 400,
                },
              },
            },
          ],
        },
        {
          ...statistics.windows[0],
          window_bp: 100,
          categories: [
            {
              ...upstreamCategory,
              motifs: {
                ...upstreamCategory.motifs,
                g4: {
                  ...upstreamCategory.motifs.g4,
                  density_per_mb: 900,
                },
              },
            },
            {
              ...downstreamCategory,
              motifs: {
                ...downstreamCategory.motifs,
                g4: {
                  ...downstreamCategory.motifs.g4,
                  density_per_mb: 800,
                },
              },
            },
          ],
        },
      ],
    });
    fixture.detectChanges();

    expect(
      fixture.componentInstance
        .windowSensitivityRows()
        .map((row) => `${row.category.label}:${row.category.window_bp}`),
    ).toEqual([
      'Gene downstream:100',
      'Gene downstream:500',
      'Gene upstream:100',
      'Gene upstream:500',
    ]);
  });
});
