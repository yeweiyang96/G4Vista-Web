import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, ParamMap, convertToParamMap, provideRouter } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';
import { TaxonomySearch, TaxonomyService } from '../../services/taxonomy.service';
import { TaxonomyHomeComponent } from './taxonomy-home.component';

describe('TaxonomyHomeComponent', () => {
  let fixture: ComponentFixture<TaxonomyHomeComponent>;
  let component: TaxonomyHomeComponent;
  let taxonomyService: jasmine.SpyObj<TaxonomyService>;
  let queryParamMapSubject: BehaviorSubject<ParamMap>;

  const arabidopsisTaxon: TaxonomySearch = {
    name: 'Arabidopsis thaliana',
    rank: 'species',
    taxon_id: 3702,
    name_class: 'scientific name',
    scientific_name: 'Arabidopsis thaliana',
  };

  beforeEach(async () => {
    taxonomyService = jasmine.createSpyObj<TaxonomyService>('TaxonomyService', [
      'getAssemblyCounts',
      'searchTaxonomy',
    ]);
    taxonomyService.getAssemblyCounts.and.returnValue(of([]));
    taxonomyService.searchTaxonomy.and.returnValue(of([arabidopsisTaxon]));
    queryParamMapSubject = new BehaviorSubject<ParamMap>(convertToParamMap({}));

    await TestBed.configureTestingModule({
      imports: [TaxonomyHomeComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            queryParamMap: queryParamMapSubject.asObservable(),
          },
        },
        { provide: TaxonomyService, useValue: taxonomyService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TaxonomyHomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('preloads and renders taxonomy results from the query param', async () => {
    queryParamMapSubject.next(convertToParamMap({ query: 'Arabidopsis thaliana' }));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const resultLink = host.querySelector('a.taxonomy-result-link');

    expect(component.searchControl.value).toBe('Arabidopsis thaliana');
    expect(taxonomyService.searchTaxonomy).toHaveBeenCalledWith('Arabidopsis thaliana');
    expect(host.textContent).toContain('Results for Arabidopsis thaliana');
    expect(host.textContent).toContain('Taxon ID: 3702');
    expect(resultLink?.getAttribute('href')).toContain('/taxonomy/3702');
  });
});
