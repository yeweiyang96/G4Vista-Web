import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Router } from '@angular/router';

@Component({
  selector: 'app-genome',
  imports: [
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
  ],
  templateUrl: './genome-home.component.html',
  styleUrl: './genome-home.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GenomeHomeComponent {
  readonly assemblyAccessionControl = new FormControl('', { nonNullable: true });
  private readonly router = inject(Router);

  openGenome(): void {
    const assemblyAccession = this.assemblyAccessionControl.value.trim();
    if (!assemblyAccession) {
      return;
    }
    void this.router.navigate(['/genome', assemblyAccession]);
  }
}
