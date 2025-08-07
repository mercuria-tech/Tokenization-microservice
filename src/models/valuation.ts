export enum ValuationMethod {
  APPRAISAL = 'APPRAISAL',
  MARKET = 'MARKET',
  AI_ESTIMATED = 'AI_ESTIMATED',
}

export interface Valuation {
  id: string;
  assetId: string;
  value: string;
  currency: string;
  valuationDate: Date;
  valuerId: string;
  method: ValuationMethod;
  confidence: number;
}
