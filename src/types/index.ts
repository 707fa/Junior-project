export type JsonRpcRequest<T> = {
  jsonrpc: "2.0";
  method: string;
  params: T;
  id: number;
};

export type JsonRpcResponse<T> = {
  jsonrpc: "2.0";
  result?: T;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
  id: number;
};

export interface UserLoginParams {
  first_name: string;
  last_name: string;
  phone: string;
  lang?: "uz" | "ru" | "en";
}

export interface UserLoginResult {
  status: string;
  message?: string;
}

export interface CardBindSmsParams {
  card_number: string;
  phone: string;
  lang?: "uz" | "ru" | "en";
}

export interface CardBindSmsResult {
  status: "enabled" | "already_enabled" | string;
  message?: string;
  phone?: string;
}

export interface CardAddRequestParams {
  card_number: string;
  phone: string;
  lang?: "uz" | "ru" | "en" | string;
}

export interface CardAddRequestResult {
  status: string;
  message?: string;
  expires_in?: number;
}

export interface CardAddConfirmParams {
  card_number: string;
  otp: string;
  lang?: "uz" | "ru" | "en" | string;
}

export interface CardAddConfirmResult {
  status: string;
  message?: string;
  data?: {
    card_number?: string;
    card_type?: string;
    owner_name?: string;
    balance?: number;
    is_sms_enabled?: boolean;
    card_expire?: string;
  };
}

export interface CardBlockRequestParams {
  card_number: string;
  lang?: "uz" | "ru" | "en" | string;
}

export interface CardBlockRequestResult {
  status: string;
  otp_sent: boolean;
  message?: string;
  expires_in?: number;
}

export interface CardBlockConfirmParams {
  card_number: string;
  otp: string;
  lang?: "uz" | "ru" | "en" | string;
}

export interface CardBlockConfirmResult {
  status: string;
  message?: string;
}

export interface CardDeleteRequestParams {
  card_number: string;
  lang?: "uz" | "ru" | "en" | string;
}

export interface CardDeleteRequestResult {
  status: string;
  otp_sent: boolean;
  message?: string;
  expires_in?: number;
}

export interface CardDeleteConfirmParams {
  card_number: string;
  otp: string;
  lang?: "uz" | "ru" | "en" | string;
}

export interface CardDeleteConfirmResult {
  status: string;
  message?: string;
}

export interface UserLoginConfirmParams {
  phone: string;
  otp: string;
  lang?: "uz" | "ru" | "en";
}

export interface UserLoginConfirmResult {
  status: string;
  token?: string;
}
export interface Card {
  number: string;
  balance: string;
  cardName: string;
  type: string;
  phone?: string;
  expire?: string;
  owner?: string;
  status?: "active" | "blocked" | "deleted";
}
export interface CheckBalanceParams {
  card_number: string;
  card_expire: string;
  lang?: "uz" | "ru" | "en";
}

export interface CheckBalanceResult {
  card: string;
  card_type: string;
  balance: number;
  message: string;
  owner: string;
  card_expire?: string;
}

export interface TransferCreateParams {
  ext_id: string;
  sender_card_number: string;
  sender_card_expiry: string;
  receiver_card_number: string;
  sending_amount: number;
  currency: "USD" | "UZS" | "RUB";
  lang?: "uz" | "ru" | "en";
}

export interface TransferCreateResult {
  ext_id: string;
  state: "created" | string;
  otp_sent: boolean;
  expires_in: number;
}

export interface TransferConfirmParams {
  ext_id: string;
  otp: string;
  lang?: "uz" | "ru" | "en";
}

export interface TransferDetails {
  status: string;
  amount: string;
  date: string;
  sender: string;
  sender_name: string;
  receiver: string;
  receiver_name: string;
}

export interface TransferConfirmResult {
  ext_id: string;
  state: "confirmed" | "created" | string;
  transaction_id?: string;
  details?: TransferDetails;
}

export interface TransferCancelParams {
  ext_id: string;
  lang?: "uz" | "ru" | "en";
}

export interface TransferCancelResult {
  ext_id: string;
  state: "refunded" | "cancelled" | string;
  message: string;
}

export interface PuliQaytarishParams {
  ext_id: string;
  lang?: "uz" | "ru" | "en";
}

export interface PuliQaytarishResult {
  ext_id: string;
  state: "refunded" | "cancelled" | string;
  message: string;
}

export interface ResendOtpParams {
  ext_id: string;
  lang?: "uz" | "ru" | "en";
}

export interface ResendOtpResult {
  ext_id: string;
  otp_sent: boolean;
  expires_in: number;
}

export interface Transaction {
  id: number;
  ext_id?: string;
  title: string;
  amount: string;
  date: string;
  status: string;
  details?: TransferDetails;
}

export interface CardListParams {
  lang?: "uz" | "ru" | "en";
}

export interface TransactionListParams {
  lang?: "uz" | "ru" | "en";
  limit?: number;
}
export interface CheckCardParams {
  receiver_card_number: string;
  lang?: "uz" | "ru" | "en" | string;
}

export interface CheckCardResult {
  receiver_name: string;
  card_type: string;
  status: string;
}

export interface CardInfoParams {
  card_number: string;
  lang?: "uz" | "ru" | "en" | string;
}

export interface CardInfoResult {
  card_id: number;
  card_number: string;
  balance: number;
  currency: string;
  status: string;
  card_type: string;
  owner_name: string;
  is_sms_active: boolean;
  expiry_date: string;
  _from_cache: boolean;
}
