import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { of } from 'rxjs';
import {
  EMPTY_G4_HISTOGRAM,
  G4ChartViewport,
  G4HistogramBin,
  G4HistogramFilters,
  G4HistogramRequest,
  G4HistogramResponse,
  G4Service,
  G4Type,
} from '../../../services/g4.service';

export interface G4ChartPointFocus {
  seqid: string;
  start: number;
  end: number;
  center: number;
}

type ChartYAxisMode = 'count' | 'density';

interface DensityUnitOption {
  label: string;
  bp: number;
  axisLabel: string;
}

interface ChartRenderBin extends G4HistogramBin {
  y_value: number;
  density_in_unit: number;
  density_unit_label: string;
}

interface ChartSize {
  width: number;
  height: number;
}

const DENSITY_UNIT_OPTIONS: readonly DensityUnitOption[] = [
  { label: '1M', bp: 1_000_000, axisLabel: '1 Mb' },
  { label: '100kb', bp: 100_000, axisLabel: '100 kb' },
  { label: '10kb', bp: 10_000, axisLabel: '10 kb' },
  { label: '1kb', bp: 1_000, axisLabel: '1 kb' },
];
const DEFAULT_DENSITY_UNIT_BP = 100_000;

@Component({
  selector: 'app-genome-range-chart',
  imports: [
    MatButtonModule,
    MatButtonToggleModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    ReactiveFormsModule,
  ],
  templateUrl: './genome-range-chart.component.html',
  styleUrl: './genome-range-chart.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GenomeRangeChartComponent {
  readonly assemblyAccession = input.required<string>();
  readonly seqid = input.required<string>();
  readonly g4Type = input.required<G4Type>();
  readonly viewport = input.required<G4ChartViewport>();
  readonly seqidLength = input.required<number>();
  readonly filters = input<G4HistogramFilters>({ tetrads: [] });

  readonly viewportChange = output<G4ChartViewport>();
  readonly pointFocus = output<G4ChartPointFocus>();

  readonly startControl = new FormControl(1, {
    nonNullable: true,
    validators: [Validators.required, Validators.min(1)],
  });
  readonly endControl = new FormControl(1, {
    nonNullable: true,
    validators: [Validators.required, Validators.min(1)],
  });
  readonly binSizeControl = new FormControl(1, {
    nonNullable: true,
    validators: [Validators.required, Validators.min(1)],
  });
  readonly yAxisMode = signal<ChartYAxisMode>('count');
  readonly densityUnitBp = signal<number>(DEFAULT_DENSITY_UNIT_BP);
  readonly densityUnitOptions = DENSITY_UNIT_OPTIONS;

  readonly validationError = signal<string | null>(null);
  readonly rangeLabel = computed(() => {
    const request = this.histogramRequest();
    if (!request) {
      return 'No range available';
    }
    return `${request.viewport.start}..${request.viewport.end} (${request.viewport.end - request.viewport.start + 1} bp)`;
  });

  private readonly chartHost = viewChild<ElementRef<HTMLDivElement>>('chartHost');

  private readonly g4Service = inject(G4Service);
  private readonly renderRevision = signal(0);
  private lastObservedWidth = 0;

  readonly histogramRequest = computed<G4HistogramRequest | undefined>(() => {
    const viewport = this.viewport();
    const seqidLength = this.seqidLength();

    if (!this.seqid() || seqidLength < 1) {
      return undefined;
    }
    if (viewport.start < 1 || viewport.end < viewport.start || viewport.end > seqidLength) {
      return undefined;
    }
    if (viewport.binSize < 1) {
      return undefined;
    }

    return {
      assemblyAccession: this.assemblyAccession(),
      seqid: this.seqid(),
      g4Type: this.g4Type(),
      viewport,
      filters: this.filters(),
    };
  });

  readonly histogramResource = rxResource<G4HistogramResponse, G4HistogramRequest | undefined>({
    params: () => this.histogramRequest(),
    stream: ({ params }) => (params ? this.g4Service.getHistogram(params) : of(EMPTY_G4_HISTOGRAM)),
    defaultValue: EMPTY_G4_HISTOGRAM,
  });
  readonly histogramSnapshot = computed(() => this.histogramResource.snapshot());
  readonly histogramStatus = computed(() => this.histogramSnapshot().status);
  readonly histogramBins = computed<readonly G4HistogramBin[]>(() => {
    const snapshot = this.histogramSnapshot();
    return 'value' in snapshot ? snapshot.value.bins : [];
  });
  readonly selectedDensityUnit = computed<DensityUnitOption>(() => {
    return (
      DENSITY_UNIT_OPTIONS.find((option) => option.bp === this.densityUnitBp()) ??
      DENSITY_UNIT_OPTIONS[1]
    );
  });
  readonly yAxisTitle = computed(() => {
    if (this.yAxisMode() === 'count') {
      return 'G4 count';
    }
    return `G4 density (/${this.selectedDensityUnit().axisLabel})`;
  });
  readonly chartRenderBins = computed<readonly ChartRenderBin[]>(() => {
    const mode = this.yAxisMode();
    const densityUnit = this.selectedDensityUnit();

    return this.histogramBins().map((bin) => {
      const densityPerBp = this.resolveDensityPerBp(bin);
      const densityInUnit = densityPerBp * densityUnit.bp;
      return {
        ...bin,
        y_value: mode === 'count' ? bin.count : densityInUnit,
        density_in_unit: densityInUnit,
        density_unit_label: densityUnit.label,
      };
    });
  });
  readonly histogramErrorMessage = computed(() => {
    if (this.histogramStatus() !== 'error') {
      return null;
    }
    return 'Histogram unavailable. Try adjusting range or filters.';
  });
  readonly showEmptyState = computed(() => {
    const status = this.histogramStatus();
    if (status === 'loading' || status === 'idle' || status === 'error') {
      return false;
    }
    return this.histogramBins().length === 0;
  });

  constructor() {
    effect(() => {
      const viewport = this.viewport();
      this.startControl.setValue(viewport.start, { emitEvent: false });
      this.endControl.setValue(viewport.end, { emitEvent: false });
      this.binSizeControl.setValue(viewport.binSize, { emitEvent: false });
      this.validationError.set(null);
      this.renderRevision.update((revision) => revision + 1);
    });

    effect(() => {
      this.histogramResource.snapshot();
      this.renderRevision.update((revision) => revision + 1);
    });

    effect((onCleanup) => {
      const host = this.chartHost()?.nativeElement;
      if (!host || typeof ResizeObserver === 'undefined') {
        return;
      }

      const resizeObserver = new ResizeObserver((entries) => {
        const entry = entries[0];
        const nextWidth = Math.trunc(entry?.contentRect.width ?? host.clientWidth ?? 0);
        if (nextWidth < 1 || nextWidth === this.lastObservedWidth) {
          return;
        }
        this.lastObservedWidth = nextWidth;
        this.renderRevision.update((revision) => revision + 1);
      });
      resizeObserver.observe(host);

      onCleanup(() => {
        resizeObserver.disconnect();
      });
    });

    effect(() => {
      const host = this.chartHost()?.nativeElement;
      if (!host) {
        return;
      }
      this.renderRevision();
      const request = this.histogramRequest();
      if (!request) {
        this.clearChart(host);
        return;
      }
      const status = this.histogramStatus();
      const bins = this.chartRenderBins();
      const yAxisTitle = this.yAxisTitle();
      if (status === 'loading' || status === 'idle' || status === 'error' || bins.length === 0) {
        this.clearChart(host);
        return;
      }
      void this.renderChart(host, request.viewport, bins, yAxisTitle);
    });
  }

  submitViewport(event?: Event): void {
    event?.preventDefault();

    const start = Math.trunc(this.startControl.value);
    const end = Math.trunc(this.endControl.value);
    const binSize = Math.trunc(this.binSizeControl.value);
    const seqidLength = this.seqidLength();

    if (!Number.isFinite(start) || !Number.isFinite(end) || !Number.isFinite(binSize)) {
      this.validationError.set('Start, end, and bin size are required integers.');
      return;
    }
    if (start < 1 || end < 1 || binSize < 1) {
      this.validationError.set('Start, end, and bin size must be positive integers.');
      return;
    }
    if (start > end) {
      this.validationError.set('Start must be less than or equal to end.');
      return;
    }
    if (end > seqidLength) {
      this.validationError.set(`End cannot exceed the sequence length (${seqidLength}).`);
      return;
    }

    this.validationError.set(null);
    this.viewportChange.emit({
      start,
      end,
      binSize,
    });
  }

  setYAxisMode(mode: ChartYAxisMode | string | null): void {
    if (mode !== 'count' && mode !== 'density') {
      return;
    }
    this.yAxisMode.set(mode);
  }

  setDensityUnit(unitBp: number | string | null): void {
    const normalizedUnitBp = Number(unitBp);
    if (!Number.isFinite(normalizedUnitBp)) {
      return;
    }
    if (!DENSITY_UNIT_OPTIONS.some((option) => option.bp === normalizedUnitBp)) {
      return;
    }
    this.densityUnitBp.set(normalizedUnitBp);
  }

  private resolveDensityPerBp(bin: G4HistogramBin): number {
    if (Number.isFinite(bin.density_per_bp) && bin.density_per_bp >= 0) {
      return bin.density_per_bp;
    }
    if (bin.count <= 0) {
      return 0;
    }
    const binWidth = Math.max(bin.end - bin.start + 1, 1);
    return bin.count / binWidth;
  }

  private async renderChart(
    host: HTMLElement,
    viewport: G4ChartViewport,
    bins: readonly ChartRenderBin[],
    yAxisTitle: string,
  ): Promise<void> {
    const chartSize = this.computeChartSize(host);
    const { default: embed } = await import('vega-embed');
    const spec = this.buildVegaSpec(viewport, bins, yAxisTitle, chartSize);

    const result = await embed(host, spec as never, { actions: false });

    result.view.addEventListener('click', (_event, item) => {
      const datum = (item as { datum?: ChartRenderBin } | undefined)?.datum;
      if (!datum) {
        return;
      }
      this.pointFocus.emit({
        seqid: this.seqid(),
        start: datum.start,
        end: datum.end,
        center: Math.round((datum.start + datum.end) / 2),
      });
    });
  }

  private buildVegaSpec(
    viewport: G4ChartViewport,
    bins: readonly ChartRenderBin[],
    yAxisTitle: string,
    chartSize: ChartSize = { width: 960, height: 320 },
  ): object {
    const hasMeanGscore = bins.some((bin) => bin.mean_gscore !== null);
    const rightPadding = hasMeanGscore ? 112 : 18;
    const xAxisValues = this.buildXAxisValues(viewport.start, viewport.end);

    return {
      $schema: 'https://vega.github.io/schema/vega/v6.json',
      autosize: {
        type: 'fit',
        contains: 'padding',
        resize: true,
      },
      width: chartSize.width,
      height: chartSize.height,
      padding: {
        left: 56,
        right: rightPadding,
        top: 14,
        bottom: 42,
      },
      data: [
        {
          name: 'bins',
          values: bins,
        },
      ],
      scales: [
        {
          name: 'x',
          type: 'linear',
          domain: [viewport.start, viewport.end],
          range: 'width',
          nice: false,
        },
        {
          name: 'y',
          type: 'linear',
          domain: { data: 'bins', field: 'y_value' },
          range: 'height',
          nice: true,
          zero: true,
        },
        {
          name: 'color',
          type: 'linear',
          domain: hasMeanGscore ? { data: 'bins', field: 'mean_gscore' } : [0, 1],
          range: ['#d9e5f3', '#87b4df', '#2f6ea8'],
          zero: false,
        },
      ],
      axes: [
        {
          orient: 'bottom',
          scale: 'x',
          title: 'Genomic position (bp)',
          values: xAxisValues,
          format: 'd',
          labelOverlap: 'greedy',
        },
        {
          orient: 'left',
          scale: 'y',
          title: yAxisTitle,
        },
      ],
      marks: [
        {
          type: 'rect',
          from: { data: 'bins' },
          encode: {
            update: {
              x: { scale: 'x', field: 'start' },
              x2: { scale: 'x', field: 'end' },
              y: { scale: 'y', field: 'y_value' },
              y2: { scale: 'y', value: 0 },
              fill: [
                {
                  test: 'datum.mean_gscore === null',
                  value: '#d9e5f3',
                },
                {
                  scale: 'color',
                  field: 'mean_gscore',
                },
              ],
              stroke: { value: '#2f3d4f' },
              strokeWidth: { value: 0.3 },
              tooltip: {
                signal:
                  "{'start': datum.start, 'end': datum.end, 'count': datum.count, 'density': datum.density_in_unit, 'density_unit': datum.density_unit_label, 'density_per_bp': datum.density_per_bp, 'mean_gscore': datum.mean_gscore}",
              },
            },
          },
        },
      ],
      legends: hasMeanGscore
        ? [
            {
              fill: 'color',
              title: 'Mean G-score',
              orient: 'right',
              offset: 8,
              titleFontSize: 12,
              labelFontSize: 11,
              titleAlign: 'right',
              labelAlign: 'right',
              gradientLength: 140,
            },
          ]
        : [],
    };
  }

  private computeChartSize(host: HTMLElement): ChartSize {
    const bounds = host.getBoundingClientRect();
    const width = Math.max(360, Math.trunc(host.clientWidth || bounds.width || 960));
    const height = Math.max(220, Math.min(420, Math.round(width * 0.34)));
    return {
      width,
      height,
    };
  }

  private buildXAxisValues(start: number, end: number): number[] {
    if (start >= end) {
      return [start];
    }
    const middle = Math.round((start + end) / 2);
    return Array.from(new Set([start, middle, end])).sort((a, b) => a - b);
  }

  private clearChart(host = this.chartHost()?.nativeElement): void {
    if (!host) {
      return;
    }
    host.innerHTML = '';
  }
}
