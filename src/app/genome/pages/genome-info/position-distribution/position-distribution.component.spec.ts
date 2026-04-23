import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatTabGroupHarness } from '@angular/material/tabs/testing';
import { MatTooltip } from '@angular/material/tooltip';
import { By } from '@angular/platform-browser';
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
    g4_type: 'normal',
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
      min_gscore: null,
      max_gscore: null,
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
              normal: {
                count: 2,
                density_per_mb: 2000,
                expected_vs_genome: 1,
                fold_vs_genome: 2,
                fold_vs_non_feature: 3,
                median_gscore: 20,
                p95_gscore: 40,
                median_tetrads: 3,
                p95_tetrads: 4,
                median_length: 24,
                p95_length: 32,
              },
              revcomp: {
                count: 1,
                density_per_mb: 1000,
                expected_vs_genome: 0.5,
                fold_vs_genome: 1,
                fold_vs_non_feature: 1.5,
                median_gscore: 18,
                p95_gscore: 30,
                median_tetrads: 2,
                p95_tetrads: 3,
                median_length: 20,
                p95_length: 28,
              },
            },
            asymmetry: {
              normal_fraction: 2 / 3,
              revcomp_fraction: 1 / 3,
              fraction_delta: 1 / 3,
              count_delta: 1,
              density_ratio_normal_over_revcomp: 2,
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
              normal: {
                count: 1,
                density_per_mb: 2000,
                expected_vs_genome: 0.5,
                fold_vs_genome: 2,
                fold_vs_non_feature: null,
                median_gscore: 16,
                p95_gscore: 16,
                median_tetrads: 2,
                p95_tetrads: 2,
                median_length: 20,
                p95_length: 20,
              },
              revcomp: {
                count: 0,
                density_per_mb: 0,
                expected_vs_genome: 0,
                fold_vs_genome: 0,
                fold_vs_non_feature: null,
                median_gscore: null,
                p95_gscore: null,
                median_tetrads: null,
                p95_tetrads: null,
                median_length: null,
                p95_length: null,
              },
            },
            asymmetry: {
              normal_fraction: 1,
              revcomp_fraction: 0,
              fraction_delta: 1,
              count_delta: 1,
              density_ratio_normal_over_revcomp: null,
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
    fixture.componentRef.setInput('g4Type', 'normal');
    fixture.componentRef.setInput('tetradOptions', [2, 3]);
    fixture.componentRef.setInput('filterSelectedTetrads', []);
    fixture.componentRef.setInput('filterMinGscore', '');
    fixture.componentRef.setInput('filterMaxGscore', '');
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
    expect(text).toContain('G-rich vs i-motif');
    expect(text).not.toContain('G4 vs i-motif');
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
      'G-rich vs i-motif',
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
    expect(tooltipMessages()).toContain(
      'Ratios are within each gene biotype row; the same site can appear in multiple biotype rows when it has multiple gene relations.',
    );
  });

  it('renders precise research table headers and removes ambiguous trend copy', async () => {
    let text = await selectTab('Density & Enrichment');
    expect(text).toContain('Interval length (Mb)');
    expect(text).toContain('G-rich density / Mb');
    expect(text).toContain('G-rich fold vs genome');
    expect(text).toContain('i-motif fold vs non-feature');
    expect(text).not.toContain('G4 density/Mb');
    expect(text).not.toContain('G4 fold genome');

    text = await selectTab('Strength');
    expect(text).toContain('gscore median / p95');
    expect(text).toContain('tetrads median / p95');
    expect(text).toContain('motif length median / p95');
    expect(text).not.toContain('Score median/p95');

    text = await selectTab('G-rich vs i-motif');
    expect(text).toContain('G-rich count');
    expect(text).toContain('G-rich fraction');
    expect(text).toContain('Fraction delta');
    expect(text).toContain('Density ratio (G-rich / i-motif)');
    expect(text).not.toContain('G4 count');
    expect(text).not.toContain('Delta');

    text = await selectTab('Window Sensitivity');
    expect(text).toContain('G-rich relative density');
    expect(text).toContain('i-motif relative density');
    expect(text).not.toContain('G4 trend');
    expect(text).not.toContain('i-motif trend');
  });

  it('attaches explanatory tooltips to research table headers', async () => {
    const messages = new Set<string>();

    for (const tabLabel of [
      'Density & Enrichment',
      'Strength',
      'G-rich vs i-motif',
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
    expect(messages).toContain('G-rich fraction minus i-motif fraction in the same category.');
    expect(messages).toContain(
      'G-rich density divided by i-motif density; N/A when denominator is zero or unavailable.',
    );
    expect(messages).toContain(
      'Bar scaled to the largest upstream/downstream density for that motif type across displayed windows; not a time trend.',
    );
  });

  it('derives density, strength, asymmetry, and window sensitivity rows', () => {
    const component = fixture.componentInstance;

    expect(component.statisticsRows()[0].displayLabel).toBe('Inside annotated genes');
    expect(component.statisticsRows()[0].motifs.normal.fold_vs_genome).toBe(2);
    expect(component.strengthRows().map((row) => row.motifLabel)).toContain('G-rich');
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
                normal: {
                  ...downstreamCategory.motifs.normal,
                  density_per_mb: 500,
                },
              },
            },
            {
              ...upstreamCategory,
              motifs: {
                ...upstreamCategory.motifs,
                normal: {
                  ...upstreamCategory.motifs.normal,
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
                normal: {
                  ...upstreamCategory.motifs.normal,
                  density_per_mb: 900,
                },
              },
            },
            {
              ...downstreamCategory,
              motifs: {
                ...downstreamCategory.motifs,
                normal: {
                  ...downstreamCategory.motifs.normal,
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
