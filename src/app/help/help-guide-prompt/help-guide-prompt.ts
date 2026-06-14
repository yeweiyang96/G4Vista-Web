import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HelpTourService } from '../help-tour';
import {
  getHelpTour,
  getOptionalHelpWorkflowIdForUrl,
  normalizeHelpRoutePath,
} from '../help-content';

interface HelpGuidePromptViewModel {
  readonly icon: string;
  readonly label: string;
  readonly routePath: string;
}

export class HelpGuidePromptStateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'HelpGuidePromptStateError';
  }
}

const STORAGE_KEY_PREFIX = 'g4vista.helpGuidePrompt.dismissed:';

function createStorageKey(routePath: string): string {
  return `${STORAGE_KEY_PREFIX}${encodeURIComponent(routePath)}`;
}

function canUseLocalStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function isPromptDismissed(routePath: string): boolean {
  if (!canUseLocalStorage()) {
    return false;
  }

  return window.localStorage.getItem(createStorageKey(routePath)) === 'true';
}

function markPromptDismissed(routePath: string): void {
  if (!canUseLocalStorage()) {
    throw new HelpGuidePromptStateError('Cannot persist the guide prompt dismissal outside a browser.');
  }

  window.localStorage.setItem(createStorageKey(routePath), 'true');
}

@Component({
  selector: 'app-help-guide-prompt',
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './help-guide-prompt.html',
  styleUrl: './help-guide-prompt.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HelpGuidePrompt {
  private readonly router = inject(Router);
  private readonly helpTour = inject(HelpTourService);
  private readonly dismissedRoutePaths = signal<readonly string[]>([]);

  readonly currentUrl = signal(this.router.url);
  readonly guidePrompt = computed<HelpGuidePromptViewModel | null>(() => {
    const routePath = normalizeHelpRoutePath(this.currentUrl());
    const workflowId = getOptionalHelpWorkflowIdForUrl(routePath);

    if (workflowId === null || this.helpTour.session() !== null) {
      return null;
    }
    if (this.dismissedRoutePaths().includes(routePath) || isPromptDismissed(routePath)) {
      return null;
    }

    const tour = getHelpTour(workflowId);
    return {
      icon: tour.steps[0]?.icon ?? 'help_outline',
      label: tour.label,
      routePath,
    };
  });

  constructor() {
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe((event) => {
        this.currentUrl.set(event.urlAfterRedirects);
      });
  }

  startGuide(): void {
    const prompt = this.getRequiredPrompt();
    this.helpTour.startWorkflowForUrl(prompt.routePath);
  }

  dismissPrompt(): void {
    const prompt = this.getRequiredPrompt();
    markPromptDismissed(prompt.routePath);
    this.dismissedRoutePaths.set([...this.dismissedRoutePaths(), prompt.routePath]);
  }

  private getRequiredPrompt(): HelpGuidePromptViewModel {
    const prompt = this.guidePrompt();
    if (prompt === null) {
      throw new HelpGuidePromptStateError('No help guide prompt is available for this route.');
    }

    return prompt;
  }
}
