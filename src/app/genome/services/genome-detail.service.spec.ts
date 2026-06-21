import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { GenomeDetailService } from './genome-detail.service';

describe('GenomeDetailService', () => {
  let service: GenomeDetailService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), GenomeDetailService],
    });

    service = TestBed.inject(GenomeDetailService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('maps current assembly region fields to the existing seqid view model', () => {
    const responseSpy = jasmine.createSpy();

    service.getAssembly('GCF_1').subscribe(responseSpy);

    const request = httpMock.expectOne('/api/v1/genome/GCF_1');
    expect(request.request.method).toBe('GET');
    request.flush({
      assembly_accession: 'GCF_1',
      organism_name: 'Bacillus subtilis',
      asm_name: 'ASM1',
      species_name: 'Bacillus subtilis',
      seq_rel_date: '2026-01-01',
      region_ids: ['chr1'],
      region_lengths: { chr1: 4_200_000 },
      regions: [
        {
          region_id: 'chr1',
          name: 'Chromosome',
          fna_header: 'chr1 header',
          length: 4_200_000,
          source: 'RefSeq',
          strand: '+',
          is_circular: true,
          has_quadruplex_sequence: true,
          status: 'ok',
        },
      ],
      taxon_id: 1423,
      species_taxon_id: 1423,
      genome_size: 4_200_000,
      default_gene_flank_window: 100,
    });

    expect(responseSpy).toHaveBeenCalledWith(
      jasmine.objectContaining({
        region_ids: ['chr1'],
        seqids: ['chr1'],
        region_lengths: { chr1: 4_200_000 },
        seqid_lengths: { chr1: 4_200_000 },
        regions: [
          jasmine.objectContaining({
            region_id: 'chr1',
            seqid: 'chr1',
            name: 'Chromosome',
            accession_name: 'Chromosome',
            length: 4_200_000,
            region_length: 4_200_000,
          }),
        ],
      }),
    );
  });

  it('maps current assembly overview region counts to seqid counts', () => {
    const responseSpy = jasmine.createSpy();

    service.getAssemblyOverview('GCF_1').subscribe(responseSpy);

    const request = httpMock.expectOne('/api/v1/genome/GCF_1/overview');
    expect(request.request.method).toBe('GET');
    request.flush({
      organism_name: 'Bacillus subtilis',
      assembly_accession: 'GCF_1',
      asm_name: 'ASM1',
      species_name: 'Bacillus subtilis',
      region_count: 1,
      genome_length_bp: 4_200_000,
      g4_count: 120,
      i_motif_count: 80,
      quadruplex_sequence_count: 200,
      seq_rel_date: '2026-01-01',
      taxon_id: 1423,
      species_taxon_id: 1423,
      quadruplex_density_per_mb: 47.62,
    });

    expect(responseSpy).toHaveBeenCalledWith(
      jasmine.objectContaining({
        region_count: 1,
        seqid_count: 1,
        quadruplex_sequence_count: 200,
      }),
    );
  });
});
