import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import type { VisualizationSpec } from 'vega-embed';

export interface StrengthBoxPlotDatum {
  key: string;
  label: string;
  color: string;
  minValue: number;
  q1Value: number;
  medianValue: number;
  p75Value: number;
  maxValue: number;
}

interface VegaBoxPlotSize {
  width: number;
  height: number;
}

const CHART_PADDING = { left: 96, right: 12, top: 8, bottom: 32 } as const;
const MINIMUM_PLOT_WIDTH = 220;
const ROW_HEIGHT = 38;
const MINIMUM_PLOT_HEIGHT = 168;
const WHISKER_CAP_HALF_HEIGHT = 9;
const BOX_HALF_HEIGHT = 9;
const MEDIAN_HALF_HEIGHT = 12;

@Component({
  selector: 'app-strength-box-plot-vega',
  imports: [MatTooltipModule],
  template: `
    <section class="strength-plot" [attr.aria-label]="title() + ' Vega box plot'">
      <h3 class="breakdown-title">
        <span class="header-help" [matTooltip]="tooltip()" matTooltipPosition="above">
          {{ title() }}
        </span>
      </h3>

      @if (rows().length > 0) {
        <div
          #plotHost
          class="strength-vega-host"
          role="img"
          [attr.aria-label]="accessibleLabel()"
        ></div>
      } @else {
        <p class="state" role="status">No {{ title() }} box plot data.</p>
      }
    </section>
  `,
  styles: `
    :host {
      display: block;
      min-width: 0;
    }

    .strength-plot {
      display: grid;
      gap: 8px;
      min-width: 0;
      padding: 10px;
      background: var(--mat-sys-surface-container-low);
      border: 1px solid var(--mat-sys-outline-variant);
      border-radius: 8px;
    }

    .breakdown-title {
      margin: 0;
      font: var(--mat-sys-title-small);
    }

    .header-help {
      text-decoration: underline dotted;
      cursor: help;
    }

    .strength-vega-host {
      min-height: 150px;
      overflow: hidden;
    }

    .state {
      display: flex;
      gap: 10px;
      align-items: center;
      margin: 0;
      font: var(--mat-sys-body-medium);
      color: var(--mat-sys-on-surface-variant);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StrengthBoxPlotVegaComponent {
  readonly title = input.required<string>();
  readonly rows = input.required<readonly StrengthBoxPlotDatum[]>();
  readonly tooltip = input.required<string>();
  readonly accessibleLabel = computed(
    () => `${this.title()} distribution by position category for the selected motif type`,
  );

  private readonly plotHost = viewChild<ElementRef<HTMLDivElement>>('plotHost');
  private readonly renderRevision = signal(0);
  private lastObservedWidth = 0;
  private cleanupChart: (() => void) | null = null;
  private renderId = 0;

  constructor() {
    effect((onCleanup) => {
      const host = this.plotHost()?.nativeElement;
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

    effect((onCleanup) => {
      const host = this.plotHost()?.nativeElement;
      const rows = this.rows();
      const title = this.title();
      this.renderRevision();

      if (!host || rows.length === 0) {
        return;
      }

      const renderId = this.renderId + 1;
      this.renderId = renderId;
      let cancelled = false;
      void this.renderChart(host, rows, title).then((cleanupChart) => {
        if (cancelled || renderId !== this.renderId) {
          cleanupChart();
          return;
        }
        this.cleanupChart = cleanupChart;
      });

      onCleanup(() => {
        cancelled = true;
        if (renderId === this.renderId) {
          this.renderId += 1;
        }
        this.clearChart(host);
      });
    });
  }

  private async renderChart(
    host: HTMLDivElement,
    rows: readonly StrengthBoxPlotDatum[],
    title: string,
  ): Promise<() => void> {
    this.clearChart(host);
    const { default: embed } = await import('vega-embed');
    const result = await embed(host, this.buildVegaSpec(rows, title), {
      actions: false,
      mode: 'vega',
      renderer: 'svg',
    });
    return () => result.view.finalize();
  }

  private clearChart(host: HTMLDivElement): void {
    this.cleanupChart?.();
    this.cleanupChart = null;
    host.innerHTML = '';
    host.removeAttribute('style');
  }

  private buildVegaSpec(rows: readonly StrengthBoxPlotDatum[], title: string): VisualizationSpec {
    const size = this.chartSize(rows);
    const [domainMin, domainMax] = this.chartDomain(rows);

    return {
      $schema: 'https://vega.github.io/schema/vega/v6.json',
      autosize: {
        type: 'fit',
        contains: 'padding',
        resize: true,
      },
      width: size.width,
      height: size.height,
      padding: CHART_PADDING,
      config: {
        axis: {
          labelColor: '#49454f',
          titleColor: '#49454f',
          domainColor: '#79747e',
          tickColor: '#79747e',
          gridColor: '#cac4d0',
        },
      },
      data: [
        {
          name: 'boxplot',
          values: rows,
        },
      ],
      scales: [
        {
          name: 'x',
          type: 'linear',
          domain: [domainMin, domainMax],
          nice: true,
          zero: false,
          range: 'width',
        },
        {
          name: 'y',
          type: 'band',
          domain: rows.map((row) => row.label),
          range: 'height',
          paddingInner: 0.34,
          paddingOuter: 0.2,
        },
      ],
      axes: [
        {
          orient: 'bottom',
          scale: 'x',
          title,
          grid: true,
          tickCount: 5,
        },
        {
          orient: 'left',
          scale: 'y',
          title: '',
          domain: false,
          ticks: false,
          labelLimit: 112,
        },
      ],
      marks: [
        {
          type: 'rule',
          from: { data: 'boxplot' },
          encode: {
            enter: {
              stroke: { value: '#5f6368' },
              strokeWidth: { value: 1.4 },
              tooltip: { signal: this.tooltipSignal() },
            },
            update: {
              x: { scale: 'x', field: 'minValue' },
              x2: { scale: 'x', field: 'maxValue' },
              y: { scale: 'y', field: 'label', band: 0.5 },
            },
          },
        },
        {
          type: 'rule',
          from: { data: 'boxplot' },
          encode: {
            enter: {
              stroke: { value: '#5f6368' },
              strokeWidth: { value: 1.4 },
              tooltip: { signal: this.tooltipSignal() },
            },
            update: {
              x: { scale: 'x', field: 'minValue' },
              y: {
                scale: 'y',
                field: 'label',
                band: 0.5,
                offset: -WHISKER_CAP_HALF_HEIGHT,
              },
              y2: {
                scale: 'y',
                field: 'label',
                band: 0.5,
                offset: WHISKER_CAP_HALF_HEIGHT,
              },
            },
          },
        },
        {
          type: 'rule',
          from: { data: 'boxplot' },
          encode: {
            enter: {
              stroke: { value: '#5f6368' },
              strokeWidth: { value: 1.4 },
              tooltip: { signal: this.tooltipSignal() },
            },
            update: {
              x: { scale: 'x', field: 'maxValue' },
              y: {
                scale: 'y',
                field: 'label',
                band: 0.5,
                offset: -WHISKER_CAP_HALF_HEIGHT,
              },
              y2: {
                scale: 'y',
                field: 'label',
                band: 0.5,
                offset: WHISKER_CAP_HALF_HEIGHT,
              },
            },
          },
        },
        {
          type: 'rect',
          from: { data: 'boxplot' },
          encode: {
            enter: {
              fillOpacity: { value: 0.76 },
              stroke: { value: 'rgba(0, 0, 0, 0.18)' },
              strokeWidth: { value: 1 },
              tooltip: { signal: this.tooltipSignal() },
            },
            update: {
              x: { scale: 'x', field: 'q1Value' },
              x2: { scale: 'x', field: 'p75Value' },
              y: { scale: 'y', field: 'label', band: 0.5, offset: -BOX_HALF_HEIGHT },
              y2: { scale: 'y', field: 'label', band: 0.5, offset: BOX_HALF_HEIGHT },
              fill: { field: 'color' },
            },
          },
        },
        {
          type: 'rule',
          from: { data: 'boxplot' },
          encode: {
            enter: {
              stroke: { value: '#1d1b20' },
              strokeWidth: { value: 2 },
              tooltip: { signal: this.tooltipSignal() },
            },
            update: {
              x: { scale: 'x', field: 'medianValue' },
              y: { scale: 'y', field: 'label', band: 0.5, offset: -MEDIAN_HALF_HEIGHT },
              y2: { scale: 'y', field: 'label', band: 0.5, offset: MEDIAN_HALF_HEIGHT },
            },
          },
        },
      ],
    };
  }

  private chartSize(rows: readonly StrengthBoxPlotDatum[]): VegaBoxPlotSize {
    const hostWidth = this.plotHost()?.nativeElement.clientWidth ?? 0;
    const width = Math.max(
      hostWidth - CHART_PADDING.left - CHART_PADDING.right,
      MINIMUM_PLOT_WIDTH,
    );
    const height = Math.max(rows.length * ROW_HEIGHT, MINIMUM_PLOT_HEIGHT);
    return { width, height };
  }

  private chartDomain(rows: readonly StrengthBoxPlotDatum[]): [number, number] {
    const minValue = Math.min(...rows.map((row) => row.minValue));
    const maxValue = Math.max(...rows.map((row) => row.maxValue));
    if (maxValue > minValue) {
      return [minValue, maxValue];
    }
    return [minValue - 1, maxValue + 1];
  }

  private tooltipSignal(): string {
    return "{'Category': datum.label, 'Min': datum.minValue, 'Q1': datum.q1Value, 'Median': datum.medianValue, 'P75': datum.p75Value, 'Max': datum.maxValue}";
  }
}
