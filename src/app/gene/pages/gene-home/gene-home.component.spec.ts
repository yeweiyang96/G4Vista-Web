import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  ActivatedRoute,
  ParamMap,
  Router,
  convertToParamMap,
  provideRouter,
} from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';
import { GeneSearchItem, GeneSearchPage, GeneService } from '../../services/gene.service';
import {
  TaxonomyNode,
  TaxonomySearch,
  TaxonomyService,
} from '../../../taxonomy/services/taxonomy.service';
import { GeneHomeComponent } from './gene-home.component';

describe('GeneHomeComponent', () => {
  let fixture: ComponentFixture<GeneHomeComponent>;
  let component: GeneHomeComponent;
  let geneService: jasmine.SpyObj<GeneService>;
  let taxonomyService: jasmine.SpyObj<TaxonomyService>;
  let paramMapSubject: BehaviorSubject<ParamMap>;
  let queryParamMapSubject: BehaviorSubject<ParamMap>;

  const homoSapiensTaxon: TaxonomySearch = {
    name: 'Homo sapiens',
    rank: 'species',
    taxon_id: 9606,
    name_class: 'scientific name',
    scientific_name: 'Homo sapiens',
  };
  const homoSapiensNode: TaxonomyNode = {
    name: 'Homo sapiens',
    rank: 'species',
    taxon_id: 9606,
    assembly_count: 48,
    children: [],
  };
  const arabidopsisNode: TaxonomyNode = {
    name: 'Arabidopsis thaliana',
    rank: 'species',
    taxon_id: 3702,
    assembly_count: 1,
    children: [],
  };
  const emptyGeneSearchPage: GeneSearchPage = {
    genes: [],
    count: 0,
  };

  function geneSearchPage(genes: readonly GeneSearchItem[]): GeneSearchPage {
    return {
      genes: [...genes],
      count: genes.length,
    };
  }

  beforeEach(async () => {
    geneService = jasmine.createSpyObj<GeneService>('GeneService', [
      'searchGenesPage',
      'downloadGeneSearch',
    ]);
    geneService.searchGenesPage.and.returnValue(of(emptyGeneSearchPage));
    geneService.downloadGeneSearch.and.returnValue(
      of({ blob: new Blob(['']), filename: 'gene-search.csv' }),
    );
    taxonomyService = jasmine.createSpyObj<TaxonomyService>('TaxonomyService', [
      'searchTaxonomy',
      'getAssemblyCounts',
      'getLineage',
    ]);
    taxonomyService.searchTaxonomy.and.returnValue(of([]));
    taxonomyService.getAssemblyCounts.and.returnValue(of([{ taxon_id: 9606, assembly_count: 48 }]));
    taxonomyService.getLineage.and.returnValue(of(homoSapiensNode));
    paramMapSubject = new BehaviorSubject<ParamMap>(convertToParamMap({}));
    queryParamMapSubject = new BehaviorSubject<ParamMap>(convertToParamMap({}));

    await TestBed.configureTestingModule({
      imports: [GeneHomeComponent],
      providers: [
        provideRouter([
          { path: 'gene', component: GeneHomeComponent },
          { path: 'gene/taxon/:taxonId', component: GeneHomeComponent },
        ]),
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: paramMapSubject.asObservable(),
            queryParamMap: queryParamMapSubject.asObservable(),
          },
        },
        { provide: GeneService, useValue: geneService },
        { provide: TaxonomyService, useValue: taxonomyService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(GeneHomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('calls search service when a non-empty query is submitted', async () => {
    component.searchControl.setValue('ATP6');

    component.onSubmit();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(geneService.searchGenesPage).toHaveBeenCalledWith({
      searchTerm: 'ATP6',
      pageIndex: 0,
      pageSize: 10,
    });
  });

  it('keeps global search enabled and renders the slow-search warning', async () => {
    component.searchControl.setValue('TP53');

    component.onSubmit();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(geneService.searchGenesPage).toHaveBeenCalledWith({
      searchTerm: 'TP53',
      pageIndex: 0,
      pageSize: 10,
    });
    expect(host.textContent).toContain('Global gene search can be slow');
  });

  it('submits scoped search after selecting a taxon', async () => {
    const router = TestBed.inject(Router);
    component.selectTaxon({ option: { value: homoSapiensTaxon } } as never);
    component.searchControl.setValue('TP53');

    component.onSubmit();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(geneService.searchGenesPage).toHaveBeenCalledWith({
      searchTerm: 'TP53',
      taxonId: 9606,
      pageIndex: 0,
      pageSize: 10,
    });
    expect(router.url).toContain('/gene/taxon/9606?search=TP53');
  });

  it('preloads scoped search state from the route', async () => {
    paramMapSubject.next(convertToParamMap({ taxonId: '9606' }));
    queryParamMapSubject.next(convertToParamMap({ search: 'TP53' }));
    fixture.detectChanges();
    await fixture.whenStable();

    expect(taxonomyService.getLineage).toHaveBeenCalledWith(9606);
    expect(component.searchControl.value).toBe('TP53');
    expect(geneService.searchGenesPage).toHaveBeenCalledWith({
      searchTerm: 'TP53',
      taxonId: 9606,
      pageIndex: 0,
      pageSize: 10,
    });
  });

  it('preloads a taxon route without running gene search when no query is present', async () => {
    taxonomyService.getLineage.and.returnValue(of(arabidopsisNode));

    paramMapSubject.next(convertToParamMap({ taxonId: '3702' }));
    queryParamMapSubject.next(convertToParamMap({}));
    fixture.detectChanges();
    await fixture.whenStable();

    expect(taxonomyService.getLineage).toHaveBeenCalledWith(3702);
    expect(component.searchControl.value).toBe('');
    expect(component.taxonControl.value).toBe('Arabidopsis thaliana');
    expect(component.selectedTaxon()).toEqual({
      taxon_id: 3702,
      name: 'Arabidopsis thaliana',
      rank: 'species',
    });
    expect(geneService.searchGenesPage).not.toHaveBeenCalled();
  });

  it('renders search results with species, export, and row navigation', async () => {
    const rows: GeneSearchItem[] = [
      {
        assembly_accession: 'GCF_000001405.39',
        organism_name: 'Homo sapiens',
        region_id: 'NC_012920.1',
        feature_id: 'gene-ATP6',
        gene_id: 'ATP6',
        gene_name: 'ATP6',
        locus_tag: null,
        biotype: 'protein_coding',
        start: 1,
        end: 200,
        strand: '+',
        g4_count: 1,
        i_motif_count: 0,
        quadruplex_sequence_count: 1,
      },
      {
        assembly_accession: 'GCF_000146045.2',
        organism_name: 'Saccharomyces cerevisiae',
        region_id: 'NC_001133.9',
        feature_id: 'gene-YAL001C',
        gene_id: 'YAL001C',
        gene_name: 'TFC3',
        locus_tag: null,
        biotype: '',
        start: 300,
        end: 900,
        strand: '-',
        g4_count: 1_234_567,
        i_motif_count: 0,
        quadruplex_sequence_count: 1_234_567,
      },
    ];

    geneService.searchGenesPage.and.returnValue(of(geneSearchPage(rows)));
    component.searchControl.setValue('gene');

    component.onSubmit();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.textContent).toContain('Species');
    expect(host.textContent).toContain('Homo sapiens');
    expect(host.textContent).toContain('Gene');
    expect(host.textContent).toContain('Feature ID');
    expect(host.textContent).toContain('Other');
    expect(host.textContent).toContain('Internal G4 count');
    expect(host.textContent).not.toContain('Gene / feature');
    expect(host.textContent).not.toContain('Gene ID');
    expect(host.querySelector('button.export-button')).not.toBeNull();

    const featureLinks = host.querySelectorAll('a.feature-link');
    expect(featureLinks.length).toBe(2);

    const assemblyHref = host.querySelector('a.assembly-link')?.getAttribute('href');
    expect(assemblyHref).toContain('/genome/GCF_000001405.39');

    expect(host.querySelector('a.gene-link')).toBeNull();
    expect(host.querySelector('a.internal-count')).toBeNull();
    expect(host.querySelector('span.internal-count')?.textContent?.trim()).toBe('1');

    const detailHref = host.querySelector('a.detail-action-link')?.getAttribute('href');
    expect(detailHref).toContain('/gene/GCF_000001405.39/NC_012920.1/gene-ATP6');
  });

  it('exports the full matching gene search result set from the server', async () => {
    const rows: GeneSearchItem[] = [
      {
        assembly_accession: 'GCF_000146045.2',
        organism_name: 'Saccharomyces cerevisiae',
        region_id: 'NC_001133.9',
        feature_id: 'gene-YAL001C',
        gene_id: 'YAL001C',
        gene_name: 'TFC3',
        locus_tag: null,
        biotype: '',
        start: 300,
        end: 900,
        strand: '-',
        g4_count: 1_234_567,
        i_motif_count: 0,
        quadruplex_sequence_count: 1_234_567,
      },
    ];
    const view = fixture.nativeElement.ownerDocument.defaultView as Window & typeof globalThis;
    const exportState: { blob: Blob | null } = { blob: null };
    spyOn(view.URL, 'createObjectURL').and.callFake((blob: Blob | MediaSource) => {
      exportState.blob = blob as Blob;
      return 'blob:g4vista-gene-results';
    });
    spyOn(view.URL, 'revokeObjectURL');
    spyOn(HTMLAnchorElement.prototype, 'click').and.callFake(() => undefined);
    const blob = new Blob(['server,csv']);
    geneService.searchGenesPage.and.returnValue(of(geneSearchPage(rows)));
    geneService.downloadGeneSearch.and.returnValue(of({ blob, filename: 'gene-results.csv' }));
    component.searchControl.setValue('gene');

    component.onSubmit();
    fixture.detectChanges();
    await fixture.whenStable();
    component.exportResults();

    expect(geneService.downloadGeneSearch).toHaveBeenCalledOnceWith({ searchTerm: 'gene' });
    expect(exportState.blob).toBe(blob);
  });
});
