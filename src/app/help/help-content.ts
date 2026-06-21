export type HelpWorkflowId =
  | 'taxonomy'
  | 'genome'
  | 'genome-detail'
  | 'gene'
  | 'download'
  | 'microbial-environment'
  | 'server-api';

export type HelpDocumentationSectionId = 'api-service' | 'citation' | 'contact';
export type HelpWorkflowDocumentationId = Exclude<HelpWorkflowId, 'server-api'>;
export type HelpDocumentationId =
  | HelpWorkflowDocumentationId
  | 'temperature-statistics'
  | 'api-service'
  | 'citation'
  | 'contact';

export type HelpApiMethod = 'GET' | 'POST';
export type HelpArticleActionKind = 'route' | 'external';

export interface HelpDocumentationIndexItem {
  readonly id: HelpDocumentationId;
  readonly label: string;
}

export interface HelpArticleAction {
  readonly kind: HelpArticleActionKind;
  readonly label: string;
  readonly icon: string;
  readonly url: string;
}

export interface HelpArticleListItem {
  readonly title: string;
  readonly body: string;
}

export interface HelpArticleFieldRow {
  readonly field: string;
  readonly description: string;
}

export interface HelpArticleParagraphBlock {
  readonly kind: 'paragraph';
  readonly body: string;
}

export interface HelpArticleImageBlock {
  readonly kind: 'image';
  readonly src: string;
  readonly alt: string;
  readonly caption: string;
  readonly position: string;
  readonly aspectRatio: string;
}

export interface HelpArticleOrderedListBlock {
  readonly kind: 'ordered-list';
  readonly items: readonly HelpArticleListItem[];
}

export interface HelpArticleBulletListBlock {
  readonly kind: 'bullet-list';
  readonly items: readonly HelpArticleListItem[];
}

export interface HelpArticleFieldTableBlock {
  readonly kind: 'field-table';
  readonly rows: readonly HelpArticleFieldRow[];
}

export interface HelpArticleDataTableBlock {
  readonly kind: 'data-table';
  readonly caption: string;
  readonly columns: readonly string[];
  readonly rows: readonly (readonly string[])[];
}

export interface HelpArticleNoteBlock {
  readonly kind: 'note';
  readonly title: string;
  readonly body: string;
}

export interface HelpArticleApiDocLinksBlock {
  readonly kind: 'api-doc-links';
  readonly links: readonly HelpApiDocLink[];
}

export interface HelpArticleApiSampleBlock {
  readonly kind: 'api-sample';
  readonly sample: HelpApiSample;
}

export interface HelpArticleCitationListBlock {
  readonly kind: 'citation-list';
  readonly references: readonly HelpReference[];
}

export interface HelpArticleContactBlock {
  readonly kind: 'contact';
  readonly contact: HelpContact;
}

export type HelpArticleBlock =
  | HelpArticleParagraphBlock
  | HelpArticleImageBlock
  | HelpArticleOrderedListBlock
  | HelpArticleBulletListBlock
  | HelpArticleFieldTableBlock
  | HelpArticleDataTableBlock
  | HelpArticleNoteBlock
  | HelpArticleApiDocLinksBlock
  | HelpArticleApiSampleBlock
  | HelpArticleCitationListBlock
  | HelpArticleContactBlock;

export interface HelpArticleSection {
  readonly id: string;
  readonly title: string;
  readonly blocks: readonly HelpArticleBlock[];
}

export interface HelpDocumentationArticle {
  readonly id: HelpDocumentationId;
  readonly title: string;
  readonly eyebrow: string;
  readonly summary: string;
  readonly action: HelpArticleAction | null;
  readonly sections: readonly HelpArticleSection[];
}

export interface HelpApiDocLink {
  readonly anchorId: string;
  readonly href: string;
  readonly icon: string;
  readonly title: string;
  readonly description: string;
}

export interface HelpApiSample {
  readonly anchorId: string;
  readonly method: HelpApiMethod;
  readonly path: string;
  readonly description: string;
  readonly requestBody: string | null;
}

export interface HelpReference {
  readonly anchorId: string;
  readonly title: string;
  readonly citation: string;
  readonly websiteUrl: string;
  readonly citationUrl: string;
}

