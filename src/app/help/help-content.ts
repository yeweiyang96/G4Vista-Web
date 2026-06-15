export type HelpWorkflowId =
  | 'taxonomy'
  | 'genome'
  | 'genome-detail'
  | 'gene'
  | 'microbial-environment'
  | 'server-api';

export interface HelpStep {
  readonly icon: string;
  readonly title: string;
  readonly body: string;
}

export interface HelpTopic {
  readonly id: HelpWorkflowId;
  readonly title: string;
  readonly summary: string;
  readonly route: string;
  readonly icon: string;
  readonly screenshotSrc?: string;
  readonly screenshotAlt?: string;
  readonly steps: readonly HelpStep[];
}

export interface HelpQuestionAnswer {
  readonly question: string;
  readonly answer: string;
}

export interface HelpReference {
  readonly title: string;
  readonly citation: string;
  readonly url: string;
}

export interface TourStep {
  readonly icon: string;
  readonly title: string;
  readonly body: string;
  readonly route: string;
  readonly targetSelector: string | null;
}

export interface HelpTourDefinition {
  readonly id: HelpWorkflowId;
  readonly label: string;
  readonly steps: readonly TourStep[];
}

export class HelpTourConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'HelpTourConfigurationError';
  }
}

export const DEFAULT_GENOME_DETAIL_HELP_ROUTE = '/genome/GCF_000001405.40';
const SCREENSHOT_VERSION = '20260612';

function screenshotPath(fileName: string): string {
  return `/help/screenshots/${fileName}?v=${SCREENSHOT_VERSION}`;
}

function isGenomeDetailRoute(path: string): boolean {
  return /^\/genome\/[^/]+$/.test(path);
}

function isGeneTaxonRoute(path: string): boolean {
  return /^\/gene\/taxon\/[^/]+$/.test(path);
}

export const HELP_TOPICS: readonly HelpTopic[] = [
  {
    id: 'taxonomy',
    title: 'Browse by taxonomy',
    summary:
      'Search for a taxon, open its taxonomy record, and continue to genome assemblies linked to that group.',
    route: '/taxonomy',
    icon: 'account_tree',
    screenshotSrc: screenshotPath('taxonomy.png'),
    screenshotAlt: 'Taxonomy page with a taxon search field and browse cards.',
    steps: [
      {
        icon: 'search',
        title: 'Search by name or taxonomy ID',
        body: 'Enter a scientific name, common name, taxonomic group, or NCBI Taxon ID to find matching taxa.',
      },
      {
        icon: 'open_in_new',
        title: 'Open a taxon record',
        body: 'Select a result to open the taxon page, where genome assemblies and taxon metadata are available.',
      },
    ],
  },
  {
    id: 'genome',
    title: 'Find a genome assembly',
    summary:
      'Search by assembly name or accession, then open the genome workspace for G4 and i-motif exploration.',
    route: '/genome',
    icon: 'manage_search',
    screenshotSrc: screenshotPath('genome.png'),
    screenshotAlt: 'Genome search page with an assembly search field.',
    steps: [
      {
        icon: 'search',
        title: 'Search assembly metadata',
        body: 'Type an assembly name or accession and select an autocomplete result to open the genome detail page.',
      },
      {
        icon: 'analytics',
        title: 'Continue into G4 analysis',
        body: 'The genome detail workspace combines summary metadata, motif filters, charts, and the embedded genome browser.',
      },
    ],
  },
  {
    id: 'genome-detail',
    title: 'Analyze G4 and i-motif sites',
    summary:
      'Use the genome detail page to filter motifs, inspect genomic context, and jump between tables, charts, and JBrowse.',
    route: DEFAULT_GENOME_DETAIL_HELP_ROUTE,
    icon: 'hub',
    screenshotSrc: screenshotPath('genome-detail.png'),
    screenshotAlt:
      'Genome detail page with metadata, G4 Explorer, charts, and genome browser panels.',
    steps: [
      {
        icon: 'fact_check',
        title: 'Confirm the assembly',
        body: 'Review assembly metadata first, especially accession, organism, release date, and available sequence IDs.',
      },
      {
        icon: 'filter_alt',
        title: 'Filter motif sites',
        body: 'Combine gene context, tetrad count, score range, and motif type before refreshing the explorer table.',
      },
      {
        icon: 'open_in_browser',
        title: 'Inspect genomic context',
        body: 'Use the chart and genome browser to move from filtered rows into sequence-level context.',
      },
    ],
  },
  {
    id: 'gene',
    title: 'Search genes and features',
    summary: 'Find feature IDs, gene IDs, or gene names globally or within a selected taxon.',
    route: '/gene',
    icon: 'abc',
    screenshotSrc: screenshotPath('gene.png'),
    screenshotAlt: 'Gene search page with keyword search and result grid.',
    steps: [
      {
        icon: 'search',
        title: 'Search feature metadata',
        body: 'Submit a gene keyword and optionally choose a taxon to narrow matching rows.',
      },
      {
        icon: 'table_view',
        title: 'Use linked result rows',
        body: 'Open assemblies or specific feature records directly from the result grid.',
      },
    ],
  },
  {
    id: 'microbial-environment',
    title: 'Microbial G4 environment research',
    summary:
      'Build a strain set, choose environmental traits, submit the study, and inspect correlation results.',
    route: '/research/microbial-environment-g4',
    icon: 'query_stats',
    screenshotSrc: screenshotPath('microbial-environment.png'),
    screenshotAlt:
      'Microbial G4 Environment Research workbench with setup rail, chart, and strain table.',
    steps: [
      {
        icon: 'tune',
        title: 'Configure the study',
        body: 'Choose the environmental trait and mode, then optionally restrict the strain set by taxonomy.',
      },
      {
        icon: 'analytics',
        title: 'Submit and compare',
        body: 'Submit the workflow to compare phenotype values against selected G4 density metrics.',
      },
      {
        icon: 'download',
        title: 'Inspect and export strains',
        body: 'Use the chart metric switch, sortable table, and download action to review the submitted strain set.',
      },
    ],
  },
  {
    id: 'server-api',
    title: 'Server API',
    summary:
      'Use the G4Vista-Server FastAPI endpoints directly for assembly, taxonomy, motif, gene, and research data.',
    route: '/api/docs',
    icon: 'terminal',
    steps: [
      {
        icon: 'description',
        title: 'Open interactive API docs',
        body: 'Use the Swagger UI or ReDoc pages to inspect endpoint parameters and response schemas.',
      },
      {
        icon: 'http',
        title: 'Call same-origin endpoints',
        body: 'Requests use the same /api/v1 paths that the G4Vista web application uses.',
      },
      {
        icon: 'data_object',
        title: 'Start from sample requests',
        body: 'Use common genome, taxonomy, G4, and microbial-environment examples as templates.',
      },
    ],
  },
];

