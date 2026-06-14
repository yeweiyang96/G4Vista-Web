import { computed, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { ChangeDetectionStrategy, Component, inject, input, numberAttribute } from '@angular/core';
import type { ChartData, ChartOptions, Plugin, TooltipItem } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { BaseChartDirective } from 'ng2-charts';
import { of } from 'rxjs';
import {
  Taxonomy,
  TaxonomyG4Summary,
  TaxonomyG4SummaryRequest,
  TaxonomyService,
} from '../../services/taxonomy.service';
import {
  G4FlankWindow,
  G4PositionCategory,
  G4_FLANK_WINDOW_OPTIONS,
  G4Type,
} from '../../../genome/services/g4.service';
import { formatCompactCount } from '../../../genome/utils/overview-format';

import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AssemblyListComponent } from './genome-list/genome-list.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterLink } from '@angular/router';
import { canonicalGeneBiotype, geneBiotypeLabel } from '../../../shared/gene-biotype';

interface PositionCategoryView extends G4PositionCategory {
  displayLabel: string;
  ratioLabel: string;
  color: string;
}

interface PublicPositionCategoryConfig {
  key: 'gene_inside' | 'gene_upstream' | 'gene_downstream' | 'other';
  label: string;
  color: string;
  description: string;
}

interface GeneBiotypeTableRow {
  bioType: string;
  displayLabel: string;
  insideCount: number;
  upstreamCount: number;
  downstreamCount: number;
  totalCount: number;
}

const DEFAULT_FLANK_WINDOW: G4FlankWindow = 1000;
const PERCENT_FORMATTER = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 1,
  minimumFractionDigits: 0,
  style: 'percent',
});
const MOTIF_LABELS: Record<G4Type, string> = {
  g4: 'G4',
  'i-motif': 'i-motif',
};
const PUBLIC_POSITION_CATEGORIES: readonly PublicPositionCategoryConfig[] = [
  {
    key: 'gene_inside',
    label: 'In genes',
    color: '#07879a',
    description: 'Predicted motif sites that fall within annotated gene intervals.',
  },
  {
    key: 'gene_upstream',
    label: 'Upstream flank',
    color: '#8ec8ef',
    description: 'Predicted motif sites in the selected upstream gene flank.',
  },
  {
    key: 'gene_downstream',
    label: 'Downstream flank',
    color: '#8ab84e',
    description: 'Predicted motif sites in the selected downstream gene flank.',
  },
  {
    key: 'other',
    label: 'Other',
    color: '#a8adb7',
    description: 'Predicted motif sites outside genes and selected gene flanks.',
  },
];

function isG4Type(value: unknown): value is G4Type {
  return value === 'g4' || value === 'i-motif';
}

function isG4FlankWindow(value: unknown): value is G4FlankWindow {
  return G4_FLANK_WINDOW_OPTIONS.some((option) => option.value === value);
}

function categoryCount(categories: readonly G4PositionCategory[], key: string): number {
  return categories.find((category) => category.key === key)?.count ?? 0;
}

function publicPositionCategoryCount(
  category: PublicPositionCategoryConfig,
  categories: readonly G4PositionCategory[],
  apiOtherCount: number,
  legacyOtherCount: number,
  hasApiOther: boolean,
): number {
  if (category.key !== 'other') {
    return categoryCount(categories, category.key);
  }
  return hasApiOther ? apiOtherCount : legacyOtherCount;
}

