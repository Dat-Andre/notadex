import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InputTextModule } from 'primeng/inputtext';
import { Asset, Chain, StatusInformation } from '../skip';
import { ChainsFilterPipe } from '../shared/chains-filter.pipe';
import { DenomsFilterPipe } from '../shared/denoms-filter.pipe';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Coin, StargateClient } from '@cosmjs/stargate';
import * as ChainRegistry from 'chain-registry';
import { MessageService } from 'primeng/api';
import { WalletService } from '../wallet.service';

@Component({
  selector: 'app-trade-parameters-selection',
  standalone: true,
  imports: [CommonModule, InputTextModule, FormsModule, ReactiveFormsModule],
  providers: [ChainsFilterPipe, DenomsFilterPipe, MessageService],
  templateUrl: './trade-parameters-selection.component.html',
  styleUrl: './trade-parameters-selection.component.scss',
})
export class TradeParametersSelectionComponent implements OnInit {
  private _searchText: string = '';

  get searchText(): string {
    return this._searchText;
  }
  set searchText(val: string) {
    this._searchText = val;
    this.searchTextEvent.emit(this._searchText);
  }

  private _statusInformation: StatusInformation | undefined;
  public get statusInformation(): StatusInformation | undefined {
    return this._statusInformation;
  }
  @Input()
  public set statusInformation(value: StatusInformation | undefined) {
    this._statusInformation = value;
    /* console.log('_statusInformation: ', value);
    console.log('selectedOriginChain: ', this.selectedOriginChain);
    console.log('selectedExitChain: ', this.selectedExitChain); */
    if (
      value &&
      (value?.state === 'STATE_COMPLETED_SUCCESS' ||
        value?.state === 'STATE_COMPLETED_ERROR') &&
      this.selectedOriginChain
    ) {
      this.wallet_service
        .getAddressForChain(this.selectedOriginChain.chain_id)
        .then((address) => {
          if (!this.selectedOriginChain || !this.selectedSourceDenom) return;
          this.getBalance(
            this.selectedOriginChain.chain_id,
            address,
            this.selectedSourceDenom
          );
        });
    }
    console.log(!this.selectedExitChain, !this.selectedExitDenom);
    if (
      value &&
      (value?.state === 'STATE_COMPLETED_SUCCESS' ||
        value?.state === 'STATE_COMPLETED_ERROR') &&
      this.selectedExitChain
    ) {
      this.wallet_service
        .getAddressForChain(this.selectedExitChain.chain_id)
        .then((address) => {
          if (!this.selectedExitChain || !this.selectedExitDenom) return;
          this.getBalance(
            this.selectedExitChain.chain_id,
            address,
            this.selectedExitDenom
          );
        });
    }
  }

  @Input() in: boolean = false;

  @Input() out: boolean = false;

  private _selectedOriginChain: Chain | undefined;
  public get selectedOriginChain(): Chain | undefined {
    return this._selectedOriginChain;
  }
  @Input()
  public set selectedOriginChain(value: Chain | undefined) {
    this._selectedOriginChain = value;
    this.searchText = '';
  }

  private _selectedExitChain: Chain | undefined;
  public get selectedExitChain(): Chain | undefined {
    return this._selectedExitChain;
  }
  @Input()
  public set selectedExitChain(value: Chain | undefined) {
    this._selectedExitChain = value;
    this.searchText = '';
  }

  private _selectedSourceDenom: Asset | undefined;
  public get selectedSourceDenom(): Asset | undefined {
    return this._selectedSourceDenom;
  }
  @Input()
  public set selectedSourceDenom(value: Asset | undefined) {
    this._selectedSourceDenom = value;
    this.searchText = '';
  }

  private _selectedExitDenom: Asset | undefined;
  public get selectedExitDenom(): Asset | undefined {
    return this._selectedExitDenom;
  }
  @Input()
  public set selectedExitDenom(value: Asset | undefined) {
    this._selectedExitDenom = value;
    this.searchText = '';
  }

  @Output() removeSelectedChainEvent: EventEmitter<any> = new EventEmitter();

  @Output() removeSelectedSourceDenomEvent: EventEmitter<any> =
    new EventEmitter();

  @Output() removeSelectedExitDenomEvent: EventEmitter<any> =
    new EventEmitter();

  @Output() searchTextEvent: EventEmitter<string> = new EventEmitter();

  constructor(
    private messageService: MessageService,
    public wallet_service: WalletService
  ) {}
  ngOnInit(): void {}

  async getBalance(chainId: string, adress: string, denom: Asset) {
    if (adress === '' || denom === undefined) {
      return;
    }
    console.log('getBalance');
    let rpcList = ChainRegistry.chains.find(
      (chain) => chain.chain_id === chainId
    )?.apis?.rpc;
    this.messageService.add({
      key: 'balances',
      sticky: true,
      severity: 'info',
      summary: 'Trying to find a RPC provider that works...',
    });
    if (rpcList) {
      //console.log(rpcList);
      rpcList = this.shuffleArray(rpcList);
      for (const rpc of rpcList) {
        let balance: Coin;
        try {
          const client = await StargateClient.connect(rpc.address);
          balance = await client.getBalance(adress, denom?.denom);
        } catch (err) {
          console.log(err);
          continue;
        }
        if (balance) {
          const totalChars = balance.amount.length;
          const decimals = denom.decimals ? denom.decimals : 0;
          const stringBalance =
            balance.amount.substring(0, totalChars - decimals) +
            '.' +
            balance.amount.substring(totalChars - decimals);
          const balanceAsNumber = Number(stringBalance);
          denom.balance = Number(balanceAsNumber);

          console.log(denom.balance);
          break;
        }
      }
    }
    this.messageService.clear('balances');
  }

  shuffleArray(array: any[]) {
    return array.sort(() => Math.random() - 0.5);
  }
}
