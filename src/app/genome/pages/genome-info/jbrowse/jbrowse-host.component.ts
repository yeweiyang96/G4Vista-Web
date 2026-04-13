import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { createElement } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { JBrowseReactView } from './jbrowse-react-view';
import { GenomeViewerConfig } from './genome-viewer-config.service';
import { GenomeNavCommand } from './genome-viewer-state.service';

@Component({
  selector: 'app-jbrowse-host',
  templateUrl: './jbrowse-host.component.html',
  styleUrl: './jbrowse-host.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JbrowseHostComponent implements AfterViewInit, OnChanges, OnDestroy {
  readonly viewerConfig = input.required<GenomeViewerConfig>();
  readonly navigationCommand = input<GenomeNavCommand | null>(null);

  @ViewChild('container', { static: true })
  private readonly containerRef!: ElementRef<HTMLDivElement>;

  private root?: Root;

  ngAfterViewInit(): void {
    this.renderReactTree();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['viewerConfig'] || changes['navigationCommand']) && this.root) {
      this.renderReactTree();
    }
  }

  ngOnDestroy(): void {
    this.root?.unmount();
    this.root = undefined;
  }

  private renderReactTree(): void {
    if (!this.root) {
      this.root = createRoot(this.containerRef.nativeElement);
    }

    const viewerConfig = this.viewerConfig();

    this.root.render(
      createElement(JBrowseReactView, {
        key: viewerConfig.assembly.name,
        viewerConfig,
        navigationCommand: this.navigationCommand() ?? undefined,
      }),
    );
  }
}
