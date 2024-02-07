import { CardModule } from 'primeng/card';
import { WalletService } from './../wallet.service';
import { Component, HostListener, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { ButtonModule } from 'primeng/button';
import { AccordionModule } from 'primeng/accordion';
import { ToastModule } from 'primeng/toast';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { SliderModule } from 'primeng/slider';
import { TimelineModule } from 'primeng/timeline';
import { SkipService } from '../skip.service';
import {
  Asset,
  AxelarTransferWrapper,
  BankSendWrapper,
  Chain,
  FungibleAssets,
  RequestMessages,
  StatusInformation,
  SwapTransferRouteSummary,
  SwapWrapper,
  TransferWrapper,
} from '../skip';
import * as ChainRegistry from 'chain-registry';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ChainsFilterPipe } from '../shared/chains-filter.pipe';
import { DenomsFilterPipe } from '../shared/denoms-filter.pipe';
import {
  Coin,
  DeliverTxResponse,
  GasPrice,
  StargateClient,
  defaultRegistryTypes,
} from '@cosmjs/stargate';
import { Registry } from '@cosmjs/proto-signing';
import { AutoFocusDirective } from '../shared/auto-focus.directive';
import { SigningCosmWasmClient } from '@cosmjs/cosmwasm-stargate';
import { Buffer } from 'buffer';
import { MessageService } from 'primeng/api';
import { WalletConnectComponent } from '../wallet-connect/wallet-connect.component';
import { Observable, first, interval, switchMap, take, tap } from 'rxjs';
import { fromBech32 } from '@cosmjs/encoding';
import { TransactionInfoComponent } from '../transaction-info/transaction-info.component';
import { TradeParametersSelectionComponent } from '../trade-parameters-selection/trade-parameters-selection.component';
import { LogsService } from '../logs.service';

@Component({
  selector: 'app-swap-in',
  standalone: true,
  imports: [
    CommonModule,
    DropdownModule,
    FormsModule,
    ReactiveFormsModule,
    InputTextModule,
    InputNumberModule,
    ButtonModule,
    CardModule,
    AccordionModule,
    ToastModule,
    ProgressSpinnerModule,
    SliderModule,
    WalletConnectComponent,
    TimelineModule,
    TransactionInfoComponent,
    TradeParametersSelectionComponent,
  ],
  providers: [
    DenomsFilterPipe,
    ChainsFilterPipe,
    AutoFocusDirective,
    MessageService,
  ],
  templateUrl: './swap-in.component.html',
  styleUrl: './swap-in.component.scss',
})
export class SwapInComponent implements OnInit {
  @HostListener('window:keplr_keystorechange', ['$event'])
  @HostListener('window:leap_keystorechange', ['$event'])
  onKeyStoreChange(event: any) {
    if (
      (this.wallet_service.wallet_primary_name === 'keplr' &&
        event.type === 'keplr_keystorechange') ||
      (this.wallet_service.wallet_primary_name === 'leap' &&
        event.type === 'leap_keystorechange')
    ) {
      this.reloadAfterWalletConnectionOrAccountChange(true);
    }
  }

  @ViewChild('walletConnect') walletConnect!: WalletConnectComponent;
  OSMOSIS_LOGO =
    'https://raw.githubusercontent.com/cosmos/chain-registry/master/osmosis/images/osmo.png';
  OSMOSIS_CHAIN_ID = 'osmosis-1';
  routesChecked = false;
  destinyWalletAddressCheck = false;
  loading = false;
  ongoingTracking = false;
  private _sourceAmount: number = 0;
  public get sourceAmount(): number {
    return this._sourceAmount;
  }
  public set sourceAmount(value: number) {
    this._sourceAmount = value;
    this.ongoingTracking = false;
    if (!value || value === 0) return;
    this.checkIfNecessaryToGetSourceDenomBalance();
    this.getRouteAndExitAmount();
  }
  JUNO_CHAIN_ID = 'juno-1';
  chains!: Chain[];
  filteredChains!: Chain[];
  selectedOriginChain!: Chain | undefined;
  selectedExitChain!: Chain | undefined;
  filteredDenoms!: Asset[];
  selectedSourceDenom!: Asset | undefined;
  selectedExitDenom!: Asset | undefined;
  eventsFromEstimate: Array<
    TransferWrapper | SwapWrapper | AxelarTransferWrapper | BankSendWrapper
  > = [];
  events: EventItem[] = [];
  private _destinyWalletAddress: string = '';
  public get destinyWalletAddress(): string {
    return this._destinyWalletAddress;
  }
  public set destinyWalletAddress(value: string) {
    this.destinyWalletAddressCheck = false;
    this._destinyWalletAddress = value;
    if (value === '') {
      return;
    }
    this.destinyWalletAddressCheck = !this.validateAddress(
      value,
      this.selectedExitChain?.chain_id
    );
    /* console.log('destinyWalletAddressCheck' + this.destinyWalletAddressCheck); */
  }
  private _addDestinyWallet = false;
  public get addDestinyWallet() {
    return this._addDestinyWallet;
  }
  public set addDestinyWallet(value) {
    this._addDestinyWallet = value;
  }
  private _editSlippage = false;
  public get editSlippage() {
    return this._editSlippage;
  }
  public set editSlippage(value) {
    this._editSlippage = value;
  }
  private _slippage: number = 1;
  public get slippage(): number {
    return this._slippage;
  }
  public set slippage(value: number) {
    this._slippage = value;
  }
  private _searchText: string = '';
  private _availableDenoms!: Asset[];
  private _statusInformation: StatusInformation | undefined;
  public get statusInformation(): StatusInformation | undefined {
    return this._statusInformation;
  }
  public set statusInformation(value: StatusInformation) {
    this._statusInformation = value;
  }
  private _previewInformation: SwapTransferRouteSummary | undefined;
  public get previewInformation(): SwapTransferRouteSummary | undefined {
    return this._previewInformation;
  }
  public set previewInformation(value: SwapTransferRouteSummary | undefined) {
    this._previewInformation = value;
    if (value?.operations) {
      this.createEventsObjectFromOperations(value?.operations);
      this.eventsFromEstimate = [...value?.operations];
    }
  }

