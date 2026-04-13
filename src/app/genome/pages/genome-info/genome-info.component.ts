import { ChangeDetectionStrategy, Component, computed, effect, inject, input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { JbrowseHostComponent } from './jbrowse/jbrowse-host.component';
import { GenomeViewerStateService } from './jbrowse/genome-viewer-state.service';
import { GenomeViewerConfigService } from './jbrowse/genome-viewer-config.service';

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
  readonly locationControl = new FormControl('', { nonNullable: true });

  private readonly viewerState = inject(GenomeViewerStateService);
  private readonly genomeViewerConfigService = inject(GenomeViewerConfigService);

  readonly viewerConfig = computed(() =>
    this.genomeViewerConfigService.createViewerConfig(this.assemblyAccession()),
  );
  readonly assemblyName = computed(() => this.viewerState.assemblyName());
  readonly navCommand = this.viewerState.navCommand;

  constructor() {
    effect(() => {
      const config = this.viewerConfig();
      this.viewerState.resetSession(config.assembly.name, config.defaultRegion);
      this.viewerState.requestNavToLocation(config.defaultRegion);
      this.locationControl.setValue(config.defaultRegion);
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
    this.viewerState.resetSession(config.assembly.name, config.defaultRegion);
    this.locationControl.setValue(config.defaultRegion);
    this.viewerState.requestNavToLocation(config.defaultRegion);
  }
}
