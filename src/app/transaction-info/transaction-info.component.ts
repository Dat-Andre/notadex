import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AccordionModule } from 'primeng/accordion';
import {
  Asset,
  AxelarTransferWrapper,
  BankSendWrapper,
  Chain,
  FungibleAssets,
  StatusInformation,
  SwapTransferRouteSummary,
  SwapWrapper,
  TransferWrapper,
} from '../skip';
import { TimelineModule } from 'primeng/timeline';

@Component({
  selector: 'app-transaction-info',
  standalone: true,
  imports: [CommonModule, AccordionModule, TimelineModule],
  templateUrl: './transaction-info.component.html',
  styleUrl: './transaction-info.component.scss',
})
export class TransactionInfoComponent implements OnInit {
  private _previewInformation: SwapTransferRouteSummary | undefined;

  private _statusInformation: StatusInformation | undefined;

  private _ongoingTracking = false;
  public get ongoingTracking() {
    return this._ongoingTracking;
  }
  @Input()
  public set ongoingTracking(value) {
    this._ongoingTracking = value;
    if (!value) {
      this.statusInformation = undefined;
      //this.eve
    }
  }

  @Input()
  public set statusInformation(value: StatusInformation | undefined) {
    console.log(value);
    this._statusInformation = value;
    this.updateIconsOnEvents();
  }
  public get statusInformation(): StatusInformation | undefined {
    return this._statusInformation;
  }

  @Input() assets: FungibleAssets | undefined;

  @Input() chains!: Chain[];

  @Input() selectedSourceDenom!: Asset;
  @Input() selectedExitDenom!: Asset;

  @Input()
  public set previewInformation(value: SwapTransferRouteSummary | undefined) {
    this._previewInformation = value;
    if (value?.operations) {
      this.createEventsObjectFromOperations(value?.operations);
      this.eventsFromEstimate = [...value?.operations];
    }
  }

  public get previewInformation(): SwapTransferRouteSummary | undefined {
    return this._previewInformation;
  }

  eventsFromEstimate: Array<
    TransferWrapper | SwapWrapper | AxelarTransferWrapper | BankSendWrapper
  > = [];
  events: EventItem[] = [];

  OSMOSIS_LOGO =
    'https://raw.githubusercontent.com/cosmos/chain-registry/master/osmosis/images/osmo.png';
  OSMOSIS_CHAIN_ID = 'osmosis-1';

  activeIndex: number | undefined = 0;

  activeIndexChange(index: any) {
    this.activeIndex = index;
  }

  constructor() {}

  ngOnInit(): void {
    this.activeIndexChange(0);
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

  updateIconsOnEvents() {
    let currentIdxTransfer = 0;

    if (!this.statusInformation) return;

    if (this.statusInformation.next_blocking_transfer) {
      const idxNextBlockedTransfer =
        this.statusInformation.next_blocking_transfer.transfer_sequence_index;

      this.events.map((event) => {
        if (idxNextBlockedTransfer > currentIdxTransfer) {
          event.icon = 'pi pi-check-circle';
          if (event.operationType === 'Transfer') {
            currentIdxTransfer++;
          }
        }
      });
    } else if (this.statusInformation.state === 'STATE_COMPLETED_SUCCESS') {
      this.events.map((event) => {
        event.icon = 'pi pi-check-circle';
      });
    } else if (this.statusInformation.state === 'STATE_COMPLETED_ERROR') {
      this.events.map((event) => {
        if (event.icon === 'pi pi-spin pi-spinner') {
          event.icon = 'pi pi-exclamation-circle';
        }
      });
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
    operations.forEach((operation) => {
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
        console.log(this.previewInformation?.chain_ids);
        const exitChain = this.chains.find(
          (chain) =>
            this.previewInformation?.chain_ids[
              idxOfOperation + idxAdditionalForTransfersPreSwap
            ] === chain.chain_id
        );
        keys.forEach((key) => {
          this.assets?.chain_to_assets_map[key].assets.find((asset) => {
            if (
              // @ts-ignore
              asset.denom === operation.transfer?.dest_denom
            ) {
              console.log(asset);
              // @ts-ignore
              console.log(operation.transfer?.dest_denom);
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

        console.log(event);
      } else if (Object.keys(operation)[0] === 'swap') {
        event.operationType = 'Swap';
        console.log(operation);
        if (this.assets === undefined || !this.assets.chain_to_assets_map) {
          return;
        }
        const operationM = operation as SwapWrapper;
        const keys = Object.keys(this.assets?.chain_to_assets_map);
        console.log(keys);
        let swapDenomIn: Asset;
        let swapDenomOut: Asset;
        keys.forEach((key) => {
          this.assets?.chain_to_assets_map[key].assets.forEach((asset) => {
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
        console.log(event);
        if (idxAdditionalForTransfersPreSwap === 1) {
          idxAdditionalForTransfersPreSwap = 0;
        }
      }
      this.events.push(event);
    });
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
  icon: string = 'pi pi-spin pi-spinner';
  next_blocking_transfer: number = 0;
}
