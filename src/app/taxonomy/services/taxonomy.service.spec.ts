import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { TaxonomyService } from './taxonomy.service';

describe('TaxonomyService', () => {
  let service: TaxonomyService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), TaxonomyService],
    });

    service = TestBed.inject(TaxonomyService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('searches taxa with HttpParams so query text is preserved', () => {
    service.searchTaxonomy('Bacillus subtilis').subscribe();

    const request = httpMock.expectOne(
      (req) => req.url === '/api/v1/taxa/' && req.params.get('query') === 'Bacillus subtilis',
    );

    expect(request.request.method).toBe('GET');
    request.flush([]);
  });

  it('maps current taxonomy assemblies to the existing assembly list model', () => {
    const responseSpy = jasmine.createSpy();

    service.getTaxonomyData(1423).subscribe(responseSpy);

    const request = httpMock.expectOne('/api/v1/taxa/1423');
    expect(request.request.method).toBe('GET');
    request.flush({
      taxon_id: 1423,
      name: 'Bacillus subtilis',
      rank: 'species',
      assembly_count: 1,
      genome_length_bp: 4_200_000,
      g4_count: 120,
      i_motif_count: 80,
      quadruplex_sequence_count: 200,
      quadruplex_density_per_mb: 47.62,
      lineage: [],
      assemblies: [
        {
          assembly_accession: 'GCF_1',
          organism_name: 'Bacillus subtilis',
          assembly_taxon_id: 1423,
          species_taxon_id: 1423,
          genome_size: 4_200_000,
        },
      ],
    });

    expect(responseSpy).toHaveBeenCalledWith(
      jasmine.objectContaining({
        assemblies: [
          jasmine.objectContaining({
            assembly_accession: 'GCF_1',
            asm_name: null,
            genome_length_bp: 4_200_000,
          }),
        ],
      }),
    );
  });

  it('uses the current quadruplex summary endpoint and maps selected motif context', () => {
    const responseSpy = jasmine.createSpy();

    service
      .getTaxonomyG4Summary({
        taxonId: 1423,
        g4Type: 'i-motif',
        flankWindow: 100,
        tetrads: [],
        minScore: null,
        maxScore: null,
      })
      .subscribe(responseSpy);

    const request = httpMock.expectOne('/api/v1/taxa/1423/quadruplex-summary');
    expect(request.request.method).toBe('GET');
    expect(request.request.params.keys()).toEqual([]);
    request.flush({
      taxon_id: 1423,
      rank: 'species',
      assembly_count: 1,
      genome_length_bp: 4_000_000,
      g4_count: 120,
      i_motif_count: 80,
      quadruplex_sequence_count: 200,
      quadruplex_density_per_mb: 50,
      position_categories: [
        {
          key: 'gene_inside',
          label: 'Gene inside',
          quadruplex_types: {
            g4: {
              count: 60,
              denominator_bp: 1_000_000,
              denominator_mode: 'gene',
              density_per_mb: 60,
            },
            'i-motif': {
              count: 40,
              denominator_bp: 1_000_000,
              denominator_mode: 'gene',
              density_per_mb: 40,
            },
          },
        },
      ],
      assembly_summaries: [
        {
          assembly_accession: 'GCF_1',
          organism_name: 'Bacillus subtilis',
          assembly_taxon_id: 1423,
          species_taxon_id: 1423,
          genome_size: 4_000_000,
          g4_count: 120,
          i_motif_count: 80,
          quadruplex_sequence_count: 200,
          quadruplex_density_per_mb: 50,
        },
      ],
    });

    expect(responseSpy).toHaveBeenCalledWith(
      jasmine.objectContaining({
        taxon_id: 1423,
        rank: 'species',
        motifs: {
          g4: { count: 120, density_per_mb: 30 },
          'i-motif': { count: 80, density_per_mb: 20 },
        },
        position_distribution: jasmine.objectContaining({
          g4_type: 'i-motif',
          total_count: 80,
          categories: [
            jasmine.objectContaining({
              key: 'gene_inside',
              count: 40,
              ratio: 0.5,
            }),
          ],
        }),
        assembly_summaries: [
          jasmine.objectContaining({
            assembly_accession: 'GCF_1',
            genome_length_bp: 4_000_000,
            g4_density_per_mb: 30,
            i_motif_density_per_mb: 20,
          }),
        ],
      }),
    );
  });
});
