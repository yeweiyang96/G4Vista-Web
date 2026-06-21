import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';

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
    expect(compiled.querySelector('.navbar')?.textContent).toContain('G4Vista');
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
});
