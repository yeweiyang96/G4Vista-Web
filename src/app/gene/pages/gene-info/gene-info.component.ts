import { ChangeDetectionStrategy, Component, computed, effect, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { of } from 'rxjs';
import { geneBiotypeLabel } from '../../../shared/gene-biotype';
import { UiThemeService } from '../../../theme/ui-theme.service';
import {
  GenomeViewerConfigService,
  GenomeViewerStateService,
  JbrowseHostComponent,
} from '../../../genome/viewer';
import { GeneDetail, GeneQuadruplexRelation, GeneService } from '../../services/gene.service';

interface GeneRelationSummary {
  key: string;
  label: string;
  count: number;
}

interface GeneMotifSummary {
  key: string;
  icon: string;
  label: string;
  value: number;
  description: string;
}

interface GeneBrowserRegion {
  seqid: string;
  start: number;
  end: number;
  location: string;
  label: string;
  lengthLabel: string;
}

interface GeneRelationDetailRow {
  id: string;
  seqid: string;
  start: number;
  end: number;
  typeLabel: string;
  location: string;
  categoryLabel: string;
  distanceLabel: string;
  overlapLabel: string;
  modeLabel: string;
  biotypeLabel: string;
}

const RELATION_CATEGORY_LABELS: Readonly<Record<string, string>> = {
  gene_inside: 'Inside gene',
  gene_upstream: 'Upstream of gene',
  gene_downstream: 'Downstream of gene',
};

const GENE_BROWSER_FLANK_BP = 1000;
const RELATION_BROWSER_FLANK_BP = 250;

function relationCategoryLabel(category: string): string {
  return RELATION_CATEGORY_LABELS[category] ?? category;
}

function formatInteger(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

function formatBasePairLength(value: number): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(2)} Mb`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)} kb`;
  }
  return `${formatInteger(value)} bp`;
}

