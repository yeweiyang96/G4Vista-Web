import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MtxGridColumn, MtxGridModule } from '@ng-matero/extensions/grid';
import { of } from 'rxjs';
import { GeneSearchItem, GeneService } from '../../services/gene.service';

const COUNT_FORMATTER = new Intl.NumberFormat('en-US');

interface GeneSearchCsvColumn {
  readonly header: string;
  readonly value: (row: GeneSearchItem) => string | number | null;
}

function internalG4SiteCount(row: GeneSearchItem): number {
  return row.insideOf_gene_g4_count;
}

function geneFeatureLabel(row: GeneSearchItem): string | null {
  return row.gene_name || row.feature_id;
}

function csvCell(value: string | number | null): string {
  const text = value === null ? '' : String(value);
  const escapedText = text.replace(/"/g, '""');
  return /[",\n\r]/.test(escapedText) ? `"${escapedText}"` : escapedText;
}

const GENE_SEARCH_CSV_COLUMNS: readonly GeneSearchCsvColumn[] = [
  { header: 'Species', value: (row) => row.organism_name },
  { header: 'Gene', value: (row) => geneFeatureLabel(row) },
  { header: 'Feature ID', value: (row) => row.gene_id },
  { header: 'Assembly', value: (row) => row.assembly_accession },
  { header: 'Sequence record', value: (row) => row.seqid },
  { header: 'Biotype', value: (row) => row.gene_biotype },
  { header: 'Start', value: (row) => row.feature_start },
  { header: 'End', value: (row) => row.feature_end },
  { header: 'Strand', value: (row) => row.strand },
  { header: 'Internal G4 count', value: (row) => internalG4SiteCount(row) },
];

function geneSearchCsv(rows: readonly GeneSearchItem[]): string {
  const headerRow = GENE_SEARCH_CSV_COLUMNS.map((column) => csvCell(column.header)).join(',');
  const bodyRows = rows.map((row) =>
    GENE_SEARCH_CSV_COLUMNS.map((column) => csvCell(column.value(row))).join(','),
  );
  return [headerRow, ...bodyRows].join('\n');
}

function exportFileName(searchTerm: string): string {
  const queryToken = searchTerm.trim().replace(/[<>:"/\\|?*\s]+/g, '_');
  return `g4vista-gene-results-${queryToken}.csv`;
}

@Component({
  selector: 'app-gene-home',
  imports: [
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MtxGridModule,
    ReactiveFormsModule,
    RouterLink,
  ],
  templateUrl: './gene-home.component.html',
  styleUrl: './gene-home.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GeneHomeComponent {
  @ViewChild('assemblyTpl', { static: true }) assemblyTpl!: TemplateRef<unknown>;
  @ViewChild('detailActionTpl', { static: true }) detailActionTpl!: TemplateRef<unknown>;
  @ViewChild('featureTpl', { static: true }) featureTpl!: TemplateRef<unknown>;
  @ViewChild('geneTpl', { static: true }) geneTpl!: TemplateRef<unknown>;
  @ViewChild('internalG4Tpl', { static: true }) internalG4Tpl!: TemplateRef<unknown>;
  @ViewChild('rangeTpl', { static: true }) rangeTpl!: TemplateRef<unknown>;

  readonly searchControl = new FormControl('', { nonNullable: true });
  readonly pageSizeOptions = [10, 20, 50];

  private readonly document = inject(DOCUMENT);
  private readonly geneService = inject(GeneService);
  private readonly submittedQuery = signal<string | null>(null);
  private readonly hasSubmitted = signal(false);

  readonly searchResultResource = rxResource<GeneSearchItem[], string | null>({
    params: () => this.submittedQuery(),
    stream: ({ params }) => (params ? this.geneService.searchGenes(params) : of([])),
    defaultValue: [],
  });

  readonly results = computed(() => this.searchResultResource.value());
  readonly isLoading = this.searchResultResource.isLoading;

  readonly showPromptMessage = computed(() => !this.hasSubmitted() || !this.submittedQuery());
  readonly showNoResultMessage = computed(
    () =>
      this.hasSubmitted() &&
      !!this.submittedQuery() &&
      !this.isLoading() &&
      this.results().length === 0,
  );
  readonly showResultsPanel = computed(
    () =>
      this.hasSubmitted() &&
      !!this.submittedQuery() &&
      (this.isLoading() || this.results().length > 0),
  );
  readonly resultCountLabel = computed(() => {
    const resultCount = this.results().length;
    if (this.isLoading() && resultCount === 0) {
      return 'Loading results...';
    }
    return `Showing 1-${resultCount} of ${resultCount} results`;
  });

  readonly columns = computed<MtxGridColumn<GeneSearchItem>[]>(() => [
    {
      header: 'Species',
      field: 'organism_name',
    },
    {
      header: 'Gene',
      field: 'feature_id',
      cellTemplate: this.featureTpl as unknown as never,
    },
    {
      header: 'Feature ID',
      field: 'gene_id',
      cellTemplate: this.geneTpl as unknown as never,
    },
    {
      header: 'Assembly',
      field: 'assembly_accession',
      cellTemplate: this.assemblyTpl as unknown as never,
    },
    {
      header: 'Sequence record',
      field: 'seqid',
    },
    {
      header: 'Biotype',
      field: 'gene_biotype',
    },
    {
      header: 'Range',
      field: 'feature_start',
      cellTemplate: this.rangeTpl as unknown as never,
    },
    {
      header: 'Internal G4 count',
      field: 'insideOf_gene_g4_count',
      cellTemplate: this.internalG4Tpl as unknown as never,
      sortable: true,
    },
    {
      header: '',
      field: 'detail_action',
      cellTemplate: this.detailActionTpl as unknown as never,
      width: '48px',
    },
  ]);

  onSubmit(event?: Event): void {
    event?.preventDefault();
    this.hasSubmitted.set(true);

    const query = this.searchControl.value.trim();
    this.submittedQuery.set(query || null);
  }

  formatRange(row: GeneSearchItem): string {
    if (row.feature_start === null || row.feature_end === null) {
      return 'Unavailable';
    }
    const strand = row.strand ? ` (${row.strand})` : '';
    return `${COUNT_FORMATTER.format(row.feature_start)}..${COUNT_FORMATTER.format(row.feature_end)}${strand}`;
  }

  internalG4Count(row: GeneSearchItem): string {
    return COUNT_FORMATTER.format(internalG4SiteCount(row));
  }

  exportResults(): void {
    const rows = this.results();
    if (rows.length === 0) {
      throw new Error('Cannot export gene search results because the current result set is empty.');
    }

    const searchTerm = this.submittedQuery();
    if (!searchTerm) {
      throw new Error('Cannot export gene search results because no search query is active.');
    }

    const view = this.document.defaultView;
    if (!view) {
      throw new Error(
        'Cannot export gene search results because the browser window is unavailable.',
      );
    }

    const body = this.document.body;
    if (!body) {
      throw new Error(
        'Cannot export gene search results because the document body is unavailable.',
      );
    }

    const blob = new Blob([geneSearchCsv(rows)], { type: 'text/csv;charset=utf-8' });
    const objectUrl = view.URL.createObjectURL(blob);
    const link = this.document.createElement('a');
    link.href = objectUrl;
    link.download = exportFileName(searchTerm);

    try {
      body.appendChild(link);
      link.click();
    } finally {
      link.remove();
      view.URL.revokeObjectURL(objectUrl);
    }
  }
}
