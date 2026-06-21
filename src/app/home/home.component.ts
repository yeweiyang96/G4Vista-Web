import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import {
  GenomeRecommendedAssembly,
  GenomeSearchService,
} from '../genome/services/genome-search.service';
import { formatCompactCount, formatGenomeLength } from '../genome/utils/overview-format';

type HomeSearchTarget = 'genome' | 'taxonomy' | 'gene';

interface WorkflowCard {
  readonly tone: 'taxonomy' | 'genome' | 'gene' | 'research';
  readonly icon: string;
  readonly title: string;
  readonly body: string;
  readonly action: string;
  readonly route: string;
}

interface StartingAction {
  readonly icon: string;
  readonly label: string;
  readonly route: string;
  readonly queryParams: Record<string, string> | null;
}

interface StartingPoint {
  readonly tone: 'human' | 'plant' | 'bacteria' | 'research';
  readonly icon: string;
  readonly title: string;
  readonly subtitle: string;
  readonly category: string;
  readonly detail: string;
  readonly actions: readonly StartingAction[];
}

interface HomeSearchNavigation {
  readonly commands: string[];
  readonly queryParams: Record<string, string>;
}

const COUNT_FORMATTER = new Intl.NumberFormat('en-US');
const NUMERIC_TAXON_ID_PATTERN = /^\d+$/;
const WORKFLOW_CARDS: readonly WorkflowCard[] = [
  {
    tone: 'genome',
    icon: 'biotech',
    title: 'Find a genome',
    body: 'Search or view genome assemblies and their predicted sites.',
    action: 'Open Genome',
    route: '/genome',
  },
  {
    tone: 'gene',
    icon: 'search',
    title: 'Search genes',
    body: 'Find genes or features and view associated G4/i-motif sites.',
    action: 'Open Gene Search',
    route: '/gene',
  },
  {
    tone: 'research',
    icon: 'science',
    title: 'Microbial G4 research',
    body: 'Analyze G4 site patterns in microbial environments and traits.',
    action: 'Open Research',
    route: '/research/microbial-environment-g4',
  },
  {
    tone: 'taxonomy',
    icon: 'account_tree',
    title: 'Browse by taxonomy',
    body: 'Explore G4 and i-motif sites by taxonomic groups.',
    action: 'Open Taxonomy',
    route: '/taxonomy',
  },
];

function homeSearchNavigation(
  target: HomeSearchTarget,
  rawQuery: string,
): HomeSearchNavigation | null {
  const query = rawQuery.trim();
  if (!query) {
    return null;
  }

  if (target === 'genome') {
    return { commands: ['/genome'], queryParams: {} };
  }

  if (target === 'taxonomy') {
    return NUMERIC_TAXON_ID_PATTERN.test(query)
      ? { commands: ['/taxonomy', query], queryParams: {} }
      : { commands: ['/taxonomy'], queryParams: { query } };
  }

  return { commands: ['/gene'], queryParams: { search: query } };
}

function findAssemblyByAccessions(
  assemblies: readonly GenomeRecommendedAssembly[],
  accessions: readonly string[],
): GenomeRecommendedAssembly | null {
  return assemblies.find((assembly) => accessions.includes(assembly.assembly_accession)) ?? null;
}

function assemblySubtitle(
  assembly: GenomeRecommendedAssembly | null,
  fallbackName: string,
  fallbackAccession: string,
): string {
  if (!assembly) {
    return `${fallbackName} (${fallbackAccession})`;
  }
  return `${assembly.asm_name || assembly.organism_name} (${assembly.assembly_accession})`;
}

function assemblyDetail(
  assembly: GenomeRecommendedAssembly | null,
  fallbackDetail: string,
): string {
  if (!assembly) {
    return fallbackDetail;
  }
  return `${formatGenomeLength(assembly.genome_length_bp)} · ${assembly.seqid_count} sequence records`;
}

function startingActionQueryParams(queryParams: Record<string, string>): Record<string, string> {
  return queryParams;
}

