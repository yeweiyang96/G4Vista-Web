import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { GenomeRangeChartComponent } from './genome-range-chart.component';
import { G4Service, G4Type } from '../../../services/g4.service';

interface GenomeRangeChartPrivateApi {
  renderChart: (...args: readonly unknown[]) => Promise<void>;
  buildVegaSpec: (...args: readonly unknown[]) => {
    data: {
      transform?: {
        as?: string;
        expr?: string;
      }[];
    }[];
    scales: {
      name?: string;
      domain?: unknown;
      zero?: boolean;
    }[];
    axes: {
      scale?: string;
      title?: string;
      values?: number[];
      labelPadding?: number;
      titlePadding?: number;
      encode?: {
        labels?: {
          update?: {
            text?: {
              signal?: string;
            };
            lineBreak?: {
              value?: string;
            };
            lineHeight?: {
              value?: number;
            };
          };
        };
      };
    }[];
    marks: {
      encode?: {
        update?: {
          cursor?: unknown;
          x?: {
            field?: string;
          };
          x2?: {
            field?: string;
          };
        };
      };
    }[];
  };
}

const TEST_CHART_THEME_COLORS = {
  axisText: '#111111',
  axisLine: '#222222',
  gridLine: '#333333',
};

function privateApi(component: GenomeRangeChartComponent): GenomeRangeChartPrivateApi {
  return component as unknown as GenomeRangeChartPrivateApi;
}

