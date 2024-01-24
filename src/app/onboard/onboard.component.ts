import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { Router } from '@angular/router';
import { BlockUIModule } from 'primeng/blockui';

@Component({
  selector: 'app-onboard',
  standalone: true,
  imports: [CommonModule, CardModule, BlockUIModule],
  templateUrl: './onboard.component.html',
  styleUrl: './onboard.component.scss',
})
export class OnboardComponent {
  constructor(private router: Router) {}

  routeToSwapIn() {
    console.log('routeToSwapIn');
    this.router.navigateByUrl('/in');
  }
}
