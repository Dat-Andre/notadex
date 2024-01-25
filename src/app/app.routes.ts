import { Routes } from '@angular/router';
import { OnboardComponent } from './onboard/onboard.component';
import { SwapInComponent } from './swap-in/swap-in.component';
import { SwapOutComponent } from './swap-out/swap-out.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'intents',
    pathMatch: 'full',
  },
  {
    path: 'intents',
    component: OnboardComponent,
    pathMatch: 'full',
  },
  {
    path: 'in',
    component: SwapInComponent,
    pathMatch: 'full',
  },
  {
    path: 'out',
    component: SwapOutComponent,
    pathMatch: 'full',
  },
];
