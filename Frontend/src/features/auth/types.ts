export type BankName = "CPB" | "EB" | "SB";

export interface UserAccount {
  id: string;
  username: string;
  name: string;
  email: string;
  role: string;
  balance: number;
  bank_name: BankName;
  status?: string;
  deletion_requested_at?: string;
  created_at?: string;
}

export interface AuthState {
  user: UserAccount | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface CustomLoginPayload {
  account_holder_name: string;
  email: string;
  bank_id: BankName;
  password?: string;
}

export interface CustomSignupPayload {
  account_holder_name: string;
  full_name?: string;
  email: string;
  bank_id: BankName;
  password?: string;
  policy_accepted?: boolean;
}

export interface OTPVerifyPayload {
  email: string;
  bank_id: BankName;
  otp_code: string;
  account_holder_name?: string;
  flow_type?: "login" | "signup";
}

export interface AuthServerResponse {
  success: boolean;
  message: string;
  requires_otp?: boolean;
  access_token?: string;
  bank_user_id?: number;
  bank_id?: string;
  account_holder_name?: string;
  email?: string;
  balance?: number;
  status?: string;
  deletion_requested_at?: string;
  deletion_scheduled_for?: string;
}
