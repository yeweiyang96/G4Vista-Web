import { Injectable } from '@angular/core';

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

export interface GenomeViewerConfig extends JBrowseConfig {
  defaultRegion: string;
}

function buildAssemblyAssetUrl(assemblyName: string, fileName: string): string {
  return `https://g4vista.med.niigata-u.ac.jp/jbrowse/${assemblyName}/${fileName}`;
}

function createViewerConfigFromAssembly(
  assemblyAccession: string,
  firstChromosome: string,
): GenomeViewerConfig {
  const geneTrackId = `${assemblyAccession}.gff.gz`;
  const gRichTrackId = `${assemblyAccession}_g.gff.gz`;
  const cRichTrackId = `${assemblyAccession}_c.gff.gz`;

  return {
    assembly: {
      name: assemblyAccession,
      sequence: {
        type: 'ReferenceSequenceTrack',
        trackId: 'ReferenceSequenceTrack',
        adapter: {
          type: 'BgzipFastaAdapter',
          fastaLocation: {
            uri: buildAssemblyAssetUrl(assemblyAccession, `${assemblyAccession}.fa.gz`),
          },
          faiLocation: {
            uri: buildAssemblyAssetUrl(assemblyAccession, `${assemblyAccession}.fa.gz.fai`),
          },
          gziLocation: {
            uri: buildAssemblyAssetUrl(assemblyAccession, `${assemblyAccession}.fa.gz.gzi`),
          },
        },
      },
    },
    tracks: [
      {
        type: 'FeatureTrack',
        trackId: geneTrackId,
        name: 'Genes',
        assemblyNames: [assemblyAccession],
        adapter: {
          type: 'Gff3TabixAdapter',
          gffGzLocation: {
            uri: buildAssemblyAssetUrl(assemblyAccession, geneTrackId),
          },
          index: {
            indexType: 'TBI',
            location: {
              uri: buildAssemblyAssetUrl(assemblyAccession, `${geneTrackId}.tbi`),
            },
          },
        },
      },
      {
        type: 'FeatureTrack',
        trackId: gRichTrackId,
        name: 'G-Rich Sequences',
        assemblyNames: [assemblyAccession],
        adapter: {
          type: 'Gff3TabixAdapter',
          gffGzLocation: {
            uri: buildAssemblyAssetUrl(assemblyAccession, gRichTrackId),
          },
          index: {
            indexType: 'TBI',
            location: {
              uri: buildAssemblyAssetUrl(assemblyAccession, `${gRichTrackId}.tbi`),
            },
          },
        },
      },
      {
        type: 'FeatureTrack',
        trackId: cRichTrackId,
        name: 'C-Rich Sequences',
        assemblyNames: [assemblyAccession],
        adapter: {
          type: 'Gff3TabixAdapter',
          gffGzLocation: {
            uri: buildAssemblyAssetUrl(assemblyAccession, cRichTrackId),
          },
          index: {
            indexType: 'TBI',
            location: {
              uri: buildAssemblyAssetUrl(assemblyAccession, `${cRichTrackId}.tbi`),
            },
          },
        },
      },
    ],
    defaultVisibleTrackIds: ['ReferenceSequenceTrack', geneTrackId, gRichTrackId, cRichTrackId],
    defaultRegion: `${firstChromosome}:1..100000`,
  };
}

@Injectable({
  providedIn: 'root',
})
export class GenomeViewerConfigService {
  createViewerConfig(assemblyAccession: string): GenomeViewerConfig {
    return createViewerConfigFromAssembly(assemblyAccession, 'NC_000001.11');
  }
}
