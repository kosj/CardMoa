export type CardCompany = 'SHINHAN' | 'LOTTE' | 'UNKNOWN';

export interface Transaction {
  id: string;
  user_id: string;
  card_company: CardCompany;
  approved_at: string;
  merchant: string;
  amount: number;
  currency: string;
  created_at: string;
}

export interface ParsedTransaction {
  card_company: CardCompany;
  approved_at: string;
  merchant: string;
  amount: number;
  currency: string;
}

export interface WebhookRequestBody {
  text: string;
  userId: string;
}

export interface WebhookResponse {
  success: boolean;
  inserted: number;
  skipped?: number;
  transactions?: ParsedTransaction[];
  error?: string;
}
