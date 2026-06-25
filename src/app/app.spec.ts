import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';

function footerElement(fixture: ComponentFixture<App>): HTMLElement | null {
  return fixture.nativeElement.querySelector('.footer') as HTMLElement | null;
}

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideZonelessChangeDetection(), provideRouter([])],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render the app brand in the navbar', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.navbar')?.textContent).toContain('G4ViSTA');
  });

  it('should expose analysis as a navbar menu trigger', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    const navbarText = compiled.querySelector('.navbar')?.textContent ?? '';
    expect(navbarText).toContain('Analysis');
    expect(navbarText).not.toContain('Research');
  });

  it('orders navbar sections by the current workflow', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;

    expect(app.sections.map((section) => section.name)).toEqual([
      'Genome',
      'Gene',
      'Analysis',
      'Download',
      'Taxonomy',
      'Documentation',
    ]);
  });

  it('should expose documentation with the documentation route and icon', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    const documentation = app.sections.find((section) => section.name === 'Documentation');

    expect(documentation).toEqual(
      jasmine.objectContaining({
        route: '/documentation',
        icon: 'menu_book',
      }),
    );
  });

  it('renders the redesigned footer on the home route', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const footer = footerElement(fixture);
    const footerText = footer?.textContent ?? '';
    const medicalAiCenter = footer?.querySelector(
      'a[href="https://bioinfo.med.niigata-u.ac.jp/"]',
    ) as HTMLAnchorElement | null;

    expect(footer).not.toBeNull();
    expect(footerText).toContain('G4ViSTA');
    expect(footerText).toContain('Predicted G4 and i-motif sequence exploration');
    expect(footerText).toContain('Medical AI Center');
    expect(footerText).toContain('MIT-style License');
    expect(footerText).toContain('CC BY 4.0');
    expect(footerText).not.toContain('Workflows');
    expect(footerText).not.toContain('Support');
    expect(medicalAiCenter?.getAttribute('target')).toBe('_blank');
    expect(medicalAiCenter?.getAttribute('rel')).toBe('noopener noreferrer');
  });

  it('keeps the footer hidden on workspace routes', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;

    app.currentUrl.set('/genome');
    fixture.detectChanges();
    expect(footerElement(fixture)).toBeNull();

    app.currentUrl.set('/research/microbial-environment-g4');
    fixture.detectChanges();
    expect(footerElement(fixture)).toBeNull();

    app.currentUrl.set('/gene/taxon/9606');
    fixture.detectChanges();
    expect(footerElement(fixture)).toBeNull();

    app.currentUrl.set('/');
    fixture.detectChanges();
    expect(footerElement(fixture)).not.toBeNull();
  });
});
