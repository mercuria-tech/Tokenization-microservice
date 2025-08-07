export enum AssetType {
  REAL_ESTATE = 'REAL_ESTATE',
  COMMODITY = 'COMMODITY',
  SECURITY = 'SECURITY',
  ART = 'ART',
}

export enum AssetStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  TOKENIZED = 'TOKENIZED',
  RETIRED = 'RETIRED',
}

export interface Asset {
  id: string;
  type: AssetType;
  name: string;
  description?: string;
  totalValue: string;
  currency: string;
  location?: string;
  metadata?: Record<string, any>;
  status: AssetStatus;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  verifiedBy?: string;
  verifiedAt?: Date;
}
