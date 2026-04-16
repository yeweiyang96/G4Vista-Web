import { Routes, UrlMatchResult, UrlSegment } from '@angular/router';
import { isDevMode } from '@angular/core';
import { HomeComponent } from './home/home.component';

const JBROWSE_BASE_URL = isDevMode()
  ? 'http://localhost:8000/jbrowse'
  : 'https://g4vista.med.niigata-u.ac.jp/api/jbrowse';

export const routes: Routes = [
  { path: '', title: 'G4Vista', component: HomeComponent },
  {
    path: 'taxonomy',
    title: 'Taxonomy',
    loadComponent: () =>
      import('./taxonomy/pages/taxonomy-home/taxonomy-home.component').then(
        (m) => m.TaxonomyHomeComponent,
      ),
  },
  {
    matcher: (url: UrlSegment[]): UrlMatchResult | null => {
      if (url.length === 2 && url[0].path === 'taxonomy' && /^\d+$/.test(url[1].path)) {
        return {
          consumed: url,
          posParams: {
            taxonId: url[1],
          },
        };
      }
      return null;
    },
    title: 'Taxonomy',
    loadComponent: () =>
      import('./taxonomy/pages/taxonomy-info/taxonomy-info').then((m) => m.TaxonomyInfoComponent),
  },
  {
    path: 'genome',
    title: 'Genome',
    loadComponent: () =>
      import('./genome/pages/genome-home/genome-home.component').then((m) => m.GenomeHomeComponent),
  },
  {
    path: 'genome/:assemblyAccession',
    title: 'Genome',
    data: {
      dataBaseUrl: JBROWSE_BASE_URL,
    },
    loadComponent: () =>
      import('./genome/pages/genome-info/genome-info.component').then((m) => m.GenomeInfoComponent),
  },
  {
    path: 'gene/:assemblyAccession/:seqid/:featureId',
    title: 'Gene',
    loadComponent: () =>
      import('./gene/pages/gene-info/gene-info.component').then((m) => m.GeneInfoComponent),
  },
];