export const HELP_QUESTIONS: readonly HelpQuestionAnswer[] = [
  {
    question: 'Which page should I start from?',
    answer:
      'Start from Taxonomy when the biological group is known, Genome when the assembly accession or organism is known, and Gene when the feature name, gene ID, or product keyword is known.',
  },
  {
    question: 'What does the Gene flank selector change?',
    answer:
      'It controls the upstream and downstream window used for gene-centered position distributions and statistics. Bacteria and Archaea default to 100 bp; eukaryotic assemblies default to 1,000 bp.',
  },
  {
    question: 'Why do tetrad and score filters change after selecting a sequence?',
    answer:
      'Filter options are refreshed for the selected motif type and sequence or region so unavailable tetrad values are removed before the table request is submitted.',
  },
  {
    question: 'How do I export all matching gene search results?',
    answer:
      'Use the export button on the Gene page after submitting a search. The CSV is generated by the server from the full matching result set, not just the current grid page.',
  },
  {
    question: 'How do I create a multi-assembly G4 package?',
    answer:
      'Add assemblies from a taxonomy page, open Download, choose motif types, filters, sort order, and TSV columns, then create the ZIP package.',
  },
];

export const HELP_REFERENCES: readonly HelpReference[] = [
  {
    title: 'G4Hunter',
    citation:
      'Bedrat A, Lacroix L, Mergny JL. Re-evaluation of G-quadruplex propensity with G4Hunter. Nucleic Acids Research. 2016.',
    url: 'https://academic.oup.com/nar/article/44/4/1746/1854664',
  },
  {
    title: 'Genome-wide quadruplex prevalence',
    citation:
      'Huppert JL, Balasubramanian S. Prevalence of quadruplexes in the human genome. Nucleic Acids Research. 2005.',
    url: 'https://academic.oup.com/nar/article/33/9/2908/1021176',
  },
  {
    title: 'i-motif DNA structure',
    citation:
      'Gehring K, Leroy JL, Guéron M. A tetrameric DNA structure with protonated cytosine-cytosine base pairs. Nature. 1993.',
    url: 'https://pubmed.ncbi.nlm.nih.gov/8388095/',
  },
  {
    title: 'NCBI Assembly',
    citation:
      'NCBI Assembly provides genome assembly metadata, accession identifiers, and organism context used by G4Vista assembly pages.',
    url: 'https://www.ncbi.nlm.nih.gov/assembly/',
  },
];

