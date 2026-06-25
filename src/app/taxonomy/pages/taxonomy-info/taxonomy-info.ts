import { computed, effect, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { ChangeDetectionStrategy, Component, inject, input, numberAttribute } from '@angular/core';
import {
  ArcElement,
  Legend,
  PieController,
  Tooltip,
  type ChartData,
  type ChartOptions,
  type Plugin,
  type TooltipItem,
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { BaseChartDirective, provideCharts } from 'ng2-charts';
import {
  Taxonomy,
  TaxonomyG4Summary,
  TaxonomyG4SummaryRequest,
  TaxonomyNode,
  TaxonomyService,
} from '../../services/taxonomy.service';
import {
  G4FlankWindow,
  G4PositionCategory,
  G4_FLANK_WINDOW_OPTIONS,
  G4Type,
} from '../../../genome/services/g4.service';
import { formatCompactCount, formatIntegerCount } from '../../../genome/utils/overview-format';

import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
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

interface GeneBiotypeTablePage {
  pageIndex: number;
  pageSize: number;
  rows: readonly GeneBiotypeTableRow[];
}

const DEFAULT_FLANK_WINDOW: G4FlankWindow = 1000;
const DEFAULT_GENE_BIOTYPE_PAGE_SIZE = 10;
const GENE_BIOTYPE_PAGE_SIZE_OPTIONS: readonly number[] = [10, 25, 50];
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
    description:
      'Predicted G4 or i-motif-forming sequences that fall within annotated gene intervals.',
  },
  {
    key: 'gene_upstream',
    label: 'Upstream flank',
    color: '#8ec8ef',
    description: 'Predicted G4 or i-motif-forming sequences in the selected upstream gene flank.',
  },
  {
    key: 'gene_downstream',
    label: 'Downstream flank',
    color: '#8ab84e',
    description: 'Predicted G4 or i-motif-forming sequences in the selected downstream gene flank.',
  },
  {
    key: 'other',
    label: 'Other',
    color: '#a8adb7',
    description:
      'Predicted G4 or i-motif-forming sequences outside genes and selected gene flanks.',
  },
];

function isG4Type(value: unknown): value is G4Type {
  return value === 'g4' || value === 'i-motif';
}

function isG4FlankWindow(value: unknown): value is G4FlankWindow {
  return G4_FLANK_WINDOW_OPTIONS.some((option) => option.value === value);
}

function defaultGeneFlankWindowFromLineage(
  lineage: readonly TaxonomyNode[] | undefined,
): G4FlankWindow | null {
  const superkingdom = lineage?.find((node) => node.rank === 'superkingdom');
  if (!superkingdom) {
    return null;
  }
  return superkingdom.name === 'Bacteria' || superkingdom.name === 'Archaea' ? 100 : 1000;
}

function categoryCount(categories: readonly G4PositionCategory[], key: string): number {
  return categories.find((category) => category.key === key)?.count ?? 0;
}

function boundedGeneBiotypePageIndex(
  rowCount: number,
  pageSize: number,
  pageIndex: number,
): number {
  const lastPageIndex = Math.max(0, Math.ceil(rowCount / pageSize) - 1);
  return Math.min(pageIndex, lastPageIndex);
}

function geneBiotypeTablePage(
  rows: readonly GeneBiotypeTableRow[],
  pageSize: number,
  pageIndex: number,
): GeneBiotypeTablePage {
  const boundedPageIndex = boundedGeneBiotypePageIndex(rows.length, pageSize, pageIndex);
  const start = boundedPageIndex * pageSize;
  return {
    pageIndex: boundedPageIndex,
    pageSize,
    rows: rows.slice(start, start + pageSize),
  };
}

