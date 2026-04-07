import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ViewChild,
  ChangeDetectorRef,
  inject,
} from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import {
  MatAutocompleteModule,
  MatAutocompleteSelectedEvent,
} from '@angular/material/autocomplete';
import { Observable, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, startWith, switchMap } from 'rxjs/operators';
import { MatTreeModule, MatTree } from '@angular/material/tree';
import { AsyncPipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { TaxonomyNode, TaxonomySearch, TaxonomyService } from '../../service/taxonomy.service';
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
    FormsModule,
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
export class TaxonomyHomeComponent implements OnInit {
  // 搜索框部分变量声明
  searchControl = new FormControl<string | TaxonomySearch>('');
  //Example options
  options: TaxonomySearch[] = EXAMPLE_DATA;
  // 订阅搜索结果列表
  filteredOptions$!: Observable<TaxonomySearch[]>;
  //是否显示lineage
  isDisplay = false;

  private readonly taxonomyService = inject(TaxonomyService);
  private readonly cdr = inject(ChangeDetectorRef);

  ngOnInit() {
    // 监听搜索框值变化
    this.filteredOptions$ = this.searchControl.valueChanges.pipe(
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
        // 只有当变化的值不是自动补齐的值时,才刷新lineage
        if (typeof value === 'string') {
          this.isDisplay = false;
        }
        const name = typeof value === 'string' ? value.trim() : value?.scientific_name;
        return name ? this._filter(name as string) : of(this.options.slice());
      }),
    );
  }

  displayFn(taxa: TaxonomySearch): string {
    return taxa && taxa.scientific_name ? taxa.scientific_name : '';
  }

  private _filter(name: string): Observable<TaxonomySearch[]> {
    const filterValue = name.toLowerCase();
    return this.taxonomyService.searchTaxonomy(filterValue);
  }

  //lineage tree部分
  dataSource!: TaxonomyNode[];
  @ViewChild('tree') tree!: MatTree<TaxonomyNode>;
  childrenAccessor = (node: TaxonomyNode) => node.children ?? [];
  // 节点追踪方法（trackBy）
  trackBy = (_index: number, node: TaxonomyNode) => node.taxon_id;
  hasChild = (_: number, node: TaxonomyNode) => !!node.children && node.children.length > 0;

  // 点击选项触发
  loadLineage(event: MatAutocompleteSelectedEvent) {
    this.isDisplay = false;
    this.taxonomyService.getLineage(event.option.value.taxon_id).subscribe((data: TaxonomyNode) => {
      this.dataSource = [data];
      this.isDisplay = true;
      // 手动触发视图检查，确保 tree 被渲染
      this.cdr.detectChanges();
      this.tree.expandAll();
    });
  }

  click() {
    // 当点击搜索框时关闭lineage tree
    this.isDisplay = false;
  }
}
