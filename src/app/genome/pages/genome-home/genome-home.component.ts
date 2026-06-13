import { SearchBarComponent } from './search-bar/search-bar.component';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { GenomeSearchService } from '../../services/genome-search.service';
import { formatCompactCount } from '../../utils/overview-format';

@Component({
  selector: 'app-genome',
  imports: [MatButtonModule, MatIconModule, RouterLink, SearchBarComponent],
  templateUrl: './genome-home.component.html',
  styleUrl: './genome-home.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GenomeHomeComponent {
  private readonly genomeSearchService = inject(GenomeSearchService);

  readonly overviewResource = rxResource({
    stream: () => this.genomeSearchService.getOverview(),
  });
  readonly recommendedAssemblies = computed(
    () => this.overviewResource.value()?.recommended_assemblies ?? [],
  );

  formatCount(value: number): string {
    return formatCompactCount(value);
  }
}