function formatBasePairRange(start: number, end: number): string {
  return `${formatInteger(start)}..${formatInteger(end)}`;
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function formatQuadruplexType(value: string): string {
  return value === 'i-motif' ? 'i-motif' : 'G4';
}

function formatRelationMode(value: string): string {
  return value
    .split('_')
    .filter((part) => part.length > 0)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function formatRelationDistance(relation: GeneQuadruplexRelation): string {
  return relation.distance_bp === 0 ? '0 bp' : formatBasePairLength(relation.distance_bp);
}

function formatRelationOverlap(relation: GeneQuadruplexRelation): string {
  if (relation.overlap_bp === 0) {
    return '0 bp';
  }
  return `${formatBasePairLength(relation.overlap_bp)} (${formatPercent(relation.overlap_fraction)})`;
}

function createBrowserLocation(seqid: string, start: number, end: number): string {
  return `${seqid}:${start}..${end}`;
}

function createBrowserRegion(seqid: string, start: number, end: number): GeneBrowserRegion {
  const normalizedStart = Math.max(1, Math.min(start, end));
  const normalizedEnd = Math.max(normalizedStart, Math.max(start, end));
  const length = normalizedEnd - normalizedStart + 1;

  return {
    seqid,
    start: normalizedStart,
    end: normalizedEnd,
    location: createBrowserLocation(seqid, normalizedStart, normalizedEnd),
    label: `${seqid}:${formatBasePairRange(normalizedStart, normalizedEnd)}`,
    lengthLabel: formatBasePairLength(length),
  };
}

function createRelationDetailRow(relation: GeneQuadruplexRelation): GeneRelationDetailRow {
  return {
    id: `${relation.quadruplex_sequence_id}:${relation.relation_category}:${relation.start}:${relation.end}`,
    seqid: relation.region_id,
    start: relation.start,
    end: relation.end,
    typeLabel: formatQuadruplexType(relation.quadruplex_type),
    location: `${relation.region_id}:${formatBasePairRange(relation.start, relation.end)}`,
    categoryLabel: relationCategoryLabel(relation.relation_category),
    distanceLabel: formatRelationDistance(relation),
    overlapLabel: formatRelationOverlap(relation),
    modeLabel: formatRelationMode(relation.relation_mode),
    biotypeLabel: geneBiotypeLabel(relation.gene_biotype),
  };
}

@Component({
  selector: 'app-gene-info',
  imports: [
    JbrowseHostComponent,
    MatButtonModule,
    MatChipsModule,
    MatIconModule,
    MatProgressSpinnerModule,
    RouterLink,
  ],
  templateUrl: './gene-info.component.html',
  styleUrl: './gene-info.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GeneInfoComponent {
  readonly assemblyAccession = input.required<string>();
  readonly dataBaseUrl = input.required<string>();
  readonly seqid = input.required<string>();
  readonly featureId = input.required<string>();
  readonly geneBiotypeLabel = geneBiotypeLabel;

  private readonly geneService = inject(GeneService);
  private readonly genomeViewerConfigService = inject(GenomeViewerConfigService);
  private readonly viewerState = inject(GenomeViewerStateService);
  private readonly uiThemeService = inject(UiThemeService);
  private lastBrowserNavigationKey: string | null = null;

  readonly geneResource = rxResource<
    GeneDetail | undefined,
    { assemblyAccession: string; regionId: string; featureId: string }
  >({
    params: () => ({
      assemblyAccession: this.assemblyAccession(),
      regionId: this.seqid(),
      featureId: this.featureId(),
    }),
    stream: ({ params }) =>
      params
        ? this.geneService.getGene(params.assemblyAccession, params.regionId, params.featureId)
        : of<GeneDetail | undefined>(undefined),
  });

  readonly geneDetail = computed<GeneDetail | undefined>(() => {
    const gene = this.geneResource.value();
    return gene?.feature_id === this.featureId() ? gene : undefined;
  });
  readonly motifSummaries = computed<GeneMotifSummary[]>(() => {
    const gene = this.geneDetail();
    if (!gene) {
      return [];
    }

    return [
      {
        key: 'g4',
        icon: 'line_axis',
        label: 'G4 sites',
        value: gene.counts.g4_count,
        description: 'Predicted G-quadruplex sequence sites linked to this feature.',
      },
      {
        key: 'i-motif',
        icon: 'ssid_chart',
        label: 'i-motif sites',
        value: gene.counts.i_motif_count,
        description: 'Predicted i-motif sequence sites linked to this feature.',
      },
      {
        key: 'quadruplex-sequence',
        icon: 'hub',
        label: 'Total motif sites',
        value: gene.counts.quadruplex_sequence_count,
        description: 'All linked quadruplex-forming sequence sites in the current gene context.',
      },
      {
        key: 'relation',
        icon: 'table_rows',
        label: 'Relation rows',
        value: gene.relations.length,
        description: 'Server-reported motif-to-feature relation records.',
      },
    ];
  });
  readonly relationSummaries = computed<GeneRelationSummary[]>(() => {
    const gene = this.geneDetail();
    if (!gene) {
      return [];
    }

    const countsByCategory = new Map<string, number>();
    for (const relation of gene.relations) {
      countsByCategory.set(
        relation.relation_category,
        (countsByCategory.get(relation.relation_category) ?? 0) + 1,
      );
    }
    return Array.from(countsByCategory.entries()).map(([key, count]) => ({
      key,
      label: relationCategoryLabel(key),
      count,
    }));
  });

  readonly relationDetailRows = computed<GeneRelationDetailRow[]>(() => {
    const gene = this.geneDetail();
    if (!gene) {
      return [];
    }

    return gene.relations
      .slice()
      .sort((left, right) => left.start - right.start || left.end - right.end)
      .map((relation) => createRelationDetailRow(relation));
  });
  readonly geneBrowserRegion = computed<GeneBrowserRegion | null>(() => {
    const gene = this.geneDetail();
    if (!gene || gene.start === null || gene.end === null) {
      return null;
    }

    const seqid = gene.region_id || this.seqid();
    return createBrowserRegion(
      seqid,
      gene.start - GENE_BROWSER_FLANK_BP,
      gene.end + GENE_BROWSER_FLANK_BP,
    );
  });
  readonly viewerConfig = computed(() =>
    this.genomeViewerConfigService.createViewerConfig({
      assemblyAccession: this.assemblyAccession(),
      dataBaseUrl: this.dataBaseUrl(),
      g4Type: 'g4',
      themeMode: this.uiThemeService.resolvedMode(),
    }),
  );
  readonly viewerRegion = this.viewerState.region;
  readonly navCommand = this.viewerState.navCommand;

  constructor() {
    effect(() => {
      const browserRegion = this.geneBrowserRegion();
      if (!browserRegion) {
        return;
      }

      const navigationKey = `${this.assemblyAccession()}::${browserRegion.location}`;
      if (navigationKey === this.lastBrowserNavigationKey) {
        return;
      }

      this.lastBrowserNavigationKey = navigationKey;
      this.viewerState.resetSession(this.assemblyAccession(), browserRegion.location);
      this.viewerState.requestNavToLocation(browserRegion.location);
    });
  }

  focusRelation(row: GeneRelationDetailRow): void {
    const browserRegion = createBrowserRegion(
      row.seqid,
      row.start - RELATION_BROWSER_FLANK_BP,
      row.end + RELATION_BROWSER_FLANK_BP,
    );
    this.viewerState.requestNavToLocation(browserRegion.location);
  }

  handleViewerRegionChange(region: string): void {
    if (region.trim().length === 0) {
      return;
    }
    this.viewerState.setRegion(region);
  }

  formatCount(value: number): string {
    return formatInteger(value);
  }
}
