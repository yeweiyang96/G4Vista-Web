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
    expect(assembly['refNameAliases']).toEqual({
      adapter: {
        type: 'RefNameAliasAdapter',
        location: {
          uri: 'http://localhost:8000/jbrowse/GCF_000021765.1/jbrowse/GCF_000021765.1.refname_aliases.txt',
        },
        refNameColumnHeaderName: 'name',
      },
    });
    expect(config.tracks.length).toBe(7);
    expect(config.configuration.rpc).toEqual({
      defaultDriver: 'WebWorkerRpcDriver',
    });
    expect(config.configuration.theme).toEqual({
      name: 'G4Vista Light',
      mode: 'light',
      components: {
        MuiPaper: {
          defaultProps: {
            elevation: 0,
          },
          styleOverrides: {
            root: {
              boxShadow: 'none',
              backgroundImage: 'none',
            },
          },
        },
      },
      palette: {
        primary: {
          main: '#d7e3ff',
        },
        secondary: {
          main: '#dae2f9',
        },
        tertiary: {
          main: '#f57c00',
        },
        quaternary: {
          main: '#d50000',
        },
        background: {
          default: '#fdfbff',
          paper: '#f9f9ff',
        },
        text: {
          primary: '#1a1b1f',
          secondary: '#46464a',
        },
      },
    });
    expect(config.configuration.extraThemes).toEqual({
      g4vistaLight: {
        name: 'G4Vista Light',
        mode: 'light',
        components: {
          MuiPaper: {
            defaultProps: {
              elevation: 0,
            },
            styleOverrides: {
              root: {
                boxShadow: 'none',
                backgroundImage: 'none',
              },
            },
          },
        },
        palette: {
          primary: {
            main: '#d7e3ff',
          },
          secondary: {
            main: '#dae2f9',
          },
          tertiary: {
            main: '#f57c00',
          },
          quaternary: {
            main: '#d50000',
          },
          background: {
            default: '#fdfbff',
            paper: '#f9f9ff',
          },
          text: {
            primary: '#1a1b1f',
            secondary: '#46464a',
          },
        },
      },
      g4vistaDark: {
        name: 'G4Vista Dark',
        mode: 'dark',
        components: {
          MuiPaper: {
            defaultProps: {
              elevation: 0,
            },
            styleOverrides: {
              root: {
                boxShadow: 'none',
                backgroundImage: 'none',
              },
            },
          },
        },
        palette: {
          primary: {
            main: '#005cbb',
          },
          secondary: {
            main: '#abc7ff',
          },
          tertiary: {
            main: '#ffffff',
          },
          quaternary: {
            main: '#ffb4ab',
          },
          background: {
            default: '#121316',
            paper: '#505050',
          },
          text: {
            primary: '#ffffff',
            secondary: '#ffffff',
          },
        },
      },
    });
    expect(config.defaultVisibleTrackIds).toEqual([
      'GCF_000021765.1_annotation',
      'GCF_000021765.1_g4',
      'GCF_000021765.1_g4_density',
      'GCF_000021765.1_g4_score',
    ]);

    const annotationTrack = config.tracks.find(
      (track) => track.trackId === 'GCF_000021765.1_annotation',
    );
    const g4DensityTrack = config.tracks.find(
      (track) => track.trackId === 'GCF_000021765.1_g4_density',
    );
    const iMotifTrack = config.tracks.find((track) => track.trackId === 'GCF_000021765.1_i-motif');
    const iMotifScoreTrack = config.tracks.find(
      (track) => track.trackId === 'GCF_000021765.1_i-motif_score',
    );

    expect(annotationTrack).toBeDefined();
    expect((annotationTrack as Record<string, unknown>)['textSearching']).toBeDefined();
    const annotationDisplay = (
      (annotationTrack as Record<string, unknown>)['displays'] as
        | Record<string, unknown>[]
        | undefined
    )?.[0];
    expect(annotationDisplay).toBeDefined();
    expect((annotationDisplay as Record<string, unknown>)['type']).toBe('LinearBasicDisplay');
    const annotationRenderer = (annotationDisplay as Record<string, unknown>)['renderer'] as
      | Record<string, unknown>
      | undefined;
    expect(annotationRenderer?.['color1']).toBe('#005cbb');
    expect(annotationRenderer?.['color2']).toBe('#00458f');
    expect(annotationRenderer?.['labels']).toEqual({
      nameColor: '#1a1b1f',
      descriptionColor: '#46464a',
    });
    const g4DensityDisplay = (
      (g4DensityTrack as Record<string, unknown>)['displays'] as
        | Record<string, unknown>[]
        | undefined
    )?.[0];
    const g4DensityRenderers = (g4DensityDisplay as Record<string, unknown>)['renderers'] as
      | Record<string, unknown>
      | undefined;
    expect((g4DensityDisplay as Record<string, unknown>)['type']).toBe('LinearWiggleDisplay');
    expect((g4DensityDisplay as Record<string, unknown>)['defaultRendering']).toBe('xyplot');
    expect(g4DensityRenderers?.['DensityRenderer']).toEqual({
      posColor: '#00458f',
      negColor: '#d50000',
    });
    const iMotifScoreDisplay = (
      (iMotifScoreTrack as Record<string, unknown>)['displays'] as
        | Record<string, unknown>[]
        | undefined
    )?.[0];
    const iMotifScoreRenderers = (iMotifScoreDisplay as Record<string, unknown>)['renderers'] as
      | Record<string, unknown>
      | undefined;
    expect((iMotifScoreDisplay as Record<string, unknown>)['defaultRendering']).toBe('xyplot');
    expect(iMotifScoreRenderers?.['XYPlotRenderer']).toEqual({
      color: '#005cbb',
      posColor: '#005cbb',
      negColor: '#d50000',
    });
    expect(iMotifTrack).toBeDefined();
    expect((iMotifTrack as Record<string, unknown>)['textSearching']).toBeDefined();
    expect(((g4DensityTrack as Record<string, unknown>)['type'] as string) ?? '').toBe(
      'QuantitativeTrack',
    );
    expect(((iMotifScoreTrack as Record<string, unknown>)['type'] as string) ?? '').toBe(
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

  it('uses Material-aligned dark theme when themeMode is dark', () => {
    const config = service.createViewerConfig({
      ...params,
      themeMode: 'dark',
    });

    expect(config.configuration.theme).toEqual({
      name: 'G4Vista Dark',
      mode: 'dark',
      components: {
        MuiPaper: {
          defaultProps: {
            elevation: 0,
          },
          styleOverrides: {
            root: {
              boxShadow: 'none',
              backgroundImage: 'none',
            },
          },
        },
      },
      palette: {
        primary: {
          main: '#005cbb',
        },
        secondary: {
          main: '#abc7ff',
        },
        tertiary: {
          main: '#ffffff',
        },
        quaternary: {
          main: '#ffb4ab',
        },
        background: {
          default: '#121316',
          paper: '#505050',
        },
        text: {
          primary: '#ffffff',
          secondary: '#ffffff',
        },
      },
    });

    const annotationTrack = config.tracks.find(
      (track) => track.trackId === 'GCF_000021765.1_annotation',
    );
    const annotationDisplay = (
      (annotationTrack as Record<string, unknown>)['displays'] as
        | Record<string, unknown>[]
        | undefined
    )?.[0];
    const annotationRenderer = (annotationDisplay as Record<string, unknown>)['renderer'] as
      | Record<string, unknown>
      | undefined;
    expect(annotationRenderer?.['color1']).toBe('#abc7ff');
    expect(annotationRenderer?.['color2']).toBe('#7cabff');
    expect(annotationRenderer?.['labels']).toEqual({
      nameColor: '#ffffff',
      descriptionColor: '#ffffff',
    });

    const g4DensityTrack = config.tracks.find(
      (track) => track.trackId === 'GCF_000021765.1_g4_density',
    );
    const g4DensityDisplay = (
      (g4DensityTrack as Record<string, unknown>)['displays'] as
        | Record<string, unknown>[]
        | undefined
    )?.[0];
    const g4DensityRenderers = (g4DensityDisplay as Record<string, unknown>)['renderers'] as
      | Record<string, unknown>
      | undefined;
    expect(g4DensityRenderers?.['DensityRenderer']).toEqual({
      posColor: '#7cabff',
      negColor: '#ffb4ab',
    });

    const g4ScoreTrack = config.tracks.find(
      (track) => track.trackId === 'GCF_000021765.1_g4_score',
    );
    const g4ScoreDisplay = (
      (g4ScoreTrack as Record<string, unknown>)['displays'] as Record<string, unknown>[] | undefined
    )?.[0];
    const g4ScoreRenderers = (g4ScoreDisplay as Record<string, unknown>)['renderers'] as
      | Record<string, unknown>
      | undefined;
    expect(g4ScoreRenderers?.['XYPlotRenderer']).toEqual({
      color: '#abc7ff',
      posColor: '#abc7ff',
      negColor: '#ffb4ab',
    });
  });
});
