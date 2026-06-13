import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-genome-help-panel',
  imports: [MatButtonModule, MatIconModule, RouterLink],
  templateUrl: './genome-help-panel.html',
  styleUrl: './help-workflow-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GenomeHelpPanel {}
