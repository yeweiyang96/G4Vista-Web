import { HelpTourDefinition, HelpWorkflowId } from './help-content-types';

export class HelpTourConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'HelpTourConfigurationError';
  }
}

export const DEFAULT_GENOME_DETAIL_HELP_ROUTE = '/genome/GCF_000001405.40';

const HELP_WORKFLOW_IDS: readonly HelpWorkflowId[] = [
  'taxonomy',
  'genome',
  'genome-detail',
  'gene',
  'download',
  'microbial-environment',
  'server-api',
];

export function isHelpWorkflowId(value: string): value is HelpWorkflowId {
  return HELP_WORKFLOW_IDS.some((workflowId) => workflowId === value);
}

function isGenomeDetailRoute(path: string): boolean {
  return /^\/genome\/[^/]+$/.test(path);
}

function isGeneTaxonRoute(path: string): boolean {
  return /^\/gene\/taxon\/[^/]+$/.test(path);
}

export const HELP_TOURS: Readonly<Record<HelpWorkflowId, HelpTourDefinition>> = {
  taxonomy: {
    id: 'taxonomy',
    label: 'Taxonomy search',
    steps: [
      {
        icon: 'account_tree',
        title: 'Taxonomy landing page',
        body: 'Start here when your question begins with an organism, lineage, or NCBI Taxon ID.',
        route: '/taxonomy',
        targetSelector: '[data-help-target="taxonomy-header"]',
      },
      {
        icon: 'search',
        title: 'Search a taxon',
        body: 'Type a scientific name, common name, group name, or Taxon ID, then choose the result with the expected rank and ID.',
        route: '/taxonomy',
        targetSelector: '[data-help-target="taxonomy-search"]',
      },
      {
        icon: 'category',
        title: 'Browse common taxa',
        body: 'Use broad starting groups when you want to inspect a lineage before choosing individual assemblies.',
        route: '/taxonomy',
        targetSelector: '[data-help-target="taxonomy-browse"]',
      },
    ],
  },
  genome: {
    id: 'genome',
    label: 'Genome search',
    steps: [
      {
        icon: 'manage_search',
        title: 'Genome search',
        body: 'Use Genome search when you know an assembly accession, assembly name, or organism name.',
        route: '/genome',
        targetSelector: '[data-help-target="genome-search"]',
      },
      {
        icon: 'keyboard_arrow_down',
        title: 'Search assembly records',
        body: 'Search exact accessions for reproducible work, or search organism names to compare available assemblies.',
        route: '/genome',
        targetSelector: '[data-help-target="genome-search-input"]',
      },
      {
        icon: 'bookmark_border',
        title: 'Review recommended assemblies',
        body: 'Recommended rows are quick examples. Record the accession before using results in analysis.',
        route: '/genome',
        targetSelector: '[data-help-target="genome-recommended"]',
      },
    ],
  },
  'genome-detail': {
    id: 'genome-detail',
    label: 'Genome detail and G4 Explorer',
    steps: [
      {
        icon: 'badge',
        title: 'Confirm assembly context',
        body: 'Check assembly accession, organism, taxonomy link, genome length, and predicted sequence counts before interpreting filters.',
        route: DEFAULT_GENOME_DETAIL_HELP_ROUTE,
        targetSelector: '[data-help-target="genome-overview"]',
      },
      {
        icon: 'query_stats',
        title: 'Compare position distributions',
        body: 'Use motif type, flank window, tetrad, score, and category controls to understand gene-centered sequence distribution.',
        route: DEFAULT_GENOME_DETAIL_HELP_ROUTE,
        targetSelector: '[data-help-target="position-distribution"]',
      },
      {
        icon: 'filter_alt',
        title: 'Filter the G4 Explorer',
        body: 'Combine sequence record, motif type, gene relation, gene keyword, tetrad, and score filters before applying.',
        route: DEFAULT_GENOME_DETAIL_HELP_ROUTE,
        targetSelector: '[data-help-target="g4-explorer-filters"]',
      },
      {
        icon: 'hub',
        title: 'Use the explorer views',
        body: 'Use the table, range chart, genome browser, and current-selection panel together to verify genomic context.',
        route: DEFAULT_GENOME_DETAIL_HELP_ROUTE,
        targetSelector: '[data-help-target="g4-explorer"]',
      },
    ],
  },
  gene: {
    id: 'gene',
    label: 'Gene search',
    steps: [
      {
        icon: 'abc',
        title: 'Gene workspace',
        body: 'Use Gene search when your question starts from a gene symbol, feature ID, locus tag, or annotation keyword.',
        route: '/gene',
        targetSelector: '[data-help-target="gene-header"]',
      },
      {
        icon: 'search',
        title: 'Submit a gene keyword',
        body: 'Enter a gene keyword and optionally choose a taxon scope to keep broad searches manageable.',
        route: '/gene',
        targetSelector: '[data-help-target="gene-search"]',
      },
      {
        icon: 'ballot',
        title: 'Open a linked record',
        body: 'Open result links to inspect gene coordinates, linked G4/i-motif windows, and the containing genome assembly.',
        route: '/gene',
        targetSelector: '[data-help-target="gene-next-actions"]',
      },
    ],
  },
  download: {
    id: 'download',
    label: 'Download package',
    steps: [
      {
        icon: 'archive',
        title: 'Download package page',
        body: 'Use Download when you need reusable TSV or ZIP files rather than only interactive inspection.',
        route: '/download',
        targetSelector: '[data-help-target="download-header"]',
      },
      {
        icon: 'inventory_2',
        title: 'Choose source rows',
        body: 'Choose selected assemblies, taxonomy or region filters, or all matching records after explicit confirmation.',
        route: '/download',
        targetSelector: '[data-help-target="download-assembly-set"]',
      },
      {
        icon: 'tune',
        title: 'Set filters and columns',
        body: 'Set motif type, gene context, score, flank windows, overlap thresholds, sort order, output mode, and columns.',
        route: '/download',
        targetSelector: '[data-help-target="download-options"]',
      },
      {
        icon: 'folder_zip',
        title: 'Create the export',
        body: 'Review the request summary, then create a ZIP with manifest files or a single TSV table.',
        route: '/download',
        targetSelector: '[data-help-target="download-create-package"]',
      },
    ],
  },
  'microbial-environment': {
    id: 'microbial-environment',
    label: 'Microbial environment research',
    steps: [
      {
        icon: 'biotech',
        title: 'Read the study context',
        body: 'The header summarizes current trait availability, chart type, displayed categories, and dataset readiness.',
        route: '/research/microbial-environment-g4',
        targetSelector: '[data-help-target="microbial-header"]',
      },
      {
        icon: 'tune',
        title: 'Choose trait and metric',
        body: 'Choose a Server-provided trait and allowed G4 density metric. Numeric traits use scatter plots; grouped traits use box plots.',
        route: '/research/microbial-environment-g4',
        targetSelector: '[data-help-target="microbial-condition"]',
      },
      {
        icon: 'travel_explore',
        title: 'Build the strain set',
        body: 'Search taxonomy groups and import selected filters when you need a lineage-aware comparison.',
        route: '/research/microbial-environment-g4',
        targetSelector: '[data-help-target="microbial-taxonomy"]',
      },
      {
        icon: 'analytics',
        title: 'Submit the analysis',
        body: 'Run analysis after trait, metric, category, taxonomy, and evidence settings match your question.',
        route: '/research/microbial-environment-g4',
        targetSelector: '[data-help-target="microbial-submit"]',
      },
      {
        icon: 'view_quilt',
        title: 'Review the workbench',
        body: 'Use the chart, summary metrics, category status, and assembly preview to check descriptive associations and source values.',
        route: '/research/microbial-environment-g4',
        targetSelector: '[data-help-target="microbial-workbench"]',
      },
    ],
  },
  'server-api': {
    id: 'server-api',
    label: 'Server API',
    steps: [
      {
        icon: 'terminal',
        title: 'G4ViSTA-Server API',
        body: 'Open the API Service documentation for Swagger, ReDoc, OpenAPI JSON, and sample requests.',
        route: '/documentation',
        targetSelector: null,
      },
    ],
  },
};

