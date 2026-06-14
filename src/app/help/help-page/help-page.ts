import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { GeneHelpPanel } from './workflow-panels/gene-help-panel';
import { GenomeDetailHelpPanel } from './workflow-panels/genome-detail-help-panel';
import { GenomeHelpPanel } from './workflow-panels/genome-help-panel';
import { MicrobialEnvironmentHelpPanel } from './workflow-panels/microbial-environment-help-panel';
import { ServerApiHelpPanel } from './workflow-panels/server-api-help-panel';
import { TaxonomyHelpPanel } from './workflow-panels/taxonomy-help-panel';
import { HELP_TOPICS, HelpWorkflowId } from '../help-content';

@Component({
  selector: 'app-help-page',
  imports: [
    GeneHelpPanel,
    GenomeDetailHelpPanel,
    GenomeHelpPanel,
    MatButtonModule,
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
  readonly topics = HELP_TOPICS;
  readonly selectedTopicId = signal<HelpWorkflowId>('taxonomy');

  selectTopic(topicId: HelpWorkflowId): void {
    this.selectedTopicId.set(topicId);
  }
}