export interface HelpContact {
  readonly anchorId: HelpDocumentationSectionId;
  readonly title: string;
  readonly body: string;
  readonly websiteLabel: string;
  readonly websiteUrl: string;
  readonly licenseNote: string;
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

export const HELP_API_SERVICE_SECTION_ID = 'api-service';
export const HELP_CITATION_SECTION_ID = 'citation';
export const HELP_CONTACT_SECTION_ID = 'contact';
export const HELP_API_DOCUMENTATION_SECTION_ID = 'api-documentation';
export const HELP_API_SAMPLE_SECTION_ID = 'api-sample-requests';
export const DEFAULT_GENOME_DETAIL_HELP_ROUTE = '/genome/GCF_000001405.40';

const SCREENSHOT_VERSION = '20260612';
const HELP_WORKFLOW_IDS: readonly HelpWorkflowId[] = [
  'taxonomy',
  'genome',
  'genome-detail',
  'gene',
  'download',
  'microbial-environment',
  'server-api',
];

function screenshotPath(fileName: string): string {
  return `/documentation/screenshots/${fileName}?v=${SCREENSHOT_VERSION}`;
}

function articleImage(
  fileName: string,
  alt: string,
  caption: string,
  position: string,
  aspectRatio: string,
): HelpArticleImageBlock {
  return {
    kind: 'image',
    src: screenshotPath(fileName),
    alt,
    caption,
    position,
    aspectRatio,
  };
}

function apiSampleBlock(sample: HelpApiSample): HelpArticleApiSampleBlock {
  return {
    kind: 'api-sample',
    sample,
  };
}

export function isHelpWorkflowId(value: string): value is HelpWorkflowId {
  return HELP_WORKFLOW_IDS.some((workflowId) => workflowId === value);
}

function isGenomeDetailRoute(path: string): boolean {
  return /^\/genome\/[^/]+$/.test(path);
}

function isGeneTaxonRoute(path: string): boolean {
  return /^\/gene\/taxon\/[^/]+$/.test(path);
}

export const HELP_API_DOC_LINKS: readonly HelpApiDocLink[] = [
  {
    anchorId: 'api-doc-swagger',
    href: '/api/docs',
    icon: 'description',
    title: 'Swagger UI',
    description: 'Interactive endpoint documentation with request controls and response schemas.',
  },
  {
    anchorId: 'api-doc-redoc',
    href: '/api/redoc',
    icon: 'article',
    title: 'ReDoc',
    description: 'Readable API reference for browsing grouped endpoints and model schemas.',
  },
  {
    anchorId: 'api-doc-openapi',
    href: '/api/openapi.json',
    icon: 'data_object',
    title: 'OpenAPI JSON',
    description: 'Machine-readable schema for clients, notebooks, and API tooling.',
  },
];

export const HELP_API_SAMPLES: readonly HelpApiSample[] = [
  {
    anchorId: 'api-sample-genome-status',
    method: 'GET',
    path: '/api/v1/genome/status',
    description: 'Check genome database counts and data freshness.',
    requestBody: null,
  },
  {
    anchorId: 'api-sample-genome-search',
    method: 'GET',
    path: '/api/v1/genome/?query=Arabidopsis',
    description: 'Search genome assemblies by organism, assembly name, or accession.',
    requestBody: null,
  },
  {
    anchorId: 'api-sample-taxa-search',
    method: 'GET',
    path: '/api/v1/taxa/?query=Arabidopsis',
    description: 'Search taxonomy records by scientific name, common name, or Taxon ID.',
    requestBody: null,
  },
  {
    anchorId: 'api-sample-genome-overview',
    method: 'GET',
    path: '/api/v1/genome/GCF_000001735.4/overview',
    description: 'Load overview metadata and motif counts for one assembly.',
    requestBody: null,
  },
  {
    anchorId: 'api-sample-g4-rows',
    method: 'GET',
    path: '/api/v1/quadruplex-sequences/GCF_000001735.4?quadruplex_type=g4&limit=20&tetrads=3&min_score=12',
    description: 'Fetch filtered G4 quadruplex sequence rows for an assembly.',
    requestBody: null,
  },
  {
    anchorId: 'api-sample-position-distribution',
    method: 'GET',
    path: '/api/v1/quadruplex-sequences/GCF_000001735.4/position-distribution?quadruplex_type=g4&flank_window=1000',
    description: 'Summarize motif position categories around gene landmarks.',
    requestBody: null,
  },
  {
    anchorId: 'api-sample-microbial-query',
    method: 'POST',
    path: '/api/v1/research/microbial-environment-g4/query/numeric-scatter',
    description: 'Submit a microbial environment G4 analysis request.',
    requestBody: `{
  "trait_code": "growth_temperature",
  "chart_kind": "scatter",
  "outcome_metric": "g4_density_per_mb",
  "taxonomy_filters": [
    {
      "rank": "genus",
      "value": "Bacillus"
    }
  ],
  "category_filters": [],
  "category_filter_logic": "intersection",
  "min_mapping_confidence_rank": 1,
  "include_review_values": false,
  "page_index": 0,
  "page_size": 50,
  "sort_field": "numeric_midpoint",
  "sort_order": "asc",
  "numeric_min": null,
  "numeric_max": null
}`,
  },
];

const NCBI_DATASETS_REFERENCE: HelpReference = {
  anchorId: 'citation-ncbi-datasets',
  title: 'NCBI Datasets',
  citation:
    'O’Leary NA, Cox E, Holmes JB, et al. Exploring and retrieving sequence and metadata for species across the tree of life with NCBI Datasets. Sci Data 11, 732 (2024). https://doi.org/10.1038/s41597-024-03571-y',
  websiteUrl: 'https://www.ncbi.nlm.nih.gov/datasets/',
  citationUrl: 'https://www.ncbi.nlm.nih.gov/datasets/docs/v2/citing-datasets/',
};

const BACDIVE_REFERENCE: HelpReference = {
  anchorId: 'citation-bacdive',
  title: 'BacDive',
  citation:
    'Schober I, Koblitz J, Sardà Carbasse J, et al. BacDive in 2025: the core database for prokaryotic strain data. Nucleic Acids Research 53(D1):D748-D756. https://doi.org/10.1093/nar/gkae959',
  websiteUrl: 'https://bacdive.dsmz.de/',
  citationUrl: 'https://bacdive.dsmz.de/about',
};

const QGRS_MAPPER_REFERENCE: HelpReference = {
  anchorId: 'citation-qgrs-mapper',
  title: 'QGRS Mapper',
  citation:
    "Kikin O, D'Antonio L, Bagga PS. QGRS Mapper: a web-based server for predicting G-quadruplexes in nucleotide sequences. Nucleic Acids Research 34(Web Server issue):W676-W682 (2006).",
  websiteUrl: 'https://bioinformatics.ramapo.edu/QGRS/index.php',
  citationUrl: 'https://bioinformatics.ramapo.edu/QGRS/index.php',
};

export const HELP_REFERENCES: readonly HelpReference[] = [
  NCBI_DATASETS_REFERENCE,
  BACDIVE_REFERENCE,
  QGRS_MAPPER_REFERENCE,
];

export const HELP_CONTACT: HelpContact = {
  anchorId: HELP_CONTACT_SECTION_ID,
  title: 'Medical AI Center',
  body: 'For questions about G4Vista access, data, or collaboration, contact the Medical AI Center through the official website.',
  websiteLabel: 'Open Medical AI Center',
  websiteUrl: 'https://bioinfo.med.niigata-u.ac.jp/',
  licenseNote:
    'G4Vista code is licensed under an MIT-style License. Documentation is licensed under CC BY 4.0.',
};

export const HELP_DOCUMENTATION_ARTICLES: readonly HelpDocumentationArticle[] = [
  {
    id: 'taxonomy',
    title: 'Taxonomy',
    eyebrow: 'Guide',
    summary:
      'The Taxonomy page is the starting point for finding organisms or broader biological groups and moving from a taxon to the genome assemblies available in G4Vista.',
    action: {
      kind: 'route',
      label: 'Open taxonomy',
      icon: 'arrow_forward',
      url: '/taxonomy',
    },
    sections: [
      {
        id: 'taxonomy-simple-search',
        title: 'Simple taxon search',
        blocks: [
          {
            kind: 'paragraph',
            body: 'The simple search accepts scientific names, common names, broader lineage names, and NCBI Taxon IDs. When the user starts typing, G4Vista shows matching taxa so the intended organism or lineage can be selected before opening a record.',
          },
          articleImage(
            'taxonomy.png',
            'Taxonomy search field and common taxon entry points.',
            'The Taxonomy search field and common taxon entry points.',
            'top center',
            '16 / 7',
          ),
          {
            kind: 'field-table',
            rows: [
              {
                field: 'Taxon name',
                description:
                  'Use a scientific name such as Arabidopsis thaliana, a genus, or a broader group when the exact Taxon ID is not known.',
              },
              {
                field: 'NCBI Taxon ID',
                description:
                  'Use a numeric identifier, for example 3702, when a specific NCBI taxonomy record is required.',
              },
              {
                field: 'Autocomplete result',
                description:
                  'Choose the result that matches the organism name and rank before opening the taxon page.',
              },
            ],
          },
        ],
      },
      {
        id: 'taxonomy-browse-groups',
        title: 'Browsing broad groups',
        blocks: [
          {
            kind: 'paragraph',
            body: 'Common starting taxa are provided for broad exploration. These entries are useful when the user wants to compare many assemblies within a lineage rather than search for one organism.',
          },
          {
            kind: 'ordered-list',
            items: [
              {
                title: 'Open a broad taxon',
                body: 'Choose a listed taxon or search for a lineage such as Viridiplantae, Bacteria, or Fungi.',
              },
              {
                title: 'Check the rank',
                body: 'Confirm whether the page represents a species, genus, family, or broader clade before using the assembly list.',
              },
              {
                title: 'Narrow when needed',
                body: 'If the assembly list is too broad, return to search and choose a lower taxonomic rank.',
              },
            ],
          },
          {
            kind: 'note',
            title: 'Ambiguous names',
            body: 'When a name appears in more than one context, prefer the autocomplete entry with the expected rank and Taxon ID.',
          },
        ],
      },
      {
        id: 'taxonomy-records-and-assemblies',
        title: 'Taxon records and assemblies',
        blocks: [
          {
            kind: 'paragraph',
            body: 'A taxon record summarizes the selected taxonomy node and lists genome assemblies connected to that taxon. The assembly table is the bridge from taxonomy browsing to sequence-level analysis.',
          },
          {
            kind: 'field-table',
            rows: [
              {
                field: 'Assembly accession',
                description:
                  'The stable accession used to open the genome workspace and identify files in download packages.',
              },
              {
                field: 'Organism and assembly name',
                description:
                  'The biological source and assembly label, useful for distinguishing reference versions.',
              },
              {
                field: 'Predicted sequence availability',
                description:
                  'Counts or status indicators show whether G4 and i-motif quadruplex sequence data are available.',
              },
              {
                field: 'Assembly selection',
                description:
                  'Assemblies can be opened immediately or added to the download set for package creation.',
              },
            ],
          },
        ],
      },
      {
        id: 'taxonomy-next-steps',
        title: 'Next steps from taxonomy',
        blocks: [
          {
            kind: 'bullet-list',
            items: [
              {
                title: 'Open one assembly',
                body: 'Use this path when the goal is to inspect G4 and i-motif positions in a single genome.',
              },
              {
                title: 'Add several assemblies',
                body: 'Use this path when the goal is to export comparable TSV files for downstream analysis.',
              },
              {
                title: 'Search genes later',
                body: 'After choosing an assembly, use Gene search when the biological question starts from a gene or feature name.',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'genome',
    title: 'Genome search',
    eyebrow: 'Guide',
    summary:
      'Genome search is used when the assembly accession, assembly name, or organism name is already known and the user wants to open the genome workspace directly.',
    action: {
      kind: 'route',
      label: 'Open genome search',
      icon: 'arrow_forward',
      url: '/genome',
    },
    sections: [
      {
        id: 'genome-search-input',
        title: 'Searching assemblies',
        blocks: [
          {
            kind: 'paragraph',
            body: 'The search box accepts assembly accessions, assembly names, and organism names. Accession searches are the most precise; organism-name searches can return several assemblies that need to be compared.',
          },
          articleImage(
            'genome.png',
            'Genome search field and recommended assembly table.',
            'The genome search field accepts accessions, assembly names, and organism names.',
            'top center',
            '16 / 7',
          ),
          {
            kind: 'field-table',
            rows: [
              {
                field: 'Assembly accession',
                description:
                  'Use values such as GCF_000001735.4 when a specific reference assembly is required.',
              },
              {
                field: 'Assembly name',
                description:
                  'Use names such as TAIR10.1 when the accession is not known but the reference name is known.',
              },
              {
                field: 'Organism name',
                description:
                  'Use scientific names when exploring available assemblies for one organism.',
              },
            ],
          },
        ],
      },
      {
        id: 'genome-recommended-assemblies',
        title: 'Recommended assemblies',
        blocks: [
          {
            kind: 'paragraph',
            body: 'Recommended rows provide fast entry points for commonly used organisms. They are intended for exploratory use when the analysis does not require a very specific accession version.',
          },
          {
            kind: 'note',
            title: 'Reference versions',
            body: 'If a publication, notebook, or external dataset names an assembly accession, search by that exact accession instead of relying on a recommended row.',
          },
        ],
      },
      {
        id: 'genome-result-rows',
        title: 'Reading assembly rows',
        blocks: [
          {
            kind: 'field-table',
            rows: [
              {
                field: 'Accession',
                description:
                  'The identifier used in URLs, API requests, JBrowse context, and download manifests.',
              },
              {
                field: 'Organism',
                description: 'The source organism associated with the assembly record.',
              },
              {
                field: 'Sequence records',
                description:
                  'The number of chromosomes, scaffolds, or contigs that can contain predicted quadruplex sequences.',
              },
              {
                field: 'Motif counts',
                description:
                  'Counts summarize available predicted G4 and i-motif rows for the assembly.',
              },
            ],
          },
        ],
      },
      {
        id: 'genome-open-workspace',
        title: 'Opening the genome workspace',
        blocks: [
          {
            kind: 'ordered-list',
            items: [
              {
                title: 'Choose the matching row',
                body: 'Check accession, organism, and assembly name before navigating away from search results.',
              },
              {
                title: 'Open the detail page',
                body: 'The genome workspace loads metadata, position summaries, filters, tables, charts, and browser context for that assembly.',
              },
              {
                title: 'Use search again for another version',
                body: 'Return to Genome search when comparing assemblies or switching to a different accession.',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'genome-detail',
    title: 'G4 Explorer',
    eyebrow: 'Guide',
    summary:
      'G4 Explorer is the genome detail workspace for filtering predicted G4 and i-motif quadruplex sequences and inspecting their genomic context.',
    action: {
      kind: 'route',
      label: 'Open example genome',
      icon: 'arrow_forward',
      url: DEFAULT_GENOME_DETAIL_HELP_ROUTE,
    },
    sections: [
      {
        id: 'g4-explorer-assembly-overview',
        title: 'Assembly overview',
        blocks: [
          {
            kind: 'paragraph',
            body: 'The top of the genome workspace identifies the selected assembly and summarizes the data available for exploration. This context should be checked before interpreting any table or chart.',
          },
          articleImage(
            'genome-detail.png',
            'Genome detail workspace with overview and G4 Explorer panels.',
            'The genome workspace combines assembly context, position summaries, filters, and result views.',
            'top center',
            '16 / 7',
          ),
          {
            kind: 'field-table',
            rows: [
              {
                field: 'Assembly accession',
                description:
                  'The accession used by G4Vista routes, API endpoints, and exported files.',
              },
              {
                field: 'Organism and taxonomy',
                description:
                  'Links the genome back to the organism context used in Taxonomy search.',
              },
              {
                field: 'Sequence records',
                description: 'Shows how many chromosomes, scaffolds, or contigs are represented.',
              },
              {
                field: 'Predicted motif counts',
                description: 'Summarizes available G4 and i-motif records before filtering.',
              },
            ],
          },
        ],
      },
      {
        id: 'g4-explorer-position-summaries',
        title: 'Position summaries',
        blocks: [
          {
            kind: 'paragraph',
            body: 'Position summary panels show how predicted quadruplex sequences are distributed relative to gene landmarks. These views are useful for deciding which filters to apply before reading individual rows.',
          },
          {
            kind: 'bullet-list',
            items: [
              {
                title: 'Genomic context',
                body: 'Counts are grouped by relationships such as inside a gene, upstream, downstream, or intergenic.',
              },
              {
                title: 'Feature-centered views',
                body: 'Summary panels help identify whether motifs concentrate around annotated features.',
              },
              {
                title: 'Motif type comparison',
                body: 'Switching between G4 and i-motif views changes which predicted records are summarized.',
              },
            ],
          },
        ],
      },
      {
        id: 'g4-explorer-filters',
        title: 'Filters and table results',
        blocks: [
          {
            kind: 'paragraph',
            body: 'Filters control which predicted rows are shown in the explorer table. The table should be treated as the exact result set for the current assembly and filter state.',
          },
          {
            kind: 'field-table',
            rows: [
              {
                field: 'Motif type',
                description:
                  'Select G4, i-motif, or the available motif class required for the current analysis.',
              },
              {
                field: 'Sequence or region',
                description:
                  'Limit rows to a chromosome, scaffold, contig, or genomic interval when the analysis is region-specific.',
              },
              {
                field: 'Gene relation',
                description:
                  'Filter rows by their relationship to genes and nearby annotated features.',
              },
              {
                field: 'G-tetrads and score',
                description:
                  'Use structural and score filters to focus on stronger or more specific predictions.',
              },
            ],
          },
          {
            kind: 'note',
            title: 'Filter interpretation',
            body: 'Counts in the table reflect the submitted filters. Clear or change filters before comparing totals across assemblies.',
          },
        ],
      },
      {
        id: 'g4-explorer-linked-views',
        title: 'Linked views and export',
        blocks: [
          {
            kind: 'ordered-list',
            items: [
              {
                title: 'Select a row',
                body: 'Use row selection to focus the chart, browser context, and current-selection details on one genomic interval.',
              },
              {
                title: 'Inspect sequence context',
                body: 'Compare the table coordinates with the range chart and JBrowse view before using a candidate in downstream work.',
              },
              {
                title: 'Download filtered rows',
                body: 'Use the table download action when the current filtered result set is needed as a TSV file.',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'gene',
    title: 'Gene search',
    eyebrow: 'Guide',
    summary:
      'Gene search is used when the question starts from a gene, locus, feature identifier, product keyword, or selected taxon rather than from a genome accession.',
    action: {
      kind: 'route',
      label: 'Open gene search',
      icon: 'arrow_forward',
      url: '/gene',
    },
    sections: [
      {
        id: 'gene-query-input',
        title: 'Searching genes and features',
        blocks: [
          {
            kind: 'paragraph',
            body: 'The search input accepts gene symbols, locus tags, feature IDs, gene IDs, and annotation keywords. The search is useful for finding annotated features that can then be linked back to genome assemblies and nearby quadruplex sequences.',
          },
          articleImage(
            'gene.png',
            'Gene search field and feature result grid.',
            'Gene search returns annotated feature rows with assembly and genomic range context.',
            'top center',
            '16 / 7',
          ),
          {
            kind: 'field-table',
            rows: [
              {
                field: 'Gene symbol or locus tag',
                description: 'Use when a familiar gene name or locus naming scheme is known.',
              },
              {
                field: 'Feature ID',
                description:
                  'Use when working from a genome annotation file or another G4Vista result row.',
              },
              {
                field: 'Product keyword',
                description: 'Use when searching for annotated functions rather than a named gene.',
              },
            ],
          },
        ],
      },
      {
        id: 'gene-taxon-context',
        title: 'Optional taxon context',
        blocks: [
          {
            kind: 'paragraph',
            body: 'Gene search can be opened from a taxon context when the result set should be limited to a selected lineage. This is useful for repeated gene-family searches across assemblies from one group.',
          },
          {
            kind: 'note',
            title: 'Broad keywords',
            body: 'Product keywords can return many rows. Add taxon context or use a more specific identifier when the result grid is too broad.',
          },
        ],
      },
      {
        id: 'gene-result-grid',
        title: 'Reading feature rows',
        blocks: [
          {
            kind: 'field-table',
            rows: [
              {
                field: 'Assembly accession',
                description: 'Identifies the genome containing the matching feature.',
              },
              {
                field: 'Sequence ID and coordinates',
                description: 'Locate the feature on a chromosome, scaffold, or contig.',
              },
              {
                field: 'Biotype and product',
                description:
                  'Describe the annotation category and functional text associated with the feature.',
              },
              {
                field: 'Linked motif counts',
                description:
                  'Show whether nearby G4 or i-motif predictions are available for the feature context.',
              },
            ],
          },
        ],
      },
      {
        id: 'gene-linked-records',
        title: 'Linked records and export',
        blocks: [
          {
            kind: 'ordered-list',
            items: [
              {
                title: 'Open the assembly',
                body: 'Use the assembly link to inspect the same genome in G4 Explorer.',
              },
              {
                title: 'Open nearby context',
                body: 'Use feature or linked motif actions to review predicted quadruplex sequences around the selected feature.',
              },
              {
                title: 'Export the full result',
                body: 'Use the download action after searching when the complete matching result set is required.',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'download',
    title: 'Download package',
    eyebrow: 'Guide',
    summary:
      'Download package creates TSV or ZIP exports from assemblies added on Download or taxonomy pages, with full source, motif, gene-relation, sorting, and column controls.',
    action: {
      kind: 'route',
      label: 'Open download package',
      icon: 'arrow_forward',
      url: '/download',
    },
    sections: [
      {
        id: 'download-collect-assemblies',
        title: 'Collecting assemblies',
        blocks: [
          {
            kind: 'paragraph',
            body: 'The package builder uses a shared assembly set. Add assemblies directly on Download by searching accession, assembly name, organism, or taxonomy context; assemblies added from taxonomy pages appear in the same set.',
          },
          articleImage(
            'download.png',
            'Download package controls for selected assemblies and TSV options.',
            'The Download page combines the selected assembly set with package filters and column controls.',
            'top center',
            '16 / 7',
          ),
          {
            kind: 'ordered-list',
            items: [
              {
                title: 'Search on Download',
                body: 'Use assembly search to add individual assemblies without leaving the package builder.',
              },
              {
                title: 'Use taxonomy when useful',
                body: 'Open a taxon page when you need to review and add many assemblies from a taxonomic group.',
              },
              {
                title: 'Confirm scope',
                body: 'Review selected assemblies or use taxon, species taxon, and region filters before exporting.',
              },
            ],
          },
        ],
      },
      {
        id: 'download-package-options',
        title: 'Package options',
        blocks: [
          {
            kind: 'field-table',
            rows: [
              {
                field: 'Source filters',
                description:
                  'Limit rows by selected assemblies, taxon IDs, species taxon IDs, or region IDs.',
              },
              {
                field: 'Motif types',
                description:
                  'Choose G4, i-motif, or both, depending on which predicted rows should be exported.',
              },
              {
                field: 'G-tetrads',
                description:
                  'Limit G4 rows to selected tetrad counts when the export should focus on specific structures.',
              },
              {
                field: 'Score range',
                description:
                  'Use minimum and maximum score controls to restrict exported predictions.',
              },
              {
                field: 'Gene relation filters',
                description:
                  'Filter rows by gene IDs, gene search term, relation categories, flank windows, and overlap thresholds.',
              },
              {
                field: 'Sort order',
                description: 'Choose the sort field and direction used in each exported TSV file.',
              },
              {
                field: 'TSV columns',
                description: 'Select the columns required for downstream analysis or reporting.',
              },
            ],
          },
        ],
      },
      {
        id: 'download-create-zip',
        title: 'Creating the ZIP file',
        blocks: [
          {
            kind: 'paragraph',
            body: 'After the source, filters, columns, and output mode are ready, use Create download. ZIP mode downloads one archive containing a manifest and TSV files split by assembly and motif type; TSV mode streams one table.',
          },
          {
            kind: 'bullet-list',
            items: [
              {
                title: 'Manifest',
                body: 'Records the selected assemblies, source filters, motif filters, gene-relation filters, sort options, and columns.',
              },
              {
                title: 'TSV files',
                body: 'Contain filtered predicted quadruplex sequence rows split by assembly and motif type.',
              },
              {
                title: 'Empty selections',
                body: 'If no assemblies or taxonomy filters are set, the request exports all rows that match the remaining filters.',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'microbial-environment',
    title: 'Microbial analysis',
    eyebrow: 'Guide',
    summary:
      'The Environment-G4 workbench compares BacDive-derived microbial environment traits with selected assembly-level quadruplex sequence density metrics.',
    action: {
      kind: 'route',
      label: 'Open microbial analysis',
      icon: 'arrow_forward',
      url: '/research/microbial-environment-g4',
    },
    sections: [
      {
        id: 'microbial-analysis-purpose',
        title: 'Purpose of the analysis',
        blocks: [
          {
            kind: 'paragraph',
            body: 'The workbench is designed for exploratory comparison of microbial environmental trait values and G4Vista density metrics. Numeric traits render as scatter plots; categorical and multi-label traits render as Server-prepared box plot summaries over canonical categories.',
          },
          articleImage(
            'microbial-environment.png',
            'Microbial analysis setup controls, scatter plot, and strain table.',
            'The microbial analysis workbench connects setup controls with correlation summaries and strain-level rows.',
            'top center',
            '16 / 7',
          ),
          {
            kind: 'note',
            title: 'Interpretation',
            body: 'The workbench reports descriptive associations in the selected dataset. Differences across environments or lineages should not be interpreted as causal evidence.',
          },
        ],
      },
      {
        id: 'microbial-select-trait',
        title: 'Selecting trait, metric, and scope',
        blocks: [
          {
            kind: 'field-table',
            rows: [
              {
                field: 'Trait',
                description:
                  'Choose a Server-provided trait such as growth temperature, growth pH, oxygen tolerance, salt tolerance, or ecological context.',
              },
              {
                field: 'Outcome metric',
                description:
                  'Choose one of the public density metrics allowed for the selected trait, such as genome-wide, gene-overlapping, upstream, downstream, or intergenic G4 density per Mb.',
              },
              {
                field: 'Canonical categories',
                description:
                  'For categorical and multi-label traits, select canonical category values prepared by the Server. Raw BacDive values are reserved for provenance tables and downloads.',
              },
              {
                field: 'Taxonomy selections',
                description:
                  'Use all eligible assemblies or restrict the analysis by taxonomy rank and search term. Taxonomy filters remain available because ecological context and lineage can be confounded.',
              },
            ],
          },
          {
            kind: 'ordered-list',
            items: [
              {
                title: 'Choose trait and metric',
                body: 'Set the environmental trait and outcome metric before defining taxonomy or category scope.',
              },
              {
                title: 'Choose categories when applicable',
                body: 'For categorical traits, use the checklist of canonical categories. Category membership is multi-label, not mutually exclusive unless marked by the data contract.',
              },
              {
                title: 'Submit the query',
                body: 'Run the analysis to refresh the summary metrics, chart, and assembly preview table.',
              },
            ],
          },
        ],
      },
      {
        id: 'microbial-read-results',
        title: 'Reading results',
        blocks: [
          {
            kind: 'field-table',
            rows: [
              {
                field: 'Summary',
                description:
                  'Reports assembly counts, read-model row counts, chart type, and the selected public density metric.',
              },
              {
                field: 'Scatter plot or box plot',
                description:
                  'Numeric traits use scatter plots. Categorical and multi-label traits use box plots with quartiles, whiskers, median, and sample size from the API.',
              },
              {
                field: 'Assembly preview',
                description:
                  'Lists assembly accessions, organism names, selected trait values or categories, density metrics, genome size, taxonomy context, and raw values where available.',
              },
            ],
          },
        ],
      },
      {
        id: 'microbial-export',
        title: 'Export and reuse',
        blocks: [
          {
            kind: 'paragraph',
            body: 'Use the table controls and download action to inspect or export the submitted assembly set. Record the selected trait code, chart kind, outcome metric, taxonomy filters, category filters, mapping confidence threshold, and sample size when reporting results.',
          },
        ],
      },
    ],
  },
  {
    id: 'temperature-statistics',
    title: 'Temperature statistics',
    eyebrow: 'Research report',
    summary:
      'This article summarizes the growth-temperature screening that was previously shown inside the microbial analysis help content.',
    action: {
      kind: 'route',
      label: 'Open microbial analysis',
      icon: 'arrow_forward',
      url: '/research/microbial-environment-g4',
    },
    sections: [
      {
        id: 'temperature-statistics-summary',
        title: 'Summary',
        blocks: [
          {
            kind: 'paragraph',
            body: 'This exploratory screen examined BacDive-derived growth-temperature analyses to identify taxonomy subsets where microbial G4 density metrics show a strong positive association with growth temperature. The analysis does not establish causality; it highlights candidate lineages for biological interpretation.',
          },
          {
            kind: 'note',
            title: 'Main finding',
            body: 'Peptococcaceae, Photobacterium, the Aquificota/Aquificia/Aquificales lineage, and several environmental Gammaproteobacteria groups showed repeated positive Spearman correlations across multiple G4 density outcomes.',
          },
        ],
      },
      {
        id: 'temperature-statistics-methods',
        title: 'Screening criteria',
        blocks: [
          {
            kind: 'field-table',
            rows: [
              {
                field: 'Correlation direction',
                description:
                  'Only positive growth-temperature and G4 density associations were retained.',
              },
              {
                field: 'Sample size',
                description: 'Each retained taxonomy subset required at least 20 genomes.',
              },
              {
                field: 'Effect size',
                description: 'Rows required Spearman rho of at least 0.5.',
              },
              {
                field: 'Multiple testing',
                description: 'Rows required FDR-adjusted q-value of 0.05 or lower.',
              },
              {
                field: 'Density outcomes',
                description:
                  'Overall, gene, upstream, downstream, and intergenic G4 density per Mb were retained. Raw G4 count was excluded because genome size can dominate that metric.',
              },
              {
                field: 'Taxon retention',
                description:
                  'Taxa were retained when at least 3 density outcomes passed the screen.',
              },
            ],
          },
        ],
      },
      {
        id: 'temperature-statistics-candidates',
        title: 'Candidate taxonomy groups',
        blocks: [
          {
            kind: 'paragraph',
            body: 'The table lists taxonomy groups with at least 3 passing G4 density outcomes after applying the screening criteria.',
          },
          {
            kind: 'data-table',
            caption: 'Taxonomy groups with at least 3 passing G4 density outcomes.',
            columns: [
              'Rank',
              'Taxonomy group',
              'Outcomes',
              'n',
              'Max rho',
              'Min FDR q',
              'Best outcome',
            ],
            rows: [
              [
                'Family',
                'Peptococcaceae',
                '5',
                '39',
                '0.776',
                '9.07e-07',
                'Upstream G4 density per Mb',
              ],
              [
                'Genus',
                'Photobacterium',
                '5',
                '22',
                '0.776',
                '1.11e-03',
                'Downstream G4 density per Mb',
              ],
              ['Class', 'Aquificae', '4', '21', '0.677', '1.78e-02', 'G4 density per Mb'],
              ['Order', 'Aquificales', '4', '21', '0.677', '1.78e-02', 'G4 density per Mb'],
              ['Phylum', 'Aquificae', '4', '21', '0.677', '1.78e-02', 'G4 density per Mb'],
              ['Family', 'Xanthobacteraceae', '4', '30', '0.639', '5.14e-03', 'G4 density per Mb'],
              [
                'Family',
                'Methanobacteriaceae',
                '4',
                '28',
                '0.615',
                '1.34e-02',
                'Upstream G4 density per Mb',
              ],
              [
                'Order',
                'Vibrionales, not validated',
                '3',
                '81',
                '0.579',
                '1.85e-06',
                'G4 density per Mb',
              ],
              [
                'Order',
                'Cellvibrionales',
                '3',
                '27',
                '0.574',
                '3.21e-02',
                'Intergenic G4 density per Mb',
              ],
              ['Family', 'Rhodanobacteraceae', '4', '48', '0.571', '1.11e-03', 'G4 density per Mb'],
              [
                'Order',
                'Lysobacterales',
                '3',
                '46',
                '0.527',
                '5.79e-03',
                'Upstream G4 density per Mb',
              ],
            ],
          },
        ],
      },
      {
        id: 'temperature-statistics-interpretation',
        title: 'Taxonomic interpretation',
        blocks: [
          {
            kind: 'bullet-list',
            items: [
              {
                title: 'Thermophilic lineages',
                body: 'Aquificae class, Aquificales order, and Aquificae phylum are best interpreted as the same Aquificota/Aquificia high-temperature bacterial lineage observed at multiple ranks.',
              },
              {
                title: 'Marine and environmental groups',
                body: 'Photobacterium and Vibrionales point to related marine Gammaproteobacteria, while Cellvibrionales, Rhodanobacteraceae, and Lysobacterales represent environmental lineages.',
              },
              {
                title: 'Archaeal candidate',
                body: 'Methanobacteriaceae should be reported separately from bacterial groups because it is a methanogenic archaeal family.',
              },
            ],
          },
        ],
      },
      {
        id: 'temperature-statistics-reporting',
        title: 'Reporting notes',
        blocks: [
          {
            kind: 'bullet-list',
            items: [
              {
                title: 'Correlation statement',
                body: 'Several taxonomy subsets show consistent positive Spearman correlations between growth temperature and G4 density.',
              },
              {
                title: 'Causality limit',
                body: 'The result should not be phrased as evidence that temperature directly increases G4 formation.',
              },
              {
                title: 'Taxonomy dependence',
                body: 'Parent-child taxonomy signals, such as Photobacterium within Vibrionales or Rhodanobacteraceae within Lysobacterales, may not be independent discoveries.',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: HELP_API_SERVICE_SECTION_ID,
    title: 'API Service',
    eyebrow: 'Reference',
    summary:
      'G4Vista-Web calls same-origin FastAPI endpoints under /api/v1. The API can also be used directly from scripts, notebooks, and external clients.',
    action: {
      kind: 'external',
      label: 'Open Swagger UI',
      icon: 'open_in_new',
      url: '/api/docs',
    },
    sections: [
      {
        id: HELP_API_DOCUMENTATION_SECTION_ID,
        title: 'Documentation links',
        blocks: [
          {
            kind: 'paragraph',
            body: 'Use the interactive or machine-readable API documentation when building a client outside G4Vista-Web.',
          },
          {
            kind: 'api-doc-links',
            links: HELP_API_DOC_LINKS,
          },
        ],
      },
      {
        id: HELP_API_SAMPLE_SECTION_ID,
        title: 'Sample requests',
        blocks: [
          {
            kind: 'paragraph',
            body: 'The following examples use the same /api/v1 route family used by the web interface for common search, genome, motif, and microbial analysis tasks.',
          },
          ...HELP_API_SAMPLES.map(apiSampleBlock),
        ],
      },
    ],
  },
  {
    id: HELP_CITATION_SECTION_ID,
    title: 'Citation',
    eyebrow: 'Reference',
    summary:
      'Cite the source resources and prediction methods that support the data or analysis used in your work.',
    action: null,
    sections: [
      {
        id: 'citation-data-resources',
        title: 'Data resources',
        blocks: [
          {
            kind: 'citation-list',
            references: [NCBI_DATASETS_REFERENCE, BACDIVE_REFERENCE],
          },
        ],
      },
      {
        id: 'citation-prediction-method',
        title: 'Prediction method',
        blocks: [
          {
            kind: 'citation-list',
            references: [QGRS_MAPPER_REFERENCE],
          },
        ],
      },
    ],
  },
  {
    id: HELP_CONTACT_SECTION_ID,
    title: 'Contact',
    eyebrow: 'Support',
    summary:
      'Use the Medical AI Center website for questions about G4Vista access, data, or collaboration.',
    action: null,
    sections: [
      {
        id: 'contact-medical-ai-center',
        title: 'Medical AI Center',
        blocks: [
          {
            kind: 'paragraph',
            body: HELP_CONTACT.body,
          },
          {
            kind: 'contact',
            contact: HELP_CONTACT,
          },
        ],
      },
    ],
  },
];

export const HELP_DOCUMENTATION_INDEX_ITEMS: readonly HelpDocumentationIndexItem[] =
  HELP_DOCUMENTATION_ARTICLES.map((article) => ({
    id: article.id,
    label: article.title,
  }));

export const HELP_TOURS: Readonly<Record<HelpWorkflowId, HelpTourDefinition>> = {
  taxonomy: {
    id: 'taxonomy',
    label: 'Taxonomy search',
    steps: [
      {
        icon: 'account_tree',
        title: 'Taxonomy landing page',
        body: 'Use taxonomy as the entry point for finding taxa, genome assemblies, and predicted quadruplex sequence data.',
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
        body: 'Use the distribution controls to evaluate quadruplex sequence counts around genomic landmarks.',
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
  download: {
    id: 'download',
    label: 'Download package',
    steps: [
      {
        icon: 'archive',
        title: 'Download package page',
        body: 'Use Download to build TSV or ZIP exports from assembly, taxonomy, motif, and gene-relation filters.',
        route: '/download',
        targetSelector: '[data-help-target="download-header"]',
      },
      {
        icon: 'inventory_2',
        title: 'Choose source rows',
        body: 'Search and add assemblies on this page, review assemblies added from taxonomy pages, or use taxon and region filters.',
        route: '/download',
        targetSelector: '[data-help-target="download-assembly-set"]',
      },
      {
        icon: 'tune',
        title: 'Set filters and columns',
        body: 'Choose motif, gene-relation, score, overlap, sort, output mode, and catalog-backed columns.',
        route: '/download',
        targetSelector: '[data-help-target="download-options"]',
      },
      {
        icon: 'folder_zip',
        title: 'Create the export',
        body: 'Submit the request when source scope, filters, output mode, and columns are ready.',
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
        body: 'The header summarizes eligible strains, available correlation methods, and data status.',
        route: '/research/microbial-environment-g4',
        targetSelector: '[data-help-target="microbial-header"]',
      },
      {
        icon: 'tune',
        title: 'Choose trait and metric',
        body: 'Select the environment trait, outcome metric, and category scope before running.',
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
        body: 'Open the Documentation API Service section for documentation links and sample requests.',
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
