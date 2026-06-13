import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { HELP_TOPICS } from '../help-content';

@Component({
  selector: 'app-help-page',
  imports: [MatButtonModule, MatIconModule, RouterLink],
  templateUrl: './help-page.html',
  styleUrl: './help-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HelpPage {
  readonly topics = HELP_TOPICS;
}
