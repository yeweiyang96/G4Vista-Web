import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, of } from 'rxjs';

export interface JBrowseTrackConfig extends Record<string, unknown> {
  trackId: string;
}

export interface JBrowseAssemblyConfig extends Record<string, unknown> {
  name: string;
}

export interface JBrowseConfig {
  assembly: JBrowseAssemblyConfig;
  tracks: JBrowseTrackConfig[];
  defaultVisibleTrackIds: string[];
}

export type GenomeViewerConfig = JBrowseConfig;

export interface GenomeViewerConfigParams {
  assemblyAccession: string;
  dataBaseUrl: string;
}

const FALLBACK_REGION = '1..1000';

function normalizeBaseUrl(dataBaseUrl: string): string {
  return dataBaseUrl.replace(/\/+$/, '');
}

function buildAssemblyAssetUrl(params: GenomeViewerConfigParams, fileName: string): string {
  const normalizedBaseUrl = normalizeBaseUrl(params.dataBaseUrl);
  return `${normalizedBaseUrl}/${params.assemblyAccession}/jbrowse/${fileName}`;
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
  const iMotifFileName = `${assemblyAccession}.i_motif.sorted.gff.gz`;

  return [
    {
      type: 'FeatureTrack',
      trackId: `${assemblyAccession}_g4`,
      name: 'G4 motifs',
      assemblyNames: [assemblyAccession],
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
      textSearching: {
        textSearchAdapter: {
          type: 'TrixTextSearchAdapter',
          textSearchAdapterId: `${assemblyAccession}_g4-index`,
          ixFilePath: {
            uri: buildAssemblyAssetUrl(params, `trix/${g4FileName}.ix`),
          },
          ixxFilePath: {
            uri: buildAssemblyAssetUrl(params, `trix/${g4FileName}.ixx`),
          },
          metaFilePath: {
            uri: buildAssemblyAssetUrl(params, `trix/${g4FileName}_meta.json`),
          },
          assemblyNames: [assemblyAccession],
        },
      },
    },
    {
      type: 'FeatureTrack',
      trackId: `${assemblyAccession}_i_motif`,
      name: 'i-motif',
      assemblyNames: [assemblyAccession],
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
      textSearching: {
        textSearchAdapter: {
          type: 'TrixTextSearchAdapter',
          textSearchAdapterId: `${assemblyAccession}_i_motif-index`,
          ixFilePath: {
            uri: buildAssemblyAssetUrl(params, `trix/${iMotifFileName}.ix`),
          },
          ixxFilePath: {
            uri: buildAssemblyAssetUrl(params, `trix/${iMotifFileName}.ixx`),
          },
          metaFilePath: {
            uri: buildAssemblyAssetUrl(params, `trix/${iMotifFileName}_meta.json`),
          },
          assemblyNames: [assemblyAccession],
        },
      },
    },
    {
      type: 'QuantitativeTrack',
      trackId: `${assemblyAccession}_g4_density`,
      name: 'G4 density',
      assemblyNames: [assemblyAccession],
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
      trackId: `${assemblyAccession}_i_motif_density`,
      name: 'i-motif density',
      assemblyNames: [assemblyAccession],
      category: ['i-motif'],
      adapter: {
        type: 'BigWigAdapter',
        bigWigLocation: {
          uri: buildAssemblyAssetUrl(params, `${assemblyAccession}.i_motif.density.bw`),
        },
      },
    },
    {
      type: 'QuantitativeTrack',
      trackId: `${assemblyAccession}_g4_gscore`,
      name: 'G4 score',
      assemblyNames: [assemblyAccession],
      category: ['G4'],
      adapter: {
        type: 'BigWigAdapter',
        bigWigLocation: {
          uri: buildAssemblyAssetUrl(params, `${assemblyAccession}.g4.gscore.bw`),
        },
      },
    },
    {
      type: 'QuantitativeTrack',
      trackId: `${assemblyAccession}_i_motif_gscore`,
      name: 'i-motif score',
      assemblyNames: [assemblyAccession],
      category: ['i-motif'],
      adapter: {
        type: 'BigWigAdapter',
        bigWigLocation: {
          uri: buildAssemblyAssetUrl(params, `${assemblyAccession}.i_motif.gscore.bw`),
        },
      },
    },
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

@Injectable({
  providedIn: 'root',
})
export class GenomeViewerConfigService {
  private readonly http = inject(HttpClient);

  createViewerConfig(params: GenomeViewerConfigParams): GenomeViewerConfig {
    const assemblyAccession = params.assemblyAccession;

    return {
      assembly: createAssemblyConfig(params),
      tracks: [createAnnotationTrackConfig(params), ...createG4TrackConfigs(params)],
      defaultVisibleTrackIds: [
        `${assemblyAccession}_annotation`,
        `${assemblyAccession}_g4`,
        `${assemblyAccession}_g4_density`,
        `${assemblyAccession}_g4_gscore`,
      ],
    };
  }

  resolveDefaultRegion(params: GenomeViewerConfigParams): Observable<string> {
    const assemblyAccession = params.assemblyAccession;
    const faiUrl = buildAssemblyAssetUrl(params, `${assemblyAccession}.fna.gz.fai`);

    return this.http.get(faiUrl, { responseType: 'text' }).pipe(
      map((faiContent) => parseDefaultRegionFromFaiContent(faiContent)),
      catchError(() => of(FALLBACK_REGION)),
    );
  }
}