  get availableDenoms(): Asset[] {
    return this._availableDenoms;
  }

  set availableDenoms(val: Asset[]) {
    this._availableDenoms = val.sort((a, b) => a?.balance - b?.balance);
  }

  get searchText(): string {
    return this._searchText;
  }
  set searchText(val: string) {
    this._searchText = val;
    if (!this.selectedOriginChain) {
      this.filteredChains = this.filter.transform(this.chains, this.searchText);
    } else if (this.selectedOriginChain) {
      this.filteredDenoms = this.filterDenoms.transform(
        this.availableDenoms,
        this.searchText
      );
    }
  }
  assets: FungibleAssets | undefined;

  constructor(
    private skip_service: SkipService,
    public wallet_service: WalletService,
    private filter: ChainsFilterPipe,
    private filterDenoms: DenomsFilterPipe,
    private messageService: MessageService,
    private logsService: LogsService
  ) {}

  async ngOnInit(): Promise<void> {
    /* console.log(ChainRegistry.chains); */

    this.skip_service.getAllAvailableAssetsForAllChains().subscribe((res) => {
      /* console.log(res); */
      this.assets = res;
    });
    this.skip_service.getChains().subscribe((res) => {
      /* console.log(res); */
      const junoIndex = res.chains.findIndex(
        (chain) => chain.chain_id === this.JUNO_CHAIN_ID
      );
      if (junoIndex !== -1) {
        res.chains.unshift(res.chains.splice(junoIndex, 1)[0]);
        this.selectedExitChain = res.chains[0];
      }

      this.selectedExitChain = res.chains[0];
      this.chains = res.chains;
      this.filteredChains = [...this.chains];
      this.checkIfThereAreBalances();

      this.wallet_service.walletConnected.subscribe(async (val: boolean) => {
        this.reloadAfterWalletConnectionOrAccountChange(val);
      });
    });
  }

  isValidBech32Address(
    address: string,
    // If passed, the prefix must match this value.
    prefix?: string,
    // If passed, the address must contain this many bytes.
    length?: number
  ): boolean {
    try {
      const decoded = fromBech32(address);

      if (prefix && decoded.prefix !== prefix) {
        return false;
      }

      if (length !== undefined && decoded.data.length !== length) {
        return false;
      }

      return true;
    } catch (err) {
      return false;
    }
  }

  async reloadAfterWalletConnectionOrAccountChange(val: boolean) {
    if (val) {
      this.checkIfThereAreBalances();
      this.wallet_service.enableChain('juno-1');
      if (this.selectedOriginChain && !this.selectedSourceDenom) {
        this.wallet_service.enableChain(this.selectedOriginChain.chain_id);
        this.getBalances(this.selectedOriginChain.chain_id);
      } else if (
        this.selectedOriginChain &&
        this.selectedSourceDenom &&
        this.selectedExitChain &&
        !this.selectedExitDenom
      ) {
        this.getBalances(this.selectedExitChain.chain_id);
        const address = await this.wallet_service.getAddressForChain(
          this.selectedOriginChain.chain_id
        );
        this.getBalance(
          this.selectedOriginChain.chain_id,
          address,
          this.selectedSourceDenom
        );
      } else if (
        this.selectedOriginChain &&
        this.selectedSourceDenom &&
        this.selectedExitDenom
      ) {
        const address = await this.wallet_service.getAddressForChain(
          this.selectedOriginChain.chain_id
        );
        this.getBalance(
          this.selectedOriginChain.chain_id,
          address,
          this.selectedSourceDenom
        );
        if (this.selectedExitChain) {
          const address = await this.wallet_service.getAddressForChain(
            this.selectedExitChain.chain_id
          );
          this.getBalance(
            this.selectedExitChain.chain_id,
            address,
            this.selectedExitDenom
          );
        }
      }
    } else {
      this.resetChecks();
      this.availableDenoms?.forEach((denom) => (denom.balance = 0));
      this.filteredDenoms = [...this.availableDenoms];
    }
  }

