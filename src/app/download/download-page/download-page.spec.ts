import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AssemblyDownloadSetService } from '../assembly-download-set.service';
import { DownloadService } from '../download.service';
import { DownloadPage } from './download-page';

const STORAGE_KEY = 'g4vista.assemblyDownloadSet';

describe('DownloadPage', () => {
  let fixture: ComponentFixture<DownloadPage>;
  let component: DownloadPage;
  let assemblySet: AssemblyDownloadSetService;
  let downloadService: jasmine.SpyObj<DownloadService>;

  beforeEach(async () => {
    window.localStorage.removeItem(STORAGE_KEY);
    downloadService = jasmine.createSpyObj<DownloadService>('DownloadService', ['createG4Package']);
    downloadService.createG4Package.and.returnValue(
      of({ blob: new Blob(['zip']), filename: 'g4-package.zip' }),
    );

    await TestBed.configureTestingModule({
      imports: [DownloadPage],
      providers: [provideRouter([]), { provide: DownloadService, useValue: downloadService }],
    }).compileComponents();

    fixture = TestBed.createComponent(DownloadPage);
    component = fixture.componentInstance;
    assemblySet = TestBed.inject(AssemblyDownloadSetService);
    fixture.detectChanges();
  });

  afterEach(() => {
    window.localStorage.removeItem(STORAGE_KEY);
  });

  it('renders selected assemblies and enables package creation when options are valid', () => {
    assemblySet.addItems([
      {
        assembly_accession: 'GCF_1',
        organism_name: 'Test organism',
        asm_name: 'ASM_TEST',
        source_taxon_id: 2,
        source_taxon_name: 'Bacteria',
      },
    ]);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.textContent).toContain('GCF_1');
    expect(host.textContent).toContain('Test organism');
    expect(component.canCreatePackage()).toBeTrue();
  });
});
