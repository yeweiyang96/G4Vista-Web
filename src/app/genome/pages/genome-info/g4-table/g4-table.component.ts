import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  ViewChild,
  computed,
  effect,
  input,
  output,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { PageEvent } from '@angular/material/paginator';
import { Sort } from '@angular/material/sort';
import { MtxGridColumn, MtxGridModule } from '@ng-matero/extensions/grid';
import {
  EMPTY_G4_PAGE,
  G4DownloadColumn,
  G4GenePosition,
  G4GenePositionOption,
  G4GeneRelationHit,
  G4PageItem,
  G4PageResponse,
  G4SortField,
} from '../../../services/g4.service';

interface SequenceSegment {
  text: string;
  highlighted: boolean;
}

const RELATION_COLUMN_FIELD_PREFIX = 'gene_relation:';

function buildG4SequenceSegments(item: G4PageItem): SequenceSegment[] {
  const boundaries = [
    0,
    item.tetrads,
    item.tetrads + item.y1,
    item.tetrads * 2 + item.y1,
    item.tetrads * 2 + item.y1 + item.y2,
    item.tetrads * 3 + item.y1 + item.y2,
    item.tetrads * 3 + item.y1 + item.y2 + item.y3,
    item.sequence.length,
  ];
  const highlights = [true, false, true, false, true, false, true];

  return highlights.flatMap((highlighted, index) => {
    const segment = item.sequence.slice(boundaries[index], boundaries[index + 1]);
    return segment ? [{ text: segment, highlighted }] : [];
  });
}

function buildRelationColumnField(position: G4GenePosition): string {
  return `${RELATION_COLUMN_FIELD_PREFIX}${position}`;
}

function parseRelationColumnField(field: string): G4GenePosition | null {
  if (!field.startsWith(RELATION_COLUMN_FIELD_PREFIX)) {
    return null;
  }

  return field.slice(RELATION_COLUMN_FIELD_PREFIX.length) as G4GenePosition;
}

function isDefaultRelationPosition(position: G4GenePosition): boolean {
  return position.startsWith('insideOf_gene_');
}

function toDownloadColumn(field: string): G4DownloadColumn {
  return field as G4DownloadColumn;
}

