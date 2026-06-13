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
  @ViewChild('featureTpl', { static: true }) featureTpl!: TemplateRef<unknown>;
  @ViewChild('geneTpl', { static: true }) geneTpl!: TemplateRef<unknown>;
  @ViewChild('rangeTpl', { static: true }) rangeTpl!: TemplateRef<unknown>;
  @ViewChild('linkedTpl', { static: true }) linkedTpl!: TemplateRef<unknown>;

  readonly searchControl = new FormControl('', { nonNullable: true });
  readonly pageSizeOptions = [10, 20, 50];

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

  readonly columns = computed<MtxGridColumn<GeneSearchItem>[]>(() => [
    {
      header: 'Gene / feature',
      field: 'feature_id',
      cellTemplate: this.featureTpl as unknown as never,
    },
    {
      header: 'Gene ID',
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
      header: 'Linked G4 sites',
      field: 'insideOf_gene_g4_count',
      cellTemplate: this.linkedTpl as unknown as never,
      sortable: true,
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

  linkedG4Count(row: GeneSearchItem): string {
    const count =
      row.insideOf_gene_g4_count +
      row.insideOf_genes_upstream_1k_g4_count +
      row.insideOf_genes_downstream_1k_g4_count;
    return COUNT_FORMATTER.format(count);
  }
}
