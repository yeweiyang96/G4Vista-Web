import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, ParamMap, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import {
  HELP_API_SERVICE_SECTION_ID,
  HELP_DOCUMENTATION_ARTICLES,
  HELP_DOCUMENTATION_INDEX_ITEMS,
} from '../help-documentation-content';
import {
  HelpDocumentationArticle,
  HelpDocumentationId,
  HelpWorkflowId,
} from '../help-content-types';
import {
  isHelpWorkflowId,
} from '../help-tour-content';

interface HelpArticleAnchor {
  readonly anchorId: string;
  readonly label: string;
}

export class DocumentationConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DocumentationConfigurationError';
  }
}

function normalizedParam(params: ParamMap, key: string): string | null {
  const rawValue = params.get(key);
  if (rawValue === null) {
    return null;
  }

  const value = rawValue.trim();
  return value.length === 0 ? null : value;
}

function isHelpDocumentationId(value: string): value is HelpDocumentationId {
  return HELP_DOCUMENTATION_INDEX_ITEMS.some((item) => item.id === value);
}

function documentationIdFromWorkflowId(workflowId: HelpWorkflowId): HelpDocumentationId {
  if (workflowId === 'server-api') {
    return HELP_API_SERVICE_SECTION_ID;
  }

  return workflowId;
}

function documentationIdFromParamMap(params: ParamMap): HelpDocumentationId {
  const doc = normalizedParam(params, 'doc');
  if (doc !== null) {
    if (!isHelpDocumentationId(doc)) {
      throw new DocumentationConfigurationError(`Invalid documentation doc query param: ${doc}.`);
    }

    return doc;
  }

  const topic = normalizedParam(params, 'topic');
  if (topic !== null) {
    if (!isHelpWorkflowId(topic)) {
      throw new DocumentationConfigurationError(
        `Invalid documentation topic query param: ${topic}.`,
      );
    }

    return documentationIdFromWorkflowId(topic);
  }

  return 'home';
}

function articleAnchors(article: HelpDocumentationArticle): readonly HelpArticleAnchor[] {
  return article.sections.map((section) => ({
    anchorId: section.id,
    label: section.title,
  }));
}

@Component({
  selector: 'app-documentation',
  imports: [MatButtonModule, MatIconModule, RouterLink],
  templateUrl: './documentation.html',
  styleUrl: './documentation.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocumentationComponent {
  private readonly route = inject(ActivatedRoute);

  readonly documentationIndexItems = HELP_DOCUMENTATION_INDEX_ITEMS;
  readonly articles = HELP_DOCUMENTATION_ARTICLES;
  readonly selectedDocumentationId = signal<HelpDocumentationId>(
    documentationIdFromParamMap(this.route.snapshot.queryParamMap),
  );
  readonly selectedArticle = computed<HelpDocumentationArticle>(() => {
    const selectedId = this.selectedDocumentationId();
    const article = this.articles.find((item) => item.id === selectedId) ?? null;
    if (article === null) {
      throw new DocumentationConfigurationError(
        `Documentation article "${selectedId}" was not configured.`,
      );
    }

    return article;
  });
  readonly articleAnchors = computed<readonly HelpArticleAnchor[]>(() =>
    articleAnchors(this.selectedArticle()),
  );

  constructor() {
    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      this.selectedDocumentationId.set(documentationIdFromParamMap(params));
    });
  }
}
