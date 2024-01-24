import { EventEmitter, HostListener, Injectable } from '@angular/core';
import { Event } from '@cosmjs/stargate';

@Injectable({
  providedIn: 'root',
})
export class WalletService {
  //private leap;
  //private keplr;
  public wallet_primary: any;
  public wallet_secondary: any;
  public wallet_primary_name!: string;
  private KEPLR = 'keplr';
  private LEAP = 'leap';

  public walletConnected: EventEmitter<boolean> = new EventEmitter<boolean>();

  private _wallet_primary_connected: boolean = false;
  public get wallet_primary_connected(): boolean {
    return this._wallet_primary_connected;
  }
  public set wallet_primary_connected(value: boolean) {
    this._wallet_primary_connected = value;
    this.walletConnected.emit(value);
  }

  constructor() {}

  async connectToWallet(wallet: string, chain_id?: string) {
    this.wallet_primary_name = wallet;
    console.log('wallet name', this.wallet_primary_name);
    switch (this.wallet_primary_name) {
      case this.LEAP:
        const { leap } = <any>window;
        this.wallet_primary = leap;
        console.log('leap wallet', this.wallet_primary);
        if (!chain_id) {
          await this.wallet_primary.enable(['juno-1']);
        } else {
          await this.wallet_primary.enable([chain_id]);
        }
        if (!this.wallet_primary) {
          console.log('leap wallet not installed');
        } else {
          const key = await this.wallet_primary.getKey(
            chain_id ? chain_id : 'juno-1'
          );
          this.wallet_primary_connected = true;
          console.log(
            chain_id ? chain_id : 'juno-1' + ' address on leap',
            key.bech32Address
          );
        }
        break;
      case this.KEPLR:
        const { keplr } = <any>window;
        this.wallet_primary = keplr;
        console.log('keplr wallet', this.wallet_primary);
        if (!chain_id) {
          await this.wallet_primary.enable(['juno-1']);
        } else {
          await this.wallet_primary.enable([chain_id]);
        }
        if (!this.wallet_primary) {
          console.log('keplar wallet not installed');
        } else {
          const key = await this.wallet_primary.getKey(
            chain_id ? chain_id : 'juno-1'
          );
          this.wallet_primary_connected = true;
          console.log(
            chain_id ? chain_id : 'juno-1' + ' address on leap',
            key.bech32Address
          );
          /*  this.wallet_primary.addEventListener(
            'keplr_keystorechange',
            () => {
              console.log(
                'Key store in Keplr is changed. You may need to refetch the account info.'
              );
              this.keyStoreChanged.emit(true);
            },
            true
          );
          console.log('passa aqui'); */
        }
        break;
    }
  }

  async enableChain(chain_id: string): Promise<string> {
    await this.wallet_primary.enable([chain_id]);
    return await this.wallet_primary.getKey(chain_id);
  }

  async disconnectWallet() {
    switch (this.wallet_primary_name) {
      case this.LEAP:
        await this.wallet_primary.disconnect();
        console.log('leap disconnect');
        break;
      case this.KEPLR:
        await this.wallet_primary.disable();
        console.log('keplr disconnect');
        break;
    }
    this.wallet_primary = undefined;
    this.wallet_primary_connected = false;
  }

  async getAccounts() {
    const offlineSigner = this.wallet_primary.getOfflineSigner('juno-1');

    const accounts = await offlineSigner.getAccounts();
    console.log('accounts', accounts);
  }

  async getAddressForChain(chainID: string): Promise<string> {
    const key = await this.wallet_primary.getKey(chainID);
    console.log(chainID + 'address', key.bech32Address);
    return key.bech32Address.toString();
  }
}
