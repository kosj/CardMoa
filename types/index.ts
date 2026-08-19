export type CardCompany = 'SHINHAN' | 'LOTTE' | 'TUITION' | 'UNKNOWN';

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
  /** '국내(원화) 결제 포함'이 꺼져 있어 저장하지 않은 건수 */
  excludedDomestic?: number;
  transactions?: ParsedTransaction[];
  error?: string;
}
