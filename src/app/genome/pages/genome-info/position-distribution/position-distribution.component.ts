import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  G4FlankWindow,
  G4FeatureBreakdownItem,
  G4_FLANK_WINDOW_OPTIONS,
  G4PositionCategory,
  G4PositionDistributionResponse,
  G4Type,
} from '../../../services/g4.service';

interface PositionCategoryView extends G4PositionCategory {
  color: string;
  displayLabel: string;
  displayDescription: string;
}

interface PositionSummaryMetric {
  key: string;
  label: string;
  value: string;
  detail: string;
}

interface PositionDistributionFilterModel {
  selectedTetrads: number[];
  minGscore: string;
  maxGscore: string;
}

const POSITION_CATEGORY_COLORS: Record<string, string> = {
  gene_inside: '#2a6f68',
  gene_upstream: '#b75f2a',
  gene_downstream: '#6f5ba7',
  other_root_non_gene_feature: '#b33f62',
  non_feature: '#58606f',
};
const FALLBACK_POSITION_CATEGORY_COLOR = '#5f6368';
const COUNT_FORMATTER = new Intl.NumberFormat('en-US');
const PERCENT_FORMATTER = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 1,
  minimumFractionDigits: 0,
  style: 'percent',
});

function motifTypeLabel(g4Type: G4Type): string {
  return g4Type === 'revcomp' ? 'i-motif sequence sites' : 'G-quadruplex sequence sites';
}

function categoryDisplayText(
  category: G4PositionCategory,
  flankWindowLabel: string,
): Pick<PositionCategoryView, 'displayLabel' | 'displayDescription'> {
  switch (category.key) {
    case 'gene_inside':
      return {
        displayLabel: 'Inside annotated genes',
        displayDescription: 'Predicted motif sites that fall within annotated gene intervals.',
      };
    case 'gene_upstream':
      return {
        displayLabel: `Within ${flankWindowLabel} upstream of genes`,
        displayDescription: 'Predicted motif sites in the upstream gene-neighbor window.',
      };
    case 'gene_downstream':
      return {
        displayLabel: `Within ${flankWindowLabel} downstream of genes`,
        displayDescription: 'Predicted motif sites in the downstream gene-neighbor window.',
      };
    case 'other_root_non_gene_feature':
      return {
        displayLabel: 'Inside root non-gene features',
        displayDescription:
          'Predicted motif sites assigned to parentless non-gene annotations such as promoters or repeat regions.',
      };
    case 'non_feature':
      return {
        displayLabel: 'No gene or root-feature assignment',
        displayDescription:
          'Predicted motif sites outside genes, gene-neighbor windows, and root non-gene features.',
      };
    default:
      return {
        displayLabel: category.label,
        displayDescription: category.description,
      };
  }
}

function categoryCount(categories: readonly G4PositionCategory[], key: string): number {
  return categories.find((category) => category.key === key)?.count ?? 0;
}

function formatCount(value: number): string {
  return COUNT_FORMATTER.format(value);
}

function formatRatio(value: number): string {
  return PERCENT_FORMATTER.format(value);
}

