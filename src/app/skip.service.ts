import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import {
  Asset,
  Chains,
  DestinationFungibleAssets,
  FungibleAssets,
  MessagesResponse,
  RequestMessages,
  StatusInformation,
  SwapTransferRouteSummary,
  SwapVenue,
} from './skip';

@Injectable({
  providedIn: 'root',
})
export class SkipService {
  private skip_api_base_v1 = 'https://api.skip.money/v1/';
  private skip_api_base_v2 = 'https://api.skip.money/v2/';
  constructor(private http: HttpClient) {}

  getChains(): Observable<Chains> {
    return this.http.get<Chains>(this.skip_api_base_v1 + 'info/chains');
  }

  getAllAvailableAssetsForAllChains(): Observable<FungibleAssets> {
    return this.http.get<FungibleAssets>(
      this.skip_api_base_v1 + 'fungible/assets'
    );
    /* .pipe(
        map((res) => {
          res.chain_to_assets_map = new Map(
            Object.entries(res.chain_to_assets_map)
          );
          return res;
        })
      ) */
  }

  getAllAvailableAssetsForChain(chain_id: string): Observable<FungibleAssets> {
    const params = new HttpParams().set('chain_id', chain_id);
    return this.http.get<FungibleAssets>(
      this.skip_api_base_v1 + 'fungible/assets',
      {
        params: params,
      }
    );
    /* .pipe(
        map((res) => {
          res.chain_to_assets_map = new Map(
            Object.keys(res.chain_to_assets_map), res.chain_to_assets_map.
          );
          return res;
        })
      ); */
  }

  getPossibleDestinationsByDenom(
    denom: string,
    source_asset_chain_id: string,
    allow_multi_tx?: boolean,
    include_cw20_assets?: boolean,
    client_id?: string
  ): Observable<DestinationFungibleAssets> {
    const body = {
      allow_multi_tx: allow_multi_tx ? allow_multi_tx : false,
      include_cw20_assets: include_cw20_assets ? include_cw20_assets : false,
      source_asset_chain_id: source_asset_chain_id,
      source_asset_denom: denom,
      client_id: client_id ? client_id : 'skip-api-docs',
    };

    return this.http
      .post<DestinationFungibleAssets>(
        this.skip_api_base_v1 + 'fungible/assets_from_source',
        body
      )
      .pipe(
        map((res) => {
          res.dest_assets = new Map(Object.entries(res.dest_assets));
          return res;
        })
      );
  }

  getRoutesForSwapOrTransfer(
    amount_in: string,
    source_asset_denom: string,
    source_asset_chain_id: string,
    dest_asset_denom: string,
    dest_asset_chain_id: string,
    cumulative_affiliate_fee_bps?: string | null,
    swap_venue?: SwapVenue,
    client_id?: string
  ): Observable<SwapTransferRouteSummary> {
    return this.http.post<SwapTransferRouteSummary>(
      this.skip_api_base_v2 + 'fungible/route',
      {
        amount_in: amount_in,
        source_asset_denom: source_asset_denom,
        source_asset_chain_id: source_asset_chain_id,
        dest_asset_denom: dest_asset_denom,
        dest_asset_chain_id: dest_asset_chain_id,
        cumulative_affiliate_fee_bps: cumulative_affiliate_fee_bps
          ? cumulative_affiliate_fee_bps
          : '0',
        swap_venue: swap_venue ? swap_venue : null,
        client_id: client_id ? client_id : 'skip-api-docs',
        allow_unsafe: true,
      }
    );
  }

  trackTx(txHash: string, chainId: string): Observable<any> {
    return this.http.post<any>(this.skip_api_base_v2 + 'tx/track', {
      tx_hash: txHash,
      chain_id: chainId,
    });
  }

  getTxStatus(txHash: string, chainId: string): Observable<StatusInformation> {
    let params = new HttpParams();
    params = params.append('tx_hash', txHash).append('chain_id', chainId);
    //params.set('chain_id', chainId);
    return this.http.get<StatusInformation>(
      this.skip_api_base_v2 + 'tx/status',
      {
        params,
      }
    );
  }

  getMessagesForSwapOrTransfer(
    request: RequestMessages
  ): Observable<MessagesResponse> {
    return this.http.post<MessagesResponse>(
      this.skip_api_base_v1 + 'fungible/msgs',
      request
    );
  }

  submitTx(tx: string, chain_id: string): Observable<any> {
    return this.http.post<any>(this.skip_api_base_v1 + 'tx/submit', {
      tx: tx,
      chain_id: chain_id,
    });
  }
}
