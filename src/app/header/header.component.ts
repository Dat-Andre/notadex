import { Component, HostListener, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { WalletService } from '../wallet.service';
import { WalletConnectComponent } from '../wallet-connect/wallet-connect.component';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { NavigationEnd, Router } from '@angular/router';
import { filter, map } from 'rxjs';
import { DialogModule } from 'primeng/dialog';
import { LogsService } from '../logs.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    WalletConnectComponent,
    ToastModule,
    DialogModule,
  ],
  providers: [MessageService],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent implements OnInit {
  verReceitas = false;
  formatedWalletAddress: string = '';
  walletAddress: string = '';
  JUNO_CHAIN_ID = 'juno-1';
  homeSeverity: string = 'primary';
  inSeverity: string = 'success';
  outSeverity: string = 'success';
  @ViewChild(WalletConnectComponent) walletConnect!: WalletConnectComponent;

  private sub = this.router.events
    .pipe(
      filter((event) => event instanceof NavigationEnd),
      map((event) => event as NavigationEnd) // appease typescript
      /* filter(event => event.url !== '/employees') */
    )
    .subscribe((event) => this.applySeverityLevelToNav(event));

  @HostListener('window:keplr_keystorechange', ['$event'])
  @HostListener('window:leap_keystorechange', ['$event'])
  onKeyStoreChange(event: any) {
    if (
      (this.walletService.wallet_primary_name === 'keplr' &&
        event.type === 'keplr_keystorechange') ||
      (this.walletService.wallet_primary_name === 'leap' &&
        event.type === 'leap_keystorechange')
    ) {
      this.reloadAfterWalletConnectionOrAccountChange();
    }
  }

  constructor(
    public walletService: WalletService,
    private messageService: MessageService,
    private router: Router
  ) {}
  ngOnInit(): void {
    this.walletService.walletConnected.subscribe(async (val) => {
      if (val) {
        this.reloadAfterWalletConnectionOrAccountChange();
      } else {
        this.walletAddress = '';
        this.formatedWalletAddress = '';
      }
    });
  }

  async reloadAfterWalletConnectionOrAccountChange() {
    const address = await this.walletService.getAddressForChain(
      this.JUNO_CHAIN_ID
    );
    this.formatedWalletAddress =
      address.slice(0, 6) + '...' + address.slice(-6);
    this.walletAddress = address;
  }

  applySeverityLevelToNav(event: NavigationEnd) {
    if (event.urlAfterRedirects === '/intents') {
      this.homeSeverity = 'primary';
      this.inSeverity = 'success';
      this.outSeverity = 'success';
    } else if (event.urlAfterRedirects === '/in') {
      this.homeSeverity = 'success';
      this.inSeverity = 'primary';
      this.outSeverity = 'success';
    } else if (event.urlAfterRedirects === '/out') {
      this.homeSeverity = 'success';
      this.inSeverity = 'success';
      this.outSeverity = 'primary';
    }
  }

  callWalletConnect() {
    this.walletConnect.showDialog();
  }

  addToClipboard(text: string) {
    navigator.clipboard.writeText(text).then(
      () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Copied to clipboard',
          detail: text,
          life: 3000,
        });
      },
      () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Something went wrong',
          detail: 'Try again',
          life: 3000,
        });
      }
    );
  }

  routeToSwapIn() {
    console.log('routeToSwapIn');
    this.router.navigateByUrl('/in');
  }

  routeToSwapOut() {
    console.log('routeToSwapOut');
    this.router.navigateByUrl('/out');
  }

  routeToIntents() {
    console.log('routeToIntents');
    this.router.navigateByUrl('/intents');
  }

  openReceitas() {}
}
