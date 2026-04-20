import './jbrowse-worker-polyfill';

import { initializeWorker } from '@jbrowse/product-core';
import Alignments from '@jbrowse/plugin-alignments';
import Arc from '@jbrowse/plugin-arc';
import Authentication from '@jbrowse/plugin-authentication';
import BED from '@jbrowse/plugin-bed';
import Canvas from '@jbrowse/plugin-canvas';
import Config from '@jbrowse/plugin-config';
import DataManagement from '@jbrowse/plugin-data-management';
import GCContent from '@jbrowse/plugin-gccontent';
import GFF3 from '@jbrowse/plugin-gff3';
import LegacyJBrowse from '@jbrowse/plugin-legacy-jbrowse';
import LinearGenomeView from '@jbrowse/plugin-linear-genome-view';
import Sequence from '@jbrowse/plugin-sequence';
import Trix from '@jbrowse/plugin-trix';
import Variants from '@jbrowse/plugin-variants';
import Wiggle from '@jbrowse/plugin-wiggle';
import { enableStaticRendering } from 'mobx-react';

const corePlugins = [
  Canvas,
  Alignments,
  Authentication,
  BED,
  Config,
  DataManagement,
  GFF3,
  LegacyJBrowse,
  LinearGenomeView,
  Sequence,
  Variants,
  Wiggle,
  GCContent,
  Trix,
  Arc,
];

function rewriteRelativeImportExtension(path: string): string {
  return path.replace(
    /\.(tsx)$|((?:\.d)?)((?:\.[^./]+?)?)\.([cm]?)ts$/i,
    (
      _match,
      tsx: string | undefined,
      declaration: string,
      extension: string,
      moduleType: string,
    ) =>
      tsx
        ? '.jsx'
        : declaration && (!extension || !moduleType)
          ? _match
          : `${declaration}${extension}.${moduleType.toLowerCase()}js`,
  );
}

enableStaticRendering(true);

void initializeWorker(corePlugins, {
  fetchESM: (url) => import(/* @vite-ignore */ rewriteRelativeImportExtension(url)),
});
