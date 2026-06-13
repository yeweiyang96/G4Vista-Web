import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { A11yModule } from '@angular/cdk/a11y';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { HelpTourService } from '../help-tour';
import { TourStep, normalizeHelpRoutePath } from '../help-content';

interface HelpTargetRect {
  readonly top: number;
  readonly left: number;
  readonly width: number;
  readonly height: number;
}

interface HelpViewportSize {
  readonly width: number;
  readonly height: number;
}

interface PanelPosition {
  readonly top: number;
  readonly left: number;
  readonly width: number;
}

export class HelpTourNavigationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'HelpTourNavigationError';
  }
}

const PANEL_MAX_WIDTH = 390;
const PANEL_MARGIN = 18;
const HIGHLIGHT_PADDING = 8;

function getViewportSize(): HelpViewportSize {
  if (typeof window === 'undefined') {
    return { width: 1024, height: 768 };
  }

  return { width: window.innerWidth, height: window.innerHeight };
}

function clampPanelPosition(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function createTargetRect(element: Element): HelpTargetRect {
  const rect = element.getBoundingClientRect();
  return {
    top: Math.max(rect.top - HIGHLIGHT_PADDING, HIGHLIGHT_PADDING),
    left: Math.max(rect.left - HIGHLIGHT_PADDING, HIGHLIGHT_PADDING),
    width: rect.width + HIGHLIGHT_PADDING * 2,
    height: rect.height + HIGHLIGHT_PADDING * 2,
  };
}

function findVisibleElement(selector: string): Element | null {
  if (typeof document === 'undefined') {
    return null;
  }

  const elements = Array.from(document.querySelectorAll(selector));
  return (
    elements.find((element) => {
      const rect = element.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    }) ?? null
  );
}

function calculatePanelPosition(
  targetRect: HelpTargetRect | null,
  viewport: HelpViewportSize,
): PanelPosition {
  const width = Math.min(PANEL_MAX_WIDTH, viewport.width - PANEL_MARGIN * 2);
  if (targetRect === null) {
    return {
      top: Math.max((viewport.height - 260) / 2, PANEL_MARGIN),
      left: Math.max((viewport.width - width) / 2, PANEL_MARGIN),
      width,
    };
  }

  const preferredTop = targetRect.top + targetRect.height + PANEL_MARGIN;
  const top =
    preferredTop + 260 <= viewport.height
      ? preferredTop
      : Math.max(targetRect.top - 260 - PANEL_MARGIN, PANEL_MARGIN);
  const centeredLeft = targetRect.left + targetRect.width / 2 - width / 2;
  const maxLeft = viewport.width - width - PANEL_MARGIN;

  return {
    top,
    left: clampPanelPosition(centeredLeft, PANEL_MARGIN, maxLeft),
    width,
  };
}

@Component({
  selector: 'app-help-tour-overlay',
  imports: [A11yModule, MatButtonModule, MatIconModule],
  templateUrl: './help-tour-overlay.html',
  styleUrl: './help-tour-overlay.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HelpTourOverlay {
  private readonly router = inject(Router);
  readonly helpTour = inject(HelpTourService);
  readonly targetRect = signal<HelpTargetRect | null>(null);
  readonly viewportSize = signal(getViewportSize());
  readonly panelPosition = computed(() =>
    calculatePanelPosition(this.targetRect(), this.viewportSize()),
  );
  readonly progressLabel = computed(() => `${this.helpTour.currentStepIndex() + 1}`);
  readonly highlightVisible = computed(() => this.targetRect() !== null);

  constructor() {
    effect(() => {
      const step = this.helpTour.currentStep();
      if (step === null) {
        this.targetRect.set(null);
        return;
      }

      this.syncStepRoute(step);
    });
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.viewportSize.set(getViewportSize());
    this.queueTargetUpdate();
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    this.queueTargetUpdate();
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    this.helpTour.closeTour();
  }

  nextStep(): void {
    this.helpTour.nextStep();
  }

  previousStep(): void {
    this.helpTour.previousStep();
  }

  closeTour(): void {
    this.helpTour.closeTour();
  }

  private syncStepRoute(step: TourStep): void {
    const expectedPath = normalizeHelpRoutePath(step.route);
    const currentPath = normalizeHelpRoutePath(this.router.url);

    if (currentPath === expectedPath) {
      this.queueTargetUpdate();
      return;
    }

    void this.router.navigateByUrl(step.route).then((navigated) => {
      const nextPath = normalizeHelpRoutePath(this.router.url);
      if (!navigated && nextPath !== expectedPath) {
        throw new HelpTourNavigationError(`Help tour could not navigate to "${step.route}".`);
      }

      this.queueTargetUpdate();
    });
  }

  private queueTargetUpdate(): void {
    if (typeof window === 'undefined') {
      return;
    }

    window.requestAnimationFrame(() => {
      this.scrollTargetIntoView();
      window.requestAnimationFrame(() => {
        this.viewportSize.set(getViewportSize());
        this.targetRect.set(this.resolveCurrentTargetRect());
      });
    });
  }

  private scrollTargetIntoView(): void {
    const selector = this.helpTour.currentStep()?.targetSelector ?? null;
    if (selector === null || typeof document === 'undefined') {
      return;
    }

    const element = findVisibleElement(selector);
    if (element === null) {
      return;
    }

    element.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'smooth' });
  }

  private resolveCurrentTargetRect(): HelpTargetRect | null {
    const selector = this.helpTour.currentStep()?.targetSelector ?? null;
    if (selector === null || typeof document === 'undefined') {
      return null;
    }

    const element = findVisibleElement(selector);
    return element === null ? null : createTargetRect(element);
  }
}
