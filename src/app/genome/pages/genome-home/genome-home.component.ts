import { SearchBarComponent } from './search-bar/search-bar.component';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-genome',
  imports: [MatButtonModule, SearchBarComponent],
  templateUrl: './genome-home.component.html',
  styleUrl: './genome-home.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GenomeHomeComponent {}
