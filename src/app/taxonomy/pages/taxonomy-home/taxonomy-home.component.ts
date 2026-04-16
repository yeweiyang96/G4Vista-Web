import {
  Component,
  ChangeDetectionStrategy,
  ViewChild,
  ChangeDetectorRef,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import {
  MatAutocompleteModule,
  MatAutocompleteSelectedEvent,
} from '@angular/material/autocomplete';
import {
  Observable,
  of,
  catchError,
  debounceTime,
  distinctUntilChanged,
  startWith,
  switchMap,
} from 'rxjs';
import { MatTreeModule, MatTree } from '@angular/material/tree';
import { AsyncPipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { TaxonomyNode, TaxonomySearch, TaxonomyService } from '../../services/taxonomy.service';
import { TaxonomyStatisticsComponent } from './taxonomy-statistics/taxonomy-statistics.component';

const EXAMPLE_DATA: TaxonomySearch[] = [
  {
    name: 'Homo sapiens',
    rank: 'species',
    taxon_id: 9606,
    name_class: 'scientific_name',
    scientific_name: 'Homo sapiens',
  },
  {
    name: 'Arabidopsis thaliana',
    rank: 'species',
    taxon_id: 3702,
    name_class: 'scientific_name',
    scientific_name: 'Arabidopsis thaliana',
  },
  {
    name: 'Escherichia coli',
    rank: 'species',
    taxon_id: 562,
    name_class: 'scientific_name',
    scientific_name: 'Escherichia coli',
  },
];

@Component({
  selector: 'app-taxonomy',
  imports: [
    MatInputModule,
    MatFormFieldModule,
    MatAutocompleteModule,
    ReactiveFormsModule,
    MatTreeModule,
    AsyncPipe,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    RouterLink,
    TaxonomyStatisticsComponent,
  ],
  templateUrl: './taxonomy-home.component.html',
  styleUrl: './taxonomy-home.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaxonomyHomeComponent {
  // 搜索框部分变量声明
  readonly searchControl = new FormControl<string | TaxonomySearch>('');
  readonly currentSearchValue = toSignal(this.searchControl.valueChanges.pipe(startWith('')), {
    initialValue: '',
  });
  readonly isTypingQuery = computed(() => typeof this.currentSearchValue() === 'string');
  //Example options
  readonly options: TaxonomySearch[] = EXAMPLE_DATA;
  // 订阅搜索结果列表
  readonly filteredOptions$: Observable<TaxonomySearch[]> = this.searchControl.valueChanges.pipe(
    startWith(''),
    // wait 300ms after each keystroke before considering the term
    debounceTime(300),
    // ignore new term if same as previous term
    distinctUntilChanged(
      (prev: string | TaxonomySearch | null, curr: string | TaxonomySearch | null) => {
        const curr_name = typeof curr === 'string' ? curr.trim() : curr?.name;
        const prev_name = typeof prev === 'string' ? prev.trim() : prev?.name;
        return prev_name === curr_name;
      },
    ),
    switchMap((value) => {
      const name = typeof value === 'string' ? value.trim() : value?.scientific_name;
      return name ? this._filter(name) : of(this.options.slice());
    }),
  );
  readonly selectedTaxonId = signal<number | null>(null);
  readonly lineageResource = rxResource<TaxonomyNode | null, number | null>({
    params: () => this.selectedTaxonId(),
    stream: ({ params }) =>
      params === null
        ? of(null)
        : this.taxonomyService.getLineage(params).pipe(catchError(() => of(null))),
    defaultValue: null,
  });
  readonly isDisplay = computed(
    () =>
      !this.isTypingQuery() &&
      !this.lineageResource.isLoading() &&
      this.lineageResource.value() !== null,
  );

  private readonly taxonomyService = inject(TaxonomyService);
  private readonly cdr = inject(ChangeDetectorRef);

  constructor() {
    effect(() => {
      if (!this.lineageResource.value()) {
        return;
      }

      // Ensure tree nodes are rendered before expanding all branches.
      this.cdr.detectChanges();
      this.tree?.expandAll();
    });
  }

  displayFn(taxa: TaxonomySearch): string {
    return taxa && taxa.scientific_name ? taxa.scientific_name : '';
  }

  private _filter(name: string): Observable<TaxonomySearch[]> {
    const filterValue = name.toLowerCase();
    return this.taxonomyService.searchTaxonomy(filterValue);
  }

  //lineage tree部分
  readonly dataSource = computed<TaxonomyNode[]>(() => {
    const lineage = this.lineageResource.value();
    return lineage ? [lineage] : [];
  });
  @ViewChild('tree') tree!: MatTree<TaxonomyNode>;
  childrenAccessor = (node: TaxonomyNode) => node.children ?? [];
  // 节点追踪方法（trackBy）
  trackBy = (_index: number, node: TaxonomyNode) => node.taxon_id;
  hasChild = (_: number, node: TaxonomyNode) => !!node.children && node.children.length > 0;

  // 点击选项触发
  loadLineage(event: MatAutocompleteSelectedEvent): void {
    this.selectedTaxonId.set(event.option.value.taxon_id);
  }
}
