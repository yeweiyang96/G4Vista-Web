import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-microbial-environment-help-panel',
  imports: [MatButtonModule, MatIconModule, RouterLink],
  templateUrl: './microbial-environment-help-panel.html',
  styleUrl: './help-workflow-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MicrobialEnvironmentHelpPanel {}
