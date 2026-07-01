import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { LogoComponent } from './logo/logo.component';
import { HelpGuidePrompt } from './help/help-guide-prompt/help-guide-prompt';
import { HelpTourOverlay } from './help/help-tour-overlay/help-tour-overlay';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

type ThemeMode = 'brightness_medium' | 'dark_mode' | 'light_mode';
interface NavigationSection {
  readonly name: string;
  readonly route: string;
  readonly icon: string;
}

interface FooterExternalLink {
  readonly label: string;
  readonly url: string;
}

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
  '/gene',
  '/genome',
  '/documentation',
  '/download',
  '/research/microbial-environment-g4',
  '/taxonomy',
]);
const FOOTER_HIDDEN_PREFIXES = ['/gene/', '/genome/', '/taxonomy/'] as const;
const NAVIGATION_SECTIONS: readonly NavigationSection[] = [
  { name: 'Genome', route: '/genome', icon: 'biotech' },
  { name: 'Gene', route: '/gene', icon: 'search' },
  { name: 'Analysis', route: '/research/microbial-environment-g4', icon: 'query_stats' },
  { name: 'Download', route: '/download', icon: 'archive' },
  { name: 'Taxonomy', route: '/taxonomy', icon: 'account_tree' },
  { name: 'Documentation', route: '/documentation', icon: 'menu_book' },
];
const MEDICAL_AI_CENTER_LINK: FooterExternalLink = {
  label: 'Medical AI Center, Niigata University School of Medicine',
  url: 'https://bioinfo.med.niigata-u.ac.jp/?lang=en',
};

function shouldShowFooter(url: string): boolean {
  const path = routePath(url);
  return (
    !FOOTER_HIDDEN_PATHS.has(path) &&
    !FOOTER_HIDDEN_PREFIXES.some((hiddenPrefix: string) => path.startsWith(hiddenPrefix))
  );
}

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    LogoComponent,
    RouterLink,
    RouterLinkActive,
    HelpGuidePrompt,
    HelpTourOverlay,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  readonly title = 'G4ViSTA';
  readonly year = new Date().getFullYear();
  readonly sections = NAVIGATION_SECTIONS;
  readonly medicalAiCenterLink = MEDICAL_AI_CENTER_LINK;
  readonly theme = signal<ThemeMode>('brightness_medium');

  private readonly router = inject(Router);

  readonly currentUrl = signal(this.router.url);
  readonly showFooter = computed(() => shouldShowFooter(this.currentUrl()));

  private readonly hasThemePreference = signal(false);

  constructor() {
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
