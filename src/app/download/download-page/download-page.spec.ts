import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NEVER, of } from 'rxjs';
import { GenomeSearchService } from '../../genome/services/genome-search.service';
import { AssemblyDownloadSetService } from '../assembly-download-set.service';
import { DownloadColumnCatalog, DownloadService } from '../download.service';
import { DownloadPage } from './download-page';

const STORAGE_KEY = 'g4vista.assemblyDownloadSet';
const COLUMN_CATALOG: DownloadColumnCatalog = {
  catalog_version: '2026-06-15',
  schema_version: 'quadruplex-sequence-v1',
  index_table: 'quadruplex_sequence_download_index',
  default_columns: ['assembly_accession', 'quadruplex_type', 'start'],
  all_columns: [
    'assembly_accession',
    'quadruplex_type',
    'start',
    'sequence',
    'gene_ids',
    'gene_names',
    'gene_biotypes',
    'relation_categories',
    'feature_types',
    'feature_ids',
  ],
  columns: [
    {
      id: 'assembly_accession',
      label: 'Assembly accession',
      type: 'string',
      category: 'assembly',
      description: 'NCBI assembly accession.',
      default_visible: true,
      exportable: true,
      source_table: 'quadruplex_sequence_download_index',
      source_field: 'assembly_accession',
    },
    {
      id: 'quadruplex_type',
      label: 'Quadruplex type',
      type: 'string',
      category: 'quadruplex sequence',
      description: 'Detected quadruplex sequence type.',
      default_visible: true,
      exportable: true,
      source_table: 'quadruplex_sequence_download_index',
      source_field: 'quadruplex_type',
    },
    {
      id: 'start',
      label: 'Start',
      type: 'integer',
      category: 'quadruplex sequence',
      description: 'Start coordinate.',
      default_visible: true,
      exportable: true,
      source_table: 'quadruplex_sequence_download_index',
      source_field: 'start',
    },
    {
      id: 'sequence',
      label: 'Sequence',
      type: 'string',
      category: 'quadruplex sequence',
      description: 'Predicted nucleotide sequence.',
      default_visible: false,
      exportable: true,
      source_table: 'quadruplex_sequence_download_index',
      source_field: 'sequence',
    },
    {
      id: 'gene_ids',
      label: 'Gene IDs',
      type: 'string',
      category: 'gene relation',
      description: 'Gene identifiers related to the quadruplex sequence.',
      default_visible: false,
      exportable: true,
      source_table: 'quadruplex_sequence_download_index',
      source_field: 'gene_ids',
    },
    {
      id: 'gene_names',
      label: 'Gene names',
      type: 'string',
      category: 'gene relation',
      description: 'Gene names aligned by position with gene_ids.',
      default_visible: false,
      exportable: true,
      source_table: 'quadruplex_sequence_download_index',
      source_field: 'gene_names',
    },
    {
      id: 'gene_biotypes',
      label: 'Gene biotypes',
      type: 'string',
      category: 'gene relation',
      description: 'Gene biotypes aligned by position with gene_ids.',
      default_visible: false,
      exportable: true,
      source_table: 'quadruplex_sequence_download_index',
      source_field: 'gene_biotypes',
    },
    {
      id: 'relation_categories',
      label: 'Relation categories',
      type: 'string',
      category: 'gene relation',
      description: 'Relation categories aligned by position with gene_ids.',
      default_visible: false,
      exportable: true,
      source_table: 'quadruplex_sequence_download_index',
      source_field: 'relation_categories',
    },
    {
      id: 'feature_types',
      label: 'Feature types',
      type: 'string',
      category: 'feature relation',
      description:
        'Gene-aligned feature type values; positions match gene_ids, gene_names, gene_biotypes, relation_categories, and feature_ids.',
      default_visible: false,
      exportable: true,
      source_table: 'quadruplex_sequence_download_index',
      source_field: 'feature_types',
    },
    {
      id: 'feature_ids',
      label: 'Feature IDs',
      type: 'string',
      category: 'feature relation',
      description:
        'Gene-aligned feature identifiers; positions match gene_ids, gene_names, gene_biotypes, relation_categories, and feature_types.',
      default_visible: false,
      exportable: true,
      source_table: 'quadruplex_sequence_download_index',
      source_field: 'feature_ids',
    },
  ],
};

