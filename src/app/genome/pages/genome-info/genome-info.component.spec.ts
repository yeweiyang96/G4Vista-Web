import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { GenomeInfoComponent } from './genome-info.component';
import { GenomeDetailService, GenomeAssemblyDetail } from '../../services/genome-detail.service';
import {
  EMPTY_G4_PAGE,
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
    taxon_id: 1,
    topt_ave: 37,
  };
  const browsePage: G4PageResponse = {
    ...EMPTY_G4_PAGE,
    count: 1,
    tetrads_list: [2, 3],
    min_gscore: 10,
    max_gscore: 50,
    g4s: [
      {
        assembly_accession: 'GCF_1',
        seqid: 'chr1',
        g4_type: 'normal',
        start: 5,
        end: 20,
        length: 16,
        tetrads: 2,
        y1: 1,
        y2: 1,
        y3: 1,
        gscore: 15,
        sequence: 'GGGGTTGGGGTTGGGG',
      },
    ],
  };
  const geneSearchPage: G4PageResponse = {
    count: 2,
    tetrads_list: [2, 3],
    min_gscore: 15,
    max_gscore: 41,
    g4s: [
      {
        assembly_accession: 'GCF_1',
        seqid: 'chr1',
        g4_type: 'normal',
        start: 10,
        end: 25,
        length: 16,
        tetrads: 2,
        y1: 1,
        y2: 1,
        y3: 1,
        gscore: 22,
        sequence: 'GGGGTTGGGGTTGGGG',
      },
      {
        assembly_accession: 'GCF_1',
        seqid: 'chr2',
        g4_type: 'normal',
        start: 30,
        end: 44,
        length: 15,
        tetrads: 3,
        y1: 1,
        y2: 1,
        y3: 1,
        gscore: 41,
        sequence: 'GGGAGGGTTGGGAGG',
      },
    ],
  };

  let genomeDetailService: jasmine.SpyObj<GenomeDetailService>;
  let g4Service: jasmine.SpyObj<G4Service>;
  let genomeViewerConfigService: jasmine.SpyObj<GenomeViewerConfigService>;
  let viewerState: GenomeViewerStateService;

  beforeEach(async () => {
    genomeDetailService = jasmine.createSpyObj<GenomeDetailService>('GenomeDetailService', [
      'getAssembly',
    ]);
    genomeDetailService.getAssembly.and.returnValue(of(assemblyDetail));

    g4Service = jasmine.createSpyObj<G4Service>('G4Service', [
      'getG4Page',
      'getGeneSearchPage',
      'getGeneRelations',
    ]);
    g4Service.getG4Page.and.returnValue(of(browsePage));
    g4Service.getGeneSearchPage.and.returnValue(of(geneSearchPage));
    g4Service.getGeneRelations.and.callFake(({ seqid, starts }) =>
      of<G4GeneRelationsResponse>({
        relations: starts.map((start) => ({
          start,
          positions: {
            insideOf_gene_normal: [
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

    genomeViewerConfigService = jasmine.createSpyObj<GenomeViewerConfigService>(
      'GenomeViewerConfigService',
      ['createViewerConfig', 'resolveDefaultRegion'],
    );
    genomeViewerConfigService.createViewerConfig.and.returnValue({
      assembly: { name: 'GCF_1' },
      tracks: [],
      defaultVisibleTrackIds: [],
    });
    genomeViewerConfigService.resolveDefaultRegion.and.returnValue(of('chr1:1..1000'));

    await TestBed.configureTestingModule({
      imports: [GenomeInfoComponent],
      providers: [
        { provide: GenomeDetailService, useValue: genomeDetailService },
        { provide: G4Service, useValue: g4Service },
        { provide: GenomeViewerConfigService, useValue: genomeViewerConfigService },
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
      G4_GENE_POSITION_OPTIONS_BY_TYPE.normal.map((option) => option.value),
    );

    component.selectG4Type('revcomp');
    fixture.detectChanges();

    expect(component.genePositionOptions().map((option) => option.value)).toEqual(
      G4_GENE_POSITION_OPTIONS_BY_TYPE.revcomp.map((option) => option.value),
    );
  });

  it('switches to assembly-scoped gene search and batches relation lookups by seqid', async () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;

    g4Service.getG4Page.calls.reset();
    g4Service.getGeneSearchPage.calls.reset();
    g4Service.getGeneRelations.calls.reset();

    component.filterModel.update((current) => ({
      ...current,
      selectedPosition: 'insideOf_gene_normal',
      geneQuery: 'dnaK',
    }));
    fixture.detectChanges();
    await new Promise((resolve) => setTimeout(resolve, 320));
    fixture.detectChanges();

    expect(component.isGeneSearchMode()).toBeTrue();
    expect(g4Service.getGeneSearchPage).toHaveBeenCalledTimes(1);
    expect(g4Service.getGeneSearchPage.calls.mostRecent().args[0]).toEqual(
      jasmine.objectContaining({
        assemblyAccession: 'GCF_1',
        g4Type: 'normal',
        searchTerm: 'dnaK',
        selectedPosition: 'insideOf_gene_normal',
      }),
    );
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
          g4Type: 'normal',
          seqid: 'chr1',
          starts: [10],
        }),
      ],
      [
        jasmine.objectContaining({
          assemblyAccession: 'GCF_1',
          g4Type: 'normal',
          seqid: 'chr2',
          starts: [30],
        }),
      ],
    ]);
    expect(component.geneRelationsByRowKey().get('chr1:10')?.insideOf_gene_normal?.[0]).toEqual(
      jasmine.objectContaining({ feature_id: 'chr1-gene-10' }),
    );
    expect(component.geneRelationsByRowKey().get('chr2:30')?.insideOf_gene_normal?.[0]).toEqual(
      jasmine.objectContaining({ feature_id: 'chr2-gene-30' }),
    );

    component.selectSeqid('chr2');
    fixture.detectChanges();
    await Promise.resolve();
    fixture.detectChanges();

    expect(viewerState.region()).toBe('chr2:1..1000');
    expect(g4Service.getGeneSearchPage).toHaveBeenCalledTimes(1);
  });
});
