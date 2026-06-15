import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import {
  GenomeDatabaseStatus,
  GenomeSearchService,
} from '../genome/services/genome-search.service';
import { HomeComponent } from './home.component';

describe('HomeComponent', () => {
  let fixture: ComponentFixture<HomeComponent>;
  let component: HomeComponent;
  let genomeSearchService: jasmine.SpyObj<GenomeSearchService>;

  const databaseStatus: GenomeDatabaseStatus = {
    assembly_count: 2,
    taxon_count: 2,
    g4_count: 12,
    i_motif_count: 8,
    assembly_data_loaded_at: '2026-06-15T00:00:00Z',
  };

  beforeEach(async () => {
    genomeSearchService = jasmine.createSpyObj<GenomeSearchService>('GenomeSearchService', [
      'getDatabaseStatus',
      'getRecommendedAssemblies',
    ]);
    genomeSearchService.getDatabaseStatus.and.returnValue(of(databaseStatus));
    genomeSearchService.getRecommendedAssemblies.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: GenomeSearchService, useValue: genomeSearchService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('routes hero searches to the selected target', () => {
    const router = TestBed.inject(Router);
    const navigateSpy = spyOn(router, 'navigate').and.resolveTo(true);

    component.heroSearchControl.setValue('GCF_000001735.4');
    component.heroTargetControl.setValue('genome');
    component.submitHeroSearch(new Event('submit'));

    expect(navigateSpy).toHaveBeenCalledWith(['/genome'], {
      queryParams: {},
    });

    navigateSpy.calls.reset();
    component.heroSearchControl.setValue('9606');
    component.heroTargetControl.setValue('taxonomy');
    component.submitHeroSearch(new Event('submit'));

    expect(navigateSpy).toHaveBeenCalledWith(['/taxonomy', '9606'], { queryParams: {} });

    navigateSpy.calls.reset();
    component.heroSearchControl.setValue('TP53');
    component.heroTargetControl.setValue('gene');
    component.submitHeroSearch(new Event('submit'));

    expect(navigateSpy).toHaveBeenCalledWith(['/gene'], { queryParams: { search: 'TP53' } });
  });

  it('maps common starting point actions to functional entry routes', () => {
    const points = component.startingPoints();
    const human = points.find((point) => point.title === 'Human reference genome');
    const arabidopsis = points.find((point) => point.title === 'Arabidopsis thaliana');
    const bacteria = points.find((point) => point.title === 'Bacterial genomes');
    const research = points.find((point) => point.title === 'Microbial environment analysis');

    expect(human?.actions.find((action) => action.label === 'Search genes')).toEqual(
      jasmine.objectContaining({ route: '/gene/taxon/9606', queryParams: null }),
    );
    expect(arabidopsis?.actions.find((action) => action.label === 'Search genes')).toEqual(
      jasmine.objectContaining({ route: '/gene/taxon/3702', queryParams: null }),
    );
    expect(bacteria?.actions.find((action) => action.label === 'Explore taxonomy')).toEqual(
      jasmine.objectContaining({ route: '/taxonomy/2', queryParams: null }),
    );
    expect(bacteria?.actions.find((action) => action.label === 'Search genes')).toEqual(
      jasmine.objectContaining({ route: '/gene/taxon/2', queryParams: null }),
    );
    expect(research?.actions.find((action) => action.label === 'Open research')).toEqual(
      jasmine.objectContaining({
        route: '/research/microbial-environment-g4',
        queryParams: {
          trait: 'temperature',
          mode: 'growth',
          rank: 'genus',
          taxon: 'Bacillus',
          run: 'true',
        },
      }),
    );
    expect(research?.actions.find((action) => action.label === 'About this study')).toEqual(
      jasmine.objectContaining({
        route: '/help',
        queryParams: { topic: 'microbial-environment' },
      }),
    );
  });
});
