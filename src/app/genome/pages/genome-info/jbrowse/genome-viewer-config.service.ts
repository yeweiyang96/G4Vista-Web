import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, of } from 'rxjs';
import { UiThemeMode } from '../../../../theme/ui-theme.service';
import type { G4Type } from '../../../services/g4.service';

export interface JBrowseTrackConfig extends Record<string, unknown> {
  trackId: string;
}

export interface JBrowseAssemblyConfig extends Record<string, unknown> {
  name: string;
}

interface JBrowseThemePalette {
  primary: {
    main: string;
  };
  secondary: {
    main: string;
  };
  tertiary: {
    main: string;
  };
  quaternary: {
    main: string;
  };
  background: {
    default: string;
    paper: string;
  };
  text: {
    primary: string;
    secondary: string;
  };
}

export interface JBrowseThemeConfig extends Record<string, unknown> {
  name: string;
  mode: UiThemeMode;
  palette: JBrowseThemePalette;
}

function createPaperNoShadowThemeConfig(): Record<string, unknown> {
  return {
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
  };
}

interface JBrowseRootConfiguration extends Record<string, unknown> {
  rpc: {
    defaultDriver: 'WebWorkerRpcDriver';
  };
  theme: JBrowseThemeConfig;
  extraThemes: Record<string, JBrowseThemeConfig>;
}

export interface JBrowseConfig {
  assembly: JBrowseAssemblyConfig;
  tracks: JBrowseTrackConfig[];
  configuration: JBrowseRootConfiguration;
  defaultVisibleTrackIds: string[];
  motifTrackIds: string[];
}

export type GenomeViewerConfig = JBrowseConfig;

export interface GenomeViewerAssetParams {
  assemblyAccession: string;
  dataBaseUrl: string;
}

export interface GenomeViewerConfigParams extends GenomeViewerAssetParams {
  g4Type: G4Type;
  themeMode?: UiThemeMode;
}

export interface GenomeViewerAssetWarning {
  readonly url: string;
  readonly status: number | null;
  readonly statusText: string | null;
  readonly message: string;
}

export interface GenomeViewerDefaultRegionResult {
  readonly region: string;
  readonly warning: GenomeViewerAssetWarning | null;
}

const FALLBACK_REGION = '1..1000';
const LIGHT_THEME_KEY = 'g4vistaLight';
const DARK_THEME_KEY = 'g4vistaDark';

const LIGHT_THEME: JBrowseThemeConfig = {
  name: 'G4Vista Light',
  mode: 'light',
  components: createPaperNoShadowThemeConfig(),
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
};

const DARK_THEME: JBrowseThemeConfig = {
  name: 'G4Vista Dark',
  mode: 'dark',
  components: createPaperNoShadowThemeConfig(),
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
};

const EXTRA_THEMES: Record<string, JBrowseThemeConfig> = {
  [LIGHT_THEME_KEY]: LIGHT_THEME,
  [DARK_THEME_KEY]: DARK_THEME,
};

function resolveActiveTheme(themeMode: UiThemeMode): JBrowseThemeConfig {
  return themeMode === 'dark' ? EXTRA_THEMES[DARK_THEME_KEY] : EXTRA_THEMES[LIGHT_THEME_KEY];
}

function normalizeBaseUrl(dataBaseUrl: string): string {
  return dataBaseUrl.replace(/\/+$/, '');
}

function buildAssemblyAssetUrl(params: GenomeViewerAssetParams, fileName: string): string {
  const normalizedBaseUrl = normalizeBaseUrl(params.dataBaseUrl);
  return `${normalizedBaseUrl}/${params.assemblyAccession}/jbrowse/${fileName}`;
}

function resolveFeatureChunkColors(themeMode: UiThemeMode): { color1: string; color2: string } {
  if (themeMode === 'dark') {
    return {
      color1: '#abc7ff',
      color2: '#7cabff',
    };
  }

  return {
    color1: '#005cbb',
    color2: '#00458f',
  };
}

