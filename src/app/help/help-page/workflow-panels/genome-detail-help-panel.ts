import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { DEFAULT_GENOME_DETAIL_HELP_ROUTE } from '../../help-content';

@Component({
  selector: 'app-genome-detail-help-panel',
  imports: [MatButtonModule, MatIconModule, RouterLink],
  templateUrl: './genome-detail-help-panel.html',
  styleUrl: './help-workflow-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GenomeDetailHelpPanel {
  readonly exampleGenomeRoute = DEFAULT_GENOME_DETAIL_HELP_ROUTE;
}
