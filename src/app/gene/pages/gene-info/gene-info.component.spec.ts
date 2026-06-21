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
        relation_category: 'gene_inside',
        distance_bp: 0,
        overlap_bp: 25,
        overlap_fraction: 1,
        relation_mode: 'within_gene',
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
        relation_category: 'gene_downstream',
        distance_bp: 200,
        overlap_bp: 0,
        overlap_fraction: 0,
        relation_mode: 'flank_window',
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
      ['createViewerConfig'],
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
    expect(genomeViewerConfigService.createViewerConfig).toHaveBeenCalledWith(
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
    expect(host.textContent).toContain('Total motif sites');
    expect(host.textContent).toContain('chr1:2,200..2,224');
    expect(host.textContent).toContain('Inside gene');
    expect(host.textContent).toContain('Downstream of gene');
  });

  it('navigates the embedded browser to a selected relation row', () => {
    const downstreamRow = component
      .relationDetailRows()
      .find((row) => row.categoryLabel === 'Downstream of gene');

    expect(downstreamRow).toBeDefined();
    component.focusRelation(downstreamRow!);

    expect(viewerState.region()).toBe('chr1:3450..3970');
  });
});
