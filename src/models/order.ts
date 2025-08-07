export enum OrderType {
  BUY = 'BUY',
  SELL = 'SELL',
}

export enum OrderMethod {
  MARKET = 'MARKET',
  LIMIT = 'LIMIT',
}

export enum OrderStatus {
  PENDING = 'PENDING',
  PARTIAL = 'PARTIAL',
  FILLED = 'FILLED',
  CANCELLED = 'CANCELLED',
}

export interface Order {
  id: string;
  tokenId: string;
  userId: string;
  orderType: OrderType;
  orderMethod: OrderMethod;
  quantity: string;
  price?: string;
  totalValue: string;
  status: OrderStatus;
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
  executedAt?: Date;
  executedPrice?: string;
}
