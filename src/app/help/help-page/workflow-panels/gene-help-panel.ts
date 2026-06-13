import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-gene-help-panel',
  imports: [MatButtonModule, MatIconModule, RouterLink],
  templateUrl: './gene-help-panel.html',
  styleUrl: './help-workflow-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GeneHelpPanel {}
