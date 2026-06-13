import { Injectable, computed, signal } from '@angular/core';
import {
  HelpTourConfigurationError,
  HelpTourDefinition,
  HelpWorkflowId,
  TourStep,
  getHelpTour,
  getHelpWorkflowIdForUrl,
  getOptionalHelpWorkflowIdForUrl,
  normalizeHelpRoutePath,
} from './help-content';

export interface HelpTourSession {
  readonly workflowId: HelpWorkflowId;
  readonly label: string;
  readonly stepIndex: number;
  readonly steps: readonly TourStep[];
}

function createTourSession(tour: HelpTourDefinition): HelpTourSession {
  return {
    workflowId: tour.id,
    label: tour.label,
    stepIndex: 0,
    steps: tour.steps,
  };
}

function createTourSessionWithStep(session: HelpTourSession, stepIndex: number): HelpTourSession {
  return {
    workflowId: session.workflowId,
    label: session.label,
    stepIndex,
    steps: session.steps,
  };
}

@Injectable({
  providedIn: 'root',
})
export class HelpTourService {
  private readonly activeSession = signal<HelpTourSession | null>(null);
  private readonly dismissedHintRoutes = signal<readonly string[]>([]);

  readonly session = this.activeSession.asReadonly();
  readonly currentStep = computed<TourStep | null>(() => {
    const session = this.activeSession();
    if (session === null) {
      return null;
    }

    return session.steps[session.stepIndex] ?? null;
  });
  readonly currentStepIndex = computed(() => this.activeSession()?.stepIndex ?? 0);
  readonly stepCount = computed(() => this.activeSession()?.steps.length ?? 0);
  readonly canGoBack = computed(() => this.currentStepIndex() > 0);

  shouldShowGuideHintForUrl(url: string): boolean {
    const routePath = normalizeHelpRoutePath(url);
    return (
      this.activeSession() === null &&
      getOptionalHelpWorkflowIdForUrl(routePath) !== null &&
      !this.dismissedHintRoutes().includes(routePath)
    );
  }

  startWorkflow(workflowId: HelpWorkflowId): void {
    const tour = getHelpTour(workflowId);
    this.activeSession.set(createTourSession(tour));
  }

  startWorkflowForUrl(url: string): void {
    this.startWorkflow(getHelpWorkflowIdForUrl(url));
  }

  dismissGuideHintForUrl(url: string): void {
    const routePath = normalizeHelpRoutePath(url);
    if (getOptionalHelpWorkflowIdForUrl(routePath) === null) {
      return;
    }
    if (this.dismissedHintRoutes().includes(routePath)) {
      return;
    }

    this.dismissedHintRoutes.set([...this.dismissedHintRoutes(), routePath]);
  }

  nextStep(): void {
    const session = this.getRequiredSession();
    const nextStepIndex = session.stepIndex + 1;

    if (nextStepIndex >= session.steps.length) {
      this.closeTour();
      return;
    }

    this.activeSession.set(createTourSessionWithStep(session, nextStepIndex));
  }

  previousStep(): void {
    const session = this.getRequiredSession();
    const previousStepIndex = session.stepIndex - 1;

    if (previousStepIndex < 0) {
      throw new HelpTourConfigurationError('Cannot move before the first help tour step.');
    }

    this.activeSession.set(createTourSessionWithStep(session, previousStepIndex));
  }

  closeTour(): void {
    this.activeSession.set(null);
  }

  private getRequiredSession(): HelpTourSession {
    const session = this.activeSession();
    if (session === null) {
      throw new HelpTourConfigurationError('No active help tour is available.');
    }

    return session;
  }
}
