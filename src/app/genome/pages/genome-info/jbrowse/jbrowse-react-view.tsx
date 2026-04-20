import { createViewState, JBrowseLinearGenomeView } from '@jbrowse/react-linear-genome-view2';
import { useEffect, useRef, useState } from 'react';
import { GenomeViewerConfig } from './genome-viewer-config.service';
import { GenomeNavCommand } from './genome-viewer-state.service';

type ViewState = ReturnType<typeof createViewState>;

function makeWorkerInstance(): Worker {
  return new Worker(new URL('./jbrowse-rpc.worker.ts', import.meta.url), { type: 'module' });
}

export interface JBrowseReactViewProps {
  viewerConfig: GenomeViewerConfig;
  navigationCommand?: GenomeNavCommand | null;
  onRegionChange?: (region: string) => void;
}

function primaryVisibleRegion(view: unknown): string | null {
  try {
    const candidate = view as {
      visibleLocStrings?: string[];
      coarseVisibleLocStrings?: string[];
    };

    if (candidate.visibleLocStrings?.length) {
      return candidate.visibleLocStrings[0];
    }
    if (candidate.coarseVisibleLocStrings?.length) {
      return candidate.coarseVisibleLocStrings[0];
    }
    return null;
  } catch {
    return null;
  }
}

export function JBrowseReactView({
  viewerConfig,
  navigationCommand,
  onRegionChange,
}: JBrowseReactViewProps) {
  const onRegionChangeRef = useRef<JBrowseReactViewProps['onRegionChange']>(onRegionChange);
  const lastReportedRegionRef = useRef<string | null>(null);
  const [viewState] = useState<ViewState>(() => {
    let currentViewState: ViewState;
    const notifyRegionChange = () => {
      const region = primaryVisibleRegion((currentViewState.session.view as unknown) ?? null);
      if (!region || region === lastReportedRegionRef.current) {
        return;
      }
      lastReportedRegionRef.current = region;
      onRegionChangeRef.current?.(region);
    };

    currentViewState = createViewState({
      ...viewerConfig,
      makeWorkerInstance,
      onChange: () => {
        queueMicrotask(notifyRegionChange);
      },
    });
    queueMicrotask(notifyRegionChange);
    return currentViewState;
  });

  useEffect(() => {
    onRegionChangeRef.current = onRegionChange;
  }, [onRegionChange]);

  useEffect(() => {
    for (const trackId of viewerConfig.defaultVisibleTrackIds) {
      viewState.session.view.showTrack(trackId);
    }
  }, [viewerConfig.defaultVisibleTrackIds, viewState]);

  useEffect(() => {
    if (!navigationCommand) {
      return;
    }

    viewState.session.view.navToLocString(
      navigationCommand.location,
      navigationCommand.assemblyName,
    );
  }, [navigationCommand, viewState]);

  return <JBrowseLinearGenomeView viewState={viewState} />;
}
