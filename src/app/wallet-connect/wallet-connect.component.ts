import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WalletService } from '../wallet.service';
import { DialogModule } from 'primeng/dialog';
import { CardModule } from 'primeng/card';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-wallet-connect',
  standalone: true,
  imports: [CommonModule, DialogModule, CardModule],
  templateUrl: './wallet-connect.component.html',
  styleUrl: './wallet-connect.component.scss',
})
export class WalletConnectComponent {
  wallets_available!: string[];
  /*   @Output()
  selected_wallet = new EventEmitter<string>(); */
  visible: boolean = false;

  constructor(public walletService: WalletService, private http: HttpClient) {}

  showDialog() {
    this.visible = true;
  }

  connectWallet(walle_name: string) {
    this.visible = false;
    this.walletService.connectToWallet(walle_name);
  }
}
