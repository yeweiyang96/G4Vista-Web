import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  TemplateRef,
  ViewChild,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { Sort } from '@angular/material/sort';
import { MtxGridColumn, MtxGridModule } from '@ng-matero/extensions/grid';
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
  quadruplexType: string;
  relationCategory: string;
  distanceBp: number;
  overlapBp: number;
  overlapFraction: number;
  relationMode: string;
  motifLengthNt: number;
  score: number;
  typeLabel: string;
  location: string;
  categoryLabel: string;
  distanceLabel: string;
  motifLengthLabel: string;
  overlapLabel: string;
  modeLabel: string;
  biotypeLabel: string;
}

type RelationMotifType = 'g4' | 'i-motif';
type RelationCategory = 'gene_inside' | 'gene_upstream' | 'gene_downstream';
type RelationSortDirection = 'asc' | 'desc';
type RelationSortField =
  | 'typeLabel'
  | 'start'
  | 'categoryLabel'
  | 'distanceBp'
  | 'motifLengthNt'
  | 'score'
  | 'modeLabel'
  | 'biotypeLabel';

interface RelationFilterOption<T extends string> {
  readonly value: T;
  readonly label: string;
}

interface RelationDistanceFilter {
  readonly minDistanceBp: number | null;
  readonly maxDistanceBp: number | null;
  readonly errorMessage: string | null;
}

interface RelationSortState {
  readonly active: RelationSortField;
  readonly direction: RelationSortDirection;
}

const RELATION_CATEGORY_LABELS: Readonly<Record<string, string>> = {
  gene_inside: 'Inside gene',
  gene_upstream: 'Upstream of gene',
  gene_downstream: 'Downstream of gene',
};

const MOTIF_TYPE_OPTIONS: readonly RelationFilterOption<RelationMotifType>[] = [
  { value: 'g4', label: 'G4' },
  { value: 'i-motif', label: 'i-motif' },
];
const RELATION_CATEGORY_OPTIONS: readonly RelationFilterOption<RelationCategory>[] = [
  { value: 'gene_inside', label: 'Inside gene' },
  { value: 'gene_upstream', label: 'Upstream of gene' },
  { value: 'gene_downstream', label: 'Downstream of gene' },
];
const ALL_MOTIF_TYPES: readonly RelationMotifType[] = ['g4', 'i-motif'];
const ALL_RELATION_CATEGORIES: readonly RelationCategory[] = [
  'gene_inside',
  'gene_upstream',
  'gene_downstream',
];
const RELATION_PAGE_SIZE_OPTIONS: readonly number[] = [10, 20, 50, 100];
const DEFAULT_RELATION_PAGE_SIZE = 20;
const DEFAULT_RELATION_SORT_STATE: RelationSortState = { active: 'start', direction: 'asc' };
const RELATION_SORT_FIELDS: ReadonlySet<string> = new Set<RelationSortField>([
  'typeLabel',
  'start',
  'categoryLabel',
  'distanceBp',
  'motifLengthNt',
  'score',
  'modeLabel',
  'biotypeLabel',
]);
const RELATION_TSV_HEADERS: readonly string[] = [
  'motif',
  'region_id',
  'start',
  'end',
  'location',
  'relation_category',
  'gene_relation',
  'distance_bp',
  'distance',
  'motif_length_nt',
  'score',
  'overlap_bp',
  'overlap_fraction',
  'overlap',
  'relation_mode',
  'gene_biotype',
];
const NON_NEGATIVE_INTEGER_PATTERN = /^\d+$/;
const GENE_BROWSER_FLANK_BP = 1000;
const RELATION_BROWSER_FLANK_BP = 100;

function relationCategoryLabel(category: string): string {
  return RELATION_CATEGORY_LABELS[category] ?? category;
}

function isRelationMotifType(value: string): value is RelationMotifType {
  return ALL_MOTIF_TYPES.includes(value as RelationMotifType);
}

function isRelationCategory(value: string): value is RelationCategory {
  return ALL_RELATION_CATEGORIES.includes(value as RelationCategory);
}

