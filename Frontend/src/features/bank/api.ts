import { apiRequest } from "@/lib/apiClient";
import { BankName, UserAccount } from "@/features/auth/types";

export interface BankListResponse {
  banks: string[];
}

export interface BankUserResponse {
  success: boolean;
  account_holder_name: string;
  balance: number;
  bank_user_id: string;
  message?: string;
}

export interface TransferRequestPayload {
  sender_account_holder_name: string;
  sender_bank_id: BankName;
  sender_bank_user_id: string;
  receiver_bank_id: BankName;
  receiver_bank_user_id: string;
  amount: number;
}

export interface TransferResponseData {
  success: boolean;
  transaction_id?: string;
  status?: string;
  message?: string;
}

export interface QRResponseData {
  success: boolean;
  qr_image_base64: string;
  expires_at: string;
  message?: string;
}

export async function fetchBankList() {
  return apiRequest<BankListResponse>("/bank");
}

export async function fetchUserDetails(bankId: BankName, bankUserId: string) {
  return apiRequest<BankUserResponse>("/bank/req", {
    method: "POST",
    body: JSON.stringify({
      bank_id: bankId,
      bank_user_id: bankUserId,
    }),
  });
}

export async function executeTransfer(payload: TransferRequestPayload) {
  return apiRequest<TransferResponseData>("/bank/req/sender", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function requestFaucetFunds(bankId: BankName, bankUserId: string, amount: number) {
  return apiRequest<BankUserResponse>("/bank/userReq", {
    method: "POST",
    body: JSON.stringify({
      bank_id: bankId,
      bank_user_id: bankUserId,
      amount,
    }),
  });
}

export async function fetchEncryptedQR(bankId: BankName, bankUserId: string) {
  return apiRequest<QRResponseData>("/qr/generate", {
    method: "POST",
    body: JSON.stringify({
      bank_id: bankId,
      bank_user_id: bankUserId,
    }),
  });
}

export async function refreshEncryptedQR(bankId: BankName, bankUserId: string) {
  return apiRequest<QRResponseData>("/qr/update", {
    method: "POST",
    body: JSON.stringify({
      bank_id: bankId,
      bank_user_id: bankUserId,
    }),
  });
}

export async function fetchFaucetQR(bankId: BankName, bankUserId: string, amount: number) {
  return apiRequest<QRResponseData>("/qr/faucet/generate", {
    method: "POST",
    body: JSON.stringify({
      bank_id: bankId,
      bank_user_id: bankUserId,
      amount,
    }),
  });
}

export async function claimFaucetQR(bankId: BankName, bankUserId: string, encryptedData: string) {
  return apiRequest<BankUserResponse>("/qr/faucet/claim", {
    method: "POST",
    body: JSON.stringify({
      bank_id: bankId,
      bank_user_id: bankUserId,
      encrypted_data: encryptedData,
    }),
  });
}

