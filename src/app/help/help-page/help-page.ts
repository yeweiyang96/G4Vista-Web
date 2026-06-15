import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, ParamMap, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { GeneHelpPanel } from './workflow-panels/gene-help-panel';
import { GenomeDetailHelpPanel } from './workflow-panels/genome-detail-help-panel';
import { GenomeHelpPanel } from './workflow-panels/genome-help-panel';
import { MicrobialEnvironmentHelpPanel } from './workflow-panels/microbial-environment-help-panel';
import { ServerApiHelpPanel } from './workflow-panels/server-api-help-panel';
import { TaxonomyHelpPanel } from './workflow-panels/taxonomy-help-panel';
import { HELP_QUESTIONS, HELP_REFERENCES, HELP_TOPICS, HelpWorkflowId } from '../help-content';

function isHelpWorkflowId(value: string): value is HelpWorkflowId {
  return HELP_TOPICS.some((topic) => topic.id === value);
}

function selectedTopicFromParamMap(params: ParamMap): HelpWorkflowId {
  const topic = params.get('topic')?.trim();
  if (!topic) {
    return 'taxonomy';
  }
  if (isHelpWorkflowId(topic)) {
    return topic;
  }
  throw new Error(`Invalid help topic query param: ${topic}.`);
}

@Component({
  selector: 'app-help-page',
  imports: [
    GeneHelpPanel,
    GenomeDetailHelpPanel,
    GenomeHelpPanel,
    MatButtonModule,
    MatExpansionModule,
    MatIconModule,
    MicrobialEnvironmentHelpPanel,
    RouterLink,
    ServerApiHelpPanel,
    TaxonomyHelpPanel,
  ],
  templateUrl: './help-page.html',
  styleUrl: './help-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HelpPage {
  private readonly route = inject(ActivatedRoute);

  readonly topics = HELP_TOPICS;
  readonly questions = HELP_QUESTIONS;
  readonly references = HELP_REFERENCES;
  readonly selectedTopicId = signal<HelpWorkflowId>(
    selectedTopicFromParamMap(this.route.snapshot.queryParamMap),
  );

  selectTopic(topicId: HelpWorkflowId): void {
    this.selectedTopicId.set(topicId);
  }
}
