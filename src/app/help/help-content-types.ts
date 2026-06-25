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
  | 'home'
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
