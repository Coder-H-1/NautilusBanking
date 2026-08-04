export type BankName = "CPB" | "EB" | "SB";

export interface UserAccount {
  id: string;
  username: string;
  name: string;
  email: string;
  role: string;
  balance: number;
  bank_name: BankName;
  created_at?: string;
}

export interface AuthState {
  user: UserAccount | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginPayload {
  username: string;
  password?: string;
  role?: string;
}

export interface RegisterPayload {
  username: string;
  password?: string;
  name: string;
  email: string;
  bank_name: BankName;
  initial_balance?: number;
}
