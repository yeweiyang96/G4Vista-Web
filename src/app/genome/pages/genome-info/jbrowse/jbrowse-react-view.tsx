import { createViewState, JBrowseLinearGenomeView } from '@jbrowse/react-linear-genome-view2';
import makeWorkerInstance from '@jbrowse/react-linear-genome-view2/esm/makeWorkerInstance';
import { StrictMode, useEffect, useState } from 'react';
import { GenomeViewerConfig } from './genome-viewer-config.service';

type ViewState = ReturnType<typeof createViewState>;

export interface JBrowseReactViewProps {
  viewerConfig: GenomeViewerConfig;
  location?: string;
}

export function JBrowseReactView({ viewerConfig, location }: JBrowseReactViewProps) {
  const [viewState, setViewState] = useState<ViewState>();

  useEffect(() => {
    const nextState = createViewState({
      assembly: viewerConfig.assembly,
      tracks: viewerConfig.tracks,
      location,
      configuration: {
        rpc: {
          defaultDriver: 'WebWorkerRpcDriver',
        },
      },
      makeWorkerInstance,
    });

    viewerConfig.defaultVisibleTrackIds.forEach((trackId: string) => {
      nextState.session.view.showTrack(trackId);
    });

    setViewState(nextState);

    return () => {
      setViewState(undefined);
    };
  }, [viewerConfig, location]);

  useEffect(() => {
    if (!viewState || !location) {
      return;
    }

    viewState.session.view.navToLocString(location, viewerConfig.assembly.name);
  }, [location, viewState, viewerConfig.assembly.name]);

  if (!viewState) {
    return null;
  }

  return (
    <StrictMode>
      <JBrowseLinearGenomeView viewState={viewState} />
    </StrictMode>
  );
}