function createFeatureTrackDisplayConfig(
  params: GenomeViewerConfigParams,
): Record<string, unknown> {
  const themeMode = params.themeMode ?? 'light';
  const activeTheme = resolveActiveTheme(themeMode);
  const chunkColors = resolveFeatureChunkColors(themeMode);

  return {
    type: 'LinearBasicDisplay',
    renderer: {
      color1: chunkColors.color1,
      color2: chunkColors.color2,
      labels: {
        nameColor: activeTheme.palette.text.primary,
        descriptionColor: activeTheme.palette.text.secondary,
      },
    },
  };
}

function createQuantitativeTrackDisplayConfig(
  params: GenomeViewerConfigParams,
  trackType: 'density' | 'score',
): Record<string, unknown> {
  const themeMode = params.themeMode ?? 'light';
  const activeTheme = resolveActiveTheme(themeMode);
  const chunkColors = resolveFeatureChunkColors(themeMode);
  const positiveColor = trackType === 'density' ? chunkColors.color2 : chunkColors.color1;
  const negativeColor = activeTheme.palette.quaternary.main;

  return {
    type: 'LinearWiggleDisplay',
    defaultRendering: 'xyplot',
    renderers: {
      DensityRenderer: {
        posColor: positiveColor,
        negColor: negativeColor,
      },
      XYPlotRenderer: {
        color: positiveColor,
        posColor: positiveColor,
        negColor: negativeColor,
      },
      LinePlotRenderer: {
        color: positiveColor,
        posColor: positiveColor,
        negColor: negativeColor,
      },
    },
  };
}

function createAssemblyConfig(params: GenomeViewerConfigParams): JBrowseAssemblyConfig {
  const assemblyAccession = params.assemblyAccession;

  return {
    name: assemblyAccession,
    sequence: {
      type: 'ReferenceSequenceTrack',
      trackId: `${assemblyAccession}-ReferenceSequenceTrack`,
      adapter: {
        type: 'BgzipFastaAdapter',
        fastaLocation: {
          uri: buildAssemblyAssetUrl(params, `${assemblyAccession}.fna.gz`),
        },
        faiLocation: {
          uri: buildAssemblyAssetUrl(params, `${assemblyAccession}.fna.gz.fai`),
        },
        gziLocation: {
          uri: buildAssemblyAssetUrl(params, `${assemblyAccession}.fna.gz.gzi`),
        },
      },
    },
    refNameAliases: {
      adapter: {
        type: 'RefNameAliasAdapter',
        location: {
          uri: buildAssemblyAssetUrl(params, `${assemblyAccession}.refname_aliases.txt`),
        },
        refNameColumnHeaderName: 'name',
      },
    },
  };
}

function createAnnotationTrackConfig(params: GenomeViewerConfigParams): JBrowseTrackConfig {
  const assemblyAccession = params.assemblyAccession;
  const annotationFileName = `${assemblyAccession}.annotation.sorted.gff.gz`;

  return {
    type: 'FeatureTrack',
    trackId: `${assemblyAccession}_annotation`,
    name: 'Genome annotation',
    assemblyNames: [assemblyAccession],
    displays: [createFeatureTrackDisplayConfig(params)],
    category: ['Annotation'],
    adapter: {
      type: 'Gff3TabixAdapter',
      gffGzLocation: {
        uri: buildAssemblyAssetUrl(params, annotationFileName),
      },
      index: {
        location: {
          uri: buildAssemblyAssetUrl(params, `${annotationFileName}.tbi`),
        },
      },
    },
    textSearching: {
      textSearchAdapter: {
        type: 'TrixTextSearchAdapter',
        textSearchAdapterId: `${assemblyAccession}_annotation-index`,
        ixFilePath: {
          uri: buildAssemblyAssetUrl(params, `trix/${annotationFileName}.ix`),
        },
        ixxFilePath: {
          uri: buildAssemblyAssetUrl(params, `trix/${annotationFileName}.ixx`),
        },
        metaFilePath: {
          uri: buildAssemblyAssetUrl(params, `trix/${annotationFileName}_meta.json`),
        },
        assemblyNames: [assemblyAccession],
      },
    },
  };
}

