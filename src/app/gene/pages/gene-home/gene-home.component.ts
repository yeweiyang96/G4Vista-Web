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

  readonly showPromptMessage = computed(() => this.hasSubmitted() && !this.submittedQuery());
  readonly showNoResultMessage = computed(
    () =>
      this.hasSubmitted() &&
      !!this.submittedQuery() &&
      !this.isLoading() &&
      this.results().length === 0,
  );

  readonly columns = computed<MtxGridColumn<GeneSearchItem>[]>(() => [
    {
      header: 'Assembly',
      field: 'assembly_accession',
      cellTemplate: this.assemblyTpl as unknown as never,
    },
    {
      header: 'SeqID',
      field: 'seqid',
    },
    {
      header: 'Feature ID',
      field: 'feature_id',
      cellTemplate: this.featureTpl as unknown as never,
    },
    {
      header: 'Gene ID',
      field: 'gene_id',
      cellTemplate: this.geneTpl as unknown as never,
    },
    {
      header: 'Gene Name',
      field: 'gene_name',
      cellTemplate: this.geneTpl as unknown as never,
    },
    {
      header: 'Biotype',
      field: 'gene_biotype',
    },
    {
      header: 'Inside Gene (G4)',
      field: 'insideOf_gene_g4_count',
      type: 'number',
      sortable: true,
    },
    {
      header: 'Upstream 1kb (G4)',
      field: 'insideOf_genes_upstream_1k_g4_count',
      type: 'number',
      sortable: true,
    },
    {
      header: 'Downstream 1kb (G4)',
      field: 'insideOf_genes_downstream_1k_g4_count',
      type: 'number',
      sortable: true,
    },
  ]);

  onSubmit(event?: Event): void {
    event?.preventDefault();
    this.hasSubmitted.set(true);

    const query = this.searchControl.value.trim();
    this.submittedQuery.set(query || null);
  }
}
