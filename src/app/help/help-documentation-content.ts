import { DEFAULT_GENOME_DETAIL_HELP_ROUTE } from './help-tour-content';
import {
  HelpApiDocLink,
  HelpApiSample,
  HelpArticleApiSampleBlock,
  HelpArticleImageBlock,
  HelpContact,
  HelpDocumentationArticle,
  HelpDocumentationIndexItem,
  HelpReference,
} from './help-content-types';

export const HELP_API_SERVICE_SECTION_ID = 'api-service';
export const HELP_CITATION_SECTION_ID = 'citation';
export const HELP_CONTACT_SECTION_ID = 'contact';
export const HELP_API_DOCUMENTATION_SECTION_ID = 'api-documentation';
export const HELP_API_SAMPLE_SECTION_ID = 'api-sample-requests';

const SCREENSHOT_VERSION = '20260626';

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

const QGRS_CPP_REFERENCE: HelpReference = {
  anchorId: 'citation-qgrs-cpp',
  title: 'qgrs-cpp',
  citation:
    'freezer333. qgrs-cpp: C++ implementation of QGRS mapping algorithm. GitHub. https://github.com/freezer333/qgrs-cpp',
  websiteUrl: 'https://github.com/freezer333/qgrs-cpp',
  citationUrl: 'https://github.com/freezer333/qgrs-cpp',
};

const QGRS_CONSERVE_REFERENCE: HelpReference = {
  anchorId: 'citation-qgrs-conserve',
  title: 'QGRS-Conserve',
  citation:
    'Frees S, Menendez C, Crum M, Bagga PS. QGRS-Conserve: a computational method for discovering evolutionarily conserved G-quadruplex motifs. Human Genomics 8, 8 (2014). https://doi.org/10.1186/1479-7364-8-8',
  websiteUrl: 'https://link.springer.com/article/10.1186/1479-7364-8-8',
  citationUrl: 'https://doi.org/10.1186/1479-7364-8-8',
};

const QGRS_H_PREDICTOR_REFERENCE: HelpReference = {
  anchorId: 'citation-qgrs-h-predictor',
  title: 'QGRS-H Predictor',
  citation:
    'Menendez C, Frees S, Bagga PS. QGRS-H Predictor: a web server for predicting homologous quadruplex forming G-rich sequence motifs in nucleotide sequences. Nucleic Acids Research 40(W1):W96-W103 (2012). https://doi.org/10.1093/nar/gks422',
  websiteUrl: 'https://academic.oup.com/nar/article-lookup/doi/10.1093/nar/gks422',
  citationUrl: 'https://doi.org/10.1093/nar/gks422',
};

export const HELP_REFERENCES: readonly HelpReference[] = [
  NCBI_DATASETS_REFERENCE,
  BACDIVE_REFERENCE,
  QGRS_CPP_REFERENCE,
  QGRS_CONSERVE_REFERENCE,
  QGRS_H_PREDICTOR_REFERENCE,
];

export const HELP_CONTACT: HelpContact = {
  anchorId: HELP_CONTACT_SECTION_ID,
  title: 'Medical AI Center',
  body: 'For questions about G4ViSTA access, data, or collaboration, contact the Medical AI Center through the official website.',
  websiteLabel: 'Open Medical AI Center',
  websiteUrl: 'https://bioinfo.med.niigata-u.ac.jp/',
  licenseNote:
    'G4ViSTA code is licensed under an MIT-style License. Documentation is licensed under CC BY 4.0.',
};

