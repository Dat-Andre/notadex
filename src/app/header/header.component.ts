import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { WalletService } from '../wallet.service';
import { WalletConnectComponent } from '../wallet-connect/wallet-connect.component';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, ButtonModule, WalletConnectComponent, ToastModule],
  providers: [MessageService],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent implements OnInit {
  formatedWalletAddress: string = '';
  walletAddress: string = '';
  JUNO_CHAIN_ID = 'juno-1';
  @ViewChild(WalletConnectComponent) walletConnect!: WalletConnectComponent;
  constructor(
    public walletService: WalletService,
    private messageService: MessageService,
    private route: ActivatedRoute
  ) {}
  ngOnInit(): void {
    this.route.url.subscribe(console.log);
    this.walletService.walletConnected.subscribe(async (val) => {
      if (val) {
        const address = await this.walletService.getAddressForChain(
          this.JUNO_CHAIN_ID
        );
        this.formatedWalletAddress =
          address.slice(0, 6) + '...' + address.slice(-6);
        this.walletAddress = address;
      } else {
        this.walletAddress = '';
        this.formatedWalletAddress = '';
      }
    });
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
}
