import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LogoComponent } from './logo/logo.component';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconRegistry, MatIconModule } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
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
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App implements OnInit {
  title = 'G4Vista';
  year = new Date().getFullYear();
  sections = [
    { name: 'Taxonomy', route: '/taxonomy' },
    { name: 'Genome', route: '/genome' },
    { name: 'Gene', route: '/gene' },
    { name: 'Environment', route: '/environment' },
  ];
  theme: 'brightness_medium' | 'dark_mode' | 'light_mode' = 'brightness_medium';

  constructor() {
    const iconRegistry = inject(MatIconRegistry);
    const sanitizer = inject(DomSanitizer);
    iconRegistry.addSvgIconLiteral('github', sanitizer.bypassSecurityTrustHtml(GITHUB_ICON));
  }

  ngOnInit() {
    const savedTheme = localStorage.getItem('theme') as
      | 'brightness_medium'
      | 'dark_mode'
      | 'light_mode';
    if (savedTheme) {
      this.theme = savedTheme;
      this.setTheme(this.theme);
    }
  }
  toggleTheme() {
    if (this.theme === 'brightness_medium') {
      this.theme = 'dark_mode';
    } else if (this.theme === 'dark_mode') {
      this.theme = 'light_mode';
    } else {
      this.theme = 'brightness_medium';
    }
    localStorage.setItem('theme', this.theme);
    this.setTheme(this.theme);
  }
  setTheme(theme: 'brightness_medium' | 'dark_mode' | 'light_mode') {
    const root = document.documentElement;
    root.classList.remove('dark_mode', 'light_mode', 'brightness_medium');
    root.classList.add(theme);
  }
}
