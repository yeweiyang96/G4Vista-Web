import { ChangeDetectionStrategy, Component, computed, effect, inject, input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { signal } from '@angular/core';
import { JbrowseHostComponent } from './jbrowse/jbrowse-host.component';
import { GenomeViewerStateService } from './jbrowse/genome-viewer-state.service';
import {
  GenomeViewerConfigParams,
  GenomeViewerConfigService,
} from './jbrowse/genome-viewer-config.service';

@Component({
  selector: 'app-genome-info',
  imports: [
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    JbrowseHostComponent,
  ],
  templateUrl: './genome-info.component.html',
  styleUrl: './genome-info.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GenomeInfoComponent {
  readonly assemblyAccession = input.required<string>();
  readonly dataBaseUrl = input.required<string>();
  readonly locationControl = new FormControl('', { nonNullable: true });

  private readonly viewerState = inject(GenomeViewerStateService);
  private readonly genomeViewerConfigService = inject(GenomeViewerConfigService);
  private readonly defaultRegionSignal = signal('1..1000');

  readonly viewerConfigParams = computed<GenomeViewerConfigParams>(() => ({
    assemblyAccession: this.assemblyAccession(),
    dataBaseUrl: this.dataBaseUrl(),
  }));
  readonly viewerConfig = computed(() =>
    this.genomeViewerConfigService.createViewerConfig(this.viewerConfigParams()),
  );
  readonly assemblyName = computed(() => this.viewerState.assemblyName());
  readonly navCommand = this.viewerState.navCommand;

  constructor() {
    effect((onCleanup) => {
      const config = this.viewerConfig();
      const fallbackRegion = '1..1000';
      this.defaultRegionSignal.set(fallbackRegion);
      this.viewerState.resetSession(config.assembly.name, fallbackRegion);
      this.locationControl.setValue(fallbackRegion);

      const subscription = this.genomeViewerConfigService
        .resolveDefaultRegion(this.viewerConfigParams())
        .subscribe((resolvedDefaultRegion) => {
          this.defaultRegionSignal.set(resolvedDefaultRegion);
          this.viewerState.resetSession(config.assembly.name, resolvedDefaultRegion);
          this.locationControl.setValue(resolvedDefaultRegion);
          this.viewerState.requestNavToLocation(resolvedDefaultRegion);
        });

      onCleanup(() => {
        subscription.unsubscribe();
      });
    });
  }

  applyLocation(): void {
    this.viewerState.requestNavToLocation(this.locationControl.value);
  }

  jumpToPresetRegion(region: string): void {
    this.locationControl.setValue(region);
    this.viewerState.requestNavToLocation(region);
  }

  resetSession(): void {
    const config = this.viewerConfig();
    const defaultRegion = this.defaultRegionSignal();
    this.viewerState.resetSession(config.assembly.name, defaultRegion);
    this.locationControl.setValue(defaultRegion);
    this.viewerState.requestNavToLocation(defaultRegion);
  }
}