export function getHelpTour(workflowId: HelpWorkflowId): HelpTourDefinition {
  return HELP_TOURS[workflowId];
}

export function getHelpWorkflowIdForUrl(url: string): HelpWorkflowId {
  const workflowId = getOptionalHelpWorkflowIdForUrl(url);
  if (workflowId === null) {
    throw new HelpTourConfigurationError(
      `No help tour is configured for route "${normalizeHelpRoutePath(url)}".`,
    );
  }

  return workflowId;
}

export function getOptionalHelpWorkflowIdForUrl(url: string): HelpWorkflowId | null {
  const path = normalizeHelpRoutePath(url);

  if (path === '/' || path === '/documentation' || path === '/help') {
    return null;
  }
  if (path === '/taxonomy') {
    return 'taxonomy';
  }
  if (path === '/genome') {
    return 'genome';
  }
  if (isGenomeDetailRoute(path)) {
    return 'genome-detail';
  }
  if (path === '/gene' || isGeneTaxonRoute(path)) {
    return 'gene';
  }
  if (path === '/download') {
    return 'download';
  }
  if (path === '/research/microbial-environment-g4') {
    return 'microbial-environment';
  }

  return null;
}

export function normalizeHelpRoutePath(url: string): string {
  const [pathWithoutHash] = url.split('#');
  const [pathWithoutQuery] = pathWithoutHash.split('?');
  return pathWithoutQuery || '/';
}
