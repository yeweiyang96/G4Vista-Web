import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { GenomeSearchService } from './genome-search.service';

describe('GenomeSearchService', () => {
  let service: GenomeSearchService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), GenomeSearchService],
    });

    service = TestBed.inject(GenomeSearchService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('searches assemblies with the current query parameter contract', () => {
    service.searchGenome('Bacillus subtilis').subscribe();

    const request = httpMock.expectOne(
      (req) => req.url === '/api/v1/genome/' && req.params.get('query') === 'Bacillus subtilis',
    );

    expect(request.request.method).toBe('GET');
    request.flush([]);
  });

  it('maps recommended assembly region counts to the existing seqid view field', () => {
    const responseSpy = jasmine.createSpy();

    service.getRecommendedAssemblies().subscribe(responseSpy);

    const request = httpMock.expectOne('/api/v1/genome/recommended-assemblies');
    expect(request.request.method).toBe('GET');
    request.flush([
      {
        organism_name: 'Bacillus subtilis',
        assembly_accession: 'GCF_1',
        asm_name: 'ASM1',
        species_name: 'Bacillus subtilis',
        region_count: 2,
        genome_length_bp: 4_200_000,
        g4_count: 120,
        i_motif_count: 80,
        quadruplex_sequence_count: 200,
      },
    ]);

    expect(responseSpy).toHaveBeenCalledWith([
      jasmine.objectContaining({
        assembly_accession: 'GCF_1',
        region_count: 2,
        seqid_count: 2,
        quadruplex_sequence_count: 200,
      }),
    ]);
  });
});