function createG4TrackConfigs(params: GenomeViewerConfigParams): JBrowseTrackConfig[] {
  const assemblyAccession = params.assemblyAccession;
  const g4FileName = `${assemblyAccession}.g4.sorted.gff.gz`;
  const iMotifFileName = `${assemblyAccession}.i-motif.sorted.gff.gz`;

  return [
    {
      type: 'FeatureTrack',
      trackId: `${assemblyAccession}_g4`,
      name: 'G4',
      assemblyNames: [assemblyAccession],
      displays: [createFeatureTrackDisplayConfig(params)],
      category: ['G4'],
      adapter: {
        type: 'Gff3TabixAdapter',
        gffGzLocation: {
          uri: buildAssemblyAssetUrl(params, g4FileName),
        },
        index: {
          location: {
            uri: buildAssemblyAssetUrl(params, `${g4FileName}.tbi`),
          },
        },
      },
    },
    {
      type: 'FeatureTrack',
      trackId: `${assemblyAccession}_i-motif`,
      name: 'i-motif',
      assemblyNames: [assemblyAccession],
      displays: [createFeatureTrackDisplayConfig(params)],
      category: ['i-motif'],
      adapter: {
        type: 'Gff3TabixAdapter',
        gffGzLocation: {
          uri: buildAssemblyAssetUrl(params, iMotifFileName),
        },
        index: {
          location: {
            uri: buildAssemblyAssetUrl(params, `${iMotifFileName}.tbi`),
          },
        },
      },
    },
    {
      type: 'QuantitativeTrack',
      trackId: `${assemblyAccession}_g4_density`,
      name: 'G4 density',
      assemblyNames: [assemblyAccession],
      displays: [createQuantitativeTrackDisplayConfig(params, 'density')],
      category: ['G4'],
      adapter: {
        type: 'BigWigAdapter',
        bigWigLocation: {
          uri: buildAssemblyAssetUrl(params, `${assemblyAccession}.g4.density.bw`),
        },
      },
    },
    {
      type: 'QuantitativeTrack',
      trackId: `${assemblyAccession}_i-motif_density`,
      name: 'i-motif density',
      assemblyNames: [assemblyAccession],
      displays: [createQuantitativeTrackDisplayConfig(params, 'density')],
      category: ['i-motif'],
      adapter: {
        type: 'BigWigAdapter',
        bigWigLocation: {
          uri: buildAssemblyAssetUrl(params, `${assemblyAccession}.i-motif.density.bw`),
        },
      },
    },
    {
      type: 'QuantitativeTrack',
      trackId: `${assemblyAccession}_g4_score`,
      name: 'G4 score',
      assemblyNames: [assemblyAccession],
      displays: [createQuantitativeTrackDisplayConfig(params, 'score')],
      category: ['G4'],
      adapter: {
        type: 'BigWigAdapter',
        bigWigLocation: {
          uri: buildAssemblyAssetUrl(params, `${assemblyAccession}.g4.score.bw`),
        },
      },
    },
    {
      type: 'QuantitativeTrack',
      trackId: `${assemblyAccession}_i-motif_score`,
      name: 'i-motif score',
      assemblyNames: [assemblyAccession],
      displays: [createQuantitativeTrackDisplayConfig(params, 'score')],
      category: ['i-motif'],
      adapter: {
        type: 'BigWigAdapter',
        bigWigLocation: {
          uri: buildAssemblyAssetUrl(params, `${assemblyAccession}.i-motif.score.bw`),
        },
      },
    },
  ];
}

