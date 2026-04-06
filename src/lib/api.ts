import axios from "axios";
import { getLanguage } from "@/lib/language";
import {
  JsonRpcRequest,
  JsonRpcResponse,
  CardBindSmsParams,
  CardBindSmsResult,
  UserLoginParams,
  UserLoginResult,
  TransferCreateParams,
  TransferCreateResult,
  TransferConfirmParams,
  TransferConfirmResult,
  TransferCancelParams,
  TransferCancelResult,
  UserLoginConfirmParams,
  UserLoginConfirmResult,
  ResendOtpParams,
  ResendOtpResult,
  CheckBalanceParams,
  CheckBalanceResult,
  TransferDetails,
  Card,
  Transaction,
  CardListParams,
  PuliQaytarishParams,
  PuliQaytarishResult,
  CardAddRequestParams,
  CardAddRequestResult,
  CardAddConfirmParams,
  CardAddConfirmResult,
  CardBlockRequestParams,
  CardBlockRequestResult,
  CardBlockConfirmParams,
  CardBlockConfirmResult,
  CardDeleteRequestParams,
  CardDeleteRequestResult,
  CardDeleteConfirmParams,
  CardDeleteConfirmResult,
  CheckCardParams,
  CheckCardResult,
  CardInfoParams,
  CardInfoResult,
} from "@/types";

const API_BASE_URL = "/api/v1/rpc/";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

let requestId = 1;

async function rpcCall<TParams, TResult>(
  method: string,
  params: TParams
): Promise<TResult> {
  const request: JsonRpcRequest<TParams> = {
    jsonrpc: "2.0",
    method,
    params: {
      ...params,
      lang: getLanguage(),
    },
    id: requestId++,
  };

  try {
    const response = await apiClient.post<JsonRpcResponse<TResult>>("", request);
    if (response.data.error) {
      console.log(`RPC Error (${method}):`, response.data.error);
      const error = new Error(response.data.error.message) as Error & { code?: number; data?: unknown };
      error.code = response.data.error.code;
      error.data = response.data.error.data;
      throw error;
    }

    const result = response.data.result;
    // Handle business logic errors returned inside the result object
    if (result && typeof result === "object" && (result as any).status === "error") {
      const error = new Error((result as any).message || "Unknown business error") as Error & { code?: number; data?: unknown };
      error.code = (result as any).code || 0;
      throw error;
    }

    return result as TResult;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        console.log(`HTTP Error (${method}):`, error.response.status, error.response.data);
      } else if (error.request) {
        console.log(`Network Error (${method}): No response received`, error.request);
      } else {
        console.log(`Request Error (${method}):`, error.message);
      }
    } else if (error instanceof Error) {
      console.log(`Error (${method}):`, error.message);
    }
    throw error;
  }
}

export const api = {
  transferCreate: (params: TransferCreateParams) =>
    rpcCall<TransferCreateParams, TransferCreateResult>(
      "transfer_create",
      params
    ),

  transferConfirm: (params: TransferConfirmParams) =>
    rpcCall<TransferConfirmParams, TransferConfirmResult>(
      "transfer_confirm",
      params
    ),

  transferCancel: (params: TransferCancelParams) =>
    rpcCall<TransferCancelParams, TransferCancelResult>(
      "transfer_cancel",
      params
    ),

  cardBindSms: (params: CardBindSmsParams) =>
    rpcCall<CardBindSmsParams, CardBindSmsResult>("card_bind_sms", params),

  userLogin: (params: UserLoginParams) =>
    rpcCall<UserLoginParams, UserLoginResult>("user_login", params),

  userLoginConfirm: (params: UserLoginConfirmParams) =>
    rpcCall<UserLoginConfirmParams, UserLoginConfirmResult>("user_login_confirm", params),

  resendOtp: (params: ResendOtpParams) =>
    rpcCall<ResendOtpParams, ResendOtpResult>("resend_otp", params),

  checkBalance: (params: CheckBalanceParams) =>
    rpcCall<CheckBalanceParams, CheckBalanceResult>("check_balance", params),

  cardList: (params: CardListParams) =>
    rpcCall<CardListParams, Card[]>("card_list", params),

  puliQaytarish: (params: PuliQaytarishParams) =>
    rpcCall<PuliQaytarishParams, PuliQaytarishResult>("puli_qaytarish", params),

  cardAddRequest: (params: CardAddRequestParams) =>
    rpcCall<CardAddRequestParams, CardAddRequestResult>("card_add_request", params),

  cardAddConfirm: (params: CardAddConfirmParams) =>
    rpcCall<CardAddConfirmParams, CardAddConfirmResult>("card_add_confirm", params),

  cardBlockRequest: (params: CardBlockRequestParams) =>
    rpcCall<CardBlockRequestParams, CardBlockRequestResult>("card_block_request", params),

  cardBlockConfirm: (params: CardBlockConfirmParams) =>
    rpcCall<CardBlockConfirmParams, CardBlockConfirmResult>("card_block_confirm", params),

  cardDeleteRequest: (params: CardDeleteRequestParams) =>
    rpcCall<CardDeleteRequestParams, CardDeleteRequestResult>("card_delete_request", params),

  cardDeleteConfirm: (params: CardDeleteConfirmParams) =>
    rpcCall<CardDeleteConfirmParams, CardDeleteConfirmResult>("card_delete_confirm", params),

  checkCard: (params: CheckCardParams) =>
    rpcCall<CheckCardParams, CheckCardResult>("card_check", params),

  cardInfo: (params: CardInfoParams) =>
    rpcCall<CardInfoParams, CardInfoResult>("card_info", params),
};