  checkIfThereAreBalances() {
    if (
      this.chains &&
      this.chains.length > 0 &&
      this.wallet_service.wallet_primary_connected
    ) {
      this.chains.forEach(async (chain) => {
        let rpcList = ChainRegistry.chains.find(
          (rpc_chain) => chain.chain_id === rpc_chain?.chain_id
        )?.apis?.rpc;

        if (rpcList) {
          rpcList = this.shuffleArray(rpcList);
          for (const rpc of rpcList) {
            let balances;

            try {
              const client = await StargateClient.connect(rpc.address);
              balances = await client.getAllBalances(
                await this.wallet_service.getAddressForChain(chain.chain_id)
              );
            } catch (err) {
              continue;
            }
            if (balances && balances.length > 0) {
              // console.log(balances);
              chain.hasBalances = true;
            }
            break;
          }
        }
      });
    }
  }

  getChainPrefixFromRegistry(chainId: string | undefined) {
    if (!chainId) {
      return;
    }
    const chain_r = ChainRegistry.chains.find(
      (chainRe) => chainRe.chain_id === chainId
    );
    return chain_r?.bech32_prefix;
  }

  selectChainWithEnter(event: any) {
    /* console.log(this.chains); */
    if (event.keyCode !== 13) {
      return;
    }
    if (this.filteredChains?.length === 1) {
      this.selectSourceChain(this.filteredChains[0]);
    }
  }

  selectSourceChain(chain: Chain) {
    /* console.log(chain); */
    this.selectedOriginChain = chain;
    this.searchText = '';
    this.getAvailableDenoms();
  }

  selectSourceDenom(denom: Asset) {
    /* console.log(denom); */
    this.selectedSourceDenom = Object.assign({}, denom);
    this.searchText = '';
    this.getAvailableDenoms('juno-1');
  }

  async selectExitDenom(denom: Asset) {
    /* console.log(denom); */
    if (this.selectedOriginChain)
      this.selectedExitDenom = Object.assign({}, denom);
    this.searchText = '';
    const adress = await this.wallet_service.getAddressForChain(denom.chain_id);
    this.getBalance(denom.chain_id, adress, denom);
  }

  getAvailableDenoms(chainId?: string) {
    if (this.selectedOriginChain === undefined && chainId === undefined) {
      return;
    }
    if (this.selectedOriginChain === undefined) {
      return;
    }
    this.skip_service
      .getAllAvailableAssetsForChain(
        chainId ? chainId : this.selectedOriginChain?.chain_id
      )
      .subscribe((res: FungibleAssets) => {
        /* console.log(res); */
        this.availableDenoms =
          res.chain_to_assets_map[
            chainId
              ? chainId
              : this.selectedOriginChain?.chain_id
              ? this.selectedOriginChain?.chain_id
              : ''
          ].assets;
        this.getBalances(chainId ? chainId : undefined);
        this.filteredDenoms = [...this.availableDenoms];
      });
  }

  async getBalances(chainId?: string) {
    if (!this.selectedOriginChain || (!chainId && !this.selectedOriginChain)) {
      return;
    }
    if (!this.wallet_service.wallet_primary_connected) {
      this.availableDenoms.map((denom) => {
        if (denom.balance === undefined) {
          denom.balance = 0;
        }
      });
      return;
    }
    /* console.log(chainId);
    console.log(this.selectedOriginChain); */
    let rpcList = ChainRegistry.chains.find(
      (chain) =>
        chain.chain_id ===
        (chainId ? chainId : this.selectedOriginChain?.chain_id)
    )?.apis?.rpc;

    if (rpcList) {
      this.messageService.add({
        key: 'balances',
        sticky: true,
        severity: 'info',
        summary: 'Trying to find a RPC provider that works...',
      });

      /* console.log(rpcList); */
      rpcList = this.shuffleArray(rpcList);
      /* console.log(rpcList); */
      for (const rpc of rpcList) {
        let balances;

        try {
          const client = await StargateClient.connect(rpc.address);
          balances = await client.getAllBalances(
            await this.wallet_service.getAddressForChain(
              chainId ? chainId : this.selectedOriginChain?.chain_id
            )
          );
        } catch (err) {
          continue;
        }
        if (balances) {
          //console.log('balances for chainId: ' + chainId, balances);
          balances?.forEach((balance) => {
            const denom = this.availableDenoms.find(
              (denom) => denom.denom === balance.denom
            );
            if (denom) {
              const decimals = denom.decimals ? denom.decimals : 0;

              while (balance.amount.length < decimals) {
                // @ts-ignore
                balance.amount = '0' + balance.amount;
                /* console.log(balance.amount); */
              }
              const totalChars = balance.amount.length;
              const stringBalance =
                balance.amount.substring(0, totalChars - decimals) +
                '.' +
                balance.amount.substring(totalChars - decimals);
              /* console.log(
                'denom: ' + stringBalance + '; balance: ' + stringBalance
              ); */
              const balanceAsNumber = Number(stringBalance);
              denom.balance = balanceAsNumber;
            }
          });

          break;
        }
      }
      this.availableDenoms.map((denom) => {
        if (denom.balance === undefined) {
          denom.balance = 0;
        }
      });
      //console.log(balances);
      this.filteredDenoms = [
        ...this.availableDenoms.sort(
          (a, b) => (b.balance ? b.balance : 0) - (a.balance ? a.balance : 0)
        ),
      ];
      this.messageService.clear();
    }
  }