describe('GenomeRangeChartComponent', () => {
  let g4Service: jasmine.SpyObj<G4Service>;

  beforeEach(async () => {
    g4Service = jasmine.createSpyObj<G4Service>('G4Service', ['getHistogram']);
    g4Service.getHistogram.and.returnValue(
      of({
        bins: [
          {
            start: 1,
            end: 50,
            count: 1,
            density_per_bp: 0.02,
            mean_gscore: 22,
          },
        ],
        range_start: 1,
        range_end: 100,
        bin_size: 50,
        total_count: 1,
      }),
    );

    await TestBed.configureTestingModule({
      imports: [GenomeRangeChartComponent],
      providers: [{ provide: G4Service, useValue: g4Service }],
    }).compileComponents();
  });

  function createComponent(g4Type: G4Type = 'normal') {
    const fixture = TestBed.createComponent(GenomeRangeChartComponent);
    const component = fixture.componentInstance;

    const renderChartSpy = spyOn(privateApi(component), 'renderChart').and.resolveTo();

    fixture.componentRef.setInput('assemblyAccession', 'GCF_1');
    fixture.componentRef.setInput('seqid', 'chr1');
    fixture.componentRef.setInput('g4Type', g4Type);
    fixture.componentRef.setInput('viewport', {
      start: 1,
      end: 100,
      binSize: 50,
    });
    fixture.componentRef.setInput('seqidLength', 10_000);
    fixture.componentRef.setInput('filters', {
      tetrads: [2, 3],
      minGscore: 10,
      maxGscore: 60,
    });
    fixture.detectChanges();

    return { fixture, renderChartSpy };
  }

  it('loads histogram data when range inputs are provided and refreshes on viewport changes', async () => {
    const { fixture } = createComponent();
    await fixture.whenStable();

    expect(g4Service.getHistogram).toHaveBeenCalledWith(
      jasmine.objectContaining({
        assemblyAccession: 'GCF_1',
        seqid: 'chr1',
        g4Type: 'normal',
        viewport: {
          start: 1,
          end: 100,
          binSize: 50,
        },
      }),
    );

    fixture.componentRef.setInput('viewport', {
      start: 500,
      end: 900,
      binSize: 20,
    });
    fixture.detectChanges();
    await fixture.whenStable();

    expect(g4Service.getHistogram).toHaveBeenCalledWith(
      jasmine.objectContaining({
        viewport: {
          start: 500,
          end: 900,
          binSize: 20,
        },
      }),
    );
  });

  it('validates manual viewport edits before emitting viewportChange', async () => {
    const { fixture } = createComponent();
    const component = fixture.componentInstance;
    await fixture.whenStable();

    const emitSpy = spyOn(component.viewportChange, 'emit');

    component.startControl.setValue(1000);
    component.endControl.setValue(900);
    component.binSizeControl.setValue(20);
    component.submitViewport();

    expect(emitSpy).not.toHaveBeenCalled();
    expect(component.validationError()).toBe('Start must be less than or equal to end.');

    component.startControl.setValue(200);
    component.endControl.setValue(1200);
    component.binSizeControl.setValue(25);
    component.submitViewport();

    expect(emitSpy).toHaveBeenCalledWith({
      start: 200,
      end: 1200,
      binSize: 25,
    });
    expect(component.validationError()).toBeNull();
  });

  it('emits resetRange and clears local validation errors', async () => {
    const { fixture } = createComponent();
    const component = fixture.componentInstance;
    await fixture.whenStable();

    const emitSpy = spyOn(component.resetRange, 'emit');

    component.startControl.setValue(1000);
    component.endControl.setValue(900);
    component.submitViewport();

    expect(component.validationError()).toBe('Start must be less than or equal to end.');

    component.resetViewport();

    expect(component.validationError()).toBeNull();
    expect(emitSpy).toHaveBeenCalledOnceWith();
  });

  it('shows a non-blocking error message when histogram request fails', async () => {
    g4Service.getHistogram.and.returnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 500,
            statusText: 'Internal Server Error',
          }),
      ),
    );

    const { fixture, renderChartSpy } = createComponent();
    const component = fixture.componentInstance;
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component.histogramStatus()).toBe('error');
    expect(component.histogramErrorMessage()).toContain('Histogram unavailable');
    expect(renderChartSpy).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain(
      'Histogram unavailable. Try adjusting range or filters.',
    );
  });

  it('shows an empty-data state and skips plotting when bins are empty', async () => {
    g4Service.getHistogram.and.returnValue(
      of({
        bins: [],
        range_start: 1,
        range_end: 100,
        bin_size: 50,
        total_count: 0,
      }),
    );

    const { fixture, renderChartSpy } = createComponent();
    const component = fixture.componentInstance;
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component.showEmptyState()).toBeTrue();
    expect(renderChartSpy).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain(
      'No histogram data for the selected range.',
    );
  });

  it('uses preset and custom density bin sizes for histogram requests', async () => {
    g4Service.getHistogram.and.returnValue(
      of({
        bins: [
          {
            start: 1,
            end: 100,
            count: 2,
            density_per_bp: 999,
            mean_gscore: 22,
          },
        ],
        range_start: 1,
        range_end: 100,
        bin_size: 100,
        total_count: 2,
      }),
    );

    const { fixture, renderChartSpy } = createComponent();
    const component = fixture.componentInstance;
    await fixture.whenStable();

    const requestCountAfterLoad = g4Service.getHistogram.calls.count();
    const emitSpy = spyOn(component.viewportChange, 'emit');
    expect(component.yAxisTitle()).toBe('G4 count');

    component.setYAxisMode('density');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.yAxisTitle()).toBe('G4 density (G4/bp)');
    expect(g4Service.getHistogram.calls.count()).toBe(requestCountAfterLoad);
    expect(component.binSizeControl.disabled).toBeFalse();
    expect(component.selectedDensityPresetBp()).toBeNull();
    expect(component.chartRenderBins()[0].y_value).toBeCloseTo(0.02, 6);

    component.setDensityUnit(1_000);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(emitSpy).toHaveBeenCalledWith({ start: 1, end: 100, binSize: 1_000 });
    fixture.componentRef.setInput('viewport', {
      start: 1,
      end: 100,
      binSize: 1_000,
    });
    fixture.detectChanges();
    await fixture.whenStable();

    expect(g4Service.getHistogram.calls.count()).toBe(requestCountAfterLoad + 1);
    expect(g4Service.getHistogram.calls.mostRecent().args[0].viewport.binSize).toBe(1_000);
    expect(component.binSizeControl.value).toBe(1_000);
    expect(component.selectedDensityPresetBp()).toBe(1_000);
    expect(component.chartRenderBins()[0].y_value).toBeCloseTo(0.02, 6);

    component.binSizeControl.setValue(1234);
    component.submitViewport();

    expect(emitSpy).toHaveBeenCalledWith({ start: 1, end: 100, binSize: 1234 });
    fixture.componentRef.setInput('viewport', {
      start: 1,
      end: 100,
      binSize: 1234,
    });
    fixture.detectChanges();
    await fixture.whenStable();

    expect(g4Service.getHistogram.calls.mostRecent().args[0].viewport.binSize).toBe(1234);
    expect(component.selectedDensityPresetBp()).toBeNull();
    expect(component.chartRenderBins()[0].density_bin_label).toBe('1234bp');
    expect(renderChartSpy).toHaveBeenCalled();
  });

  it('does not use pointer cursor in chart marks', async () => {
    const { fixture } = createComponent();
    const component = fixture.componentInstance;
    await fixture.whenStable();

    const spec = privateApi(component).buildVegaSpec(
      component.viewport(),
      component.chartRenderBins(),
      component.yAxisTitle(),
      TEST_CHART_THEME_COLORS,
    );

    expect(spec.marks[0]?.encode?.update?.cursor).toBeUndefined();
  });

  it('anchors the x scale at the selected viewport start', async () => {
    const { fixture } = createComponent();
    const component = fixture.componentInstance;
    await fixture.whenStable();

    const spec = privateApi(component).buildVegaSpec(
      { start: 10_000, end: 1_000_000, binSize: 1000 },
      [
        {
          start: 10_000,
          end: 10_999,
          count: 2,
          density_per_bp: 0.002,
          mean_gscore: 22,
          y_value: 2,
          density: 0.002,
          density_bin_label: '100kb',
          bin_length: 1000,
        },
      ],
      'G4 count',
      TEST_CHART_THEME_COLORS,
    );
    const xScale = spec.scales.find((scale) => scale.name === 'x');
    const xAxis = spec.axes.find((axis) => axis.scale === 'x');
    const rectMark = spec.marks[0]?.encode?.update;

    expect(xScale?.domain).toEqual([0, 990_000]);
    expect(xScale?.zero).toBeFalse();
    expect(xAxis?.title).toBe('Genomic position (bp)');
    expect(xAxis?.values).toEqual([0, 495_000, 990_000]);
    expect(xAxis?.encode?.labels?.update?.text?.signal).toBe("format(datum.value + 10000, 'd')");
    expect(spec.data[0]?.transform).toContain(
      jasmine.objectContaining({
        as: 'plot_start',
        expr: 'max(0, datum.start - 10000)',
      }),
    );
    expect(spec.data[0]?.transform).toContain(
      jasmine.objectContaining({
        as: 'plot_end',
        expr: 'min(990000, max(0, datum.end - 10000))',
      }),
    );
    expect(rectMark?.x?.field).toBe('plot_start');
    expect(rectMark?.x2?.field).toBe('plot_end');
  });

  it('adds selected gene boundaries to x-axis ticks when provided', async () => {
    const { fixture } = createComponent();
    const component = fixture.componentInstance;
    await fixture.whenStable();

    fixture.componentRef.setInput('axisFeatureRange', {
      start: 6000,
      end: 8000,
    });
    fixture.detectChanges();

    const spec = privateApi(component).buildVegaSpec(
      { start: 5000, end: 9000, binSize: 100 },
      [
        {
          start: 6000,
          end: 6099,
          count: 1,
          density_per_bp: 0.01,
          mean_gscore: 22,
          y_value: 1,
          density: 0.01,
          density_bin_label: '100kb',
          bin_length: 100,
        },
      ],
      'G4 count',
      TEST_CHART_THEME_COLORS,
    );
    const xAxis = spec.axes.find((axis) => axis.scale === 'x');

    expect(xAxis?.values).toEqual([0, 1000, 3000, 4000]);
    expect(xAxis?.labelPadding).toBe(8);
    expect(xAxis?.titlePadding).toBe(18);
    expect(xAxis?.encode?.labels?.update?.text?.signal).toContain(
      "datum.value === 1000 ? 'Gene start\\n' + format(datum.value + 5000, 'd')",
    );
    expect(xAxis?.encode?.labels?.update?.text?.signal).toContain(
      "datum.value === 3000 ? 'Gene end\\n' + format(datum.value + 5000, 'd')",
    );
    expect(xAxis?.encode?.labels?.update?.lineBreak?.value).toBe('\n');
    expect(xAxis?.encode?.labels?.update?.lineHeight?.value).toBe(12);
  });
});
