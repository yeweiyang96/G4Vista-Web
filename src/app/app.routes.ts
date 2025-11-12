import { Routes, UrlMatchResult, UrlSegment } from '@angular/router';
import { HomeComponent } from './home/home.component';

export const routes: Routes = [
  { path: '', title: 'G4Vista', component: HomeComponent },
  {
    path: 'taxonomy',
    title: 'Taxonomy',
    loadComponent: () => import('./taxonomy/taxonomy.component').then((m) => m.TaxonomyComponent),
  },
  {
    matcher: (url: UrlSegment[]): UrlMatchResult | null => {
      if (url.length === 2 && url[0].path === 'taxonomy' && /^\d+$/.test(url[1].path)) {
        return {
          consumed: url,
          posParams: {
            taxon_id: url[1],
          },
        };
      }
      return null;
    },
    title: 'Taxonomy',
    loadComponent: () =>
      import('./taxonomy/taxonomy-details/taxonomy-details').then((m) => m.TaxonomyDetails),
  },
];