function createDefaultVisibleTrackIds(assemblyAccession: string, g4Type: G4Type): string[] {
  const motifTrackPrefix = g4Type === 'i-motif' ? 'i-motif' : 'g4';

  return [
    `${assemblyAccession}_annotation`,
    `${assemblyAccession}_${motifTrackPrefix}`,
    `${assemblyAccession}_${motifTrackPrefix}_density`,
    `${assemblyAccession}_${motifTrackPrefix}_score`,
  ];
}

function createGeneDefaultVisibleTrackIds(assemblyAccession: string): string[] {
  return [
    `${assemblyAccession}_annotation`,
    `${assemblyAccession}_g4`,
    `${assemblyAccession}_i-motif`,
  ];
}

function createMotifTrackIds(assemblyAccession: string): string[] {
  return [
    `${assemblyAccession}_g4`,
    `${assemblyAccession}_g4_density`,
    `${assemblyAccession}_g4_score`,
    `${assemblyAccession}_i-motif`,
    `${assemblyAccession}_i-motif_density`,
    `${assemblyAccession}_i-motif_score`,
  ];
}

function parseDefaultRegionFromFaiContent(faiContent: string): string {
  const firstNonEmptyLine = faiContent
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line.length > 0);

  if (!firstNonEmptyLine) {
    return FALLBACK_REGION;
  }

  const firstRefName = firstNonEmptyLine.split('\t')[0];
  if (!firstRefName) {
    return FALLBACK_REGION;
  }

  return `${firstRefName}:1..1000`;
}

function assetWarningFromError(url: string, error: unknown): GenomeViewerAssetWarning {
  if (error instanceof HttpErrorResponse) {
    return {
      url,
      status: error.status,
      statusText: error.statusText || null,
      message: error.message,
    };
  }
  if (error instanceof Error) {
    return {
      url,
      status: null,
      statusText: null,
      message: error.message,
    };
  }
  return {
    url,
    status: null,
    statusText: null,
    message: 'JBrowse asset request failed.',
  };
}

@Injectable({
  providedIn: 'root',
})
export class GenomeViewerConfigService {
  private readonly http = inject(HttpClient);

  createViewerConfig(params: GenomeViewerConfigParams): GenomeViewerConfig {
    const assemblyAccession = params.assemblyAccession;
    return this.createViewerConfigWithDefaultVisibleTrackIds(
      params,
      createDefaultVisibleTrackIds(assemblyAccession, params.g4Type),
    );
  }

  createGeneViewerConfig(params: GenomeViewerConfigParams): GenomeViewerConfig {
    return this.createViewerConfigWithDefaultVisibleTrackIds(
      params,
      createGeneDefaultVisibleTrackIds(params.assemblyAccession),
    );
  }

  private createViewerConfigWithDefaultVisibleTrackIds(
    params: GenomeViewerConfigParams,
    defaultVisibleTrackIds: string[],
  ): GenomeViewerConfig {
    const assemblyAccession = params.assemblyAccession;
    const themeMode = params.themeMode ?? 'light';

    return {
      assembly: createAssemblyConfig(params),
      tracks: [createAnnotationTrackConfig(params), ...createG4TrackConfigs(params)],
      configuration: {
        rpc: {
          defaultDriver: 'WebWorkerRpcDriver',
        },
        theme: resolveActiveTheme(themeMode),
        extraThemes: EXTRA_THEMES,
      },
      defaultVisibleTrackIds,
      motifTrackIds: createMotifTrackIds(assemblyAccession),
    };
  }

  resolveDefaultRegion(params: GenomeViewerAssetParams): Observable<GenomeViewerDefaultRegionResult> {
    const assemblyAccession = params.assemblyAccession;
    const faiUrl = buildAssemblyAssetUrl(params, `${assemblyAccession}.fna.gz.fai`);

    return this.http.get(faiUrl, { responseType: 'text' }).pipe(
      map((faiContent) => ({
        region: parseDefaultRegionFromFaiContent(faiContent),
        warning: null,
      })),
      catchError((error: unknown) =>
        of({
          region: FALLBACK_REGION,
          warning: assetWarningFromError(faiUrl, error),
        }),
      ),
    );
  }
}