@Component({
  selector: 'app-taxonomy-info',
  imports: [
    BaseChartDirective,
    MatButtonModule,
    MatButtonToggleModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatSelectModule,
    MatTooltipModule,
    AssemblyListComponent,
    RouterLink,
  ],
  templateUrl: './taxonomy-info.html',
  styleUrl: './taxonomy-info.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaxonomyInfoComponent {
  readonly taxonId = input.required<number, string>({ transform: numberAttribute });
  readonly g4Type = signal<G4Type>('g4');
  readonly flankWindow = signal<G4FlankWindow>(DEFAULT_FLANK_WINDOW);
  readonly positionContextTaxonId = signal<number | null>(null);
  readonly flankWindowOptions = G4_FLANK_WINDOW_OPTIONS;
  readonly taxonomyResource = rxResource<Taxonomy, number>({
    params: () => this.taxonId(),
    stream: ({ params }) => this.taxonomyService.getTaxonomyData(params),
  });
  readonly taxonomy = computed<Taxonomy | undefined>(() => {
    const current = this.taxonomyResource.value();
    return current?.taxon_id === this.taxonId() ? current : undefined;
  });
  readonly summaryResource = rxResource<TaxonomyG4Summary | null, TaxonomyG4SummaryRequest | null>({
    params: () => {
      if (this.positionContextTaxonId() !== this.taxonId()) {
        return null;
      }

      return {
        taxonId: this.taxonId(),
        g4Type: this.g4Type(),
        flankWindow: this.flankWindow(),
        tetrads: [],
        minScore: null,
        maxScore: null,
        overlap: false,
      };
    },
    stream: ({ params }) => {
      if (!params) {
        return of(null);
      }

      return this.taxonomyService.getTaxonomyG4Summary(params);
    },
    defaultValue: null,
  });
  readonly positionPiePlugins: Plugin<'pie'>[] = [ChartDataLabels as Plugin<'pie'>];
  readonly positionPieOptions: ChartOptions<'pie'> = {
    responsive: true,
    maintainAspectRatio: false,
    elements: {
      arc: {
        borderAlign: 'inner',
        borderColor: 'rgba(255, 255, 255, 0.9)',
        borderWidth: 1,
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        filter: (context) => Number(context.parsed) > 0,
        callbacks: {
          label: (context) => this.positionPieTooltipLabel(context),
        },
      },
      datalabels: {
        align: 'center',
        anchor: 'center',
        clamp: true,
        color: '#ffffff',
        display: (context) => {
          const value = Number(context.dataset.data[context.dataIndex] ?? 0);
          return value > 0 ? 'auto' : false;
        },
        font: {
          size: 11,
          weight: 'bold',
        },
        formatter: (value) => this.formatCount(Number(value)),
        textStrokeColor: 'rgba(0, 0, 0, 0.42)',
        textStrokeWidth: 2,
      },
    },
  };
  readonly summary = computed<TaxonomyG4Summary | undefined>(() => {
    const current = this.summaryResource.value();
    return current?.taxon_id === this.taxonId() ? current : undefined;
  });
  readonly assemblyCount = computed<number>(
    () => this.summary()?.assembly_count ?? this.taxonomy()?.assemblies?.length ?? 0,
  );
  readonly assemblyRows = computed(() => {
    const summaryAssemblies = this.summary()?.assembly_summaries ?? [];
    return summaryAssemblies.length ? summaryAssemblies : (this.taxonomy()?.assemblies ?? []);
  });
  readonly selectedMotifLabel = computed(() => MOTIF_LABELS[this.g4Type()]);
  readonly flankWindowLabel = computed(
    () =>
      this.flankWindowOptions.find((option) => option.value === this.flankWindow())?.label ??
      `${this.flankWindow()} bp`,
  );
  readonly isPositionContextRequested = computed(
    () => this.positionContextTaxonId() === this.taxonId(),
  );
  readonly positionCategoryRows = computed<readonly PositionCategoryView[]>(() => {
    const distribution = this.summary()?.position_distribution;
    const categories = distribution?.categories ?? [];
    const geneContextTotal = PUBLIC_POSITION_CATEGORIES.reduce(
      (sum, category) =>
        category.key === 'other' ? sum : sum + categoryCount(categories, category.key),
      0,
    );
    const apiOtherCount = categoryCount(categories, 'other');
    const hasApiOther = categories.some((category) => category.key === 'other');
    const total = Math.max(distribution?.total_count ?? 0, geneContextTotal + apiOtherCount);
    const legacyOtherCount = Math.max(0, total - geneContextTotal);

    return PUBLIC_POSITION_CATEGORIES.map((category) => {
      const count = publicPositionCategoryCount(
        category,
        categories,
        apiOtherCount,
        legacyOtherCount,
        hasApiOther,
      );
      const ratio = total ? count / total : 0;
      return {
        key: category.key,
        label: category.label,
        count,
        ratio,
        precedence_rank: 0,
        description: category.description,
        displayLabel: category.label,
        ratioLabel: PERCENT_FORMATTER.format(ratio),
        color: category.color,
      };
    });
  });
  readonly positionContextTotal = computed(() =>
    this.positionCategoryRows().reduce((sum, category) => sum + category.count, 0),
  );
  readonly positionPieData = computed<ChartData<'pie', number[], string>>(() => {
    const rows = this.positionCategoryRows().filter((category) => category.count > 0);
    return {
      labels: rows.map((category) => category.displayLabel),
      datasets: [
        {
          label: this.selectedMotifLabel(),
          data: rows.map((category) => category.count),
          backgroundColor: rows.map((category) => category.color),
          hoverBackgroundColor: rows.map((category) => category.color),
          hoverOffset: 2,
        },
      ],
    };
  });
  readonly geneBiotypeRows = computed<readonly GeneBiotypeTableRow[]>(() =>
    (this.summary()?.position_distribution.gene_biotype_breakdown ?? [])
      .map((row) => {
        const insideCount = categoryCount(row.categories, 'gene_inside');
        const upstreamCount = categoryCount(row.categories, 'gene_upstream');
        const downstreamCount = categoryCount(row.categories, 'gene_downstream');
        return {
          bioType: canonicalGeneBiotype(row.bio_type),
          displayLabel: geneBiotypeLabel(row.bio_type),
          insideCount,
          upstreamCount,
          downstreamCount,
          totalCount: insideCount + upstreamCount + downstreamCount,
        };
      })
      .filter((row) => row.totalCount > 0)
      .sort((left, right) => right.totalCount - left.totalCount),
  );
  readonly positionContextErrorMessage = computed(() =>
    this.summaryResource.snapshot().status === 'error'
      ? 'Taxon-level position context is unavailable.'
      : '',
  );

  private readonly taxonomyService = inject(TaxonomyService);

  setG4Type(value: unknown): void {
    if (!isG4Type(value)) {
      return;
    }
    this.g4Type.set(value);
  }

  setFlankWindow(value: unknown): void {
    if (!isG4FlankWindow(value)) {
      return;
    }
    this.flankWindow.set(value);
  }

  loadPositionContext(): void {
    this.positionContextTaxonId.set(this.taxonId());
  }

  formatCount(value: number | undefined): string {
    return formatCompactCount(value ?? 0);
  }

  private positionPieTooltipLabel(context: TooltipItem<'pie'>): string {
    const label = context.label || 'Context';
    const value = Number(context.parsed);
    const total = this.positionContextTotal();
    const ratio = total ? value / total : 0;
    return `${label}: ${this.formatCount(value)} (${PERCENT_FORMATTER.format(ratio)})`;
  }
}