  async getBalance(chainId: string, adress: string, denom: Asset) {
    if (adress === '' || denom === undefined) {
      return;
    }
    /* console.log('getBalance'); */
    let rpcList = ChainRegistry.chains.find(
      (chain) => chain.chain_id === chainId
    )?.apis?.rpc;
    /* this.messageService.add({
      key: 'balances',
      sticky: true,
      severity: 'info',
      summary: 'Trying to find a RPC provider that works...',
    }); */
    if (rpcList) {
      //console.log(rpcList);
      rpcList = this.shuffleArray(rpcList);
      for (const rpc of rpcList) {
        let balance: Coin;
        try {
          const client = await StargateClient.connect(rpc.address);
          balance = await client.getBalance(adress, denom?.denom);
        } catch (err) {
          /* console.log(err); */
          continue;
        }
        /* console.log(balance); */
        if (balance) {
          const decimals = denom.decimals ? denom.decimals : 0;
          while (balance.amount.length < decimals) {
            // @ts-ignore
            balance.amount = '0' + balance.amount;
            /* console.log(balance.amount); */
          }
          const totalChars = balance.amount.length;
          /* if(totalChars < decimals) {

          } */
          const stringBalance =
            balance.amount.substring(0, totalChars - decimals) +
            '.' +
            balance.amount.substring(totalChars - decimals);
          const balanceAsNumber = Number(stringBalance);
          denom.balance = Number(balanceAsNumber);

          /* console.log(denom.balance); */
          break;
        }
      }
    }
    //this.messageService.clear('balances');
  }

  getRouteAndExitAmount() {
    this.loading = true;
    const sourceDenom = this.selectedSourceDenom;
    if (!sourceDenom) {
      this.loading = false;
      return;
    }
    const chainIdIn = this.selectedSourceDenom?.chain_id;
    let balanceIn = this.convertFromNumberToString(
      this.sourceAmount,
      sourceDenom
    );
    const denomIn = this.selectedSourceDenom?.denom;
    const chainIdOut = this.selectedExitDenom?.chain_id;
    let denomOut;
    if (
      this.selectedOriginChain?.chain_id === this.selectedExitDenom?.chain_id
    ) {
      denomOut = this.selectedExitDenom?.denom;
    } else {
      denomOut = this.selectedExitDenom?.denom;
    }
    if (!balanceIn || !denomIn || !chainIdIn || !chainIdOut || !denomOut) {
      this.loading = false;
      return;
    }
    balanceIn = balanceIn.toString().replace('.', '').replace(/^0+/, '');
    this.skip_service
      .getRoutesForSwapOrTransfer(
        balanceIn,
        denomIn,
        chainIdIn,
        denomOut,
        chainIdOut
      )
      .subscribe(
        (res) => {
          /* console.log(res); */
          //this.formatPreviewAmounts(res);
          this.previewInformation = res;
          this.loading = false;
        },
        (err) => {
          /*  if (err.status === 400) { */
          this.messageService.add({
            severity: 'error',
            summary: 'Result',
            detail:
              'Something went wrong... ' + '[' + err?.error?.message + ']',
            life: 50000,
          });
          /* console.log(err); */
          this.previewInformation = undefined;
          //this.routesChecked = true;
          /*  } */
          this.loading = false;
        }
      );
  }

  resetChecks() {
    this.routesChecked = false;
    this.destinyWalletAddressCheck = false;
  }

  removeSelectedChain() {
    this.selectedOriginChain = undefined;
    this.filteredChains = [...this.chains];
    this.selectedSourceDenom = undefined;
    this.selectedExitDenom = undefined;
    this.resetInputs();
    this.resetChecks();
  }

  removeSelectedSourceDenom() {
    this.selectedSourceDenom = undefined;
    this.selectedExitDenom = undefined;
    this.resetInputs();
    this.resetChecks();
    this.getAvailableDenoms();
  }

  removeSelectedExitDenom() {
    this.selectedExitDenom = undefined;
    this.filteredDenoms = [...this.availableDenoms];
    this.resetInputs();
    this.resetChecks();
    this.getAvailableDenoms('juno-1');
  }

  resetInputs() {
    this.searchText = '';
    this.sourceAmount = 0;
    this.previewInformation = undefined;
    this.destinyWalletAddress = '';
  }

  convertFromNumberToString(number: number, denom: Asset) {
    const numDecimals = denom.decimals;
    if (!numDecimals) {
      return;
    }
    return number.toFixed(numDecimals);
  }

