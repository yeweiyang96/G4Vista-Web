import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, ParamMap, convertToParamMap, provideRouter } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';
import { GenomeSearch, GenomeSearchService } from '../../../services/genome-search.service';

import { SearchBarComponent } from './search-bar.component';

describe('SearchBarComponent', () => {
  let component: SearchBarComponent;
  let fixture: ComponentFixture<SearchBarComponent>;
  let genomeSearchService: jasmine.SpyObj<GenomeSearchService>;
  let queryParamMapSubject: BehaviorSubject<ParamMap>;

  const bacillusAssembly: GenomeSearch = {
    asm_name: 'ASM188410v1',
    assembly_accession: 'GCA_001884105.1',
    organism_name: 'Bacillus luti',
  };

  beforeEach(async () => {
    genomeSearchService = jasmine.createSpyObj<GenomeSearchService>('GenomeSearchService', [
      'searchGenome',
    ]);
    genomeSearchService.searchGenome.and.returnValue(of([bacillusAssembly]));
    queryParamMapSubject = new BehaviorSubject<ParamMap>(convertToParamMap({}));

    await TestBed.configureTestingModule({
      imports: [SearchBarComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            queryParamMap: queryParamMapSubject.asObservable(),
          },
        },
        { provide: GenomeSearchService, useValue: genomeSearchService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SearchBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('preloads and renders genome results from the query param', async () => {
    queryParamMapSubject.next(convertToParamMap({ query: 'Bacillus' }));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(component.searchControl.value).toBe('Bacillus');
    expect(genomeSearchService.searchGenome).toHaveBeenCalledWith('Bacillus');
    expect(host.textContent).toContain('Results for Bacillus');
    expect(host.textContent).toContain('GCA_001884105.1');
    expect(host.textContent).toContain('Bacillus luti');
  });
});
