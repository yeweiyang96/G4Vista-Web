import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LogoComponent } from './logo.component';

describe('LogoComponent', () => {
  let component: LogoComponent;
  let fixture: ComponentFixture<LogoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LogoComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LogoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders the brand mark as decorative image content', () => {
    const image = fixture.nativeElement.querySelector('img') as HTMLImageElement | null;

    expect(image?.getAttribute('src')).toBe('brand/g4vista-logo-mark.png');
    expect(image?.getAttribute('alt')).toBe('');
    expect(image?.getAttribute('width')).toBe('512');
    expect(image?.getAttribute('height')).toBe('512');
  });
});