@Component({
  selector: 'app-home',
  imports: [
    MatButtonModule,
    MatButtonToggleModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    ReactiveFormsModule,
    RouterLink,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {
  private readonly genomeSearchService = inject(GenomeSearchService);
  private readonly router = inject(Router);

  readonly heroSearchControl = new FormControl('', { nonNullable: true });
  readonly heroTargetControl = new FormControl<HomeSearchTarget>('genome', { nonNullable: true });
  readonly databaseStatusResource = rxResource({
    stream: () => this.genomeSearchService.getDatabaseStatus(),
  });
  readonly recommendedAssembliesResource = rxResource({
    stream: () => this.genomeSearchService.getRecommendedAssemblies(),
  });
  readonly databaseStatus = computed(() => this.databaseStatusResource.value());
  readonly recommendedAssemblies = computed(() => this.recommendedAssembliesResource.value() ?? []);
  readonly workflowCards = WORKFLOW_CARDS;
  readonly assemblyDataLoadedAt = computed(
    () => this.databaseStatus()?.assembly_data_loaded_at ?? 'Loading',
  );
  readonly startingPoints = computed<readonly StartingPoint[]>(() => {
    const assemblies = this.recommendedAssemblies();
    const human = findAssemblyByAccessions(assemblies, ['GCF_000001405.40']);
    const arabidopsis = findAssemblyByAccessions(assemblies, ['GCF_000001735.4']);

    return [
      {
        tone: 'human',
        icon: 'person',
        title: 'Human reference genome',
        subtitle: assemblySubtitle(human, 'GRCh38.p14', 'GCF_000001405.40'),
        category: 'Reference assembly',
        detail: assemblyDetail(human, '~3.1B bp · 24 chromosomes'),
        actions: [
          {
            icon: 'open_in_new',
            label: 'View genome',
            route: '/genome/GCF_000001405.40',
            queryParams: null,
          },
          { icon: 'search', label: 'Search genes', route: '/gene/taxon/9606', queryParams: null },
        ],
      },
      {
        tone: 'plant',
        icon: 'local_florist',
        title: 'Arabidopsis thaliana',
        subtitle: assemblySubtitle(arabidopsis, 'TAIR10.1', 'GCF_000001735.4'),
        category: 'Plant model organism',
        detail: assemblyDetail(arabidopsis, '~119M bp · 5 chromosomes'),
        actions: [
          {
            icon: 'open_in_new',
            label: 'View genome',
            route: '/genome/GCF_000001735.4',
            queryParams: null,
          },
          { icon: 'search', label: 'Search genes', route: '/gene/taxon/3702', queryParams: null },
        ],
      },
      {
        tone: 'bacteria',
        icon: 'coronavirus',
        title: 'Bacterial genomes',
        subtitle: 'Browse representative bacterial assemblies',
        category: 'Multiple phyla',
        detail: 'Complete and draft assemblies',
        actions: [
          {
            icon: 'account_tree',
            label: 'Explore taxonomy',
            route: '/taxonomy/2',
            queryParams: null,
          },
          {
            icon: 'search',
            label: 'Search genes',
            route: '/gene/taxon/2',
            queryParams: null,
          },
        ],
      },
      {
        tone: 'research',
        icon: 'science',
        title: 'Microbial environment analysis',
        subtitle: 'Correlate G4 patterns with growth conditions',
        category: 'Temperature and pH',
        detail: 'Taxonomy-based strain selection',
        actions: [
          {
            icon: 'show_chart',
            label: 'Open research',
            route: '/research/microbial-environment-g4',
            queryParams: startingActionQueryParams({
              trait: 'growth_temperature',
              metric: 'g4_density_per_mb',
              rank: 'genus',
              taxon: 'Bacillus',
              run: 'true',
            }),
          },
          {
            icon: 'info',
            label: 'About this study',
            route: '/documentation',
            queryParams: startingActionQueryParams({ topic: 'microbial-environment' }),
          },
        ],
      },
    ];
  });

  formatCount(value: number): string {
    return formatCompactCount(value);
  }

  formatExactCount(value: number): string {
    return COUNT_FORMATTER.format(value);
  }

  canSubmitHeroSearch(): boolean {
    return this.heroSearchControl.value.trim().length > 0;
  }

  submitHeroSearch(event: Event): void {
    event.preventDefault();

    const navigation = homeSearchNavigation(
      this.heroTargetControl.value,
      this.heroSearchControl.value,
    );
    if (navigation === null) {
      return;
    }

    void this.router.navigate(navigation.commands, { queryParams: navigation.queryParams });
  }
}