@Component({
  selector: 'app-taxonomy-info',
  imports: [
    BaseChartDirective,
    MatButtonToggleModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatPaginatorModule,
    MatSelectModule,
    MatTooltipModule,
    AssemblyListComponent,
    RouterLink,
  ],
  providers: [
    provideCharts({
      registerables: [PieController, ArcElement, Tooltip, Legend],
    }),
  ],
  templateUrl: './taxonomy-info.html',
  styleUrl: './taxonomy-info.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaxonomyInfoComponent {
  readonly taxonId = input.required<number, string>({ transform: numberAttribute });
  readonly g4Type = signal<G4Type>('g4');
  readonly flankWindow = signal<G4FlankWindow>(DEFAULT_FLANK_WINDOW);
  readonly geneBiotypePageIndex = signal(0);
  readonly geneBiotypePageSize = signal(DEFAULT_GENE_BIOTYPE_PAGE_SIZE);
  readonly geneBiotypePageSizeOptions = GENE_BIOTYPE_PAGE_SIZE_OPTIONS;
  readonly flankWindowOptions = G4_FLANK_WINDOW_OPTIONS;
  readonly taxonomyResource = rxResource<Taxonomy, number>({
    params: () => this.taxonId(),
    stream: ({ params }) => this.taxonomyService.getTaxonomyData(params),
  });
  readonly taxonomy = computed<Taxonomy | undefined>(() => {
    const current = this.taxonomyResource.value();
    return current?.taxon_id === this.taxonId() ? current : undefined;
  });
  readonly summaryResource = rxResource<TaxonomyG4Summary, TaxonomyG4SummaryRequest>({
    params: () => ({
      taxonId: this.taxonId(),
      g4Type: this.g4Type(),
      flankWindow: this.flankWindow(),
      tetrads: [],
      minScore: null,
      maxScore: null,
    }),
    stream: ({ params }) => this.taxonomyService.getTaxonomyG4Summary(params),
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
        formatter: (value) => this.formatChartCount(Number(value)),
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
  readonly positionCategoryRows = computed<readonly PositionCategoryView[]>(() => {
    const distribution = this.summary()?.position_distribution;
    const categories = distribution?.categories ?? [];

    return PUBLIC_POSITION_CATEGORIES.map((category) => {
      const apiCategory = categories.find((candidate) => candidate.key === category.key);
      const ratio = apiCategory?.ratio ?? 0;
      return {
        key: category.key,
        label: apiCategory?.label ?? category.label,
        count: apiCategory?.count ?? 0,
        ratio,
        precedence_rank: apiCategory?.precedence_rank ?? 0,
        description: apiCategory?.description ?? category.description,
        displayLabel: apiCategory?.display_label ?? apiCategory?.label ?? category.label,
        ratioLabel: PERCENT_FORMATTER.format(ratio),
        color: category.color,
      };
    });
  });
  readonly positionContextTotal = computed(
    () => this.summary()?.position_distribution.total_count ?? 0,
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
      .sort(
        (left, right) =>
          right.totalCount - left.totalCount || left.displayLabel.localeCompare(right.displayLabel),
      ),
  );
  readonly geneBiotypePage = computed<GeneBiotypeTablePage>(() =>
    geneBiotypeTablePage(
      this.geneBiotypeRows(),
      this.geneBiotypePageSize(),
      this.geneBiotypePageIndex(),
    ),
  );
  readonly positionContextErrorMessage = computed(() =>
    this.summaryResource.snapshot().status === 'error'
      ? 'Taxon-level position context is unavailable.'
      : '',
  );

  private readonly taxonomyService = inject(TaxonomyService);
  private lastDefaultGeneFlankTaxonId: number | null = null;

  constructor() {
    effect(() => {
      const taxonomy = this.taxonomy();
      if (!taxonomy) {
        return;
      }
      if (this.lastDefaultGeneFlankTaxonId === taxonomy.taxon_id) {
        return;
      }

      const defaultFlankWindow = defaultGeneFlankWindowFromLineage(taxonomy.lineage);
      if (defaultFlankWindow === null) {
        return;
      }

      this.lastDefaultGeneFlankTaxonId = taxonomy.taxon_id;
      this.flankWindow.set(defaultFlankWindow);
    });
  }

  setG4Type(value: unknown): void {
    if (!isG4Type(value)) {
      return;
    }
    this.g4Type.set(value);
    this.geneBiotypePageIndex.set(0);
  }

  setFlankWindow(value: unknown): void {
    if (!isG4FlankWindow(value)) {
      return;
    }
    this.flankWindow.set(value);
    this.geneBiotypePageIndex.set(0);
  }

  changeGeneBiotypePage(event: PageEvent): void {
    this.geneBiotypePageIndex.set(event.pageIndex);
    this.geneBiotypePageSize.set(event.pageSize);
  }

  formatChartCount(value: number | undefined): string {
    return formatCompactCount(value ?? 0);
  }

  formatTableCount(value: number | undefined): string {
    return formatIntegerCount(value ?? 0);
  }

  private positionPieTooltipLabel(context: TooltipItem<'pie'>): string {
    const label = context.label || 'Context';
    const value = Number(context.parsed);
    const ratio = this.positionPieDataRows()[context.dataIndex]?.ratio ?? 0;
    return `${label}: ${this.formatChartCount(value)} (${PERCENT_FORMATTER.format(ratio)})`;
  }

  private positionPieDataRows(): readonly PositionCategoryView[] {
    return this.positionCategoryRows().filter((category) => category.count > 0);
  }
}
