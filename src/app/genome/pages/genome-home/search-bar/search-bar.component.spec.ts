import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { GenomeSearch, GenomeSearchService } from '../../../services/genome-search.service';

import { SearchBarComponent } from './search-bar.component';

describe('SearchBarComponent', () => {
  let component: SearchBarComponent;
  let fixture: ComponentFixture<SearchBarComponent>;
  let genomeSearchService: jasmine.SpyObj<GenomeSearchService>;

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

    await TestBed.configureTestingModule({
      imports: [SearchBarComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
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

  it('does not submit typed text as genome query results', () => {
    const router = TestBed.inject(Router);
    const navigateSpy = spyOn(router, 'navigate').and.resolveTo(true);

    component.searchControl.setValue('Bacillus');
    component.submitSearch(new Event('submit'));
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(navigateSpy).not.toHaveBeenCalled();
    expect(host.textContent).not.toContain('Results for Bacillus');
  });

  it('searches autocomplete options from typed text', async () => {
    component.searchControl.setValue('Bacillus');
    await new Promise<void>((resolve) => {
      setTimeout(resolve, 350);
    });
    fixture.detectChanges();

    expect(genomeSearchService.searchGenome).toHaveBeenCalledWith('bacillus');
  });

  it('opens the selected autocomplete assembly directly', () => {
    const router = TestBed.inject(Router);
    const navigateSpy = spyOn(router, 'navigate').and.resolveTo(true);

    component.onOptionSelected({ option: { value: bacillusAssembly.assembly_accession } } as never);

    expect(navigateSpy).toHaveBeenCalledWith(['/genome', 'GCA_001884105.1']);
  });

  it('clears the input and stays on the genome search page', () => {
    const router = TestBed.inject(Router);
    const navigateSpy = spyOn(router, 'navigate').and.resolveTo(true);

    component.searchControl.setValue('Bacillus');
    component.clearSearch(new MouseEvent('click'));
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(component.searchControl.value).toBe('');
    expect(navigateSpy).toHaveBeenCalledWith(['/genome']);
    expect(host.textContent).not.toContain('Results for Bacillus');
  });
});
