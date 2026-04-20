import { DOCUMENT } from '@angular/common';
import { inject, Injectable, OnDestroy, signal } from '@angular/core';

export type UiThemeMode = 'light' | 'dark';

function resolveThemeMode(documentRef: Document | null): UiThemeMode {
  if (!documentRef?.documentElement) {
    return 'light';
  }

  const classList = documentRef.documentElement.classList;
  if (classList.contains('dark_mode')) {
    return 'dark';
  }
  if (classList.contains('light_mode')) {
    return 'light';
  }

  if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
}

@Injectable({
  providedIn: 'root',
})
export class UiThemeService implements OnDestroy {
  readonly resolvedMode = signal<UiThemeMode>('light');

  private readonly documentRef = inject(DOCUMENT, { optional: true });
  private readonly mediaListener = () => {
    this.refreshResolvedMode();
  };
  private classObserver?: MutationObserver;
  private mediaQueryList?: MediaQueryList;

  constructor() {
    this.refreshResolvedMode();

    if (typeof window === 'undefined' || !this.documentRef?.documentElement) {
      return;
    }

    this.classObserver = new MutationObserver(() => {
      this.refreshResolvedMode();
    });
    this.classObserver.observe(this.documentRef.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    this.mediaQueryList = window.matchMedia('(prefers-color-scheme: dark)');
    this.mediaQueryList.addEventListener('change', this.mediaListener);
  }

  ngOnDestroy(): void {
    this.classObserver?.disconnect();
    this.classObserver = undefined;

    this.mediaQueryList?.removeEventListener('change', this.mediaListener);
    this.mediaQueryList = undefined;
  }

  private refreshResolvedMode(): void {
    this.resolvedMode.set(resolveThemeMode(this.documentRef ?? null));
  }
}