describe('DownloadPage', () => {
  let fixture: ComponentFixture<DownloadPage>;
  let component: DownloadPage;
  let assemblySet: AssemblyDownloadSetService;
  let downloadService: jasmine.SpyObj<DownloadService>;
  let genomeSearchService: jasmine.SpyObj<GenomeSearchService>;

  beforeEach(async () => {
    window.localStorage.removeItem(STORAGE_KEY);
    downloadService = jasmine.createSpyObj<DownloadService>('DownloadService', [
      'getColumnCatalog',
      'createDownload',
    ]);
    genomeSearchService = jasmine.createSpyObj<GenomeSearchService>('GenomeSearchService', [
      'searchGenome',
    ]);
    downloadService.getColumnCatalog.and.returnValue(of(COLUMN_CATALOG));
    downloadService.createDownload.and.returnValue(NEVER);
    genomeSearchService.searchGenome.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [DownloadPage],
      providers: [
        provideRouter([]),
        { provide: DownloadService, useValue: downloadService },
        { provide: GenomeSearchService, useValue: genomeSearchService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DownloadPage);
    component = fixture.componentInstance;
    assemblySet = TestBed.inject(AssemblyDownloadSetService);
    fixture.detectChanges();
  });

  afterEach(() => {
    window.localStorage.removeItem(STORAGE_KEY);
  });

  it('loads catalog defaults and renders taxonomy-added assemblies', () => {
    assemblySet.addItems([
      {
        assembly_accession: 'GCF_1',
        organism_name: 'Test organism',
        asm_name: 'ASM_TEST',
        source_taxon_id: 2,
        source_taxon_name: 'Bacteria',
      },
    ]);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;

    expect(component.selectedColumnIds()).toEqual(COLUMN_CATALOG.default_columns);
    expect(component.selectedColumnCount()).toBe(3);
    expect(host.textContent).toContain('GCF_1');
    expect(host.textContent).toContain('Test organism');
    expect(component.canCreateDownload()).toBeTrue();
  });

  it('renders relation category filters as visible multi-select options', () => {
    const host = fixture.nativeElement as HTMLElement;
    const relationFilter = host.querySelector('.filter-core .relation-category-filter');

    expect(relationFilter).not.toBeNull();
    expect(relationFilter?.textContent).toContain('Gene context categories');
    expect(relationFilter?.querySelectorAll('mat-checkbox').length).toBe(3);
    expect(relationFilter?.textContent).toContain('Inside genes');
    expect(relationFilter?.textContent).toContain('Upstream of genes');
    expect(relationFilter?.textContent).toContain('Downstream of genes');
    expect(component.selectedRelationCategories()).toEqual(['gene_inside']);
  });

  it('defaults relation category filters to inside genes', () => {
    assemblySet.addItems([
      {
        assembly_accession: 'GCF_1',
        organism_name: 'Test organism',
        asm_name: 'ASM_TEST',
        source_taxon_id: null,
        source_taxon_name: null,
      },
    ]);

    component.createDownload();

    expect(downloadService.createDownload).toHaveBeenCalledOnceWith(
      jasmine.objectContaining({
        filters: jasmine.objectContaining({
          relation_categories: ['gene_inside'],
        }),
      }),
    );
  });

  it('keeps at least one relation category selected', () => {
    expect(component.selectedRelationCategories()).toEqual(['gene_inside']);

    component.toggleRelationCategory('gene_inside', {
      checked: false,
    } as Parameters<DownloadPage['toggleRelationCategory']>[1]);

    expect(component.selectedRelationCategories()).toEqual(['gene_inside']);

    component.toggleRelationCategory('gene_upstream', {
      checked: true,
    } as Parameters<DownloadPage['toggleRelationCategory']>[1]);
    component.toggleRelationCategory('gene_inside', {
      checked: false,
    } as Parameters<DownloadPage['toggleRelationCategory']>[1]);

    expect(component.selectedRelationCategories()).toEqual(['gene_upstream']);

    component.toggleRelationCategory('gene_upstream', {
      checked: false,
    } as Parameters<DownloadPage['toggleRelationCategory']>[1]);

    expect(component.selectedRelationCategories()).toEqual(['gene_inside']);
  });

  it('adds a searched assembly to the shared download set', () => {
    component.addAssemblyFromSearchResult({
      assembly_accession: 'GCF_000001405.40',
      asm_name: 'GRCh38.p14',
      organism_name: 'Homo sapiens',
      matched_taxonomy_name: 'Mammalia',
      matched_taxonomy_taxon_id: 40674,
      matched_taxonomy_rank: 'class',
      species_name: 'Homo sapiens',
      species_taxon_id: 9606,
      strain_name: null,
      strain_taxon_id: null,
    });

    expect(assemblySet.accessions()).toEqual(['GCF_000001405.40']);
    expect(assemblySet.items()[0].source_taxon_name).toBe('Mammalia');
  });

  it('submits the complete download request contract', () => {
    component.setDataScopeMode('taxon_or_region');
    component.setDownloadMode('tsv');
    component.setColumnSelectionMode('custom');
    component.selectedColumnIds.set(['assembly_accession', 'start']);
    component.taxonIdsInput.set('3702');
    component.speciesTaxonIdsInput.set('3702');
    component.regionIdsInput.set('chr1, chr2');
    component.selectedMotifTypes.set(['g4']);
    component.geneIdsInput.set('geneA geneB');
    component.geneSearchTermInput.set('dnaA');
    component.selectedRelationCategories.set(['gene_inside', 'gene_upstream']);
    component.selectedFlankWindows.set([0, 200]);
    component.minOverlapBpInput.set('2');
    component.minOverlapFractionInput.set('0.5');
    component.tetradsInput.set('2, 3');
    component.minScoreInput.set('10');
    component.maxScoreInput.set('50');
    component.setSortField('start');
    component.setSortOrder('desc');

    component.createDownload();

    expect(downloadService.createDownload).toHaveBeenCalledOnceWith({
      mode: 'tsv',
      columns: ['assembly_accession', 'start'],
      filters: {
        assembly_accessions: [],
        taxon_ids: [3702],
        species_taxon_ids: [3702],
        region_ids: ['chr1', 'chr2'],
        quadruplex_types: ['g4'],
        gene_ids: ['geneA', 'geneB'],
        gene_search_term: 'dnaA',
        relation_categories: ['gene_inside', 'gene_upstream'],
        flank_windows: [0, 200],
        min_overlap_bp: 2,
        min_overlap_fraction: 0.5,
        tetrads: [2, 3],
        min_score: 10,
        max_score: 50,
      },
      sort: 'start',
      order: 'desc',
    });
  });

  it('reports invalid numeric filters before submitting', () => {
    assemblySet.addItems([
      {
        assembly_accession: 'GCF_1',
        organism_name: 'Test organism',
        asm_name: 'ASM_TEST',
        source_taxon_id: null,
        source_taxon_name: null,
      },
    ]);
    component.tetradsInput.set('2, bad');

    component.createDownload();

    expect(component.errorMessage()).toContain('Tetrads');
    expect(downloadService.createDownload).not.toHaveBeenCalled();
  });

  it('requires an explicit valid data scope before download creation', () => {
    expect(component.canCreateDownload()).toBeFalse();

    component.setDataScopeMode('taxon_or_region');
    component.taxonIdsInput.set('3702');

    expect(component.canCreateDownload()).toBeTrue();

    component.setDataScopeMode('all_records');

    expect(component.canCreateDownload()).toBeFalse();

    component.allRecordsConfirmed.set(true);

    expect(component.canCreateDownload()).toBeTrue();
  });

  it('disables download creation when motif types or custom columns are empty', () => {
    assemblySet.addItems([
      {
        assembly_accession: 'GCF_1',
        organism_name: 'Test organism',
        asm_name: 'ASM_TEST',
        source_taxon_id: null,
        source_taxon_name: null,
      },
    ]);

    expect(component.canCreateDownload()).toBeTrue();

    component.selectedMotifTypes.set([]);

    expect(component.canCreateDownload()).toBeFalse();

    component.selectedMotifTypes.set(['g4']);
    component.setColumnSelectionMode('custom');
    component.selectedColumnIds.set([]);

    expect(component.canCreateDownload()).toBeFalse();
  });
});
