import { TestBed } from '@angular/core/testing';
import { AssemblyDownloadSetService } from './assembly-download-set.service';

const STORAGE_KEY = 'g4vista.assemblyDownloadSet';

describe('AssemblyDownloadSetService', () => {
  let service: AssemblyDownloadSetService;

  beforeEach(() => {
    window.localStorage.removeItem(STORAGE_KEY);
    TestBed.configureTestingModule({});
    service = TestBed.inject(AssemblyDownloadSetService);
  });

  afterEach(() => {
    window.localStorage.removeItem(STORAGE_KEY);
  });

  it('dedupes assemblies by accession and persists the sorted set', () => {
    service.addItems([
      {
        assembly_accession: 'GCF_2',
        organism_name: 'Organism B',
        asm_name: 'ASM_B',
        source_taxon_id: 2,
        source_taxon_name: 'Taxon B',
      },
      {
        assembly_accession: 'GCF_1',
        organism_name: 'Organism A',
        asm_name: 'ASM_A',
        source_taxon_id: 1,
        source_taxon_name: 'Taxon A',
      },
      {
        assembly_accession: 'GCF_2',
        organism_name: 'Organism B updated',
        asm_name: 'ASM_B2',
        source_taxon_id: 2,
        source_taxon_name: 'Taxon B',
      },
    ]);
    TestBed.tick();

    expect(service.count()).toBe(2);
    expect(service.accessions()).toEqual(['GCF_1', 'GCF_2']);
    expect(service.items()[1].organism_name).toBe('Organism B updated');
    expect(window.localStorage.getItem(STORAGE_KEY)).toContain('GCF_1');
  });
});