  async executePreview() {
    if (this.wallet_service.wallet_primary_connected === false) {
      this.walletConnect.showDialog();
      return;
    }
    if (this.previewInformation === undefined) {
      return;
    }

    const requestMessages = await this.takeRoutesAndCreateMessagesRequest(
      this.previewInformation
    );

    this.skip_service
      .getMessagesForSwapOrTransfer(requestMessages)
      .subscribe(async (res) => {
        /* console.log('messages: ', res); */

        const multihopMsg = res.msgs[0];
        const msgJSON = JSON.parse(multihopMsg.msg);
        /* console.log('JSON message:', msgJSON); */
        // get signing client
        let rpc_list = ChainRegistry.chains.find(
          (chain) => chain.chain_id === multihopMsg.chain_id
        )?.apis?.rpc;
        /* 'https://rpc.cosmos.directory/' +
        multihopMsg.chain_id.split('-')[0]; */
        if (rpc_list === undefined || rpc_list.length === 0) {
          return;
        }

        const signer =
          await this.wallet_service.wallet_primary.getOfflineSignerAuto(
            multihopMsg.chain_id
          );
        const sourceChain = ChainRegistry.chains.find(
          (chain) => chain.chain_id === multihopMsg.chain_id
        );

        // get average gas price
        const feeInfo = sourceChain?.fees?.fee_tokens[0];
        let averageGasPrice = 0;
        if (feeInfo?.average_gas_price) {
          averageGasPrice = feeInfo.average_gas_price;
        }
        /* console.log('fee INFO' + feeInfo?.average_gas_price);
        console.log('fee INFO' + feeInfo?.denom); */

        let signingStargateClient;

        rpc_list = this.shuffleArray(rpc_list);
        this.messageService.add({
          key: 'balances',
          sticky: true,
          severity: 'info',
          summary:
            'Trying to find a free RPC provider that works to send the transaction...',
        });
        for (const rpc of rpc_list) {
          /* console.log('rpc url', rpc); */
          //const registry = new Registry([...defaultRegistryTypes]);
          try {
            signingStargateClient =
              await SigningCosmWasmClient.connectWithSigner(
                rpc.address,
                signer,
                {
                  gasPrice: GasPrice.fromString(
                    `${feeInfo?.average_gas_price ?? 0}${feeInfo?.denom}`
                  ) /* ,
                  registry: registry as any, */,
                }
              );
          } catch (err) {
            /* console.log(err); */
            continue;
          }
          break;
        }

        if (signingStargateClient === undefined) {
          return;
        }
        this.messageService.clear('balances');
        //console.log('rpc url', RPC_URL);

        /* console.log('entrou 3'); */
        let msg;
        if (
          multihopMsg.msg_type_url ===
          '/ibc.applications.transfer.v1.MsgTransfer'
        ) {
          msg = {
            typeUrl: multihopMsg.msg_type_url,
            value: {
              sourcePort: msgJSON.source_port,
              sourceChannel: msgJSON.source_channel,
              token: msgJSON.token,
              sender: msgJSON.sender,
              receiver: msgJSON.receiver,
              timeoutTimestamp: msgJSON.timeout_timestamp,
              memo: msgJSON.memo,
            },
          };
        } else if (
          multihopMsg.msg_type_url === '/cosmos.bank.v1beta1.MsgSend'
        ) {
          msg = {
            typeUrl: '/cosmos.bank.v1beta1.MsgSend',
            value: {
              fromAddress: msgJSON.from_address,
              toAddress: 'juno1wx4jx4qgafmchamkdw9z6y8agh7xt6yfvj8tve',
              amount: msgJSON.amount,
            },
          };
        } else if (
          multihopMsg.msg_type_url === '/cosmwasm.wasm.v1.MsgExecuteContract'
        ) {
          /* console.log(multihopMsg.msg_type_url);
          console.log('multihopMsg: ', multihopMsg); */
          msg = {
            typeUrl: multihopMsg.msg_type_url,
            value: {
              sender: msgJSON.sender,
              contract: msgJSON.contract,
              msg: Uint8Array.from(Buffer.from(JSON.stringify(msgJSON.msg))),
              funds: msgJSON.funds,
            },
          };
        } else {
          /* console.log(multihopMsg.msg_type_url); */

          msg = {
            typeUrl: multihopMsg.msg_type_url,
            value: {
              sender: msgJSON.sender,
              contract: msgJSON.contract,
              msg: Uint8Array.from(Buffer.from(JSON.stringify(msgJSON.msg))),
              funds: msgJSON.funds,
            },
          };
        }
        /* console.log('msg: ', msg); */
        this.messageService.add({
          key: 'broadcast',
          sticky: true,
          severity: 'info',
          summary: 'Executing transaction...',
        });
        let deliverTxResponse;
        try {
          const gasUsed = await signingStargateClient.simulate(
            await this.wallet_service.getAddressForChain(multihopMsg.chain_id),
            [msg],
            undefined
          );
          /* console.log('gasUsed', gasUsed); */
          if (gasUsed) {
            deliverTxResponse = await signingStargateClient.signAndBroadcast(
              await this.wallet_service.getAddressForChain(
                multihopMsg.chain_id
              ),
              [msg],
              {
                amount: [
                  {
                    denom: feeInfo?.denom ?? '',
                    amount: feeInfo?.average_gas_price?.toString() ?? '0',
                  },
                ],
                gas: Math.floor(gasUsed * 1.5).toString(),
              }
            );
          }
        } catch (err: any) {
          /* console.log(err); */
          this.messageService.clear('broadcast');
          this.messageService.add({
            severity: 'error',
            summary: 'Result',
            detail: 'Something went wrong... ' + '[' + err?.Error?.data + ']',
            life: 5000,
          });
        }
        this.messageService.clear('broadcast');
        if (deliverTxResponse && deliverTxResponse.code === 0) {
          this.messageService.add({
            severity: 'success',
            summary: 'Result',
            detail: 'Transaction delivered',
            life: 2000,
          });
          this.ongoingTracking = true;
          this.trackTxAndCheckStatus(deliverTxResponse);
        } else if (deliverTxResponse) {
          /* console.log(deliverTxResponse); */
          this.messageService.add({
            severity: 'error',
            summary: 'Result',
            detail:
              'Something went wrong... It is probably an RPC provider issue. Try again.',
            life: 5000,
          });
        }
        /* console.log('entrou 4'); */
        //const tx = await signingStargateClient.sign(account[0], res.msgs, null, null);
        /* console.log(deliverTxResponse); */
      });
  }

