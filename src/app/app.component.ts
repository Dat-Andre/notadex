import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { Chain } from './skip';

import { InjectionToken } from '@angular/core';
import { WalletService } from './wallet.service';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { HeaderComponent } from './header/header.component';
import { FooterComponent } from './footer/footer.component';
import { SwUpdate } from '@angular/service-worker';
import { ConfirmationService } from 'primeng/api';

export const WINDOW = new InjectionToken<Window>('Global window object', {
  factory: () => window,
});

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    HeaderComponent,
    FooterComponent,
    ConfirmDialogModule,
  ],
  providers: [ConfirmationService, SwUpdate],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  title = 'many-to_many';
  log_result!: Chain[];

  constructor(
    public walletService: WalletService,
    private swUpdate: SwUpdate,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.swUpdate.versionUpdates.subscribe((event) => {
      if (event.type === 'VERSION_READY') {
        window.location.reload();
      }
    });
  }

  askForRefreash(event: Event) {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: 'There is a new version available. Would you like to update?',
      header: 'Update Available',
      icon: 'pi pi-exclamation-triangle',
      acceptIcon: 'none',
      rejectIcon: 'none',
      rejectButtonStyleClass: 'p-button-text',
      accept: () => {
        window.location.reload();
      },
      reject: () => {},
    });
  }
}
