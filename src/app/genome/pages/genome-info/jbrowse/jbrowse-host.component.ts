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

@Component({
  selector: 'app-jbrowse-host',
  templateUrl: './jbrowse-host.component.html',
  styleUrl: './jbrowse-host.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JbrowseHostComponent implements AfterViewInit, OnChanges, OnDestroy {
  readonly viewerConfig = input.required<GenomeViewerConfig>();
  readonly location = input<string>('NC_000001.11:1..100000');

  @ViewChild('container', { static: true })
  private readonly containerRef!: ElementRef<HTMLDivElement>;

  private root?: Root;

  ngAfterViewInit(): void {
    this.renderReactTree();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['viewerConfig'] || changes['location']) && this.root) {
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

    this.root.render(
      createElement(JBrowseReactView, {
        viewerConfig: this.viewerConfig(),
        location: this.location() || undefined,
      }),
    );
  }
}
