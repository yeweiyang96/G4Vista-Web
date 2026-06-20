import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, ParamMap, convertToParamMap, provideRouter } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { getOptionalHelpWorkflowIdForUrl } from '../help-content';
import { DocumentationComponent } from './documentation';

describe('DocumentationComponent', () => {
  let routeQueryParamMap: ParamMap;
  let routeQueryParamMapSubject: BehaviorSubject<ParamMap>;

  beforeEach(async () => {
    routeQueryParamMap = convertToParamMap({});
    routeQueryParamMapSubject = new BehaviorSubject(routeQueryParamMap);

    await TestBed.configureTestingModule({
      imports: [DocumentationComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            get queryParamMap(): BehaviorSubject<ParamMap> {
              return routeQueryParamMapSubject;
            },
            snapshot: {
              get queryParamMap(): ParamMap {
                return routeQueryParamMap;
              },
            },
          },
        },
      ],
    }).compileComponents();
  });

  async function createDocumentation(
    queryParams: Record<string, string>,
  ): Promise<ComponentFixture<DocumentationComponent>> {
    routeQueryParamMap = convertToParamMap(queryParams);
    routeQueryParamMapSubject.next(routeQueryParamMap);
    const fixture = TestBed.createComponent(DocumentationComponent);
    await fixture.whenStable();
    return fixture;
  }

  async function setQueryParams(
    fixture: ComponentFixture<DocumentationComponent>,
    queryParams: Record<string, string>,
  ): Promise<void> {
    routeQueryParamMap = convertToParamMap(queryParams);
    routeQueryParamMapSubject.next(routeQueryParamMap);
    await fixture.whenStable();
  }

  it('renders the taxonomy article with section-based contents', async () => {
    const fixture = await createDocumentation({});
    const component = fixture.componentInstance;
    const host = fixture.nativeElement as HTMLElement;
    const pageIndexText = host.querySelector('.page-index')?.textContent ?? '';
    const docContentText = host.querySelector('.doc-content')?.textContent ?? '';
    const contentIndexText = host.querySelector('.content-index')?.textContent ?? '';

    expect(component.selectedDocumentationId()).toBe('taxonomy');
    expect(host.querySelector('.workflow-tabs')).toBeNull();
    expect(host.querySelector('.help-content-shell')).toBeNull();
    expect(pageIndexText).toContain('Taxonomy');
    expect(pageIndexText).toContain('API Service');
    expect(pageIndexText).not.toContain('User workflows');
    expect(pageIndexText).not.toContain('The Taxonomy page is the starting point');
    expect(docContentText).toContain('Simple taxon search');
    expect(docContentText).toContain('Taxon records and assemblies');
    expect(docContentText).not.toContain('What to enter');
    expect(docContentText).not.toContain('Results');
    expect(host.querySelector('.article-figure figcaption')?.textContent).toContain(
      'Taxonomy search field',
    );
    expect(host.querySelector('.field-table')).not.toBeNull();
    expect(contentIndexText).toContain('Simple taxon search');
    expect(contentIndexText).toContain('Next steps from taxonomy');
    expect(host.querySelector('.index-link')?.getAttribute('href')).toContain('/documentation');
    expect(host.querySelector('.content-link-list a')?.getAttribute('href')).toContain(
      '/documentation?doc=taxonomy#',
    );
  });

  it('switches documentation from the left index query state', async () => {
    const fixture = await createDocumentation({});
    const component = fixture.componentInstance;
    const host = fixture.nativeElement as HTMLElement;

    await setQueryParams(fixture, { doc: 'api-service' });

    expect(component.selectedDocumentationId()).toBe('api-service');
    expect(host.querySelector('.doc-content')?.textContent).toContain('API Service');
    expect(host.querySelector('.doc-content')?.textContent).toContain('/api/v1/genome/status');
    expect(host.querySelector('.doc-content')?.textContent).not.toContain('Simple taxon search');
    expect(host.querySelector('.content-index')?.textContent).toContain('Documentation links');
    expect(host.querySelector('.content-index')?.textContent).toContain('Sample requests');
  });

  it('maps the legacy topic query param to the matching documentation article', async () => {
    const fixture = await createDocumentation({ topic: 'microbial-environment' });
    const component = fixture.componentInstance;
    const host = fixture.nativeElement as HTMLElement;

    expect(component.selectedDocumentationId()).toBe('microbial-environment');
    expect(host.querySelector('.doc-content')?.textContent).toContain('Microbial analysis');
    expect(host.querySelector('.doc-content')?.textContent).toContain('Purpose of the analysis');
    expect(host.querySelector('.index-link-active')?.textContent).toContain('Microbial analysis');
  });

  it('renders citation and contact as documentation articles', async () => {
    const fixture = await createDocumentation({ doc: 'citation' });
    const component = fixture.componentInstance;
    const host = fixture.nativeElement as HTMLElement;

    expect(component.selectedDocumentationId()).toBe('citation');
    expect(host.querySelector('.doc-content')?.textContent).toContain('NCBI Datasets');
    expect(host.querySelector('.doc-content')?.textContent).toContain('QGRS Mapper');
    expect(host.querySelector('.content-index')?.textContent).toContain('Data resources');

    await setQueryParams(fixture, { doc: 'contact' });

    expect(component.selectedDocumentationId()).toBe('contact');
    expect(host.querySelector('.doc-content')?.textContent).toContain('Medical AI Center');
    expect(host.querySelector('.doc-content')?.textContent).toContain('MIT-style License');
    expect(host.querySelector('.content-index')?.textContent).toContain('Medical AI Center');
  });

  it('configures and documents the download route', async () => {
    const fixture = await createDocumentation({ doc: 'download' });
    const host = fixture.nativeElement as HTMLElement;
    const image = host.querySelector('.article-figure img') as HTMLImageElement | null;

    expect(getOptionalHelpWorkflowIdForUrl('/download')).toBe('download');
    expect(getOptionalHelpWorkflowIdForUrl('/download?motif=g4')).toBe('download');
    expect(getOptionalHelpWorkflowIdForUrl('/documentation')).toBeNull();
    expect(getOptionalHelpWorkflowIdForUrl('/help')).toBeNull();
    expect(host.querySelector('.doc-content')?.textContent).toContain('Creating the ZIP file');
    expect(host.querySelector('.content-index')?.textContent).toContain('Package options');
    expect(image?.getAttribute('src')).toContain('/documentation/screenshots/download.png');
  });

  it('renders the temperature statistics report as a documentation article', async () => {
    const fixture = await createDocumentation({ doc: 'temperature-statistics' });
    const component = fixture.componentInstance;
    const host = fixture.nativeElement as HTMLElement;

    expect(component.selectedDocumentationId()).toBe('temperature-statistics');
    expect(host.querySelector('.doc-content')?.textContent).toContain('Temperature statistics');
    expect(host.querySelector('.doc-content')?.textContent).toContain('Candidate taxonomy groups');
    expect(host.querySelector('.doc-content')?.textContent).toContain('Peptococcaceae');
    expect(host.querySelector('.data-table')).not.toBeNull();
    expect(host.querySelector('.content-index')?.textContent).toContain('Reporting notes');
  });
});
