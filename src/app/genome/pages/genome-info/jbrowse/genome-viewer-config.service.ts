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
  return `http://localhost:8000/jbrowse/${assemblyName}/jbrowse/${fileName}`;
}

function createViewerConfigFromAssembly(
  assemblyAccession: string,
  firstChromosome: string,
): GenomeViewerConfig {
  const geneTrackId = `${assemblyAccession}_annotation`;
  const gRichTrackId = `${assemblyAccession}_g4`;
  const cRichTrackId = `${assemblyAccession}_g4_revcomp`;

  return {
    assembly: {
      name: assemblyAccession,
      sequence: {
        type: 'ReferenceSequenceTrack',
        trackId: 'ReferenceSequenceTrack',
        adapter: {
          type: 'BgzipFastaAdapter',
          fastaLocation: {
            uri: buildAssemblyAssetUrl(assemblyAccession, `${assemblyAccession}.fna.gz`),
          },
          faiLocation: {
            uri: buildAssemblyAssetUrl(assemblyAccession, `${assemblyAccession}.fna.gz.fai`),
          },
          gziLocation: {
            uri: buildAssemblyAssetUrl(assemblyAccession, `${assemblyAccession}.fna.gz.gzi`),
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
            uri: buildAssemblyAssetUrl(
              assemblyAccession,
              `${assemblyAccession}.annotation.sorted.gff.gz`,
            ),
          },
          index: {
            indexType: 'TBI',
            location: {
              uri: buildAssemblyAssetUrl(
                assemblyAccession,
                `${assemblyAccession}.annotation.sorted.gff.gz.tbi`,
              ),
            },
          },
        },
      },
      {
        type: 'FeatureTrack',
        trackId: gRichTrackId,
        name: 'G-quadruplexs',
        assemblyNames: [assemblyAccession],
        adapter: {
          type: 'Gff3TabixAdapter',
          gffGzLocation: {
            uri: buildAssemblyAssetUrl(assemblyAccession, `${assemblyAccession}.g4.sorted.gff.gz`),
          },
          index: {
            indexType: 'TBI',
            location: {
              uri: buildAssemblyAssetUrl(
                assemblyAccession,
                `${assemblyAccession}.g4.sorted.gff.gz.tbi`,
              ),
            },
          },
        },
      },
      {
        type: 'FeatureTrack',
        trackId: cRichTrackId,
        name: 'G-quadruplexs on reverse complement',
        assemblyNames: [assemblyAccession],
        adapter: {
          type: 'Gff3TabixAdapter',
          gffGzLocation: {
            uri: buildAssemblyAssetUrl(
              assemblyAccession,
              `${assemblyAccession}.g4.revcomp.sorted.gff.gz`,
            ),
          },
          index: {
            indexType: 'TBI',
            location: {
              uri: buildAssemblyAssetUrl(
                assemblyAccession,
                `${assemblyAccession}.g4.revcomp.sorted.gff.gz.tbi`,
              ),
            },
          },
        },
      },
    ],
    defaultVisibleTrackIds: ['ReferenceSequenceTrack', geneTrackId, gRichTrackId, cRichTrackId],
    defaultRegion: `${firstChromosome}:1..1000`,
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
