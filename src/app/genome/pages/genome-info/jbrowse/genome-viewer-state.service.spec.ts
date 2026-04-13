import { TestBed } from '@angular/core/testing';
import { GenomeViewerStateService } from './genome-viewer-state.service';

describe('GenomeViewerStateService', () => {
  let service: GenomeViewerStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GenomeViewerStateService);
  });

  it('issues distinct navigation commands for repeated identical locations', () => {
    service.resetSession('NCBI_ASM_001', 'chr1:1..100');

    service.requestNavToLocation('chr1:200..300');
    const firstCommand = service.navCommand();

    service.requestNavToLocation('chr1:200..300');
    const secondCommand = service.navCommand();

    if (!firstCommand || !secondCommand) {
      fail('Expected navigation commands to be emitted');
      return;
    }

    expect(secondCommand.id).toBeGreaterThan(firstCommand.id);
    expect(secondCommand.location).toBe('chr1:200..300');
    expect(secondCommand.assemblyName).toBe('NCBI_ASM_001');
  });

  it('updates region when requesting navigation', () => {
    service.resetSession('NCBI_ASM_001', 'chr1:1..100');

    service.requestNavToLocation('chr1:500..600');

    expect(service.region()).toBe('chr1:500..600');
  });
});
