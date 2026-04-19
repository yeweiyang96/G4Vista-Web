import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { GenomeRangeChartComponent } from './genome-range-chart.component';
import { G4Service, G4Type } from '../../../services/g4.service';

interface GenomeRangeChartPrivateApi {
  renderChart: (...args: readonly unknown[]) => Promise<void>;
  buildVegaSpec: (...args: readonly unknown[]) => {
    marks: {
      encode?: {
        update?: {
          cursor?: unknown;
        };
      };
    }[];
  };
}

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

  it('switches y-axis mode and density units without refetching histogram', async () => {
    const { fixture, renderChartSpy } = createComponent();
    const component = fixture.componentInstance;
    await fixture.whenStable();

    const requestCountAfterLoad = g4Service.getHistogram.calls.count();
    expect(component.yAxisTitle()).toBe('G4 count');

    component.setYAxisMode('density');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.yAxisTitle()).toBe('G4 density (/100 kb)');
    expect(g4Service.getHistogram.calls.count()).toBe(requestCountAfterLoad);
    expect(component.chartRenderBins()[0].y_value).toBeCloseTo(2000, 6);

    component.setDensityUnit(1_000);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.yAxisTitle()).toBe('G4 density (/1 kb)');
    expect(g4Service.getHistogram.calls.count()).toBe(requestCountAfterLoad);
    expect(component.chartRenderBins()[0].y_value).toBeCloseTo(20, 6);
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
    );

    expect(spec.marks[0]?.encode?.update?.cursor).toBeUndefined();
  });
});