export const HELP_DOCUMENTATION_ARTICLES: readonly HelpDocumentationArticle[] = [
  {
    id: 'home',
    title: 'Welcome to G4ViSTA',
    eyebrow: 'Overview',
    summary:
      'G4ViSTA helps biologists search genomes, taxa, genes, and microbial trait datasets, then inspect predicted G4 and i-motif-forming sequences with tables, charts, genome browser views, and export tools.',
    action: null,
    sections: [
      {
        id: 'g4-i-motif-definition',
        title: 'What G4ViSTA contains',
        blocks: [
          {
            kind: 'paragraph',
            body: 'G4ViSTA stores predicted G-quadruplex-forming sequences in guanine-rich genomic regions and predicted i-motif-forming sequences in cytosine-rich genomic regions. These are computational predictions, so they are best used as candidates for comparison, visualization, filtering, and follow-up experiments.',
          },
          {
            kind: 'field-table',
            rows: [
              {
                field: 'G4',
                description:
                  'Predicted G-quadruplex-forming sequence. In G4ViSTA tables this is the guanine-rich motif class.',
              },
              {
                field: 'i-motif',
                description:
                  'Predicted i-motif-forming sequence. In G4ViSTA tables this is the cytosine-rich motif class.',
              },
              {
                field: 'Density per Mb',
                description:
                  'A count normalized by genome length, useful when comparing genomes with very different sizes.',
              },
              {
                field: 'Gene context',
                description:
                  'The relationship between a predicted sequence and annotated genes, such as inside a gene, upstream, downstream, or intergenic.',
              },
            ],
          },
        ],
      },
      {
        id: 'choose-a-workflow',
        title: 'Choose a workflow',
        blocks: [
          {
            kind: 'paragraph',
            body: 'Start with the biological identifier you already know. A taxon name, an assembly accession, a gene name, and an environmental trait each lead to a different G4ViSTA workflow.',
          },
          {
            kind: 'field-table',
            rows: [
              {
                field: 'I know the organism or lineage',
                description:
                  'Use Taxonomy to search NCBI taxon names or Taxon IDs, browse common groups, open a taxon record, and review available assemblies.',
              },
              {
                field: 'I know the assembly',
                description:
                  'Use Genome search to open a specific assembly by accession, assembly name, or organism name.',
              },
              {
                field: 'I know a gene or feature',
                description:
                  'Use Gene search to find annotated features by gene symbol, locus tag, feature ID, gene ID, or product keyword.',
              },
              {
                field: 'I need data files',
                description:
                  'Use Download to build TSV or ZIP exports from selected assemblies, taxonomy filters, motif filters, gene-context filters, and column selections.',
              },
              {
                field: 'I am comparing microbial traits',
                description:
                  'Use Microbial analysis to compare BacDive-derived traits with selected assembly-level G4 density metrics.',
              },
            ],
          },
        ],
      },
      {
        id: 'recommended-first-steps',
        title: 'Recommended first steps',
        blocks: [
          {
            kind: 'ordered-list',
            items: [
              {
                title: 'Identify the biological scope',
                body: 'Decide whether your question is about one assembly, a taxonomic group, a gene family, or a microbial trait comparison.',
              },
              {
                title: 'Open the matching search page',
                body: 'Use the page index on this documentation screen or the main navigation bar to open the relevant tool.',
              },
              {
                title: 'Check assembly and taxonomy context',
                body: 'Before interpreting counts or densities, confirm the organism, assembly accession, taxon rank, and sequence record count.',
              },
              {
                title: 'Filter before exporting',
                body: 'Apply motif type, score, tetrad, region, gene relation, and taxonomy filters before downloading files for downstream analysis.',
              },
              {
                title: 'Record the query settings',
                body: 'For reproducibility, record the assembly accession, taxon ID, motif type, score range, flank window, gene relation, and selected density metric.',
              },
            ],
          },
        ],
      },
      {
        id: 'home-qa',
        title: 'Q&A',
        blocks: [
          {
            kind: 'bullet-list',
            items: [
              {
                title: 'Are these experimentally validated structures?',
                body: 'No. G4ViSTA presents predicted G4 and i-motif-forming sequences. Treat them as computational candidates that need biological interpretation and, when required, experimental validation.',
              },
              {
                title: 'Why do counts differ between species?',
                body: 'Genome size, assembly quality, gene annotation, taxonomic scope, and filter settings can all change counts. Use density per Mb when comparing genomes of different sizes.',
              },
              {
                title: 'Should I start from Taxonomy or Genome search?',
                body: 'Use Taxonomy when you want to browse organisms or lineages. Use Genome search when you already know the exact assembly accession or assembly name.',
              },
              {
                title: 'Why do some pages show no rows?',
                body: 'The selected assembly, taxon, trait, or filter combination may not have matching records. Clear filters, broaden the taxon scope, or check whether the assembly has predicted sequence data.',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'taxonomy',
    title: 'Taxonomy',
    eyebrow: 'Guide',
    summary:
      'The Taxonomy page is the starting point for finding organisms or broader biological groups and moving from a taxon to the genome assemblies available in G4ViSTA.',
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
            body: 'The simple search accepts scientific names, common names, broader lineage names, and NCBI Taxon IDs. When the user starts typing, G4ViSTA shows matching taxa so the intended organism or lineage can be selected before opening a record.',
          },
          articleImage(
            'taxonomy.webp',
            'Taxonomy search panel with taxon name and Taxon ID input.',
            'The Taxonomy search panel accepts scientific names, common names, broader groups, and NCBI Taxon IDs.',
            'top center',
            '1256 / 316',
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
            body: 'A taxon record summarizes the selected taxonomy node and lists genome assemblies connected to that taxon. Use this page to confirm taxon rank, inspect lineage context, compare position summaries, and move from a biological group to individual assemblies.',
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
                field: 'Position context',
                description:
                  'The pie chart groups predicted sequences by genomic context, such as inside genes, upstream, downstream, or other regions.',
              },
              {
                field: 'Gene biotype table',
                description:
                  'When available, the table summarizes intragenic and flanking predicted sequences by gene biotype.',
              },
              {
                field: 'Lineage panel',
                description:
                  'Use lineage links to move up or down the taxonomy tree and compare related groups.',
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
        id: 'taxonomy-detail-steps',
        title: 'Using a taxon detail page',
        blocks: [
          {
            kind: 'ordered-list',
            items: [
              {
                title: 'Confirm the taxon',
                body: 'Check the Taxon ID, rank, and assembly count. A species page and a family page can answer very different questions.',
              },
              {
                title: 'Choose motif type and flank window',
                body: 'Switch between G4 and i-motif summaries, then choose the gene flank distance used for upstream and downstream categories.',
              },
              {
                title: 'Read the position context first',
                body: 'Use the chart to see whether predicted sequences are mostly intragenic, flanking genes, or outside the selected gene windows.',
              },
              {
                title: 'Open or collect assemblies',
                body: 'Open one assembly for detailed inspection, or add assemblies to the download set when you need files for several genomes.',
              },
              {
                title: 'Use lineage links for comparison',
                body: 'Move to parent or related taxonomy nodes when the current taxon has too few or too many assemblies.',
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
      {
        id: 'taxonomy-qa',
        title: 'Q&A',
        blocks: [
          {
            kind: 'bullet-list',
            items: [
              {
                title: 'I searched a common name and got unexpected results.',
                body: 'Choose the autocomplete result with the expected scientific name, rank, and Taxon ID. Common names can map to multiple taxonomy records.',
              },
              {
                title: 'Why does a broad taxon have many assemblies?',
                body: 'Higher ranks include descendants. Open a lower rank or use the assembly table to choose specific accessions before analysis.',
              },
              {
                title: 'Why are upstream and downstream counts sensitive to the flank window?',
                body: 'A larger flank window includes more sequence around genes. Keep the same window when comparing taxa or reporting counts.',
              },
              {
                title: 'What should I do if a taxon has no assemblies?',
                body: 'Try a parent taxon, a species-level taxon, or Genome search by organism name. G4ViSTA can only analyze assemblies that are present in its database.',
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
            'genome.webp',
            'Genome search field, recommended assembly table, and search tips.',
            'Genome search combines accession search with recommended assemblies and quick search tips.',
            'top center',
            '1256 / 583',
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
      {
        id: 'genome-search-strategy',
        title: 'Search strategy',
        blocks: [
          {
            kind: 'field-table',
            rows: [
              {
                field: 'Exact accession search',
                description:
                  'Best for reproducible work. Use the accession named in a paper, notebook, or external annotation file.',
              },
              {
                field: 'Assembly name search',
                description:
                  'Useful when you know a reference name such as TAIR10.1 but not the accession.',
              },
              {
                field: 'Organism search',
                description:
                  'Useful for browsing available assemblies. Check organism name, assembly name, and accession before opening a result.',
              },
              {
                field: 'Recommended assemblies',
                description:
                  'Fast entry points for common organisms. Use them for exploration, then record the accession used in your analysis.',
              },
            ],
          },
          {
            kind: 'note',
            title: 'Version matters',
            body: 'Different assembly versions can have different sequence records, coordinates, annotations, and predicted sequence counts. Always report the assembly accession.',
          },
        ],
      },
      {
        id: 'genome-qa',
        title: 'Q&A',
        blocks: [
          {
            kind: 'bullet-list',
            items: [
              {
                title: 'Why do several rows appear for one organism?',
                body: 'An organism may have reference, alternate, strain, or updated assemblies. Choose the accession that matches your biological question and downstream coordinate system.',
              },
              {
                title: 'What if I only know the species name?',
                body: 'Search the species name here for assemblies, or use Taxonomy when you want to inspect the taxonomic group before choosing an assembly.',
              },
              {
                title: 'Why does a recommended assembly differ from my paper?',
                body: 'Recommended rows are convenient defaults, not a substitute for a publication-specific accession. Search the exact accession when reproducing a published analysis.',
              },
              {
                title: 'What does sequence records mean?',
                body: 'It is the number of chromosomes, scaffolds, contigs, or other assembly records that can contain predicted G4 or i-motif-forming sequences.',
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
            'genome-detail.webp',
            'G4 Explorer filter controls, result tabs, table, and current selection panel.',
            'The G4 Explorer links filter controls with table, range chart, genome browser, and current-selection views.',
            'top center',
            '1256 / 680',
          ),
          {
            kind: 'field-table',
            rows: [
              {
                field: 'Assembly accession',
                description:
                  'The accession used by G4ViSTA routes, API endpoints, and exported files.',
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
            body: 'Position distribution and statistics panels show how predicted quadruplex sequences are distributed relative to gene landmarks. These views are useful for deciding which filters to apply before reading individual rows.',
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
              {
                title: 'Flank window control',
                body: 'The selected window defines how far upstream or downstream of a gene a predicted sequence can be counted as flanking.',
              },
              {
                title: 'Tetrad and score filters',
                body: 'Use these filters when the summary should match the strength criteria used in the table.',
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
                field: 'Gene keyword',
                description:
                  'Search a feature ID, gene name, or locus tag to focus the explorer around a selected gene or feature.',
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
            kind: 'paragraph',
            body: 'The table, range chart, genome browser, and current-selection panel are linked by the active assembly, sequence record, region, motif type, and filters.',
          },
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
                title: 'Use the range chart',
                body: 'Zoom or reset the range chart to inspect local density and gene-centered context for the active sequence record.',
              },
              {
                title: 'Use the genome browser',
                body: 'Open the Genome browser tab to view sequence, annotation, and predicted sequence tracks in genomic coordinates.',
              },
              {
                title: 'Download filtered rows',
                body: 'Use the table download action when the current filtered result set is needed as a TSV file.',
              },
            ],
          },
        ],
      },
      {
        id: 'g4-explorer-qa',
        title: 'Q&A',
        blocks: [
          {
            kind: 'bullet-list',
            items: [
              {
                title: 'Why did my table count change after using the position panel?',
                body: 'Position summaries and table filters can use motif type, flank window, tetrad, score, sequence, and gene settings. Check that the same settings are applied before comparing counts.',
              },
              {
                title: 'Why are some gene relation fields unavailable?',
                body: 'Gene relation values depend on annotation and read-model availability for the assembly. Try a different sequence record or clear the gene filter if the current scope is too narrow.',
              },
              {
                title: 'Why does the genome browser show a different region than the table?',
                body: 'The browser follows the active sequence record and displayed region. Reset the browser view or select a row again to synchronize the visible interval.',
              },
              {
                title: 'Can I compare two assemblies on this page?',
                body: 'This workspace focuses on one assembly. Use Genome search to open another assembly, or Download to export comparable files for multiple assemblies.',
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
            'gene.webp',
            'Gene keyword search, optional taxon scope, and result guidance panel.',
            'Gene search starts with a gene or feature keyword and can be narrowed with a taxon scope.',
            'top center',
            '1256 / 500',
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
                  'Use when working from a genome annotation file or another G4ViSTA result row.',
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
            body: 'Gene search can be opened from a taxon context or narrowed manually with the Taxon scope field. This is useful for repeated gene-family searches across assemblies from one organism or lineage.',
          },
          {
            kind: 'note',
            title: 'Broad keywords',
            body: 'Product keywords and short gene symbols can return many rows. Add taxon context or use a more specific identifier when the result grid is too broad or slow.',
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
              {
                field: 'Export',
                description:
                  'Download the complete result set for the current gene keyword and taxon scope, not only the visible page.',
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
                title: 'Review the gene detail page',
                body: 'The detail page shows feature coordinates, strand, biotype, annotation attributes, and linked G4/i-motif relation rows.',
              },
              {
                title: 'Export the full result',
                body: 'Use the download action after searching when the complete matching result set is required.',
              },
            ],
          },
        ],
      },
      {
        id: 'gene-qa',
        title: 'Q&A',
        blocks: [
          {
            kind: 'bullet-list',
            items: [
              {
                title: 'Why is global gene search slow?',
                body: 'A global keyword search scans many assemblies. Select a taxon scope or use a more specific feature ID, gene ID, locus tag, or product term.',
              },
              {
                title: 'Why do gene names repeat across rows?',
                body: 'The same gene symbol can appear in different assemblies, sequence records, strains, paralogs, or annotation versions. Use assembly accession, region, and feature ID to distinguish them.',
              },
              {
                title: 'Why are linked G4 counts zero for a gene?',
                body: 'No predicted G4 or i-motif-forming sequences may overlap the selected gene context under the current relation rules and available annotation.',
              },
              {
                title: 'What should I export?',
                body: 'Export gene search results when you need a gene list. Use the genome explorer table or Download page when you need the predicted sequence rows themselves.',
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
            'download.webp',
            'Download source controls and request summary.',
            'The Download page starts by choosing the row scope, then summarizes filters and output before export.',
            'top center',
            '1256 / 650',
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
                body: 'Choose one source mode: selected assembly set, taxonomy or region filters, or all matching records. Review the request summary before exporting.',
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
                  'Limit rows by the saved assembly set, by taxon IDs, species taxon IDs, or region IDs, or by all matching records after explicit confirmation.',
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
                field: 'Flank windows',
                description:
                  'Apply selected upstream and downstream windows when gene relation categories include flanking rows.',
              },
              {
                field: 'Overlap thresholds',
                description:
                  'Use minimum overlap base pairs or overlap fraction when you need stricter gene-context evidence.',
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
                title: 'Single TSV mode',
                body: 'Creates one tab-separated table for the full request, useful for spreadsheet import or command-line processing.',
              },
              {
                title: 'Empty selections',
                body: 'If all matching records is selected, confirm the broad export intentionally. Otherwise choose assemblies or taxonomy and region filters first.',
              },
            ],
          },
        ],
      },
      {
        id: 'download-qa',
        title: 'Q&A',
        blocks: [
          {
            kind: 'bullet-list',
            items: [
              {
                title: 'Why is Create download disabled?',
                body: 'The source scope may be incomplete, all-records mode may need confirmation, no motif type may be selected, or the column catalog may not be loaded.',
              },
              {
                title: 'Which format should I choose?',
                body: 'Use ZIP when exporting multiple assemblies or motif types because it includes a manifest. Use single TSV when you want one table for quick import.',
              },
              {
                title: 'Why are upstream or downstream rows missing?',
                body: 'Select upstream or downstream gene context categories and the flank windows you want. The default source focuses on inside-gene rows.',
              },
              {
                title: 'Why did a numeric filter fail?',
                body: 'Score, overlap base pairs, and overlap fraction fields require valid numeric ranges. Overlap fraction must be between 0 and 1.',
              },
              {
                title: 'How do I reproduce an export later?',
                body: 'Keep the ZIP manifest or record the source mode, taxon IDs, assemblies, motif types, score range, gene relation filters, sort order, and column set.',
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
            body: 'The workbench is designed for exploratory comparison of microbial environmental trait values and G4ViSTA density metrics. Numeric traits render as scatter plots; categorical and multi-label traits render as box plot summaries over standard categories loaded from the current Server options response.',
          },
          articleImage(
            'microbial-environment.webp',
            'Microbial analysis setup controls, summary metrics, and category box plot.',
            'The microbial analysis workbench connects Server-provided setup options with chart-ready results.',
            'top center',
            '1256 / 680',
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
                  'Choose a Server-provided trait. The available list, default chart type, default metric, category mode, and evidence defaults are loaded from the current dataset.',
              },
              {
                field: 'Outcome metric',
                description:
                  'Choose one of the public density metrics allowed for the selected trait, such as genome-wide, gene-overlapping, upstream, downstream, or intergenic G4 density per Mb.',
              },
              {
                field: 'Standard categories',
                description:
                  'For categorical and multi-label traits, select standard category values prepared for analysis. Raw BacDive values stay available in the table and downloads for checking.',
              },
              {
                field: 'Context axis',
                description:
                  'For traits such as ecological context, choose the category axis prepared by the dataset, then select the displayed categories.',
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
                body: 'For categorical traits, use the checklist of standard categories. A single assembly may belong to more than one category unless the data contract marks that trait as single-select.',
              },
              {
                title: 'Submit the query',
                body: 'Run the analysis to refresh the summary metrics, chart, and assembly preview table.',
              },
              {
                title: 'Review and export',
                body: 'Use the assembly preview to check raw BacDive values, normalized values, taxonomy context, genome size, and selected density metrics before downloading results.',
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
                  'Reports assembly counts, result row counts, chart type, and the selected public density metric.',
              },
              {
                field: 'Scatter plot or box plot',
                description:
                  'Numeric traits use scatter plots. Categorical and multi-label traits use box plots with quartiles, whiskers, median, and sample size from the API.',
              },
              {
                field: 'Category status',
                description:
                  'For box plots, status rows show category sample size, median, whisker range, outliers, and API status.',
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
        id: 'microbial-mapping-evidence',
        title: 'Evidence levels for grouped traits',
        blocks: [
          {
            kind: 'paragraph',
            body: 'Evidence levels are shown only for BacDive traits that must be grouped from text into standard categories, such as oxygen tolerance or ecological context. They are not used for numeric traits such as growth temperature or pH. For grouped traits, G4ViSTA keeps the original BacDive text, assigns it to a standard category when the match is clear enough, and lets you choose how strict that assignment must be before it appears in the chart.',
          },
          {
            kind: 'field-table',
            rows: [
              {
                field: 'High evidence',
                description:
                  'Clear match to a standard category, such as an exact oxygen label, a clear soil or water source, or Homo sapiens as the host.',
              },
              {
                field: 'Medium evidence',
                description:
                  'Reasonable broader match, such as animal or plant host association, air, food, industrial sample terms, or common-name host rules.',
              },
              {
                field: 'Low evidence',
                description:
                  'Weak but retained match. Useful for checking source data, but usually not the best default for stricter comparisons.',
              },
              {
                field: 'Review-only',
                description:
                  'Ambiguous, conflicting, unknown, or marked for manual review. Included in analysis only when Include review-only values is turned on.',
              },
            ],
          },
          {
            kind: 'note',
            title: 'Source values',
            body: 'The table and downloads keep the original BacDive values, the cleaned values, and the rule used for grouping so results can be checked later.',
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
      {
        id: 'microbial-qa',
        title: 'Q&A',
        blocks: [
          {
            kind: 'bullet-list',
            items: [
              {
                title: 'Why do numeric traits use scatter plots but categories use box plots?',
                body: 'Numeric traits such as growth temperature or pH have numeric midpoints, so each assembly can be plotted against a density metric. Categorical and multi-label traits compare distributions across standard categories.',
              },
              {
                title: 'Why can one assembly appear in more than one category?',
                body: 'Some traits are multi-label. The same assembly can belong to several categories, but it is counted once within each category.',
              },
              {
                title: 'Why should I keep taxonomy filters in mind?',
                body: 'Ecological context, host association, and microbial lineage are confounded. Use taxonomy filters for stratified comparisons and sensitivity analysis.',
              },
              {
                title: 'Should I include review-only values?',
                body: 'Usually keep review-only values off for the main analysis. Turn them on only when checking ambiguous source values or running a sensitivity analysis.',
              },
              {
                title: 'Can these charts prove environmental causation?',
                body: 'No. The workbench reports descriptive associations in the selected dataset. Treat results as exploratory comparisons that require biological follow-up.',
              },
            ],
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
      {
        id: 'temperature-statistics-qa',
        title: 'Q&A',
        blocks: [
          {
            kind: 'bullet-list',
            items: [
              {
                title: 'Is this report a general rule for all microbes?',
                body: 'No. It summarizes one exploratory screen with explicit sample-size, effect-size, and FDR criteria.',
              },
              {
                title: 'Why are related ranks listed separately?',
                body: 'A genus, family, order, class, or phylum can overlap biologically. Treat parent-child taxonomy signals as related evidence, not independent discoveries.',
              },
              {
                title: 'How should I reuse these candidates?',
                body: 'Open Microbial analysis, select growth temperature and a density metric, then repeat the comparison with the relevant taxonomy filters and recorded sample size.',
              },
              {
                title: 'Why was raw G4 count excluded?',
                body: 'Raw count can be dominated by genome size. Density per Mb is better for comparing assemblies with different genome lengths.',
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
      'G4ViSTA-Web calls same-origin FastAPI endpoints under /api/v1. The API can also be used directly from scripts, notebooks, and external clients.',
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
            body: 'Use the interactive or machine-readable API documentation when building a script, notebook, or external client outside G4ViSTA-Web.',
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
      {
        id: 'api-service-qa',
        title: 'Q&A',
        blocks: [
          {
            kind: 'bullet-list',
            items: [
              {
                title: 'When should I use the API instead of the web page?',
                body: 'Use the API for reproducible notebooks, batch queries, external pipelines, or when you need to save request JSON with analysis results.',
              },
              {
                title: 'Why do some API requests need POST?',
                body: 'Complex analysis and download requests include many filters, category selections, and pagination settings, so they are sent as structured JSON bodies.',
              },
              {
                title: 'Why does an endpoint return 422?',
                body: 'A required parameter or request field is invalid. Check accession values, Taxon IDs, metric names, category IDs, numeric ranges, and sort fields.',
              },
              {
                title: 'How do I match web results with API results?',
                body: 'Use the same assembly accession, taxon scope, motif type, score range, flank window, gene relation filters, trait code, and outcome metric.',
              },
            ],
          },
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
            references: [QGRS_CPP_REFERENCE, QGRS_CONSERVE_REFERENCE, QGRS_H_PREDICTOR_REFERENCE],
          },
        ],
      },
      {
        id: 'citation-qa',
        title: 'Q&A',
        blocks: [
          {
            kind: 'bullet-list',
            items: [
              {
                title: 'What should I cite for genome metadata?',
                body: 'Cite NCBI Datasets when using assembly and taxonomy-derived genome metadata from G4ViSTA.',
              },
              {
                title: 'What should I cite for microbial trait analyses?',
                body: 'Cite BacDive when using microbial strain metadata or Environment-G4 results derived from BacDive traits.',
              },
              {
                title: 'What should I cite for predicted G4 candidates?',
                body: 'Cite the prediction method references listed here, and describe the G4ViSTA filters used in your analysis.',
              },
              {
                title: 'Do I need to cite exported files separately?',
                body: 'No separate file citation is required, but include the G4ViSTA route, assembly accessions, filters, and download manifest when reporting reproducible work.',
              },
            ],
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
      'Use the Medical AI Center website for questions about G4ViSTA access, data, or collaboration.',
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
      {
        id: 'contact-before-writing',
        title: 'Before contacting support',
        blocks: [
          {
            kind: 'bullet-list',
            items: [
              {
                title: 'For search issues',
                body: 'Include the exact query, selected taxon or assembly accession, and the page where the issue occurred.',
              },
              {
                title: 'For analysis issues',
                body: 'Include trait code, outcome metric, taxonomy filters, category filters, evidence level, and whether review-only values were included.',
              },
              {
                title: 'For download issues',
                body: 'Include the selected source mode, filters, output mode, column mode, and any error message shown on the page.',
              },
              {
                title: 'For browser-display issues',
                body: 'Include the assembly accession, sequence record, visible region, browser, and approximate time of the problem.',
              },
            ],
          },
        ],
      },
      {
        id: 'contact-qa',
        title: 'Q&A',
        blocks: [
          {
            kind: 'bullet-list',
            items: [
              {
                title: 'Can support interpret my biological result?',
                body: 'Support can help with G4ViSTA access, data, and reproducibility details. Biological interpretation should be supported by domain evidence and follow-up analysis.',
              },
              {
                title: 'Should I send screenshots?',
                body: 'Screenshots are useful when they show the selected filters, accession, taxon, error message, or chart state.',
              },
              {
                title: 'Can I request collaboration?',
                body: 'Use the Medical AI Center website for collaboration questions and include enough context to identify the G4ViSTA workflow involved.',
              },
            ],
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