  async trackTxAndCheckStatus(deliverTxResponse: DeliverTxResponse) {
    if (!this.selectedOriginChain) return;
    // const hex = this.stringToHex(deliverTxResponse.transactionHash);
    this.messageService.add({
      key: 'broadcast',
      sticky: true,
      severity: 'info',
      summary: 'Tracking the transation...',
    });
    setTimeout(() => {
      if (!this.selectedOriginChain) return;
      this.skip_service
        .trackTx(
          deliverTxResponse.transactionHash,
          this.selectedOriginChain.chain_id
        )
        .subscribe((res) => {
          if (!this.selectedOriginChain) return;
          //this.ongoingTracking = true;
          this.executeCheckStatusLoop(
            res.tx_hash,
            this.selectedOriginChain?.chain_id
          );
        }),
        async (err: any) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Result',
            detail: 'Something went wrong setting up the Tx tracking... ',
            life: 5000,
          });
          let address;
          if (this.selectedOriginChain) {
            address = await this.wallet_service.getAddressForChain(
              this.selectedOriginChain?.chain_id
            );
          }
          this.logsService.postLog('Inititate Tracking', address, err);
          /* .subscribe((res) => console.log(res)) */
          //this.ongoingTracking = false;
        };
    }, 5000);
  }

  /* stringToHex(str: string): string {
    return str
      .split('')
      .map((char) => char.charCodeAt(0).toString(16).padStart(2, '0'))
      .join('');
  } */

  async executeCheckStatusLoop(txHash: string, chainId: string) {
    /* console.log('entrou na função'); */
    const ticket = interval(10000)
      .pipe(
        /* tap(() => console.log('tick')), */
        take(30),
        switchMap(() => {
          /* console.log('entrou switchMap'); */
          return this.checkTxStatus(txHash, chainId);
        }),
        first((res) => {
          this.statusInformation = res;
          /* console.log(res); */
          if (
            res !== undefined &&
            (res.state === 'STATE_PENDING' ||
              res.state === 'STATE_SUBMITTED' ||
              res.state === 'STATE_RECEIVED')
          ) {
            /* console.log('State: ', res.state); */
            this.messageService.clear('broadcast');
            this.messageService.add({
              key: 'broadcast',
              sticky: true,
              severity: 'info',
              summary: 'Tracking the transation...[ ' + res?.state + ' ]',
            });
          }
          return (
            res !== undefined &&
            (res.state === 'STATE_COMPLETED_SUCCESS' ||
              res.state === 'STATE_COMPLETED_ERROR')
          );
        })
      )
      .subscribe(
        async (res) => {
          /* console.log('finalizour subscribe'); */
          this.messageService.clear('broadcast');
          if (res !== undefined && res.state === 'STATE_COMPLETED_SUCCESS') {
            this.messageService.add({
              severity: 'success',
              summary: 'Result',
              detail: 'Nice! Transaction completed successfully!',
              life: 3000,
            });
            //this.ongoingTracking = false;
          } else if (
            res !== undefined &&
            res.state === 'STATE_COMPLETED_ERROR'
          ) {
            this.messageService.add({
              severity: 'error',
              summary: 'Result',
              detail:
                'The initial transaction or a subsequent transfer failed and lifecycle tracking has concluded.',
              life: 5000,
            });
            //this.ongoingTracking = false;
            let address;
            if (this.selectedOriginChain) {
              address = await this.wallet_service.getAddressForChain(
                this.selectedOriginChain?.chain_id
              );
            }
            this.logsService.postLog('Tracking Process', address, res);
            /* .subscribe((res) => console.log(res)) */
          }

          /* if (
            this.selectedOriginChain &&
            this.selectedSourceDenom &&
            this.selectedExitDenom
          ) {
            const address = await this.wallet_service.getAddressForChain(
              this.selectedOriginChain.chain_id
            );
            this.getBalance(
              this.selectedOriginChain.chain_id,
              address,
              this.selectedSourceDenom
            );
          } */
        },
        async (err) => {
          this.messageService.clear('broadcast');
          this.messageService.add({
            severity: 'error',
            summary: 'Result',
            detail: 'Something went wrong while tracking the transation...',
            life: 5000,
          });
          let address;
          if (this.selectedOriginChain) {
            address = await this.wallet_service.getAddressForChain(
              this.selectedOriginChain?.chain_id
            );
          }
          //this.ongoingTracking = false;
          this.logsService.postLog('Tracking Process', address, err);
          /* .subscribe((res) => console.log(res)) */
          /* console.log(err); */
        }
      );
  }

  checkTxStatus(txHash: string, chainId: string): Observable<any> {
    return this.skip_service.getTxStatus(txHash, chainId);
  }

  async takeRoutesAndCreateMessagesRequest(
    routes: SwapTransferRouteSummary
  ): Promise<RequestMessages> {
    const req = new RequestMessages();
    req.source_asset_denom = routes.source_asset_denom;
    req.source_asset_chain_id = routes.source_asset_chain_id;
    req.dest_asset_denom = routes.dest_asset_denom;
    req.dest_asset_chain_id = routes.dest_asset_chain_id;
    req.amount_in = routes.amount_in;
    req.amount_out = routes.amount_out;
    req.operations = routes.operations;
    const userAddresses: string[] = [];
    for (const chainID of routes.chain_ids) {
      const address = await this.wallet_service.getAddressForChain(chainID);
      userAddresses.push(address);
    }
    /* console.log('user addresses', userAddresses); */
    req.address_list = userAddresses;
    req.slippage_tolerance_percent = this.slippage.toString();
    req.affiliates = [];
    return req;
  }

  formatPreviewAmounts(swapTransferRouteSummary: SwapTransferRouteSummary) {
    const decimalsIn = this.selectedSourceDenom?.decimals
      ? this.selectedSourceDenom?.decimals
      : 0;
    while (swapTransferRouteSummary.amount_in.length < decimalsIn) {
      // @ts-ignore
      swapTransferRouteSummary.amount_in =
        '0' + swapTransferRouteSummary.amount_in;
      /* console.log(swapTransferRouteSummary.amount_in); */
    }
    const totalCharsIn = swapTransferRouteSummary.amount_in.length;

    const stringBalanceIn =
      swapTransferRouteSummary.amount_in.substring(
        0,
        totalCharsIn - decimalsIn
      ) +
      '.' +
      swapTransferRouteSummary.amount_in.substring(totalCharsIn - decimalsIn);
    swapTransferRouteSummary.amount_in = stringBalanceIn;

    const decimalsOut = this.selectedExitDenom?.decimals
      ? this.selectedExitDenom?.decimals
      : 0;
    while (swapTransferRouteSummary.amount_out.length < decimalsOut) {
      // @ts-ignore
      swapTransferRouteSummary.amount_out =
        '0' + swapTransferRouteSummary.amount_out;
      /* console.log(swapTransferRouteSummary.amount_in); */
    }
    const totalCharsOut = swapTransferRouteSummary.amount_out.length;

    const stringBalanceOut =
      swapTransferRouteSummary.amount_out.substring(
        0,
        totalCharsOut - decimalsOut
      ) +
      '.' +
      swapTransferRouteSummary.amount_out.substring(
        totalCharsOut - decimalsOut
      );
    swapTransferRouteSummary.amount_out = stringBalanceOut;
  }

  getNumberFromString(string: string, decimals: number | null): number | null {
    if (!decimals) {
      return null;
    }
    const totalChars = string.length;
    let stringBalance = string.toString();
    if (decimals >= totalChars) {
      if (decimals === totalChars) {
        stringBalance = '0.' + string;
      } else {
        let moreDecimals = '0.';
        for (let i = 0; i < decimals - totalChars; i++) {
          moreDecimals += '0';
        }
        stringBalance = moreDecimals + string;
      }
    } else {
      stringBalance =
        stringBalance.substring(0, totalChars - decimals) +
        '.' +
        stringBalance.substring(totalChars - decimals);
    }

    return Number(stringBalance);
  }

  addMissingDecimalsToString(string: string, decimals: number) {
    const totalChars = string.length;
    if (decimals >= totalChars) {
      if (decimals === totalChars) {
        string = '0.' + string;
      } else {
        let moreDecimals = '0.';
        for (let i = 0; i < decimals - totalChars; i++) {
          moreDecimals += '0';
        }
        string = moreDecimals + string;
      }
    }
  }

  async checkIfNecessaryToGetSourceDenomBalance() {
    if (
      this.selectedOriginChain &&
      this.selectedSourceDenom &&
      this.selectedExitDenom &&
      this.wallet_service.wallet_primary_connected &&
      (this.selectedSourceDenom.balance === 0 ||
        !this.selectedSourceDenom.balance)
    ) {
      const address = await this.wallet_service.getAddressForChain(
        this.selectedOriginChain.chain_id
      );
      this.getBalance(
        this.selectedOriginChain.chain_id,
        address,
        this.selectedSourceDenom
      );
    }
  }

  createEventsObjectFromOperations(
    operations: Array<
      TransferWrapper | SwapWrapper | AxelarTransferWrapper | BankSendWrapper
    >
  ) {
    //console.log(operations[0].type);
    this.events = [];
    if (!operations || operations.length === 0) {
      return;
    }

    let idxAdditionalForTransfersPreSwap = 1;
    operations?.forEach((operation) => {
      //console.log(Object.keys(operation));
      const event = new EventItem();
      if (Object.keys(operation)[0] === 'transfer') {
        event.operationType = 'Transfer';
        if (this.assets === undefined || !this.assets.chain_to_assets_map) {
          return;
        }
        const keys = Object.keys(this.assets?.chain_to_assets_map);
        //console.log(keys);
        let assetInfo: Asset;
        const sourceChain = this.chains.find(
          // @ts-ignore
          (chain) => chain.chain_id === operation.transfer?.chain_id
        );
        const idxOfOperation = operations.indexOf(operation);
        /* console.log(this.previewInformation?.chain_ids); */
        const exitChain = this.chains.find(
          (chain) =>
            this.previewInformation?.chain_ids[
              idxOfOperation + idxAdditionalForTransfersPreSwap
            ] === chain.chain_id
        );
        keys?.forEach((key) => {
          this.assets?.chain_to_assets_map[key].assets.find((asset) => {
            if (
              // @ts-ignore
              asset.denom === operation.transfer?.dest_denom
            ) {
              /* console.log(asset); */
              // @ts-ignore
              /* console.log(operation.transfer?.dest_denom); */
              assetInfo = asset;
            }
          });
        });

        event.chainSource = sourceChain?.chain_name;
        event.chainSourceIcon =
          sourceChain?.chain_id === this.OSMOSIS_CHAIN_ID
            ? this.OSMOSIS_LOGO
            : sourceChain?.logo_uri;
        event.chainExit = exitChain?.chain_name;
        event.chainExitIcon =
          exitChain?.chain_id === this.OSMOSIS_CHAIN_ID
            ? this.OSMOSIS_LOGO
            : exitChain?.logo_uri;
        // @ts-ignore
        event.denomName = assetInfo?.name;
        // @ts-ignore
        event.denomIcon = assetInfo?.logo_uri;

        /* console.log(event); */
      } else if (Object.keys(operation)[0] === 'swap') {
        event.operationType = 'Swap';
        /* console.log(operation); */
        if (this.assets === undefined || !this.assets.chain_to_assets_map) {
          return;
        }
        const operationM = operation as SwapWrapper;
        const keys = Object.keys(this.assets?.chain_to_assets_map);
        /* console.log(keys); */
        let swapDenomIn: Asset;
        let swapDenomOut: Asset;
        keys?.forEach((key) => {
          this.assets?.chain_to_assets_map[key].assets?.forEach((asset) => {
            if (
              // @ts-ignore
              asset.denom ===
              operationM.swap?.swap_in?.swap_operations[0]?.denom_in
            ) {
              swapDenomIn = asset;
            } else if (
              // @ts-ignore
              asset.denom ===
              operationM.swap?.swap_in?.swap_operations[
                // @ts-ignore
                operationM.swap?.swap_in?.swap_operations?.length - 1
              ]?.denom_out
            ) {
              swapDenomOut = asset;
            }
          });
        });

        const sourceChain = this.chains.find(
          // @ts-ignore
          (chain) =>
            chain.chain_id === operationM.swap?.swap_in?.swap_venue.chain_id
        );
        event.chainSource = sourceChain?.chain_name;
        event.chainSourceIcon =
          sourceChain?.chain_id === this.OSMOSIS_CHAIN_ID
            ? this.OSMOSIS_LOGO
            : sourceChain?.logo_uri;

        // @ts-ignore
        event.swapDenomInName = swapDenomIn?.name;
        // @ts-ignore
        event.swapDenomInIcon = swapDenomIn?.logo_uri;
        // @ts-ignore
        event.swapDenomOutName = swapDenomOut?.name;
        // @ts-ignore
        event.swapDenomOutIcon = swapDenomOut?.logo_uri;
        /* console.log(event); */
        if (idxAdditionalForTransfersPreSwap === 1) {
          idxAdditionalForTransfersPreSwap = 0;
        }
      }
      this.events.push(event);
    });
  }

  shuffleArray(array: any[]) {
    return array.sort(() => Math.random() - 0.5);
  }

  validateAddress(address: string, chainId: string | undefined) {
    const chainPrefix = this.getChainPrefixFromRegistry(chainId);
    if (!chainPrefix) {
      return false;
    }
    const valid = this.isValidBech32Address(address, chainPrefix);
    return valid;
  }

  addToClipboard(text: string) {
    navigator.clipboard.writeText(text).then(
      () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Copied to clipboard',
          detail: text,
          life: 5000,
        });
      },
      () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Something went wrong',
          detail: 'Try again',
          life: 5000,
        });
      }
    );
  }
}
export class EventItem {
  operationType?: string;
  chainSource?: string;
  chainSourceIcon?: string;
  chainExit?: string;
  chainExitIcon?: string;
  denomName?: string;
  denomIcon?: string;
  swapDenomInName?: string;
  swapDenomOutName?: string;
  swapDenomInIcon?: string;
  swapDenomOutIcon?: string;
}
