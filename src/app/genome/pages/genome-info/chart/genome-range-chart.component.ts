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
import { DOCUMENT } from '@angular/common';
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
import { UiThemeMode, UiThemeService } from '../../../../theme/ui-theme.service';

export interface G4ChartPointFocus {
  seqid: string;
  start: number;
  end: number;
  center: number;
}

export interface G4ChartAxisFeatureRange {
  start: number;
  end: number;
}

type ChartYAxisMode = 'count' | 'density';

interface DensityUnitOption {
  label: string;
  bp: number;
}

interface ChartRenderBin extends G4HistogramBin {
  y_value: number;
  density: number;
  density_bin_label: string;
  bin_length: number;
}

interface ChartSize {
  width: number;
  height: number;
}

interface ChartThemeColors {
  axisText: string;
  axisLine: string;
  gridLine: string;
}

const DEFAULT_CHART_THEME_COLORS: ChartThemeColors = {
  axisText: '#1d1b20',
  axisLine: '#74777f',
  gridLine: '#c4c6d0',
};
const DENSITY_UNIT_OPTIONS: readonly DensityUnitOption[] = [
  { label: '1M', bp: 1_000_000 },
  { label: '100kb', bp: 100_000 },
  { label: '10kb', bp: 10_000 },
  { label: '1kb', bp: 1_000 },
];
const FALLBACK_CHART_WIDTH = 960;

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
  readonly axisFeatureRange = input<G4ChartAxisFeatureRange | null>(null);

  readonly viewportChange = output<G4ChartViewport>();
  readonly pointFocus = output<G4ChartPointFocus>();
  readonly resetRange = output<void>();

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

  private readonly documentRef = inject(DOCUMENT, { optional: true });
  private readonly g4Service = inject(G4Service);
  private readonly uiThemeService = inject(UiThemeService);
  private readonly renderRevision = signal(0);
  private lastObservedWidth = 0;

  readonly histogramViewport = computed<G4ChartViewport>(() => {
    const viewport = this.viewport();
    return {
      ...viewport,
      binSize: Math.max(1, Math.trunc(viewport.binSize)),
    };
  });
  readonly selectedDensityPresetBp = computed<number | null>(() => {
    const binSize = this.histogramViewport().binSize;
    return DENSITY_UNIT_OPTIONS.some((option) => option.bp === binSize) ? binSize : null;
  });
  readonly histogramRequest = computed<G4HistogramRequest | undefined>(() => {
    const viewport = this.histogramViewport();
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
  readonly yAxisTitle = computed(() => {
    if (this.yAxisMode() === 'count') {
      return 'G4 count';
    }
    return 'G4 density (G4/bp)';
  });
  readonly chartRenderBins = computed<readonly ChartRenderBin[]>(() => {
    const mode = this.yAxisMode();
    const densityBinLabel = this.formatDensityBinLabel(this.histogramViewport().binSize);

    return this.histogramBins().map((bin) => {
      const binLength = this.resolveBinLength(bin);
      const density = this.resolveDensity(bin, binLength);
      return {
        ...bin,
        y_value: mode === 'count' ? bin.count : density,
        density,
        density_bin_label: densityBinLabel,
        bin_length: binLength,
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
      this.binSizeControl.setValue(this.histogramViewport().binSize, { emitEvent: false });
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
      const themeColors = this.resolveChartThemeColors(this.uiThemeService.resolvedMode());
      if (status === 'loading' || status === 'idle' || status === 'error' || bins.length === 0) {
        this.clearChart(host);
        return;
      }
      void this.renderChart(host, request.viewport, bins, yAxisTitle, themeColors);
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

  resetViewport(): void {
    this.validationError.set(null);
    this.resetRange.emit();
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
    this.binSizeControl.setValue(normalizedUnitBp);
    this.submitViewport();
  }

  private resolveDensity(bin: G4HistogramBin, binLength: number): number {
    if (bin.count <= 0) {
      return 0;
    }
    return bin.count / binLength;
  }

  private resolveBinLength(bin: G4HistogramBin): number {
    const binWidth = Math.max(bin.end - bin.start + 1, 1);
    return binWidth;
  }

  private formatDensityBinLabel(binSize: number): string {
    return DENSITY_UNIT_OPTIONS.find((option) => option.bp === binSize)?.label ?? `${binSize}bp`;
  }

  private async renderChart(
    host: HTMLElement,
    viewport: G4ChartViewport,
    bins: readonly ChartRenderBin[],
    yAxisTitle: string,
    themeColors: ChartThemeColors,
  ): Promise<void> {
    const chartSize = this.computeChartSize(host);
    const { default: embed } = await import('vega-embed');
    const spec = this.buildVegaSpec(viewport, bins, yAxisTitle, themeColors, chartSize);

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
    themeColors: ChartThemeColors = DEFAULT_CHART_THEME_COLORS,
    chartSize: ChartSize = { width: 960, height: 320 },
  ): object {
    const hasMeanScore = bins.some((bin) => bin.mean_score !== null);
    const rightPadding = hasMeanScore ? 112 : 18;
    const xSpan = viewport.end - viewport.start;
    const xDomainEnd = Math.max(xSpan, 1);
    const axisFeatureRange = this.axisFeatureRange();
    const hasFeatureAxisLabels = this.hasVisibleAxisFeatureRange(
      xDomainEnd,
      viewport,
      axisFeatureRange,
    );
    const xAxisValues = this.buildRelativeXAxisValues(xSpan, viewport, axisFeatureRange);
    const xAxisLabelSignal = this.buildXAxisLabelSignal(xDomainEnd, viewport, axisFeatureRange);

    return {
      $schema: 'https://vega.github.io/schema/vega/v6.json',
      autosize: {
        type: 'fit',
        contains: 'padding',
        resize: true,
      },
      width: chartSize.width,
      height: chartSize.height,
      config: {
        axis: {
          labelColor: themeColors.axisText,
          titleColor: themeColors.axisText,
          domainColor: themeColors.axisLine,
          tickColor: themeColors.axisLine,
          gridColor: themeColors.gridLine,
        },
        legend: {
          labelColor: themeColors.axisText,
          titleColor: themeColors.axisText,
        },
      },
      padding: {
        left: 56,
        right: rightPadding,
        top: 14,
        bottom: hasFeatureAxisLabels ? 62 : 42,
      },
      data: [
        {
          name: 'bins',
          values: bins,
          transform: [
            {
              type: 'formula',
              as: 'plot_start',
              expr: `max(0, datum.start - ${viewport.start})`,
            },
            {
              type: 'formula',
              as: 'plot_end',
              expr: `min(${xDomainEnd}, max(0, datum.end - ${viewport.start}))`,
            },
          ],
        },
      ],
      scales: [
        {
          name: 'x',
          type: 'linear',
          domain: [0, xDomainEnd],
          range: 'width',
          nice: false,
          zero: false,
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
          domain: hasMeanScore ? { data: 'bins', field: 'mean_score' } : [0, 1],
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
          labelPadding: hasFeatureAxisLabels ? 8 : 4,
          titlePadding: hasFeatureAxisLabels ? 18 : 4,
          encode: {
            labels: {
              update: {
                text: {
                  signal: xAxisLabelSignal,
                },
                lineBreak: {
                  value: '\n',
                },
                lineHeight: {
                  value: 12,
                },
              },
            },
          },
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
              x: { scale: 'x', field: 'plot_start' },
              x2: { scale: 'x', field: 'plot_end' },
              y: { scale: 'y', field: 'y_value' },
              y2: { scale: 'y', value: 0 },
              fill: [
                {
                  test: 'datum.mean_score === null',
                  value: '#d9e5f3',
                },
                {
                  scale: 'color',
                  field: 'mean_score',
                },
              ],
              stroke: { value: '#2f3d4f' },
              strokeWidth: { value: 0.3 },
              tooltip: {
                signal:
                  "{'start': datum.start, 'end': datum.end, 'count': datum.count, 'bin_length': datum.bin_length, 'density': datum.density, 'density_bin': datum.density_bin_label, 'mean_score': datum.mean_score}",
              },
            },
          },
        },
      ],
      legends: hasMeanScore
        ? [
            {
              fill: 'color',
              title: 'Mean score',
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

  private resolveChartThemeColors(mode: UiThemeMode): ChartThemeColors {
    const defaultAxisText = mode === 'dark' ? '#e1e2e6' : '#1d1b20';
    const defaultAxisLine = mode === 'dark' ? '#8f9099' : '#74777f';
    const defaultGridLine = mode === 'dark' ? '#494a50' : '#c4c6d0';

    return {
      axisText: this.resolveCssColorVar('--mat-sys-on-surface', defaultAxisText),
      axisLine: this.resolveCssColorVar('--mat-sys-outline', defaultAxisLine),
      gridLine: this.resolveCssColorVar('--mat-sys-outline-variant', defaultGridLine),
    };
  }

  private resolveCssColorVar(variableName: string, fallbackColor: string): string {
    const rootElement = this.documentRef?.documentElement;
    if (!rootElement) {
      return fallbackColor;
    }

    const resolvedValue = getComputedStyle(rootElement).getPropertyValue(variableName).trim();
    return resolvedValue || fallbackColor;
  }

  private computeChartSize(host: HTMLElement): ChartSize {
    const bounds = host.getBoundingClientRect();
    const width = Math.max(1, Math.trunc(host.clientWidth || bounds.width || FALLBACK_CHART_WIDTH));
    const height = Math.max(220, Math.min(420, Math.round(width * 0.34)));
    return {
      width,
      height,
    };
  }

  private buildRelativeXAxisValues(
    xDomainEnd: number,
    viewport: G4ChartViewport,
    axisFeatureRange: G4ChartAxisFeatureRange | null,
  ): number[] {
    if (xDomainEnd <= 0) {
      return [0];
    }

    const values = axisFeatureRange ? [0, xDomainEnd] : [0, Math.round(xDomainEnd / 2), xDomainEnd];
    if (axisFeatureRange) {
      values.push(
        ...[axisFeatureRange.start, axisFeatureRange.end]
          .filter((position) => position >= viewport.start && position <= viewport.end)
          .map((position) => position - viewport.start),
      );
    }

    return Array.from(new Set(values)).sort((a, b) => a - b);
  }

  private buildXAxisLabelSignal(
    xDomainEnd: number,
    viewport: G4ChartViewport,
    axisFeatureRange: G4ChartAxisFeatureRange | null,
  ): string {
    const baseLabel = `format(datum.value + ${viewport.start}, 'd')`;
    if (!axisFeatureRange) {
      return baseLabel;
    }

    const featureLabels = new Map<number, string>();
    const featureStartOffset = axisFeatureRange.start - viewport.start;
    if (this.isVisibleRelativeAxisPosition(featureStartOffset, xDomainEnd)) {
      featureLabels.set(featureStartOffset, 'Gene start');
    }

    const featureEndOffset = axisFeatureRange.end - viewport.start;
    if (this.isVisibleRelativeAxisPosition(featureEndOffset, xDomainEnd)) {
      featureLabels.set(
        featureEndOffset,
        featureLabels.has(featureEndOffset) ? 'Gene start/end' : 'Gene end',
      );
    }

    if (!featureLabels.size) {
      return baseLabel;
    }

    return `${Array.from(featureLabels.entries())
      .sort(([left], [right]) => left - right)
      .map(([value, label]) => `datum.value === ${value} ? '${label}\\n' + ${baseLabel} : `)
      .join('')}${baseLabel}`;
  }

  private hasVisibleAxisFeatureRange(
    xDomainEnd: number,
    viewport: G4ChartViewport,
    axisFeatureRange: G4ChartAxisFeatureRange | null,
  ): boolean {
    if (!axisFeatureRange) {
      return false;
    }
    return [axisFeatureRange.start, axisFeatureRange.end].some((position) =>
      this.isVisibleRelativeAxisPosition(position - viewport.start, xDomainEnd),
    );
  }

  private isVisibleRelativeAxisPosition(position: number, xDomainEnd: number): boolean {
    return Number.isFinite(position) && position >= 0 && position <= xDomainEnd;
  }

  private clearChart(host = this.chartHost()?.nativeElement): void {
    if (!host) {
      return;
    }
    host.innerHTML = '';
  }
}
