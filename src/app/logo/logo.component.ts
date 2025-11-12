import { Component, HostBinding } from '@angular/core';

@Component({
  selector: 'app-logo',
  standalone: true,
  imports: [],
  templateUrl: './logo.component.html',
  styleUrl: './logo.component.scss',
})
export class LogoComponent {
  @HostBinding('attr.aria-hidden')
  ariaHidden = true;
}
