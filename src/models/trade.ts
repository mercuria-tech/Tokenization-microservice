export enum SettlementStatus {
  PENDING = 'pending',
  SETTLED = 'settled',
  FAILED = 'failed',
}

export interface Trade {
  id: string;
  buyOrderId: string;
  sellOrderId: string;
  tokenId: string;
  quantity: string;
  price: string;
  totalValue: string;
  buyerId: string;
  sellerId: string;
  executedAt: Date;
  settlementStatus: SettlementStatus;
  settlementHash?: string;
}
