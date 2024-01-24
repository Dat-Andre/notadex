export interface Chains {
  chains: Chain[];
}

export interface Chain {
  chain_name: string;
  chain_id: string;
  pfm_enabled: boolean;
  bech32_prefix: string;
  logo_uri: string;
  fee_assets: AssetDenomGas[];
  chain_type: string;
}

export interface AssetDenomGas {
  denom: string;
  gas_price_info: GasPriceTiers | null;
}

export interface GasPriceTiers {
  low: string;
  average: string;
  high: string;
}

export interface FungibleAssets {
  chain_to_assets_map: ChainToAssetsMap;
}

export interface ChainToAssetsMap {
  [key: string]: Assets;
}

export interface Assets {
  assets: Asset[];
}

export interface DestinationFungibleAssets {
  dest_assets: Map<string, Asset[]>;
}

export interface Asset {
  denom: string;
  chain_id: string;
  origin_denom: string;
  origin_chain_id: string;
  trace: string;
  is_cw20: boolean;
  is_evm: boolean;
  symbol: string | null;
  name: string | null;
  logo_uri: string | null;
  decimals: number | null;
  token_contract: string | null;
  recommended_symbol: string | null;
  balance: number;
}

export interface SwapVenue {
  name: string;
  chain_id: string;
}

export interface SwapTransferRouteSummary {
  amount_in: string;
  amount_out: string;
  source_asset_denom: string;
  source_asset_chain_id: string;
  dest_asset_denom: string;
  dest_asset_chain_id: string;
  operations: Array<
    TransferWrapper | SwapWrapper | AxelarTransferWrapper | BankSendWrapper
  >;
  chain_ids: string[];
  does_swap: boolean;
  estimated_amount_out: string;
  swap_venue: SwapVenue;
  txs_required: number;
  usd_amount_in: string;
  usd_amount_out: string;
  swap_price_impact_percent: string;
}

export class TransferWrapper {
  transfer: Transfer | undefined;
}

export interface Transfer {
  port: string;
  channel: string;
  chain_id: string;
  pmf_enabled: boolean;
  dest_denom: string;
}

export class SwapWrapper {
  swap: SwapInWrapper | undefined;
}

export interface SwapInWrapper {
  swap_in: SwapIn;
  estimated_affiliate_fee: string;
}

export interface SwapIn {
  price_impact_percent: string;
  swap_amount_in: string;
  swap_venue: SwapVenue;
  swap_operations: SwapOperation[];
}

export interface SwapOutWrapper {
  swap_in: SwapOut;
  estimated_affiliate_fee: string;
}

export interface SwapOut {
  swap_venue: SwapVenue;
  swap_operations: SwapOperation[];
}

export interface SwapOperation {
  pool: string;
  denom_in: string;
  denom_out: string;
  swap_amount_in: string;
  estimated_affiliate_fee: string;
}

export class AxelarTransferWrapper {
  axelar_transfer: AxelarTransfer | undefined;
}

export interface AxelarTransfer {
  from_chain: string;
  from_chain_id: string;
  to_chain: string;
  to_chain_id: string;
  asset: string;
  should_unwrap: boolean;
  fee_amount: string;
  fee_asset: FeeAsset;
}

export interface FeeAsset {
  is_testnet: boolean;
}

export class BankSendWrapper {
  bank_send: any;
}

export class RequestMessages {
  source_asset_denom!: string;
  source_asset_chain_id!: string;
  dest_asset_denom!: string;
  dest_asset_chain_id!: string;
  amount_in!: string;
  amount_out!: string;
  address_list!: string[];
  operations!: Array<
    TransferWrapper | SwapWrapper | AxelarTransferWrapper | BankSendWrapper
  >;
  slippage_tolerance_percent!: string;
  timeout_seconds!: string;
  post_route_handler!: CwContractWrapper | AutoPilotMessageWrapper;
  affiliates!: Affiliate[];
  client_id!: string;
}

export class CwContractWrapper {
  wasm_msg!: WasmMessage;
}

export class WasmMessage {
  contract_address!: string;
  // Json string of the message
  msg!: string;
}

export class AutoPilotMessageWrapper {
  autpilot_msg!: AutoPilotMessage;
}

export class AutoPilotMessage {
  receiver!: string;
  // LIQUID_STAKE or CLAIM
  action!: string;
}

export class Affiliate {
  basis_points_fee!: string;
  address!: string;
}

export interface MessagesResponse {
  msgs: Message[];
}

export interface Message {
  chain_id: string;
  path: string[];
  msg: string;
  msg_type_url: string;
}