@Component({
  selector: 'app-g4-table',
  imports: [MatButtonModule, MatChipsModule, MatIconModule, MtxGridModule, RouterLink],
  templateUrl: './g4-table.component.html',
  styleUrl: './g4-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class G4TableComponent {
  @ViewChild('sequenceTpl', { static: true }) sequenceTpl!: TemplateRef<unknown>;
  @ViewChild('relationTpl', { static: true }) relationTpl!: TemplateRef<unknown>;

  readonly page = input.required<G4PageResponse>();
  readonly filterScopeLabel = input.required<string>();
  readonly filterSelectedGeneLabel = input('Any');
  readonly hasSelectedGene = input(false);
  readonly filterSelectedTetrads = input<readonly number[]>([]);
  readonly filterMinScore = input<number | undefined>(undefined);
  readonly filterMaxScore = input<number | undefined>(undefined);
  readonly showAccessionIdColumn = input(false);
  readonly sortState = input.required<{ active: G4SortField; direction: 'asc' | 'desc' }>();
  readonly pageIndex = input.required<number>();
  readonly pageSize = input.required<number>();
  readonly isLoading = input(false);
  readonly isDownloading = input(false);
  readonly geneRelationsByRowKey =
    input.required<Map<string, Partial<Record<G4GenePosition, G4GeneRelationHit[]>>>>();
  readonly genePositionOptions = input.required<readonly G4GenePositionOption[]>();

  private readonly columnVisibility = signal<Record<string, boolean>>({});
  private readonly cachedPage = signal<G4PageResponse>(EMPTY_G4_PAGE);
  private readonly cachedGeneRelationsByRowKey = signal<
    Map<string, Partial<Record<G4GenePosition, G4GeneRelationHit[]>>>
  >(new Map());

  readonly displayedPage = computed(() => (this.isLoading() ? this.cachedPage() : this.page()));
  readonly displayedGeneRelationsByRowKey = computed(() =>
    this.isLoading() ? this.cachedGeneRelationsByRowKey() : this.geneRelationsByRowKey(),
  );
  readonly hasGeneSelection = computed(() => this.hasSelectedGene());
  readonly geneChipLabel = computed(() => this.filterSelectedGeneLabel().trim() || 'Any');
  readonly tetradsChipLabel = computed(() =>
    this.filterSelectedTetrads().length ? this.filterSelectedTetrads().join(', ') : 'All',
  );
  readonly hasSelectedGeneChip = computed(() => this.hasSelectedGene());
  readonly hasSelectedTetradsChip = computed(() => this.filterSelectedTetrads().length > 0);
  readonly hasSelectedScoreChip = computed(
    () => this.filterMinScore() !== undefined || this.filterMaxScore() !== undefined,
  );
  readonly scoreChipLabel = computed(() => {
    const min = this.filterMinScore();
    const max = this.filterMaxScore();

    if (min !== undefined && max !== undefined) {
      return `${min}-${max}`;
    }
    if (min !== undefined) {
      return `>= ${min}`;
    }
    if (max !== undefined) {
      return `<= ${max}`;
    }

    return `${this.displayedPage().min_score}-${this.displayedPage().max_score}`;
  });

  readonly columns = computed<MtxGridColumn<G4PageItem>[]>(() => {
    const visibility = this.columnVisibility();
    const baseColumns = [
      ...(this.showAccessionIdColumn()
        ? ([{ header: 'Sequence / region', field: 'seqid' }] satisfies MtxGridColumn<G4PageItem>[])
        : []),
      { header: 'Start (1-based)', field: 'start', sortable: true, type: 'number' },
      { header: 'End (1-based)', field: 'end', sortable: true, type: 'number' },
      { header: 'Length (bp)', field: 'length', sortable: true, type: 'number' },
      { header: 'G-tetrads', field: 'tetrads', sortable: true, type: 'number' },
      { header: 'Score', field: 'score', sortable: true, type: 'number' },
      {
        header: 'Sequence',
        field: 'sequence',
        cellTemplate: this.sequenceTpl as unknown as never,
      },
    ] satisfies MtxGridColumn<G4PageItem>[];

    const visibleBaseColumns = baseColumns.map((column) => ({
      ...column,
      show: visibility[column.field] ?? true,
    }));

    const relationColumns = this.genePositionOptions().map((option) => {
      const field = buildRelationColumnField(option.value);

      return {
        header: option.label,
        field,
        cellTemplate: this.relationTpl as unknown as never,
        show: visibility[field] ?? isDefaultRelationPosition(option.value),
      } satisfies MtxGridColumn<G4PageItem>;
    });

    return [...visibleBaseColumns, ...relationColumns];
  });

  readonly sortChanged = output<Sort>();
  readonly pageChanged = output<PageEvent>();
  readonly navigateToG4 = output<G4PageItem>();
  readonly resetScope = output<void>();
  readonly resetGene = output<void>();
  readonly resetTetrads = output<void>();
  readonly resetScore = output<void>();
  readonly downloadRequested = output<readonly G4DownloadColumn[]>();
  readonly visibleColumnKeysChange = output<readonly G4DownloadColumn[]>();

  constructor() {
    effect(() => {
      const page = this.page();
      const relations = this.geneRelationsByRowKey();

      if (!this.isLoading()) {
        this.cachedPage.set(page);
        this.cachedGeneRelationsByRowKey.set(relations);
      }
    });

    effect(() => {
      this.visibleColumnKeysChange.emit(this.visibleDownloadColumnKeys());
    });
  }

  onSortChange(sort: Sort): void {
    this.sortChanged.emit(sort);
  }

  onColumnChange(columns: MtxGridColumn<G4PageItem>[]): void {
    this.columnVisibility.update((current) => {
      const next = { ...current };
      for (const column of columns) {
        next[column.field] = column.show ?? false;
      }
      return next;
    });
  }

  onPageChange(event: PageEvent): void {
    this.pageChanged.emit(event);
  }

  onNavigateToG4(item: G4PageItem): void {
    this.navigateToG4.emit(item);
  }

  onResetScope(): void {
    this.resetScope.emit();
  }

  onResetGene(): void {
    this.resetGene.emit();
  }

  onResetTetrads(): void {
    this.resetTetrads.emit();
  }

  onResetScore(): void {
    this.resetScore.emit();
  }

  onDownload(): void {
    this.downloadRequested.emit(this.visibleDownloadColumnKeys());
  }

  visibleDownloadColumnKeys(): readonly G4DownloadColumn[] {
    return this.columns()
      .filter((column) => column.show !== false)
      .map((column) => toDownloadColumn(column.field));
  }

  sequenceSegments(item: G4PageItem): SequenceSegment[] {
    return buildG4SequenceSegments(item);
  }

  relationColumnPosition(
    column: MtxGridColumn<G4PageItem> | null | undefined,
  ): G4GenePosition | null {
    return column ? parseRelationColumnField(column.field) : null;
  }

  relationHits(item: G4PageItem, position: G4GenePosition): G4GeneRelationHit[] {
    return (
      this.displayedGeneRelationsByRowKey().get(`${item.seqid}:${item.start}`)?.[position] ?? []
    );
  }

  trackByG4(_index: number, item: G4PageItem): string {
    return `${item.seqid}:${item.start}:${item.g4_type}`;
  }

  trackByFeatureId(_index: number, item: G4GeneRelationHit): string {
    return item.feature_id;
  }
}
