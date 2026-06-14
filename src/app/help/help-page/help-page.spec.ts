import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, ParamMap, convertToParamMap, provideRouter } from '@angular/router';
import { HelpPage } from './help-page';

describe('HelpPage', () => {
  let fixture: ComponentFixture<HelpPage>;
  let component: HelpPage;
  let routeQueryParamMap: ParamMap;

  beforeEach(async () => {
    routeQueryParamMap = convertToParamMap({ topic: 'microbial-environment' });

    await TestBed.configureTestingModule({
      imports: [HelpPage],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              get queryParamMap(): ParamMap {
                return routeQueryParamMap;
              },
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HelpPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('selects the requested help topic from the query param', () => {
    const host = fixture.nativeElement as HTMLElement;

    expect(component.selectedTopicId()).toBe('microbial-environment');
    expect(host.querySelector('#help-panel-microbial-environment')?.textContent).toContain(
      'Microbial G4 environment research',
    );
  });
});
