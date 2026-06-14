import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

type ApiMethod = 'GET' | 'POST';

interface ServerApiDocLink {
  readonly href: string;
  readonly icon: string;
  readonly title: string;
  readonly description: string;
}

interface ServerApiSample {
  readonly method: ApiMethod;
  readonly path: string;
  readonly description: string;
  readonly requestBody: string | null;
}

@Component({
  selector: 'app-server-api-help-panel',
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './server-api-help-panel.html',
  styleUrl: './help-workflow-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServerApiHelpPanel {
  readonly docsLinks: readonly ServerApiDocLink[] = [
    {
      href: '/api/docs',
      icon: 'description',
      title: 'Swagger UI',
      description: 'Interactive endpoint documentation with request controls and response schemas.',
    },
    {
      href: '/api/redoc',
      icon: 'article',
      title: 'ReDoc',
      description: 'Readable API reference for browsing grouped endpoints and model schemas.',
    },
    {
      href: '/api/openapi.json',
      icon: 'data_object',
      title: 'OpenAPI JSON',
      description: 'Machine-readable schema for clients, notebooks, and API tooling.',
    },
  ];

  readonly samples: readonly ServerApiSample[] = [
    {
      method: 'GET',
      path: '/api/v1/genome/status',
      description: 'Check genome database counts and data freshness.',
      requestBody: null,
    },
    {
      method: 'GET',
      path: '/api/v1/genome/?query=Arabidopsis',
      description: 'Search genome assemblies by organism, assembly name, or accession.',
      requestBody: null,
    },
    {
      method: 'GET',
      path: '/api/v1/taxa/?query=Arabidopsis',
      description: 'Search taxonomy records by scientific name, common name, or Taxon ID.',
      requestBody: null,
    },
    {
      method: 'GET',
      path: '/api/v1/genome/GCF_000001735.4/overview',
      description: 'Load overview metadata and motif counts for one assembly.',
      requestBody: null,
    },
    {
      method: 'GET',
      path: '/api/v1/g4/GCF_000001735.4/g4?limit=20&tetrads=3&min_score=12',
      description: 'Fetch filtered G4 motif rows for an assembly.',
      requestBody: null,
    },
    {
      method: 'GET',
      path: '/api/v1/g4/GCF_000001735.4/g4/position-distribution?flank_window=1000&include_feature_breakdown=true',
      description: 'Summarize motif position categories around gene landmarks.',
      requestBody: null,
    },
    {
      method: 'POST',
      path: '/api/v1/research/microbial-environment-g4/query',
      description: 'Submit a microbial environment G4 analysis request.',
      requestBody: `{
  "trait": "temperature",
  "mode": "growth",
  "taxonomy_selections": [
    {
      "rank": "genus",
      "value": "Bacillus"
    }
  ],
  "page_index": 0,
  "page_size": 50,
  "sort_field": "phenotype_value",
  "sort_order": "asc",
  "density_metric": "g4_density_per_mb"
}`,
    },
  ];
}
