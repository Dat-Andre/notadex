import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { Router } from '@angular/router';
import { BlockUIModule } from 'primeng/blockui';
import { SidebarModule } from 'primeng/sidebar';

@Component({
  selector: 'app-onboard',
  standalone: true,
  imports: [CommonModule, CardModule, BlockUIModule, SidebarModule],
  templateUrl: './onboard.component.html',
  styleUrl: './onboard.component.scss',
})
export class OnboardComponent {
  eternalFight = false;
  friends = false;
  showeternalFightbtn = false;
  constructor(private router: Router) {}

  routeToSwapIn() {
    /* console.log('routeToSwapIn'); */
    this.router.navigateByUrl('/in');
  }

  routeToSwapOut() {
    /* console.log('routeToSwapOut'); */
    this.router.navigateByUrl('/out');
  }

  routeToIntents() {
    /* console.log('routeToIntents'); */
    this.router.navigateByUrl('/intents');
  }

  navigateToLink() {
    window.open('https://skip.money/', '_blank');
  }
}
