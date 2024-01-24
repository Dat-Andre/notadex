import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { SkipService } from './skip.service';
import { ButtonModule } from 'primeng/button';
import {
  Asset,
  Chain,
  FungibleAssets,
  RequestMessages,
  SwapTransferRouteSummary,
} from './skip';
import { map, of, switchMap, tap } from 'rxjs';
import {
  MsgTransferEncodeObject,
  SigningStargateClient,
} from '@cosmjs/stargate';
import { GasPrice } from '@cosmjs/stargate';
import { InjectionToken } from '@angular/core';
import { WalletService } from './wallet.service';
import { Buffer } from 'buffer';
import * as chainRegistry from 'chain-registry';
import { SigningCosmWasmClient } from '@cosmjs/cosmwasm-stargate';
import { HeaderComponent } from './header/header.component';
import { Footer } from 'primeng/api';
import { FooterComponent } from './footer/footer.component';

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
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  title = 'many-to_many';
  log_result!: Chain[];

  constructor(
    private skip_service: SkipService,
    public walletService: WalletService
  ) {}

  async ngOnInit(): Promise<void> {}
}