function normalizeMotifSelection(value: unknown): readonly RelationMotifType[] {
  if (!Array.isArray(value)) {
    throw new Error('Motif filter selection must be an array.');
  }

  const selected = new Set<RelationMotifType>();
  for (const item of value) {
    if (typeof item !== 'string' || !isRelationMotifType(item)) {
      throw new Error(`Unsupported motif filter value: ${String(item)}.`);
    }
    selected.add(item);
  }
  return ALL_MOTIF_TYPES.filter((item) => selected.has(item));
}

function normalizeRelationCategorySelection(value: unknown): readonly RelationCategory[] {
  if (!Array.isArray(value)) {
    throw new Error('Gene relation filter selection must be an array.');
  }

  const selected = new Set<RelationCategory>();
  for (const item of value) {
    if (typeof item !== 'string' || !isRelationCategory(item)) {
      throw new Error(`Unsupported gene relation filter value: ${String(item)}.`);
    }
    selected.add(item);
  }
  return ALL_RELATION_CATEGORIES.filter((item) => selected.has(item));
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
  switch (value) {
    case 'overlap':
    case 'within_gene':
      return 'Intragenic';
    case 'flank':
    case 'flank_window':
      return 'Flanking';
    default:
      throw new Error(`Unsupported gene relation mode: ${value}.`);
  }
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

function parseDistanceInput(
  rawValue: string,
  label: string,
): { readonly value: number | null; readonly errorMessage: string | null } {
  const value = rawValue.trim();
  if (value.length === 0) {
    return { value: null, errorMessage: null };
  }
  if (!NON_NEGATIVE_INTEGER_PATTERN.test(value)) {
    return { value: null, errorMessage: `${label} must be a non-negative integer in bp.` };
  }
  return { value: Number(value), errorMessage: null };
}

function createDistanceFilter(minRawValue: string, maxRawValue: string): RelationDistanceFilter {
  const minDistance = parseDistanceInput(minRawValue, 'Minimum distance');
  if (minDistance.errorMessage) {
    return {
      minDistanceBp: null,
      maxDistanceBp: null,
      errorMessage: minDistance.errorMessage,
    };
  }

  const maxDistance = parseDistanceInput(maxRawValue, 'Maximum distance');
  if (maxDistance.errorMessage) {
    return {
      minDistanceBp: null,
      maxDistanceBp: null,
      errorMessage: maxDistance.errorMessage,
    };
  }

  if (
    minDistance.value !== null &&
    maxDistance.value !== null &&
    minDistance.value > maxDistance.value
  ) {
    return {
      minDistanceBp: minDistance.value,
      maxDistanceBp: maxDistance.value,
      errorMessage: 'Minimum distance must be less than or equal to maximum distance.',
    };
  }

  return {
    minDistanceBp: minDistance.value,
    maxDistanceBp: maxDistance.value,
    errorMessage: null,
  };
}

function matchesDistanceFilter(
  row: GeneRelationDetailRow,
  filter: RelationDistanceFilter,
): boolean {
  if (filter.errorMessage !== null) {
    return false;
  }
  if (filter.minDistanceBp !== null && row.distanceBp < filter.minDistanceBp) {
    return false;
  }
  if (filter.maxDistanceBp !== null && row.distanceBp > filter.maxDistanceBp) {
    return false;
  }
  return true;
}

function parseRelationSortField(value: string): RelationSortField {
  if (!RELATION_SORT_FIELDS.has(value)) {
    throw new Error(`Unsupported relation sort field: ${value}.`);
  }
  return value as RelationSortField;
}

function relationSortStateFromSort(sort: Sort): RelationSortState {
  return {
    active: parseRelationSortField(sort.active),
    direction: sort.direction === 'desc' ? 'desc' : 'asc',
  };
}

function compareText(left: string, right: string): number {
  return left.localeCompare(right, undefined, { sensitivity: 'base' });
}

function relationSortValue(row: GeneRelationDetailRow, field: RelationSortField): string | number {
  switch (field) {
    case 'typeLabel':
      return row.typeLabel;
    case 'start':
      return row.start;
    case 'categoryLabel':
      return row.categoryLabel;
    case 'distanceBp':
      return row.distanceBp;
    case 'motifLengthNt':
      return row.motifLengthNt;
    case 'score':
      return row.score;
    case 'modeLabel':
      return row.modeLabel;
    case 'biotypeLabel':
      return row.biotypeLabel;
  }
}

function compareRelationRows(
  left: GeneRelationDetailRow,
  right: GeneRelationDetailRow,
  sortState: RelationSortState,
): number {
  const leftValue = relationSortValue(left, sortState.active);
  const rightValue = relationSortValue(right, sortState.active);
  const multiplier = sortState.direction === 'asc' ? 1 : -1;
  const comparison =
    typeof leftValue === 'number' && typeof rightValue === 'number'
      ? leftValue - rightValue
      : compareText(String(leftValue), String(rightValue));

  if (comparison !== 0) {
    return comparison * multiplier;
  }
  return left.start - right.start || left.end - right.end || compareText(left.id, right.id);
}

function tsvCell(value: string | number): string {
  return String(value).replace(/\t/g, ' ').replace(/\r?\n/g, ' ');
}

function relationTsvValues(row: GeneRelationDetailRow): readonly (string | number)[] {
  return [
    row.typeLabel,
    row.seqid,
    row.start,
    row.end,
    row.location,
    row.relationCategory,
    row.categoryLabel,
    row.distanceBp,
    row.distanceLabel,
    row.motifLengthNt,
    row.score,
    row.overlapBp,
    row.overlapFraction,
    row.overlapLabel,
    row.relationMode,
    row.biotypeLabel,
  ];
}

function createRelationTsv(rows: readonly GeneRelationDetailRow[]): string {
  const lines = [
    RELATION_TSV_HEADERS.join('\t'),
    ...rows.map((row) => relationTsvValues(row).map(tsvCell).join('\t')),
  ];
  return `${lines.join('\n')}\n`;
}

function sanitizeDownloadFilenameToken(value: string): string {
  const token = value
    .trim()
    .replace(/[^A-Za-z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  if (token.length === 0) {
    throw new Error('Cannot create gene relation filename from an empty token.');
  }
  return token;
}

function createRelationDownloadFilename(
  assemblyAccession: string,
  regionId: string,
  featureId: string,
): string {
  return [
    sanitizeDownloadFilenameToken(assemblyAccession),
    sanitizeDownloadFilenameToken(regionId),
    sanitizeDownloadFilenameToken(featureId),
    'relations.tsv',
  ].join('_');
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

function geneSequenceRecordLabel(gene: GeneDetail): string {
  return gene.region_name || gene.region_id;
}

function createRelationDetailRow(
  relation: GeneQuadruplexRelation,
  sequenceRecordLabel: string,
): GeneRelationDetailRow {
  return {
    id: `${relation.quadruplex_sequence_id}:${relation.relation_category}:${relation.start}:${relation.end}`,
    seqid: relation.region_id,
    start: relation.start,
    end: relation.end,
    quadruplexType: relation.quadruplex_type,
    relationCategory: relation.relation_category,
    distanceBp: relation.distance_bp,
    overlapBp: relation.overlap_bp,
    overlapFraction: relation.overlap_fraction,
    relationMode: relation.relation_mode,
    motifLengthNt: relation.length,
    score: relation.score,
    typeLabel: formatQuadruplexType(relation.quadruplex_type),
    location: `${sequenceRecordLabel}:${formatBasePairRange(relation.start, relation.end)}`,
    categoryLabel: relationCategoryLabel(relation.relation_category),
    distanceLabel: formatRelationDistance(relation),
    motifLengthLabel: formatInteger(relation.length),
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
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MtxGridModule,
    RouterLink,
  ],
  templateUrl: './gene-info.component.html',
  styleUrl: './gene-info.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GeneInfoComponent {
  @ViewChild('relationActionTpl', { static: true }) relationActionTpl!: TemplateRef<unknown>;
  @ViewChild('geneBrowserSection') geneBrowserSection?: ElementRef<HTMLElement>;

  readonly assemblyAccession = input.required<string>();
  readonly dataBaseUrl = input.required<string>();
  readonly seqid = input.required<string>();
  readonly featureId = input.required<string>();
  readonly geneBiotypeLabel = geneBiotypeLabel;
  readonly motifTypeOptions = MOTIF_TYPE_OPTIONS;
  readonly relationCategoryOptions = RELATION_CATEGORY_OPTIONS;
  readonly relationPageSizeOptions: number[] = [...RELATION_PAGE_SIZE_OPTIONS];

  private readonly document = inject(DOCUMENT);
  private readonly geneService = inject(GeneService);
  private readonly genomeViewerConfigService = inject(GenomeViewerConfigService);
  private readonly viewerState = inject(GenomeViewerStateService);
  private readonly uiThemeService = inject(UiThemeService);
  private lastBrowserNavigationKey: string | null = null;

  readonly selectedMotifTypes = signal<readonly RelationMotifType[]>(ALL_MOTIF_TYPES);
  readonly selectedRelationCategories =
    signal<readonly RelationCategory[]>(ALL_RELATION_CATEGORIES);
  readonly minDistanceInput = signal('');
  readonly maxDistanceInput = signal('');
  readonly relationPageIndex = signal(0);
  readonly relationPageSize = signal(DEFAULT_RELATION_PAGE_SIZE);
  readonly relationSortState = signal<RelationSortState>(DEFAULT_RELATION_SORT_STATE);

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
        label: 'Total predicted sequences',
        value: gene.counts.quadruplex_sequence_count,
        description: 'All linked G4 and i-motif-forming sequences in the current gene context.',
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
      .map((relation) => createRelationDetailRow(relation, geneSequenceRecordLabel(gene)));
  });
  readonly relationDistanceFilter = computed<RelationDistanceFilter>(() =>
    createDistanceFilter(this.minDistanceInput(), this.maxDistanceInput()),
  );
  readonly relationFilterError = computed<string | null>(
    () => this.relationDistanceFilter().errorMessage,
  );
  readonly filteredRelationRows = computed<GeneRelationDetailRow[]>(() => {
    const selectedMotifTypes = this.selectedMotifTypes();
    const selectedRelationCategories = this.selectedRelationCategories();
    const distanceFilter = this.relationDistanceFilter();

    return this.relationDetailRows().filter(
      (row) =>
        selectedMotifTypes.includes(row.quadruplexType as RelationMotifType) &&
        selectedRelationCategories.includes(row.relationCategory as RelationCategory) &&
        matchesDistanceFilter(row, distanceFilter),
    );
  });
  readonly sortedFilteredRelationRows = computed<GeneRelationDetailRow[]>(() => {
    const sortState = this.relationSortState();
    return this.filteredRelationRows()
      .slice()
      .sort((left, right) => compareRelationRows(left, right, sortState));
  });
  readonly relationNoResultText = computed<string>(() =>
    this.relationFilterError() === null
      ? 'No relation rows match the current filters.'
      : 'No relation rows are shown because the distance filter is invalid.',
  );
  readonly canDownloadRelations = computed<boolean>(
    () => this.relationFilterError() === null && this.sortedFilteredRelationRows().length > 0,
  );
  readonly relationColumns = computed<MtxGridColumn<GeneRelationDetailRow>[]>(
    () =>
      [
        { header: 'Motif', field: 'typeLabel', sortable: true },
        {
          header: 'Location',
          field: 'location',
          sortable: true,
          sortProp: { id: 'start' },
        },
        { header: 'Gene relation', field: 'categoryLabel', sortable: true },
        {
          header: 'Distance',
          field: 'distanceBp',
          sortable: true,
          type: 'number',
          formatter: (row: GeneRelationDetailRow) => row.distanceLabel,
        },
        {
          header: 'Motif length (nt)',
          field: 'motifLengthNt',
          sortable: true,
          type: 'number',
          formatter: (row: GeneRelationDetailRow) => row.motifLengthLabel,
        },
        {
          header: 'Score',
          field: 'score',
          sortable: true,
          type: 'number',
        },
        { header: 'Mode', field: 'modeLabel', sortable: true },
        { header: 'Gene biotype', field: 'biotypeLabel', sortable: true },
        {
          header: 'Actions',
          field: 'actions',
          cellTemplate: this.relationActionTpl as unknown as never,
          width: '160px',
        },
      ] satisfies MtxGridColumn<GeneRelationDetailRow>[],
  );
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
    this.genomeViewerConfigService.createGeneViewerConfig({
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

  setSelectedMotifTypes(value: unknown): void {
    this.selectedMotifTypes.set(normalizeMotifSelection(value));
    this.resetRelationPagination();
  }

  setSelectedRelationCategories(value: unknown): void {
    this.selectedRelationCategories.set(normalizeRelationCategorySelection(value));
    this.resetRelationPagination();
  }

  setMinDistanceInput(value: string): void {
    this.minDistanceInput.set(value);
    this.resetRelationPagination();
  }

  setMaxDistanceInput(value: string): void {
    this.maxDistanceInput.set(value);
    this.resetRelationPagination();
  }

  clearRelationFilters(): void {
    this.selectedMotifTypes.set(ALL_MOTIF_TYPES);
    this.selectedRelationCategories.set(ALL_RELATION_CATEGORIES);
    this.minDistanceInput.set('');
    this.maxDistanceInput.set('');
    this.resetRelationPagination();
  }

  onRelationPageChange(event: PageEvent): void {
    if (!Number.isInteger(event.pageIndex) || event.pageIndex < 0) {
      throw new Error(`Invalid relation page index: ${event.pageIndex}.`);
    }
    if (!Number.isInteger(event.pageSize) || event.pageSize < 1) {
      throw new Error(`Invalid relation page size: ${event.pageSize}.`);
    }
    this.relationPageIndex.set(event.pageIndex);
    this.relationPageSize.set(event.pageSize);
  }

  onRelationSortChange(sort: Sort): void {
    this.relationSortState.set(relationSortStateFromSort(sort));
  }

  downloadFilteredRelations(): void {
    const rows = this.sortedFilteredRelationRows();
    if (this.relationFilterError() !== null) {
      throw new Error(
        'Cannot download gene relation table because the distance filter is invalid.',
      );
    }
    if (rows.length === 0) {
      throw new Error('Cannot download gene relation table because no relation rows match.');
    }

    const blob = new Blob([createRelationTsv(rows)], {
      type: 'text/tab-separated-values;charset=utf-8',
    });
    const filename = createRelationDownloadFilename(
      this.assemblyAccession(),
      this.seqid(),
      this.featureId(),
    );
    this.saveRelationBlob(blob, filename);
  }

  focusRelation(row: GeneRelationDetailRow): void {
    const browserRegion = createBrowserRegion(
      row.seqid,
      row.start - RELATION_BROWSER_FLANK_BP,
      row.end + RELATION_BROWSER_FLANK_BP,
    );
    this.viewerState.requestNavToLocation(browserRegion.location);
    this.scrollToGenomeBrowser();
  }

  resetBrowserRange(): void {
    const browserRegion = this.geneBrowserRegion();
    if (!browserRegion) {
      throw new Error('Cannot reset gene browser range because gene coordinates are unavailable.');
    }
    this.viewerState.requestNavToLocation(browserRegion.location);
  }

  sequenceRecordLabel(gene: GeneDetail): string {
    return geneSequenceRecordLabel(gene);
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

  private resetRelationPagination(): void {
    this.relationPageIndex.set(0);
  }

  private scrollToGenomeBrowser(): void {
    this.geneBrowserSection?.nativeElement.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }

  private saveRelationBlob(blob: Blob, filename: string): void {
    const view = this.document.defaultView;
    if (!view) {
      throw new Error(
        'Cannot save gene relation download because the browser window is unavailable.',
      );
    }
    const body = this.document.body;
    if (!body) {
      throw new Error(
        'Cannot save gene relation download because the document body is unavailable.',
      );
    }

    const objectUrl = view.URL.createObjectURL(blob);
    const link = this.document.createElement('a');
    link.href = objectUrl;
    link.download = filename;

    try {
      body.appendChild(link);
      link.click();
    } finally {
      link.remove();
      view.URL.revokeObjectURL(objectUrl);
    }
  }
}
