import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { GeneService } from '../../../gene/services/gene.service';
import { GenomeInfoComponent } from './genome-info.component';
import { GenomeAssemblyDetail, GenomeDetailService } from '../../services/genome-detail.service';
import {
  EMPTY_G4_PAGE,
  EMPTY_G4_POSITION_DISTRIBUTION,
  EMPTY_G4_POSITION_STATISTICS,
  G4_GENE_POSITION_OPTIONS_BY_TYPE,
  G4GeneRelationsResponse,
  G4PageResponse,
  G4Service,
} from '../../services/g4.service';
import { GenomeViewerConfigService, GenomeViewerStateService } from '../../viewer';

describe('GenomeInfoComponent', () => {
  const assemblyDetail: GenomeAssemblyDetail = {
    assembly_accession: 'GCF_1',
    organism_name: 'Test organism',
    asm_name: 'ASM_TEST',
    species_name: 'Testus organismus',
    seq_rel_date: '2026-01-01',
    seqids: ['chr1', 'chr2'],
    seqid_lengths: {
      chr1: 10_000,
      chr2: 20_000,
    },
    regions: [
      {
        seqid: 'chr1',
        accession_name: 'Main chromosome',
        fna_header: 'chr1 FASTA header',
        region_length: 10_000,
      },
      {
        seqid: 'chr2',
        accession_name: 'Plasmid pTest',
        fna_header: 'chr2 plasmid FASTA header',
        region_length: 20_000,
      },
    ],
    taxon_id: 1,
    default_gene_flank_window: 1000,
  };
  const secondAssemblyDetail: GenomeAssemblyDetail = {
    assembly_accession: 'GCF_2',
    organism_name: 'Another organism',
    asm_name: 'ASM_TEST_2',
    species_name: 'Another organismus',
    seq_rel_date: '2026-01-02',
    seqids: ['chrA', 'chrB'],
    seqid_lengths: {
      chrA: 12_000,
      chrB: 24_000,
    },
    regions: [
      {
        seqid: 'chrA',
        accession_name: 'Chromosome A',
        fna_header: 'chrA FASTA header',
        region_length: 12_000,
      },
      {
        seqid: 'chrB',
        accession_name: 'Plasmid B',
        fna_header: 'chrB FASTA header',
        region_length: 24_000,
      },
    ],
    taxon_id: 2,
    default_gene_flank_window: 1000,
  };
  const chr1BrowsePage: G4PageResponse = {
    ...EMPTY_G4_PAGE,
    count: 1,
    tetrads_list: [2, 3],
    min_score: 10,
    max_score: 50,
    g4s: [
      {
        assembly_accession: 'GCF_1',
        seqid: 'chr1',
        g4_type: 'g4',
        start: 5,
        end: 20,
        length: 16,
        tetrads: 2,
        y1: 1,
        y2: 1,
        y3: 1,
        score: 15,
        sequence: 'GGGGTTGGGGTTGGGG',
      },
    ],
  };
  const chr2BrowsePage: G4PageResponse = {
    ...EMPTY_G4_PAGE,
    count: 1,
    tetrads_list: [2, 3],
    min_score: 11,
    max_score: 51,
    g4s: [
      {
        assembly_accession: 'GCF_1',
        seqid: 'chr2',
        g4_type: 'g4',
        start: 50,
        end: 70,
        length: 21,
        tetrads: 3,
        y1: 1,
        y2: 1,
        y3: 1,
        score: 18,
        sequence: 'GGGTTAGGGTTAGGGTTAGGG',
      },
    ],
  };
  const wholeGenomeBrowsePage: G4PageResponse = {
    count: 2,
    tetrads_list: [2, 3],
    min_score: 10,
    max_score: 51,
    g4s: [chr1BrowsePage.g4s[0], chr2BrowsePage.g4s[0]],
  };
  const geneSearchPage: G4PageResponse = {
    count: 2,
    tetrads_list: [2, 3],
    min_score: 15,
    max_score: 41,
    g4s: [
      {
        assembly_accession: 'GCF_1',
        seqid: 'chr1',
        g4_type: 'g4',
        start: 10,
        end: 25,
        length: 16,
        tetrads: 2,
        y1: 1,
        y2: 1,
        y3: 1,
        score: 22,
        sequence: 'GGGGTTGGGGTTGGGG',
      },
      {
        assembly_accession: 'GCF_1',
        seqid: 'chr2',
        g4_type: 'g4',
        start: 30,
        end: 44,
        length: 15,
        tetrads: 3,
        y1: 1,
        y2: 1,
        y3: 1,
        score: 41,
        sequence: 'GGGAGGGTTGGGAGG',
      },
    ],
  };

  let genomeDetailService: jasmine.SpyObj<GenomeDetailService>;
  let geneService: jasmine.SpyObj<GeneService>;
  let g4Service: jasmine.SpyObj<G4Service>;
  let genomeViewerConfigService: jasmine.SpyObj<GenomeViewerConfigService>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;
  let viewerState: GenomeViewerStateService;

  beforeEach(async () => {
    genomeDetailService = jasmine.createSpyObj<GenomeDetailService>('GenomeDetailService', [
      'getAssembly',
    ]);
    genomeDetailService.getAssembly.and.returnValue(of(assemblyDetail));

    geneService = jasmine.createSpyObj<GeneService>('GeneService', ['getGene']);
    geneService.getGene.and.returnValue(
      of({
        assembly_accession: 'GCF_1',
        seqid: 'chr1',
        source: null,
        feature: 'gene',
        feature_start: null,
        feature_end: null,
        strand: null,
        phase: null,
        feature_id: 'dnaK',
        gene_name: 'dnaK',
        gene_id: 'GENE1',
        parent_id: null,
        locus_tag: null,
        description: null,
        gene_biotype: 'protein_coding',
        feature_key: 'dnaK',
        insideOf_gene_g4: [],
        insideOf_genes_upstream_100bp_g4: [],
        insideOf_genes_downstream_100bp_g4: [],
        insideOf_genes_upstream_200bp_g4: [],
        insideOf_genes_downstream_200bp_g4: [],
        insideOf_genes_upstream_300bp_g4: [],
        insideOf_genes_downstream_300bp_g4: [],
        insideOf_genes_upstream_500bp_g4: [],
        insideOf_genes_downstream_500bp_g4: [],
        insideOf_genes_upstream_1k_g4: [],
        insideOf_genes_upstream_2k_g4: [],
        insideOf_genes_upstream_3k_g4: [],
        insideOf_genes_upstream_4k_g4: [],
        insideOf_genes_upstream_5k_g4: [],
        insideOf_genes_downstream_1k_g4: [],
        insideOf_genes_downstream_2k_g4: [],
        insideOf_genes_downstream_3k_g4: [],
        insideOf_genes_downstream_4k_g4: [],
        insideOf_genes_downstream_5k_g4: [],
        insideOf_gene_i_motif: [],
        insideOf_genes_upstream_100bp_i_motif: [],
        insideOf_genes_downstream_100bp_i_motif: [],
        insideOf_genes_upstream_200bp_i_motif: [],
        insideOf_genes_downstream_200bp_i_motif: [],
        insideOf_genes_upstream_300bp_i_motif: [],
        insideOf_genes_downstream_300bp_i_motif: [],
        insideOf_genes_upstream_500bp_i_motif: [],
        insideOf_genes_downstream_500bp_i_motif: [],
        insideOf_genes_upstream_1k_i_motif: [],
        insideOf_genes_upstream_2k_i_motif: [],
        insideOf_genes_upstream_3k_i_motif: [],
        insideOf_genes_upstream_4k_i_motif: [],
        insideOf_genes_upstream_5k_i_motif: [],
        insideOf_genes_downstream_1k_i_motif: [],
        insideOf_genes_downstream_2k_i_motif: [],
        insideOf_genes_downstream_3k_i_motif: [],
        insideOf_genes_downstream_4k_i_motif: [],
        insideOf_genes_downstream_5k_i_motif: [],
      }),
    );

    g4Service = jasmine.createSpyObj<G4Service>('G4Service', [
      'getG4Page',
      'getAssemblyG4Page',
      'getGeneSearchPage',
      'getGeneCandidates',
      'getGeneRelations',
      'getPositionDistribution',
      'getPositionStatistics',
      'downloadG4Table',
    ]);
    g4Service.getG4Page.and.callFake(({ seqid, pageSize }) =>
      of(
        seqid === 'chr2'
          ? {
              ...chr2BrowsePage,
              g4s: pageSize === 1 ? [chr2BrowsePage.g4s[0]] : chr2BrowsePage.g4s,
            }
          : {
              ...chr1BrowsePage,
              g4s: pageSize === 1 ? [chr1BrowsePage.g4s[0]] : chr1BrowsePage.g4s,
            },
      ),
    );
    g4Service.getAssemblyG4Page.and.callFake(({ pageSize }) =>
      of({
        ...wholeGenomeBrowsePage,
        g4s: pageSize === 1 ? [wholeGenomeBrowsePage.g4s[0]] : wholeGenomeBrowsePage.g4s,
        count: pageSize === 1 ? 1 : wholeGenomeBrowsePage.count,
      }),
    );
    g4Service.getGeneSearchPage.and.callFake(({ pageSize }) =>
      of({
        ...geneSearchPage,
        g4s: pageSize === 1 ? [geneSearchPage.g4s[0]] : geneSearchPage.g4s,
        count: pageSize === 1 ? 1 : geneSearchPage.count,
      }),
    );
    g4Service.getGeneCandidates.and.returnValue(of([]));
    g4Service.downloadG4Table.and.returnValue(
      of({ blob: new Blob(['test']), filename: 'GCF_1_whole-genome_g4_sites.tsv' }),
    );
    g4Service.getGeneRelations.and.callFake(({ seqid, starts }) =>
      of<G4GeneRelationsResponse>({
        relations: starts.map((start) => ({
          start,
          positions: {
            insideOf_gene_g4: [
              {
                feature_id: `${seqid}-gene-${start}`,
                label: `${seqid.toUpperCase()} gene ${start}`,
                gene_biotype: 'protein_coding',
              },
            ],
          },
        })),
      }),
    );
    g4Service.getPositionDistribution.and.returnValue(
      of({
        ...EMPTY_G4_POSITION_DISTRIBUTION,
        assembly_accession: 'GCF_1',
        g4_type: 'g4',
        total_count: 5,
        categories: [
          {
            key: 'gene_inside',
            label: 'Gene inside',
            count: 2,
            ratio: 0.4,
            precedence_rank: 1,
            description: 'Gene hit',
          },
          {
            key: 'gene_upstream',
            label: 'Gene upstream',
            count: 1,
            ratio: 0.2,
            precedence_rank: 2,
            description: 'Upstream hit',
          },
          {
            key: 'gene_downstream',
            label: 'Gene downstream',
            count: 1,
            ratio: 0.2,
            precedence_rank: 3,
            description: 'Downstream hit',
          },
          {
            key: 'other',
            label: 'Other',
            count: 1,
            ratio: 0.2,
            precedence_rank: 4,
            description: 'Outside genes and selected flanks',
          },
        ],
        feature_breakdown: [
          {
            feature_type: 'promoter',
            unique_g4_count: 1,
            relation_count: 1,
            ratio_of_total: 0.2,
            is_root_feature: true,
          },
        ],
      }),
    );
    g4Service.getPositionStatistics.and.returnValue(
      of({
        ...EMPTY_G4_POSITION_STATISTICS,
        assembly_accession: 'GCF_1',
        genome_length_bp: 30_000,
        genome_length_mb: 0.03,
        filters: {
          windows: [1000],
          g4_type: 'g4',
          tetrads: [],
          min_score: null,
          max_score: null,
        },
        windows: [
          {
            window_bp: 1000,
            categories: [
              {
                key: 'gene_inside',
                label: 'Gene inside',
                description: 'Gene hit',
                precedence_rank: 1,
                merged_interval_length_bp: 1000,
                length_mb: 0.001,
                motifs: {
                  g4: {
                    count: 2,
                    density_per_mb: 2000,
                    expected_vs_genome: 1,
                    fold_vs_genome: 2,
                    fold_vs_other: 3,
                    fold_vs_non_feature: 3,
                    min_score: 10,
                    q1_score: 15,
                    median_score: 20,
                    p75_score: 40,
                    max_score: 50,
                    min_tetrads: 2,
                    q1_tetrads: 2,
                    median_tetrads: 3,
                    p75_tetrads: 4,
                    max_tetrads: 5,
                    min_length: 20,
                    q1_length: 22,
                    median_length: 24,
                    p75_length: 32,
                    max_length: 40,
                  },
                },
                asymmetry: {
                  g4_fraction: 2 / 3,
                  i_motif_fraction: 1 / 3,
                  fraction_delta: 1 / 3,
                  count_delta: 1,
                  density_ratio_g4_over_i_motif: 2,
                },
              },
            ],
            gene_biotype_breakdown: [],
          },
        ],
      }),
    );

    genomeViewerConfigService = jasmine.createSpyObj<GenomeViewerConfigService>(
      'GenomeViewerConfigService',
      ['createViewerConfig', 'resolveDefaultRegion'],
    );
    genomeViewerConfigService.createViewerConfig.and.returnValue({
      assembly: { name: 'GCF_1' },
      tracks: [],
      configuration: {
        rpc: {
          defaultDriver: 'WebWorkerRpcDriver',
        },
        theme: {
          name: 'G4Vista Light',
          mode: 'light',
          palette: {
            primary: { main: '#311b92' },
            secondary: { main: '#0097a7' },
            tertiary: { main: '#f57c00' },
            quaternary: { main: '#d50000' },
            background: { default: '#fdfbff', paper: '#f9f9ff' },
            text: { primary: '#1a1b1f', secondary: '#46464a' },
          },
        },
        extraThemes: {},
      },
      defaultVisibleTrackIds: [],
      motifTrackIds: [],
    });
    genomeViewerConfigService.resolveDefaultRegion.and.returnValue(of('chr1:1..1000'));
    snackBar = jasmine.createSpyObj<MatSnackBar>('MatSnackBar', ['open']);

    await TestBed.configureTestingModule({
      imports: [GenomeInfoComponent],
      providers: [
        { provide: GenomeDetailService, useValue: genomeDetailService },
        { provide: GeneService, useValue: geneService },
        { provide: G4Service, useValue: g4Service },
        { provide: GenomeViewerConfigService, useValue: genomeViewerConfigService },
        { provide: MatSnackBar, useValue: snackBar },
      ],
    })
      .overrideComponent(GenomeInfoComponent, {
        set: { template: '' },
      })
      .compileComponents();

    viewerState = TestBed.inject(GenomeViewerStateService);
  });

  function createComponent() {
    const fixture = TestBed.createComponent(GenomeInfoComponent);
    fixture.componentRef.setInput('assemblyAccession', 'GCF_1');
    fixture.componentRef.setInput('dataBaseUrl', 'http://example.test/data');
    fixture.detectChanges();
    return fixture;
  }

  it('derives search scope options directly from the current g4 type enum', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;

    expect(component.genePositionOptions().map((option) => option.value)).toEqual(
      G4_GENE_POSITION_OPTIONS_BY_TYPE.g4.map((option) => option.value),
    );

    component.selectG4Type('i-motif');
    fixture.detectChanges();

    expect(component.genePositionOptions().map((option) => option.value)).toEqual(
      G4_GENE_POSITION_OPTIONS_BY_TYPE['i-motif'].map((option) => option.value),
    );
  });

  it('displays empty gene candidate biotypes as Other', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;

    expect(
      component.geneOptionLabel({
        feature_id: 'geneA',
        seqid: 'chr1',
        gene_name: 'dnaA',
        locus_tag: null,
        gene_biotype: '',
      }),
    ).toBe('dnaA · geneA · chr1 · Other');
    expect(
      component.displayGeneCandidate({
        feature_id: 'geneA',
        seqid: 'chr1',
        gene_name: 'dnaA',
        locus_tag: null,
        gene_biotype: 'other',
      }),
    ).toBe('dnaA (geneA) [chr1] · Other');
  });

  it('ignores invalid g4 type toggle values', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;

    component.selectG4Type(null);
    fixture.detectChanges();

    expect(component.g4Type()).toBe('g4');
    expect(component.defaultGenePosition()).toBe(G4_GENE_POSITION_OPTIONS_BY_TYPE.g4[0].value);
  });

  it('uses whole-genome browse by default and initializes chart/JBrowse to the first sequence record', async () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component.browseScope()).toBe(component.wholeGenomeScope);
    expect(component.displayedAccessionIdValue()).toBe(component.wholeGenomeScope);
    expect(component.displayedAccessionIdLabel()).toBe('Whole genome');
    expect(component.showAccessionIdColumn()).toBeTrue();
    expect(g4Service.getAssemblyG4Page).toHaveBeenCalledWith(
      jasmine.objectContaining({
        assemblyAccession: 'GCF_1',
        g4Type: 'g4',
        pageSize: 10,
      }),
    );
    expect(component.chartSeqid()).toBe('chr1');
    expect(component.chartViewport()).toEqual({
      start: 1,
      end: 10_000,
      binSize: 100,
    });
    expect(viewerState.region()).toBe('chr1:1..10000');
  });

  it('uses the server-provided filename for table downloads', async () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;
    await fixture.whenStable();
    fixture.detectChanges();

    const filename = 'GCF_1_whole-genome_g4_score-ge10_sites.tsv';
    const blob = new Blob(['test']);
    const anchor = document.createElement('a');
    const clickSpy = spyOn(anchor, 'click');
    spyOn(URL, 'createObjectURL').and.returnValue('blob:g4-download');
    spyOn(URL, 'revokeObjectURL');
    spyOn(document, 'createElement').and.returnValue(anchor);
    g4Service.downloadG4Table.and.returnValue(of({ blob, filename }));

    component.downloadTable(['seqid']);

    expect(g4Service.downloadG4Table).toHaveBeenCalledWith(
      jasmine.objectContaining({
        assemblyAccession: 'GCF_1',
        g4Type: 'g4',
        columns: ['seqid'],
      }),
    );
    expect(anchor.download).toBe(filename);
    expect(clickSpy).toHaveBeenCalled();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:g4-download');
  });

  it('loads position distribution and statistics from independent whole-genome controls only', async () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;
    await fixture.whenStable();
    fixture.detectChanges();

    expect(g4Service.getPositionDistribution).toHaveBeenCalledWith(
      jasmine.objectContaining({
        assemblyAccession: 'GCF_1',
        g4Type: 'g4',
        flankWindow: 1000,
        tetrads: [],
        minScore: undefined,
        maxScore: undefined,
        includeFeatureBreakdown: false,
      }),
    );
    expect(g4Service.getPositionStatistics).toHaveBeenCalledWith(
      jasmine.objectContaining({
        assemblyAccession: 'GCF_1',
        windows: [1000],
        g4Type: 'g4',
        tetrads: [],
        minScore: undefined,
        maxScore: undefined,
        includeGeneBiotypeBreakdown: true,
      }),
    );

    g4Service.getPositionDistribution.calls.reset();
    g4Service.getPositionStatistics.calls.reset();
    component.filterModel.update((current) => ({
      ...current,
      selectedTetrads: [3],
      minScore: '12',
      maxScore: '40',
    }));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(g4Service.getPositionDistribution).not.toHaveBeenCalled();
    expect(g4Service.getPositionStatistics).not.toHaveBeenCalled();

    component.submitFilters();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(g4Service.getPositionDistribution).not.toHaveBeenCalled();
    expect(g4Service.getPositionStatistics).not.toHaveBeenCalled();

    component.setPositionDistributionFilterModel({
      selectedTetrads: [3],
      minScore: '12',
      maxScore: '40',
    });
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(g4Service.getPositionDistribution).not.toHaveBeenCalled();
    expect(g4Service.getPositionStatistics).not.toHaveBeenCalled();

    component.submitPositionDistributionFilters();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(g4Service.getPositionDistribution).toHaveBeenCalledWith(
      jasmine.objectContaining({
        assemblyAccession: 'GCF_1',
        g4Type: 'g4',
        flankWindow: 1000,
        tetrads: [3],
        minScore: 12,
        maxScore: 40,
        includeFeatureBreakdown: false,
      }),
    );
    expect(g4Service.getPositionStatistics).toHaveBeenCalledWith(
      jasmine.objectContaining({
        assemblyAccession: 'GCF_1',
        windows: [1000],
        g4Type: 'g4',
        tetrads: [3],
        minScore: 12,
        maxScore: 40,
        includeGeneBiotypeBreakdown: true,
      }),
    );

    g4Service.getPositionDistribution.calls.reset();
    g4Service.getPositionStatistics.calls.reset();
    component.resetPositionDistributionFilters();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(g4Service.getPositionDistribution).toHaveBeenCalledWith(
      jasmine.objectContaining({
        assemblyAccession: 'GCF_1',
        g4Type: 'g4',
        flankWindow: 1000,
        tetrads: [],
        minScore: undefined,
        maxScore: undefined,
        includeFeatureBreakdown: false,
      }),
    );
    expect(g4Service.getPositionStatistics).toHaveBeenCalledWith(
      jasmine.objectContaining({
        assemblyAccession: 'GCF_1',
        windows: [1000],
        g4Type: 'g4',
        tetrads: [],
        minScore: undefined,
        maxScore: undefined,
        includeGeneBiotypeBreakdown: true,
      }),
    );

    g4Service.getPositionDistribution.calls.reset();
    g4Service.getPositionStatistics.calls.reset();

    component.selectG4Type('i-motif');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(g4Service.getPositionDistribution).not.toHaveBeenCalled();
    expect(g4Service.getPositionStatistics).not.toHaveBeenCalled();

    component.setPositionDistributionFlankWindow(500);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(g4Service.getPositionDistribution).toHaveBeenCalledWith(
      jasmine.objectContaining({
        assemblyAccession: 'GCF_1',
        g4Type: 'g4',
        flankWindow: 500,
        tetrads: [],
        includeFeatureBreakdown: false,
      }),
    );
    expect(g4Service.getPositionStatistics).toHaveBeenCalledWith(
      jasmine.objectContaining({
        assemblyAccession: 'GCF_1',
        windows: [500],
        g4Type: 'g4',
        tetrads: [],
        includeGeneBiotypeBreakdown: true,
      }),
    );
    expect(component.positionDistributionFlankWindowLabel()).toBe('500 bp');

    g4Service.getPositionDistribution.calls.reset();
    g4Service.getPositionStatistics.calls.reset();
    component.setPositionDistributionG4Type('i-motif');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(g4Service.getPositionDistribution).toHaveBeenCalledWith(
      jasmine.objectContaining({
        assemblyAccession: 'GCF_1',
        g4Type: 'i-motif',
        flankWindow: 500,
        tetrads: [],
        includeFeatureBreakdown: false,
      }),
    );
    expect(g4Service.getPositionStatistics).toHaveBeenCalledWith(
      jasmine.objectContaining({
        assemblyAccession: 'GCF_1',
        windows: [500],
        g4Type: 'i-motif',
        tetrads: [],
        includeGeneBiotypeBreakdown: true,
      }),
    );
  });

  it('displays accession names and filters options without changing seqid values', async () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component.displayedAccessionIdValue()).toBe(component.wholeGenomeScope);
    expect(component.displayedRegionFnaHeader()).toBe('');
    expect(component.allAccessionIdOptions().map((option) => option.label)).toEqual([
      'Whole genome',
      'Main chromosome',
      'Plasmid pTest',
    ]);
    expect(component.allAccessionIdOptions().map((option) => option.value)).toEqual([
      component.wholeGenomeScope,
      'chr1',
      'chr2',
    ]);

    component.onAccessionFilterInput({ target: { value: 'plasmid' } } as unknown as Event);
    fixture.detectChanges();

    expect(component.accessionIdOptions().map((option) => option.value)).toEqual(['chr2']);
    expect(component.accessionIdOptions().map((option) => option.label)).toEqual(['Plasmid pTest']);

    component.onAccessionFilterInput({ target: { value: 'chr1' } } as unknown as Event);
    fixture.detectChanges();

    expect(component.accessionIdOptions().map((option) => option.value)).toEqual(['chr1']);
    expect(component.accessionIdOptions()[0].label).toBe('Main chromosome');

    component.clearAccessionFilter();
    fixture.detectChanges();

    expect(component.accessionFilter()).toBe('');
    expect(component.accessionIdOptions().length).toBe(3);
  });

  it('switches to another Accession ID and applies its full range viewport', async () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;
    await fixture.whenStable();
    fixture.detectChanges();

    g4Service.getG4Page.calls.reset();

    component.selectBrowseScope('chr2');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component.browseScope()).toBe('chr2');
    expect(component.displayedAccessionIdValue()).toBe('chr2');
    expect(component.displayedAccessionIdLabel()).toBe('Plasmid pTest');
    expect(component.displayedRegionFnaHeader()).toBe('chr2 plasmid FASTA header');
    expect(g4Service.getG4Page.calls.allArgs()).toContain([
      jasmine.objectContaining({
        assemblyAccession: 'GCF_1',
        g4Type: 'g4',
        seqid: 'chr2',
        pageSize: 10,
      }),
    ]);
    expect(component.chartSeqid()).toBe('chr2');
    expect(component.chartViewport()).toEqual({
      start: 1,
      end: 20_000,
      binSize: 200,
    });
    expect(viewerState.region()).toBe('chr2:1..20000');
  });

  it('switches to Whole genome browse and displays the first sequence record full range', async () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;
    await fixture.whenStable();
    fixture.detectChanges();

    component.selectBrowseScope('chr2');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    g4Service.getAssemblyG4Page.calls.reset();
    component.selectBrowseScope(component.wholeGenomeScope);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component.browseScope()).toBe(component.wholeGenomeScope);
    expect(component.displayedAccessionIdValue()).toBe(component.wholeGenomeScope);
    expect(component.showAccessionIdColumn()).toBeTrue();
    expect(g4Service.getAssemblyG4Page.calls.allArgs()).toContain([
      jasmine.objectContaining({
        assemblyAccession: 'GCF_1',
        g4Type: 'g4',
        pageSize: 10,
      }),
    ]);
    expect(viewerState.region()).toBe('chr1:1..10000');
    expect(component.chartSeqid()).toBe('chr1');
    expect(component.chartViewport()).toEqual({
      start: 1,
      end: 10_000,
      binSize: 100,
    });
  });

  it('uses the first sequence record full range when default region is invalid', async () => {
    genomeViewerConfigService.resolveDefaultRegion.and.returnValue(of('1..1000'));

    const fixture = createComponent();
    const component = fixture.componentInstance;
    await fixture.whenStable();
    fixture.detectChanges();

    component.selectBrowseScope(component.wholeGenomeScope);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(viewerState.region()).toBe('chr1:1..10000');
    expect(component.chartSeqid()).toBe('chr1');
    expect(component.chartViewport()).toEqual({
      start: 1,
      end: 10_000,
      binSize: 100,
    });
  });

  it('applies gene search after selecting a candidate and keeps browse scope after gene reset', async () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;
    await fixture.whenStable();
    fixture.detectChanges();

    component.selectBrowseScope('chr2');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    g4Service.getGeneSearchPage.calls.reset();
    g4Service.getG4Page.calls.reset();
    g4Service.getGeneRelations.calls.reset();
    geneService.getGene.and.returnValue(
      of({
        assembly_accession: 'GCF_1',
        seqid: 'chr2',
        source: null,
        feature: 'gene',
        feature_start: 6000,
        feature_end: 8000,
        strand: null,
        phase: null,
        feature_id: 'dnaK',
        gene_name: 'dnaK',
        gene_id: 'GENE_DNAK',
        parent_id: null,
        locus_tag: null,
        description: null,
        gene_biotype: 'protein_coding',
        feature_key: 'dnaK',
        insideOf_gene_g4: [],
        insideOf_genes_upstream_100bp_g4: [],
        insideOf_genes_downstream_100bp_g4: [],
        insideOf_genes_upstream_200bp_g4: [],
        insideOf_genes_downstream_200bp_g4: [],
        insideOf_genes_upstream_300bp_g4: [],
        insideOf_genes_downstream_300bp_g4: [],
        insideOf_genes_upstream_500bp_g4: [],
        insideOf_genes_downstream_500bp_g4: [],
        insideOf_genes_upstream_1k_g4: [],
        insideOf_genes_upstream_2k_g4: [],
        insideOf_genes_upstream_3k_g4: [],
        insideOf_genes_upstream_4k_g4: [],
        insideOf_genes_upstream_5k_g4: [],
        insideOf_genes_downstream_1k_g4: [],
        insideOf_genes_downstream_2k_g4: [],
        insideOf_genes_downstream_3k_g4: [],
        insideOf_genes_downstream_4k_g4: [],
        insideOf_genes_downstream_5k_g4: [],
        insideOf_gene_i_motif: [],
        insideOf_genes_upstream_100bp_i_motif: [],
        insideOf_genes_downstream_100bp_i_motif: [],
        insideOf_genes_upstream_200bp_i_motif: [],
        insideOf_genes_downstream_200bp_i_motif: [],
        insideOf_genes_upstream_300bp_i_motif: [],
        insideOf_genes_downstream_300bp_i_motif: [],
        insideOf_genes_upstream_500bp_i_motif: [],
        insideOf_genes_downstream_500bp_i_motif: [],
        insideOf_genes_upstream_1k_i_motif: [],
        insideOf_genes_upstream_2k_i_motif: [],
        insideOf_genes_upstream_3k_i_motif: [],
        insideOf_genes_upstream_4k_i_motif: [],
        insideOf_genes_upstream_5k_i_motif: [],
        insideOf_genes_downstream_1k_i_motif: [],
        insideOf_genes_downstream_2k_i_motif: [],
        insideOf_genes_downstream_3k_i_motif: [],
        insideOf_genes_downstream_4k_i_motif: [],
        insideOf_genes_downstream_5k_i_motif: [],
      }),
    );

    component.selectGeneCandidate({
      feature_id: 'dnaK',
      seqid: 'chr2',
      gene_name: 'dnaK',
      locus_tag: 'LOC_DNAK',
      gene_biotype: 'protein_coding',
    });
    component.filterModel.update((current) => ({
      ...current,
      selectedPosition: 'insideOf_gene_g4',
      minScore: '10',
      maxScore: '55',
    }));
    component.submitFilters();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component.isGeneSearchMode()).toBeTrue();
    expect(component.browseScope()).toBe('chr2');
    expect(component.displayedAccessionIdValue()).toBe('chr2');
    expect(component.showAccessionIdColumn()).toBeTrue();
    expect(geneService.getGene).toHaveBeenCalledWith('GCF_1', 'chr2', 'dnaK');
    expect(g4Service.getGeneSearchPage).toHaveBeenCalledWith(
      jasmine.objectContaining({
        assemblyAccession: 'GCF_1',
        g4Type: 'g4',
        selectedFeatureId: 'dnaK',
        selectedPosition: 'insideOf_gene_g4',
      }),
    );
    expect(component.chartSeqid()).toBe('chr2');
    expect(component.chartViewport()).toEqual({
      start: 5000,
      end: 9000,
      binSize: 100,
    });
    expect(component.chartAxisFeatureRange()).toEqual({
      start: 6000,
      end: 8000,
    });
    expect(viewerState.region()).toBe('chr2:5000..9000');
    expect(
      Object.prototype.hasOwnProperty.call(
        g4Service.getGeneSearchPage.calls.mostRecent().args[0],
        'seqid',
      ),
    ).toBeFalse();
    expect(g4Service.getGeneRelations.calls.allArgs().slice(-2)).toEqual([
      [
        jasmine.objectContaining({
          assemblyAccession: 'GCF_1',
          g4Type: 'g4',
          seqid: 'chr1',
          starts: [10],
        }),
      ],
      [
        jasmine.objectContaining({
          assemblyAccession: 'GCF_1',
          g4Type: 'g4',
          seqid: 'chr2',
          starts: [30],
        }),
      ],
    ]);

    component.resetGeneFilter();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component.isGeneSearchMode()).toBeFalse();
    expect(component.browseScope()).toBe('chr2');
    expect(component.displayedAccessionIdValue()).toBe('chr2');
    expect(component.showAccessionIdColumn()).toBeFalse();
    expect(g4Service.getG4Page).toHaveBeenCalledWith(
      jasmine.objectContaining({
        assemblyAccession: 'GCF_1',
        g4Type: 'g4',
        seqid: 'chr2',
        pageSize: 10,
        minScore: 10,
        maxScore: 55,
      }),
    );
  });

  it('clears gene search mode when Accession ID changes after selecting a gene', async () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;
    await fixture.whenStable();
    fixture.detectChanges();

    component.selectBrowseScope('chr2');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    component.selectGeneCandidate({
      feature_id: 'dnaK',
      seqid: 'chr2',
      gene_name: 'dnaK',
      locus_tag: 'LOC_DNAK',
      gene_biotype: 'protein_coding',
    });
    component.submitFilters();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component.isGeneSearchMode()).toBeTrue();
    expect(component.displayedAccessionIdValue()).toBe('chr2');

    g4Service.getG4Page.calls.reset();

    component.selectBrowseScope('chr1');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component.isGeneSearchMode()).toBeFalse();
    expect(component.submittedSelectedGene()).toBeNull();
    expect(component.draftSelectedGene()).toBeNull();
    expect(component.draftGeneInput()).toBe('');
    expect(component.browseScope()).toBe('chr1');
    expect(component.displayedAccessionIdValue()).toBe('chr1');
    expect(component.showAccessionIdColumn()).toBeFalse();
    expect(g4Service.getG4Page.calls.allArgs()).toContain([
      jasmine.objectContaining({
        assemblyAccession: 'GCF_1',
        g4Type: 'g4',
        seqid: 'chr1',
        pageSize: 10,
      }),
    ]);
    expect(component.chartSeqid()).toBe('chr1');
    expect(component.chartViewport()).toEqual({
      start: 1,
      end: 10_000,
      binSize: 100,
    });
    expect(viewerState.region()).toBe('chr1:1..10000');
  });

  it('normalizes gene-navigation target when selected gene seqid is invalid', async () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;
    await fixture.whenStable();
    fixture.detectChanges();

    component.selectBrowseScope('chr2');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    geneService.getGene.and.returnValue(
      of({
        assembly_accession: 'GCF_1',
        seqid: 'chr404',
        source: null,
        feature: 'gene',
        feature_start: 6000,
        feature_end: 8000,
        strand: null,
        phase: null,
        feature_id: 'dnaK',
        gene_name: 'dnaK',
        gene_id: 'GENE_DNAK',
        parent_id: null,
        locus_tag: null,
        description: null,
        gene_biotype: 'protein_coding',
        feature_key: 'dnaK',
        insideOf_gene_g4: [],
        insideOf_genes_upstream_100bp_g4: [],
        insideOf_genes_downstream_100bp_g4: [],
        insideOf_genes_upstream_200bp_g4: [],
        insideOf_genes_downstream_200bp_g4: [],
        insideOf_genes_upstream_300bp_g4: [],
        insideOf_genes_downstream_300bp_g4: [],
        insideOf_genes_upstream_500bp_g4: [],
        insideOf_genes_downstream_500bp_g4: [],
        insideOf_genes_upstream_1k_g4: [],
        insideOf_genes_upstream_2k_g4: [],
        insideOf_genes_upstream_3k_g4: [],
        insideOf_genes_upstream_4k_g4: [],
        insideOf_genes_upstream_5k_g4: [],
        insideOf_genes_downstream_1k_g4: [],
        insideOf_genes_downstream_2k_g4: [],
        insideOf_genes_downstream_3k_g4: [],
        insideOf_genes_downstream_4k_g4: [],
        insideOf_genes_downstream_5k_g4: [],
        insideOf_gene_i_motif: [],
        insideOf_genes_upstream_100bp_i_motif: [],
        insideOf_genes_downstream_100bp_i_motif: [],
        insideOf_genes_upstream_200bp_i_motif: [],
        insideOf_genes_downstream_200bp_i_motif: [],
        insideOf_genes_upstream_300bp_i_motif: [],
        insideOf_genes_downstream_300bp_i_motif: [],
        insideOf_genes_upstream_500bp_i_motif: [],
        insideOf_genes_downstream_500bp_i_motif: [],
        insideOf_genes_upstream_1k_i_motif: [],
        insideOf_genes_upstream_2k_i_motif: [],
        insideOf_genes_upstream_3k_i_motif: [],
        insideOf_genes_upstream_4k_i_motif: [],
        insideOf_genes_upstream_5k_i_motif: [],
        insideOf_genes_downstream_1k_i_motif: [],
        insideOf_genes_downstream_2k_i_motif: [],
        insideOf_genes_downstream_3k_i_motif: [],
        insideOf_genes_downstream_4k_i_motif: [],
        insideOf_genes_downstream_5k_i_motif: [],
      }),
    );

    component.selectGeneCandidate({
      feature_id: 'dnaK',
      seqid: 'chr404',
      gene_name: 'dnaK',
      locus_tag: 'LOC_DNAK',
      gene_biotype: 'protein_coding',
    });
    component.submitFilters();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component.chartSeqid()).toBe('chr2');
    expect(component.chartViewport()).toEqual({
      start: 5000,
      end: 9000,
      binSize: 100,
    });
    expect(viewerState.region()).toBe('chr2:5000..9000');
  });

  it('blocks submit when text is typed without selecting a candidate', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;

    g4Service.getGeneSearchPage.calls.reset();

    component.onGeneInput({ target: { value: 'dnaK' } } as unknown as Event);
    component.submitFilters();
    fixture.detectChanges();

    expect(component.geneInputError()).toContain('Select a gene from the suggestions');
    expect(component.isGeneSearchMode()).toBeFalse();
    expect(g4Service.getGeneSearchPage).not.toHaveBeenCalled();
  });

  it('keeps submitted gene until apply and clears it when committed g4Type changes', async () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;
    await fixture.whenStable();
    fixture.detectChanges();

    component.selectGeneCandidate({
      feature_id: 'dnaK',
      seqid: 'chr2',
      gene_name: 'dnaK',
      locus_tag: 'LOC_DNAK',
      gene_biotype: 'protein_coding',
    });
    component.submitFilters();
    fixture.detectChanges();

    expect(component.submittedSelectedGene()?.feature_id).toBe('dnaK');

    component.filterModel.update((current) => ({
      ...current,
      selectedPosition: 'insideOf_genes_upstream_100bp_g4',
    }));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component.submittedSelectedGene()?.feature_id).toBe('dnaK');
    expect(component.draftSelectedGene()).toBeNull();
    expect(component.draftGeneInput()).toBe('');

    component.selectGeneCandidate({
      feature_id: 'dnaK',
      seqid: 'chr2',
      gene_name: 'dnaK',
      locus_tag: 'LOC_DNAK',
      gene_biotype: 'protein_coding',
    });
    component.submitFilters();
    fixture.detectChanges();

    expect(component.submittedSelectedGene()?.feature_id).toBe('dnaK');
    component.selectG4Type('i-motif');
    fixture.detectChanges();

    expect(component.submittedSelectedGene()).toBeNull();
    expect(component.draftSelectedGene()).toBeNull();
  });

  it('rebuilds the genome browser config with the committed motif type after apply', async () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;
    await fixture.whenStable();
    fixture.detectChanges();

    genomeViewerConfigService.createViewerConfig.calls.reset();

    component.selectDraftG4Type('i-motif');
    expect(component.g4Type()).toBe('g4');

    component.submitFilters();
    component.viewerConfig();

    expect(component.g4Type()).toBe('i-motif');
    expect(genomeViewerConfigService.createViewerConfig).toHaveBeenCalledWith(
      jasmine.objectContaining({
        assemblyAccession: 'GCF_1',
        dataBaseUrl: 'http://example.test/data',
        g4Type: 'i-motif',
      }),
    );
  });

  it('keeps selected gene and shows snackbar when selected gene returns no results', async () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;
    const snackBarOpenSpy = spyOn(
      (component as unknown as { snackBar: MatSnackBar }).snackBar,
      'open',
    );
    await fixture.whenStable();
    fixture.detectChanges();

    g4Service.getGeneSearchPage.and.returnValue(
      of({
        ...EMPTY_G4_PAGE,
        count: 0,
        g4s: [],
        tetrads_list: [2, 3],
        min_score: 10,
        max_score: 50,
      }),
    );
    component.selectGeneCandidate({
      feature_id: 'dnaK',
      seqid: 'chr2',
      gene_name: 'dnaK',
      locus_tag: 'LOC_DNAK',
      gene_biotype: 'protein_coding',
    });
    component.submitFilters();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component.submittedSelectedGene()?.feature_id).toBe('dnaK');
    expect(component.isGeneSearchMode()).toBeTrue();
    expect(snackBarOpenSpy).toHaveBeenCalledWith(
      'No G4 matched the selected gene with the current filters.',
      'Dismiss',
      { duration: 4000 },
    );
  });

  it('clears gene selection when assembly accession changes', async () => {
    genomeDetailService.getAssembly.and.callFake((assemblyAccession: string) =>
      of(assemblyAccession === 'GCF_2' ? secondAssemblyDetail : assemblyDetail),
    );
    genomeViewerConfigService.createViewerConfig.and.callFake(({ assemblyAccession }) => ({
      assembly: { name: assemblyAccession },
      tracks: [],
      configuration: {
        rpc: {
          defaultDriver: 'WebWorkerRpcDriver',
        },
        theme: {
          name: 'G4Vista Light',
          mode: 'light',
          palette: {
            primary: { main: '#311b92' },
            secondary: { main: '#0097a7' },
            tertiary: { main: '#f57c00' },
            quaternary: { main: '#d50000' },
            background: { default: '#fdfbff', paper: '#f9f9ff' },
            text: { primary: '#1a1b1f', secondary: '#46464a' },
          },
        },
        extraThemes: {},
      },
      defaultVisibleTrackIds: [],
      motifTrackIds: [],
    }));
    genomeViewerConfigService.resolveDefaultRegion.and.callFake(({ assemblyAccession }) =>
      of(assemblyAccession === 'GCF_2' ? 'chrA:1..1000' : 'chr1:1..1000'),
    );

    const fixture = createComponent();
    const component = fixture.componentInstance;
    await fixture.whenStable();
    fixture.detectChanges();

    component.selectGeneCandidate({
      feature_id: 'gene-HALTADL_RS16150',
      seqid: 'chr2',
      gene_name: 'eif1A',
      locus_tag: 'HALTADL_RS16150',
      gene_biotype: 'protein_coding',
    });
    component.submitFilters();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component.isGeneSearchMode()).toBeTrue();
    expect(component.submittedSelectedGene()?.feature_id).toBe('gene-HALTADL_RS16150');

    fixture.componentRef.setInput('assemblyAccession', 'GCF_2');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component.isGeneSearchMode()).toBeFalse();
    expect(component.submittedSelectedGene()).toBeNull();
    expect(component.draftSelectedGene()).toBeNull();
    expect(component.draftGeneInput()).toBe('');
    expect(component.browseScope()).toBe(component.wholeGenomeScope);
    const assembly2GeneSearchCall = g4Service.getGeneSearchPage.calls
      .allArgs()
      .map((args) => args[0])
      .find(
        (request) =>
          request.assemblyAccession === 'GCF_2' &&
          request.selectedFeatureId === 'gene-HALTADL_RS16150',
      );
    expect(assembly2GeneSearchCall).toBeUndefined();
  });

  it('resets the browser to the full selected seqid range', async () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;
    await fixture.whenStable();
    fixture.detectChanges();

    component.selectBrowseScope('chr2');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    viewerState.requestNavToLocation('chr9:1..500');

    component.resetBrowser();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component.chartSeqid()).toBe('chr2');
    expect(component.chartViewport()).toEqual({
      start: 1,
      end: 20_000,
      binSize: 200,
    });
    expect(viewerState.region()).toBe('chr2:1..20000');
  });

  it('resets the chart viewport through the chart reset handler', async () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;
    await fixture.whenStable();
    fixture.detectChanges();

    component.selectBrowseScope('chr2');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    component.applyChartViewport({
      start: 1000,
      end: 2000,
      binSize: 25,
    });

    expect(component.chartViewport()).toEqual({
      start: 1000,
      end: 2000,
      binSize: 25,
    });
    expect(viewerState.region()).toBe('chr2:1000..2000');

    component.resetChartViewport();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component.chartSeqid()).toBe('chr2');
    expect(component.chartViewport()).toEqual({
      start: 1,
      end: 20_000,
      binSize: 200,
    });
    expect(viewerState.region()).toBe('chr2:1..20000');
  });
});