@Component({
  selector: 'app-position-distribution',
  imports: [
    MatButtonModule,
    MatButtonToggleModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatTooltipModule,
  ],
  templateUrl: './position-distribution.component.html',
  styleUrl: './position-distribution.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PositionDistributionComponent {
  readonly distribution = input.required<G4PositionDistributionResponse>();
  readonly isLoading = input(false);
  readonly errorMessage = input('');
  readonly flankWindow = input.required<G4FlankWindow>();
  readonly flankWindowLabel = input.required<string>();
  readonly g4Type = input.required<G4Type>();
  readonly tetradOptions = input.required<readonly number[]>();
  readonly filterSelectedTetrads = input<number[]>([]);
  readonly filterMinGscore = input('');
  readonly filterMaxGscore = input('');
  readonly g4TypeChange = output<G4Type>();
  readonly flankWindowChange = output<G4FlankWindow>();
  readonly filterModelChange = output<PositionDistributionFilterModel>();
  readonly applyFilters = output<void>();
  readonly resetFilters = output<void>();
  readonly flankWindowOptions = G4_FLANK_WINDOW_OPTIONS;
  readonly formatCount = formatCount;
  readonly formatRatio = formatRatio;
  readonly motifTypeLabel = computed(() => motifTypeLabel(this.g4Type()));

  readonly categoryRows = computed<readonly PositionCategoryView[]>(() =>
    this.distribution().categories.map((category) => {
      const displayText = categoryDisplayText(category, this.flankWindowLabel());
      return {
        ...category,
        ...displayText,
        color: POSITION_CATEGORY_COLORS[category.key] ?? FALLBACK_POSITION_CATEGORY_COLOR,
      };
    }),
  );
  readonly featureBreakdown = computed<readonly G4FeatureBreakdownItem[]>(() =>
    this.distribution().feature_breakdown.slice(0, 12),
  );
  readonly gradient = computed(() => {
    const total = this.distribution().total_count;
    if (!total) {
      return 'conic-gradient(var(--mat-sys-surface-container-high) 0deg 360deg)';
    }

    let currentAngle = 0;
    const segments: string[] = [];
    for (const category of this.categoryRows()) {
      if (category.count <= 0) {
        continue;
      }
      const nextAngle = currentAngle + (category.count / total) * 360;
      segments.push(`${category.color} ${currentAngle}deg ${nextAngle}deg`);
      currentAngle = nextAngle;
    }

    return segments.length
      ? `conic-gradient(${segments.join(', ')})`
      : 'conic-gradient(var(--mat-sys-surface-container-high) 0deg 360deg)';
  });
  readonly summaryMetrics = computed<readonly PositionSummaryMetric[]>(() => {
    const distribution = this.distribution();
    const categories = distribution.categories;
    const total = distribution.total_count;
    const geneInside = categoryCount(categories, 'gene_inside');
    const upstream = categoryCount(categories, 'gene_upstream');
    const downstream = categoryCount(categories, 'gene_downstream');
    const otherFeature = categoryCount(categories, 'other_root_non_gene_feature');
    const nonFeature = categoryCount(categories, 'non_feature');
    const regulatoryNeighborhood = upstream + downstream;

    return [
      {
        key: 'total',
        label: 'Predicted motif sites',
        value: formatCount(total),
        detail: 'Whole genome, all accessions',
      },
      {
        key: 'gene',
        label: 'Inside annotated genes',
        value: formatRatio(total ? geneInside / total : 0),
        detail: `${formatCount(geneInside)} motif sites`,
      },
      {
        key: 'regulatory',
        label: `Within ${this.flankWindowLabel()} of genes`,
        value: formatRatio(total ? regulatoryNeighborhood / total : 0),
        detail: `${formatCount(regulatoryNeighborhood)} upstream or downstream sites`,
      },
      {
        key: 'non-feature',
        label: 'Outside annotated features',
        value: formatRatio(total ? nonFeature / total : 0),
        detail: `${formatCount(nonFeature)} unassigned; ${formatCount(otherFeature)} in root non-gene features`,
      },
    ];
  });

  changeG4Type(value: G4Type): void {
    this.g4TypeChange.emit(value);
  }

  changeFlankWindow(value: G4FlankWindow): void {
    this.flankWindowChange.emit(value);
  }

  onMinGscoreInput(event: Event): void {
    this.changeMinGscore(this.readInputValue(event));
  }

  onMaxGscoreInput(event: Event): void {
    this.changeMaxGscore(this.readInputValue(event));
  }

  changeSelectedTetrads(value: number[] | null): void {
    this.filterModelChange.emit({
      selectedTetrads: value ?? [],
      minGscore: this.filterMinGscore(),
      maxGscore: this.filterMaxGscore(),
    });
  }

  changeMinGscore(rawValue: string): void {
    this.filterModelChange.emit({
      selectedTetrads: this.filterSelectedTetrads(),
      minGscore: rawValue,
      maxGscore: this.filterMaxGscore(),
    });
  }

  changeMaxGscore(rawValue: string): void {
    this.filterModelChange.emit({
      selectedTetrads: this.filterSelectedTetrads(),
      minGscore: this.filterMinGscore(),
      maxGscore: rawValue,
    });
  }

  onApplyFilters(event?: Event): void {
    event?.preventDefault();
    this.applyFilters.emit();
  }

  onResetFilters(): void {
    this.resetFilters.emit();
  }

  private readInputValue(event: Event): string {
    return (event.target as HTMLInputElement | null)?.value ?? '';
  }
}