export const HELP_TOURS: Readonly<Record<HelpWorkflowId, HelpTourDefinition>> = {
  taxonomy: {
    id: 'taxonomy',
    label: 'Taxonomy search',
    steps: [
      {
        icon: 'account_tree',
        title: 'Taxonomy landing page',
        body: 'Use taxonomy as the entry point for finding taxa, genome assemblies, and predicted motif data.',
        route: '/taxonomy',
        targetSelector: '[data-help-target="taxonomy-header"]',
      },
      {
        icon: 'search',
        title: 'Search a taxon',
        body: 'Start typing a name or Taxon ID, then select a matching taxon to open its record.',
        route: '/taxonomy',
        targetSelector: '[data-help-target="taxonomy-search"]',
      },
      {
        icon: 'category',
        title: 'Browse common taxa',
        body: 'Use common starting taxa to open broad groups and review their available genome assemblies.',
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
        body: 'Use the assembly search page to find genomes by accession, assembly name, or organism.',
        route: '/genome',
        targetSelector: '[data-help-target="genome-search"]',
      },
      {
        icon: 'keyboard_arrow_down',
        title: 'Search assembly records',
        body: 'Type an assembly accession, assembly name, or organism name, then choose a matching result.',
        route: '/genome',
        targetSelector: '[data-help-target="genome-search-input"]',
      },
      {
        icon: 'bookmark_border',
        title: 'Review recommended assemblies',
        body: 'Use the recommended assembly table as a fast route into commonly used genome workspaces.',
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
        body: 'The overview section identifies the selected assembly, organism, taxonomy link, and sequence count.',
        route: DEFAULT_GENOME_DETAIL_HELP_ROUTE,
        targetSelector: '[data-help-target="genome-overview"]',
      },
      {
        icon: 'query_stats',
        title: 'Compare position distributions',
        body: 'Use the distribution controls to evaluate motif counts around genomic landmarks.',
        route: DEFAULT_GENOME_DETAIL_HELP_ROUTE,
        targetSelector: '[data-help-target="position-distribution"]',
      },
      {
        icon: 'filter_alt',
        title: 'Filter the G4 Explorer',
        body: 'Combine accession, motif type, gene context, tetrad, and score filters before submitting.',
        route: DEFAULT_GENOME_DETAIL_HELP_ROUTE,
        targetSelector: '[data-help-target="g4-explorer-filters"]',
      },
      {
        icon: 'hub',
        title: 'Use the explorer views',
        body: 'The explorer area keeps table, range chart, genome browser, and current-selection views together.',
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
        body: 'Search by feature ID, gene ID, or gene name to find matching annotated features.',
        route: '/gene',
        targetSelector: '[data-help-target="gene-header"]',
      },
      {
        icon: 'search',
        title: 'Submit a gene keyword',
        body: 'Enter a keyword and press the search button to load matching features.',
        route: '/gene',
        targetSelector: '[data-help-target="gene-search"]',
      },
      {
        icon: 'ballot',
        title: 'Open a linked record',
        body: 'Use result links to review gene coordinates, linked G4 windows, and genome context.',
        route: '/gene',
        targetSelector: '[data-help-target="gene-next-actions"]',
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
        body: 'The header summarizes eligible strains, available correlation methods, and data status.',
        route: '/research/microbial-environment-g4',
        targetSelector: '[data-help-target="microbial-header"]',
      },
      {
        icon: 'tune',
        title: 'Choose the environmental condition',
        body: 'Select the trait and mode before defining the strain set.',
        route: '/research/microbial-environment-g4',
        targetSelector: '[data-help-target="microbial-condition"]',
      },
      {
        icon: 'travel_explore',
        title: 'Build the strain set',
        body: 'Search taxonomy groups and add them to combine selected groups as a union.',
        route: '/research/microbial-environment-g4',
        targetSelector: '[data-help-target="microbial-taxonomy"]',
      },
      {
        icon: 'analytics',
        title: 'Submit the analysis',
        body: 'Submit refreshes the chart, summary metrics, and strain table for the selected setup.',
        route: '/research/microbial-environment-g4',
        targetSelector: '[data-help-target="microbial-submit"]',
      },
      {
        icon: 'view_quilt',
        title: 'Review the workbench',
        body: 'Results appear in the workbench area after a run, with charts, summary metrics, and strain rows.',
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
        title: 'G4Vista-Server API',
        body: 'Open the Help Center Server API tab for documentation links and sample requests.',
        route: '/help',
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

  if (path === '/' || path === '/help') {
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
