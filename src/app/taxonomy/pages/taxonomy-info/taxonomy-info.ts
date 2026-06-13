import { computed, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { ChangeDetectionStrategy, Component, inject, input, numberAttribute } from '@angular/core';
import {
  Taxonomy,
  TaxonomyG4AssemblySummary,
  TaxonomyG4DensityDistribution,
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
import { formatCompactCount, formatGenomeLength } from '../../../genome/utils/overview-format';

import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AssemblyListComponent } from './genome-list/genome-list.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterLink } from '@angular/router';

interface PositionCategoryView extends G4PositionCategory {
  displayLabel: string;
  ratioLabel: string;
  width: string;
}

interface DensityDistributionRow {
  motifType: G4Type;
  label: string;
  distribution: TaxonomyG4DensityDistribution;
}

const DEFAULT_FLANK_WINDOW: G4FlankWindow = 1000;
const DENSITY_FORMATTER = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 2,
  minimumFractionDigits: 0,
});
const PERCENT_FORMATTER = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 1,
  minimumFractionDigits: 0,
  style: 'percent',
});
const MOTIF_LABELS: Record<G4Type, string> = {
  g4: 'G4',
  'i-motif': 'i-motif',
};

function isG4Type(value: unknown): value is G4Type {
  return value === 'g4' || value === 'i-motif';
}

function isG4FlankWindow(value: unknown): value is G4FlankWindow {
  return G4_FLANK_WINDOW_OPTIONS.some((option) => option.value === value);
}

function densityForAssembly(assembly: TaxonomyG4AssemblySummary, g4Type: G4Type): number | null {
  return g4Type === 'g4' ? assembly.g4_density_per_mb : assembly.i_motif_density_per_mb;
}

function descendingNullableDensity(
  left: TaxonomyG4AssemblySummary,
  right: TaxonomyG4AssemblySummary,
  g4Type: G4Type,
): number {
  return (densityForAssembly(right, g4Type) ?? -1) - (densityForAssembly(left, g4Type) ?? -1);
}

@Component({
  selector: 'app-taxonomy-info',
  imports: [
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
      overlap: false,
    }),
    stream: ({ params }) => this.taxonomyService.getTaxonomyG4Summary(params),
  });
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
  readonly comparisonModeLabel = computed(() =>
    this.summary()?.comparison_mode === 'multi_assembly'
      ? 'Multi-assembly comparison'
      : 'Single-assembly landscape',
  );
  readonly assemblyContextText = computed(() => {
    const count = this.assemblyCount();
    if (count === 0) {
      return 'No assemblies are currently available for this taxon.';
    }
    if (count === 1) {
      return '1 assembly available for this taxon. Values describe this assembly only; no within-species variation is inferred.';
    }
    return `${count} assemblies available for this taxon. Density per Mb is used for assembly-level comparison.`;
  });
  readonly primaryAssembly = computed<TaxonomyG4AssemblySummary | null>(() => {
    const summary = this.summary();
    return summary?.assembly_count === 1 ? (summary.assembly_summaries[0] ?? null) : null;
  });
  readonly selectedMotifLabel = computed(() => MOTIF_LABELS[this.g4Type()]);
  readonly selectedMotifSummary = computed(() => this.summary()?.motifs[this.g4Type()]);
  readonly selectedDensityDistribution = computed(
    () => this.summary()?.density_distributions[this.g4Type()],
  );
  readonly densityDistributionRows = computed<readonly DensityDistributionRow[]>(() => {
    const summary = this.summary();
    if (!summary || summary.comparison_mode !== 'multi_assembly') {
      return [];
    }
    return [
      { motifType: 'g4', label: 'G4 density', distribution: summary.density_distributions.g4 },
      {
        motifType: 'i-motif',
        label: 'i-motif density',
        distribution: summary.density_distributions['i-motif'],
      },
    ];
  });
  readonly positionCategoryRows = computed<readonly PositionCategoryView[]>(() => {
    const categories = this.summary()?.position_distribution.categories ?? [];
    return categories.map((category) => {
      const ratio = Number.isFinite(category.ratio) ? category.ratio : 0;
      return {
        ...category,
        displayLabel: category.display_label ?? category.label,
        ratioLabel: PERCENT_FORMATTER.format(ratio),
        width: `${Math.max(ratio * 100, category.count > 0 ? 2 : 0)}%`,
      };
    });
  });
  readonly geneBiotypeRows = computed(
    () =>
      this.summary()?.position_distribution.gene_biotype_breakdown
        .filter((row) => row.total_count > 0)
        .slice(0, 8) ?? [],
  );
  readonly topDensityAssemblies = computed<readonly TaxonomyG4AssemblySummary[]>(() => {
    const summary = this.summary();
    if (!summary || summary.comparison_mode !== 'multi_assembly') {
      return [];
    }
    return summary.assembly_summaries
      .slice()
      .sort((left, right) => descendingNullableDensity(left, right, this.g4Type()))
      .slice(0, 5);
  });
  readonly lowDensityAssemblies = computed<readonly TaxonomyG4AssemblySummary[]>(() => {
    const summary = this.summary();
    if (!summary || summary.comparison_mode !== 'multi_assembly') {
      return [];
    }
    return summary.assembly_summaries
      .slice()
      .sort((left, right) => descendingNullableDensity(right, left, this.g4Type()))
      .slice(0, 5);
  });
  readonly summaryErrorMessage = computed(() =>
    this.summaryResource.snapshot().status === 'error'
      ? 'Taxonomy-level G4 statistics are unavailable.'
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

  formatCount(value: number | undefined): string {
    return formatCompactCount(value ?? 0);
  }

  formatGenomeLength(value: number | undefined): string {
    return value === undefined ? 'N/A' : formatGenomeLength(value);
  }

  formatDensity(value: number | null | undefined): string {
    return value === null || value === undefined ? 'N/A' : `${DENSITY_FORMATTER.format(value)}/Mb`;
  }

  formatRatio(value: number | null | undefined): string {
    return value === null || value === undefined ? 'N/A' : `${DENSITY_FORMATTER.format(value)}x`;
  }

  densityForAssembly(assembly: TaxonomyG4AssemblySummary): string {
    return this.formatDensity(densityForAssembly(assembly, this.g4Type()));
  }
}
