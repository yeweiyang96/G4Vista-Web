import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import {
  GenomeViewerConfigParams,
  GenomeViewerConfigService,
} from './genome-viewer-config.service';

describe('GenomeViewerConfigService', () => {
  let service: GenomeViewerConfigService;
  let httpMock: HttpTestingController;

  const params: GenomeViewerConfigParams = {
    assemblyAccession: 'GCF_000021765.1',
    dataBaseUrl: 'http://localhost:8000/jbrowse/',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(GenomeViewerConfigService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('builds config aligned with expected assembly/annotation/g4 structure', () => {
    const config = service.createViewerConfig(params);

    const assembly = config.assembly as Record<string, unknown>;
    expect(assembly['name']).toBe('GCF_000021765.1');
    expect(assembly['refNameAliases']).toBeUndefined();
    expect(config.tracks.length).toBe(7);
    expect(config.defaultVisibleTrackIds).toEqual([
      'GCF_000021765.1_annotation',
      'GCF_000021765.1_g4',
      'GCF_000021765.1_g4_density',
      'GCF_000021765.1_g4_gscore',
    ]);

    const annotationTrack = config.tracks.find(
      (track) => track.trackId === 'GCF_000021765.1_annotation',
    );
    const g4DensityTrack = config.tracks.find(
      (track) => track.trackId === 'GCF_000021765.1_g4_density',
    );
    const iMotifTrack = config.tracks.find((track) => track.trackId === 'GCF_000021765.1_i_motif');
    const iMotifGscoreTrack = config.tracks.find(
      (track) => track.trackId === 'GCF_000021765.1_i_motif_gscore',
    );

    expect(annotationTrack).toBeDefined();
    expect((annotationTrack as Record<string, unknown>)['textSearching']).toBeDefined();
    expect(iMotifTrack).toBeDefined();
    expect((iMotifTrack as Record<string, unknown>)['textSearching']).toBeDefined();
    expect(((g4DensityTrack as Record<string, unknown>)['type'] as string) ?? '').toBe(
      'QuantitativeTrack',
    );
    expect(((iMotifGscoreTrack as Record<string, unknown>)['type'] as string) ?? '').toBe(
      'QuantitativeTrack',
    );
  });

  it('parses default region from the first row of fai content', () => {
    let actualRegion = '';

    service.resolveDefaultRegion(params).subscribe((region) => {
      actualRegion = region;
    });

    const request = httpMock.expectOne(
      'http://localhost:8000/jbrowse/GCF_000021765.1/jbrowse/GCF_000021765.1.fna.gz.fai',
    );
    expect(request.request.responseType).toBe('text');
    request.flush('NC_011662.2\t4496212\t55\t80\t81\nNC_011667.1\t78374\t4552540\t80\t81\n');

    expect(actualRegion).toBe('NC_011662.2:1..1000');
  });

  it('falls back when fai request fails', () => {
    let actualRegion = '';

    service.resolveDefaultRegion(params).subscribe((region) => {
      actualRegion = region;
    });

    const request = httpMock.expectOne(
      'http://localhost:8000/jbrowse/GCF_000021765.1/jbrowse/GCF_000021765.1.fna.gz.fai',
    );
    request.flush('Not Found', { status: 404, statusText: 'Not Found' });

    expect(actualRegion).toBe('1..1000');
  });
});
