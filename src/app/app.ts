import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { LogoComponent } from './logo/logo.component';
import { MatButtonModule } from '@angular/material/button';
import { MatIconRegistry, MatIconModule } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { HelpTourOverlay } from './help/help-tour-overlay/help-tour-overlay';
import { HelpTourService } from './help/help-tour';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

type ThemeMode = 'brightness_medium' | 'dark_mode' | 'light_mode';
const THEME_STORAGE_KEY = 'theme';

function isThemeMode(value: string | null): value is ThemeMode {
  return value === 'brightness_medium' || value === 'dark_mode' || value === 'light_mode';
}

function getNextTheme(current: ThemeMode): ThemeMode {
  if (current === 'brightness_medium') {
    return 'dark_mode';
  }
  if (current === 'dark_mode') {
    return 'light_mode';
  }
  return 'brightness_medium';
}

function routePath(url: string): string {
  return url.split('?')[0]?.split('#')[0] ?? url;
}

const FOOTER_HIDDEN_PATHS = new Set<string>([
  '/',
  '/gene',
  '/genome',
  '/help',
  '/research/microbial-environment-g4',
  '/taxonomy',
]);
const FOOTER_HIDDEN_PREFIXES = ['/gene/', '/genome/', '/taxonomy/'] as const;

function shouldShowFooter(url: string): boolean {
  const path = routePath(url);
  return (
    !FOOTER_HIDDEN_PATHS.has(path) &&
    !FOOTER_HIDDEN_PREFIXES.some((hiddenPrefix: string) => path.startsWith(hiddenPrefix))
  );
}

const GITHUB_ICON = `
<svg viewBox="0 0 20 20" class="github-logo" aria-hidden="true">
      <path
        d="M10 0C4.477 0 0 4.477 0 10c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V19c0 .27.16.59.67.5C17.14 18.16 20 14.42 20 10A10 10 0 0 0 10 0z"
        fill="currentColor"
        fill-rule="evenodd" />
    </svg>
`;
@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    LogoComponent,
    MatButtonModule,
    RouterLink,
    RouterLinkActive,
    MatIconModule,
    HelpTourOverlay,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  readonly title = 'G4Vista';
  readonly year = new Date().getFullYear();
  readonly sections = [
    { name: 'Taxonomy', route: '/taxonomy', icon: 'account_tree' },
    { name: 'Genome', route: '/genome', icon: 'biotech' },
    { name: 'Gene', route: '/gene', icon: 'search' },
    { name: 'Analysis', route: '/research/microbial-environment-g4', icon: 'query_stats' },
    { name: 'Help', route: '/help', icon: 'help_outline' },
  ];
  readonly theme = signal<ThemeMode>('brightness_medium');
  readonly helpTour = inject(HelpTourService);

  private readonly router = inject(Router);

  readonly currentUrl = signal(this.router.url);
  readonly showGuideHint = computed(() =>
    this.helpTour.shouldShowGuideHintForUrl(this.currentUrl()),
  );
  readonly showFooter = computed(() => shouldShowFooter(this.currentUrl()));

  private readonly iconRegistry = inject(MatIconRegistry);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly hasThemePreference = signal(false);

  constructor() {
    this.iconRegistry.addSvgIconLiteral(
      'github',
      this.sanitizer.bypassSecurityTrustHtml(GITHUB_ICON),
    );

    const savedTheme = this.readSavedTheme();
    if (savedTheme) {
      this.theme.set(savedTheme);
      this.hasThemePreference.set(true);
    }

    effect(() => {
      if (!this.hasThemePreference()) {
        return;
      }

      const currentTheme = this.theme();
      this.setTheme(currentTheme);
      this.saveTheme(currentTheme);
    });

    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe((event) => {
        this.currentUrl.set(event.urlAfterRedirects);
      });
  }

  toggleTheme(): void {
    this.theme.set(getNextTheme(this.theme()));
    this.hasThemePreference.set(true);
  }

  startGuideForCurrentPage(): void {
    this.helpTour.startWorkflowForUrl(this.currentUrl());
  }

  dismissHelpHint(): void {
    this.helpTour.dismissGuideHintForUrl(this.currentUrl());
  }

  private setTheme(theme: ThemeMode): void {
    if (typeof document === 'undefined') {
      return;
    }

    const root = document.documentElement;
    root.classList.remove('dark_mode', 'light_mode', 'brightness_medium');
    root.classList.add(theme);
  }

  private readSavedTheme(): ThemeMode | null {
    if (typeof window === 'undefined') {
      return null;
    }

    const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isThemeMode(savedTheme) ? savedTheme : null;
  }

  private saveTheme(theme: ThemeMode): void {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }
}
