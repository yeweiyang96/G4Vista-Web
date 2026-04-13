import { createViewState, JBrowseLinearGenomeView } from '@jbrowse/react-linear-genome-view2';
import { StrictMode, useEffect, useState } from 'react';
import { GenomeViewerConfig } from './genome-viewer-config.service';
import { GenomeNavCommand } from './genome-viewer-state.service';

type ViewState = ReturnType<typeof createViewState>;

export interface JBrowseReactViewProps {
  viewerConfig: GenomeViewerConfig;
  navigationCommand?: GenomeNavCommand | null;
}

export function JBrowseReactView({ viewerConfig, navigationCommand }: JBrowseReactViewProps) {
  const [viewState] = useState<ViewState>(() => createViewState({ ...viewerConfig }));

  useEffect(() => {
    if (!navigationCommand) {
      return;
    }

    viewState.session.view.navToLocString(
      navigationCommand.location,
      navigationCommand.assemblyName,
    );
  }, [navigationCommand, viewState]);

  return (
    <StrictMode>
      <JBrowseLinearGenomeView viewState={viewState} />
    </StrictMode>
  );
}
