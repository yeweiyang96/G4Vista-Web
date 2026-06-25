import { Component, input, output, provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import {
  GenomeNavCommand,
  GenomeViewerConfig,
  GenomeViewerConfigService,
  GenomeViewerStateService,
  JbrowseHostComponent,
} from '../../../genome/viewer';
import { GeneDetail, GeneService } from '../../services/gene.service';
import { GeneInfoComponent } from './gene-info.component';

@Component({
  selector: 'app-jbrowse-host',
  template: '',
})
class JbrowseHostStubComponent {
  readonly viewerConfig = input.required<GenomeViewerConfig>();
  readonly navigationCommand = input<GenomeNavCommand | null>(null);
  readonly regionChanged = output<string>();
}

describe('GeneInfoComponent', () => {
  const geneDetail: GeneDetail = {
    assembly_accession: 'GCF_1',
    region_id: 'chr1',
    region_name: 'Chromosome 1',
    feature_id: 'gene-dnaK',
    gene_id: 'GENE_DNAK',
    gene_name: 'dnaK',
    locus_tag: 'LOC_DNAK',
    biotype: 'protein_coding',
    start: 2000,
    end: 3500,
    strand: '+',
    attributes_raw: '',
    counts: {
      g4_count: 2,
      i_motif_count: 1,
      quadruplex_sequence_count: 3,
    },
    relations: [
      {
        assembly_accession: 'GCF_1',
        region_id: 'chr1',
        quadruplex_sequence_id: 'chr1-g4-2200',
        quadruplex_type: 'g4',
        start: 2200,
        end: 2224,
        length: 25,
        score: 42,
        relation_category: 'gene_inside',
        distance_bp: 0,
        overlap_bp: 25,
        overlap_fraction: 1,
        relation_mode: 'overlap',
        gene_id: 'GENE_DNAK',
        gene_biotype: 'protein_coding',
      },
      {
        assembly_accession: 'GCF_1',
        region_id: 'chr1',
        quadruplex_sequence_id: 'chr1-imotif-3700',
        quadruplex_type: 'i-motif',
        start: 3700,
        end: 3720,
        length: 21,
        score: 31,
        relation_category: 'gene_downstream',
        distance_bp: 200,
        overlap_bp: 0,
        overlap_fraction: 0,
        relation_mode: 'flank',
        gene_id: 'GENE_DNAK',
        gene_biotype: 'protein_coding',
      },
    ],
  };

  let fixture: ComponentFixture<GeneInfoComponent>;
  let component: GeneInfoComponent;
  let geneService: jasmine.SpyObj<GeneService>;
  let genomeViewerConfigService: jasmine.SpyObj<GenomeViewerConfigService>;
  let viewerState: GenomeViewerStateService;

  beforeEach(async () => {
    geneService = jasmine.createSpyObj<GeneService>('GeneService', ['getGene']);
    geneService.getGene.and.returnValue(of(geneDetail));
    genomeViewerConfigService = jasmine.createSpyObj<GenomeViewerConfigService>(
      'GenomeViewerConfigService',
      ['createViewerConfig', 'createGeneViewerConfig'],
    );
    genomeViewerConfigService.createGeneViewerConfig.and.returnValue({
      assembly: { name: 'GCF_1' },
      tracks: [],
      configuration: {
        rpc: {
          defaultDriver: 'WebWorkerRpcDriver',
        },
        theme: {
          name: 'G4ViSTA Light',
          mode: 'light',
          palette: {
            primary: { main: '#005cbb' },
            secondary: { main: '#abc7ff' },
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

    await TestBed.configureTestingModule({
      imports: [GeneInfoComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: GeneService, useValue: geneService },
        { provide: GenomeViewerConfigService, useValue: genomeViewerConfigService },
      ],
    })
      .overrideComponent(GeneInfoComponent, {
        remove: { imports: [JbrowseHostComponent] },
        add: { imports: [JbrowseHostStubComponent] },
      })
      .compileComponents();

    viewerState = TestBed.inject(GenomeViewerStateService);
    fixture = TestBed.createComponent(GeneInfoComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('assemblyAccession', 'GCF_1');
    fixture.componentRef.setInput('dataBaseUrl', 'http://example.test/jbrowse');
    fixture.componentRef.setInput('seqid', 'chr1');
    fixture.componentRef.setInput('featureId', 'gene-dnaK');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('loads gene detail, builds the genome browser config, and focuses the gene window', () => {
    expect(geneService.getGene).toHaveBeenCalledWith('GCF_1', 'chr1', 'gene-dnaK');
    expect(genomeViewerConfigService.createGeneViewerConfig).toHaveBeenCalledWith(
      jasmine.objectContaining({
        assemblyAccession: 'GCF_1',
        dataBaseUrl: 'http://example.test/jbrowse',
        g4Type: 'g4',
      }),
    );
    expect(component.geneBrowserRegion()?.location).toBe('chr1:1000..4500');
    expect(viewerState.region()).toBe('chr1:1000..4500');

    const host = fixture.nativeElement as HTMLElement;
    expect(host.textContent).toContain('G4 sites');
    expect(host.textContent).toContain('i-motif sites');
    expect(host.textContent).toContain('Total predicted sequences');
    expect(host.querySelector('.gene-hero')).not.toBeNull();
    expect(host.querySelectorAll('.gene-summary > div').length).toBe(4);
    expect(host.textContent).toContain('Chromosome 1');
    expect(host.textContent).toContain('Chromosome 1:2,200..2,224');
    expect(host.textContent).toContain('Inside gene');
    expect(host.textContent).toContain('Downstream of gene');
  });

  it('labels relation mode, motif length, and score with biological table semantics', () => {
    const columns = component.relationColumns().map((column) => column.header);
    const insideRow = component
      .relationDetailRows()
      .find((row) => row.categoryLabel === 'Inside gene');

    expect(columns).toContain('Motif length (nt)');
    expect(columns).toContain('Score');
    expect(insideRow).toEqual(
      jasmine.objectContaining({
        motifLengthNt: 25,
        motifLengthLabel: '25',
        score: 42,
        location: 'Chromosome 1:2,200..2,224',
        modeLabel: 'Intragenic',
      }),
    );
  });

  it('filters relation rows by motif, gene relation, and distance range', () => {
    component.setSelectedMotifTypes(['i-motif']);

    expect(component.sortedFilteredRelationRows().map((row) => row.typeLabel)).toEqual(['i-motif']);

    component.clearRelationFilters();
    component.setSelectedRelationCategories(['gene_inside']);

    expect(component.sortedFilteredRelationRows().map((row) => row.categoryLabel)).toEqual([
      'Inside gene',
    ]);

    component.clearRelationFilters();
    component.setMinDistanceInput('100');
    component.setMaxDistanceInput('250');

    expect(component.sortedFilteredRelationRows().map((row) => row.distanceBp)).toEqual([200]);
  });

  it('keeps invalid distance input visible and shows no filtered relation rows', () => {
    component.setMinDistanceInput('300');
    component.setMaxDistanceInput('100');

    expect(component.minDistanceInput()).toBe('300');
    expect(component.maxDistanceInput()).toBe('100');
    expect(component.relationFilterError()).toBe(
      'Minimum distance must be less than or equal to maximum distance.',
    );
    expect(component.sortedFilteredRelationRows()).toEqual([]);
    expect(component.canDownloadRelations()).toBeFalse();
  });

  it('downloads the filtered and sorted relation rows as TSV', async () => {
    const view = fixture.nativeElement.ownerDocument.defaultView as Window & typeof globalThis;
    const exportState: { blob: Blob | null; filename: string } = { blob: null, filename: '' };
    spyOn(view.URL, 'createObjectURL').and.callFake((blob: Blob | MediaSource) => {
      exportState.blob = blob as Blob;
      return 'blob:g4vista-gene-relations';
    });
    spyOn(view.URL, 'revokeObjectURL');
    spyOn(HTMLAnchorElement.prototype, 'click').and.callFake(function (
      this: HTMLAnchorElement,
    ): void {
      exportState.filename = this.download;
    });
    component.setSelectedRelationCategories(['gene_downstream']);

    component.downloadFilteredRelations();

    expect(exportState.filename).toBe('GCF_1_chr1_gene-dnaK_relations.tsv');
    expect(exportState.blob).not.toBeNull();
    const tsv = await exportState.blob!.text();
    expect(tsv).toContain(
      [
        'motif',
        'region_id',
        'start',
        'end',
        'location',
        'relation_category',
        'gene_relation',
        'distance_bp',
        'distance',
        'motif_length_nt',
        'score',
        'overlap_bp',
        'overlap_fraction',
        'overlap',
        'relation_mode',
        'gene_biotype',
      ].join('\t'),
    );
    expect(tsv).toContain('i-motif\tchr1\t3700\t3720');
    expect(tsv).toContain('Chromosome 1:3,700..3,720');
    expect(tsv).toContain('gene_downstream\tDownstream of gene\t200\t200 bp\t21\t31');
    expect(tsv).not.toContain('gene_inside');
  });

  it('navigates the embedded browser to a selected relation row and scrolls to the browser', () => {
    spyOn(HTMLElement.prototype, 'scrollIntoView');
    const downstreamRow = component
      .relationDetailRows()
      .find((row) => row.categoryLabel === 'Downstream of gene');

    expect(downstreamRow).toBeDefined();
    component.focusRelation(downstreamRow!);

    expect(viewerState.region()).toBe('chr1:3600..3820');
    expect(HTMLElement.prototype.scrollIntoView).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'start',
    });
  });

  it('resets the embedded browser to the default gene browser range', () => {
    spyOn(HTMLElement.prototype, 'scrollIntoView');
    const downstreamRow = component
      .relationDetailRows()
      .find((row) => row.categoryLabel === 'Downstream of gene');

    expect(downstreamRow).toBeDefined();
    component.focusRelation(downstreamRow!);
    expect(viewerState.region()).toBe('chr1:3600..3820');

    component.resetBrowserRange();

    expect(viewerState.region()).toBe('chr1:1000..4500');
  });
});
