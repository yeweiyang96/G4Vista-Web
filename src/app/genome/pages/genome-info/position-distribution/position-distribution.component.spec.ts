import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ArcElement, DoughnutController, Legend, Tooltip } from 'chart.js';
import { BaseChartDirective, provideCharts } from 'ng2-charts';
import {
  EMPTY_G4_POSITION_DISTRIBUTION,
  G4PositionDistributionResponse,
} from '../../../services/g4.service';
import { PositionDistributionComponent } from './position-distribution.component';

describe('PositionDistributionComponent', () => {
  const selectedCategoryKeys: readonly string[] = [
    'gene_inside',
    'gene_upstream',
    'gene_downstream',
    'other',
  ];
  const distribution: G4PositionDistributionResponse = {
    ...EMPTY_G4_POSITION_DISTRIBUTION,
    assembly_accession: 'GCF_1',
    quadruplex_type: 'g4',
    total_count: 6,
    categories: [
      {
        key: 'gene_inside',
        label: 'Gene inside',
        count: 2,
        ratio: 1 / 3,
        precedence_rank: 1,
        description: 'Inside gene',
        display_label: 'In genes',
        display_description: 'Predicted motif sites in genes.',
        category_group: 'gene_context',
        is_default_chart_category: true,
        display_order: 1,
      },
      {
        key: 'gene_upstream',
        label: 'Gene upstream',
        count: 1,
        ratio: 1 / 6,
        precedence_rank: 2,
        description: 'Upstream gene',
        display_label: 'Upstream flank',
        display_description: 'Predicted motif sites in upstream flanks.',
        category_group: 'gene_context',
        is_default_chart_category: true,
        display_order: 2,
      },
      {
        key: 'gene_downstream',
        label: 'Gene downstream',
        count: 1,
        ratio: 1 / 6,
        precedence_rank: 3,
        description: 'Downstream gene',
        display_label: 'Downstream flank',
        display_description: 'Predicted motif sites in downstream flanks.',
        category_group: 'gene_context',
        is_default_chart_category: true,
        display_order: 3,
      },
      {
        key: 'other',
        label: 'Other',
        count: 2,
        ratio: 1 / 3,
        precedence_rank: 4,
        description: 'Outside genes and selected flanks',
        display_label: 'Other',
        display_description: 'Predicted motif sites outside genes and selected gene flanks.',
        category_group: 'background',
        is_default_chart_category: true,
        display_order: 4,
      },
    ],
    feature_breakdown: [],
    gene_biotype_breakdown: [],
  };

  let fixture: ComponentFixture<PositionDistributionComponent>;

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
    fixture.componentRef.setInput('flankWindow', 1000);
    fixture.componentRef.setInput('flankWindowLabel', '1 kb');
    fixture.componentRef.setInput('g4Type', 'g4');
    fixture.componentRef.setInput('tetradOptions', [2, 3]);
    fixture.componentRef.setInput('filterSelectedTetrads', []);
    fixture.componentRef.setInput('filterMinScore', '');
    fixture.componentRef.setInput('filterMaxScore', '');
    fixture.componentRef.setInput('selectedCategoryKeys', selectedCategoryKeys);
    fixture.detectChanges();
  });

  function renderedText(): string {
    return fixture.nativeElement.textContent as string;
  }

  it('renders the overview without statistics table or box plots', () => {
    const text = renderedText();

    expect(text).toContain('G-quadruplex (G4) and i-motif overview');
    expect(text).toContain('Chart categories');
    expect(text).toContain('Other');
    expect(text).toContain('Key metrics');
    expect(text).not.toContain('Gene-context position statistics');
    expect(text).not.toContain('Density by gene context');
    expect(text).not.toContain('G-score distribution');
    expect(text).not.toContain('Length distribution');
    expect(text.toLowerCase()).not.toContain('enrichment');
    expect(text).not.toContain('Other annotations');
    expect(text).not.toContain('Outside annotations');
    expect(text).not.toContain('Other root non-gene feature');
    expect(text).not.toContain('Non-feature');
    expect(text).not.toContain('Non-gene annotation feature');
    expect(fixture.nativeElement.querySelectorAll('app-strength-box-plot-vega').length).toBe(0);
  });

  it('uses four public categories for the overview chart', () => {
    const component = fixture.componentInstance;

    expect(component.categoryRows().map((category) => category.displayLabel)).toEqual([
      'In genes',
      'Upstream flank',
      'Downstream flank',
      'Other',
    ]);
    expect(component.summaryDoughnutData().labels).toEqual([
      'In genes',
      'Upstream flank',
      'Downstream flank',
      'Other',
    ]);
    expect(component.summaryDoughnutData().datasets[0].data).toEqual([2, 1, 1, 2]);
  });

  it('folds legacy background categories into the fallback Other row', () => {
    fixture.componentRef.setInput('distribution', {
      ...distribution,
      categories: [
        ...distribution.categories.filter((category) => category.key !== 'other'),
        {
          key: 'other_root_non_gene_feature',
          label: 'Other root non-gene feature',
          count: 1,
          ratio: 1 / 6,
          precedence_rank: 4,
          description: 'Other annotation',
          display_label: 'Non-gene annotation feature',
          display_description: 'Background category.',
          category_group: 'background',
          is_default_chart_category: true,
          display_order: 4,
        },
        {
          key: 'non_feature',
          label: 'Non-feature',
          count: 1,
          ratio: 1 / 6,
          precedence_rank: 5,
          description: 'No feature',
          display_label: 'No assigned feature',
          display_description: 'Background category.',
          category_group: 'background',
          is_default_chart_category: true,
          display_order: 5,
        },
      ],
    });
    fixture.detectChanges();

    const text = renderedText();
    expect(fixture.componentInstance.categoryRows().map((category) => category.key)).toEqual([
      'gene_inside',
      'gene_upstream',
      'gene_downstream',
    ]);
    expect(fixture.componentInstance.summaryDoughnutData().labels).toEqual([
      'In genes',
      'Upstream flank',
      'Downstream flank',
      'Other',
    ]);
    expect(text).not.toContain('Other root non-gene feature');
    expect(text).not.toContain('Non-feature');
    expect(text).not.toContain('Non-gene annotation feature');
    expect(text).not.toContain('No assigned feature');
  });

  it('emits selected category changes for the parent component', () => {
    const component = fixture.componentInstance;
    const emitSpy = spyOn(component.categorySelectionChange, 'emit');

    component.changeSummaryCategoryVisibility('gene_upstream', false);

    expect(emitSpy).toHaveBeenCalledOnceWith(['gene_inside', 'gene_downstream', 'other']);
  });

  it('keeps at least one selected chart category', () => {
    const component = fixture.componentInstance;
    const emitSpy = spyOn(component.categorySelectionChange, 'emit');

    fixture.componentRef.setInput('selectedCategoryKeys', ['gene_inside']);
    fixture.detectChanges();
    component.changeSummaryCategoryVisibility('gene_inside', false);

    expect(emitSpy).not.toHaveBeenCalled();
  });

  it('renders the doughnut chart through ng2-charts', () => {
    expect(fixture.debugElement.queryAll(By.directive(BaseChartDirective)).length).toBeGreaterThan(
      0,
    );
  });
});
