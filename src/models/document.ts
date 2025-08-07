export interface Document {
  id: string;
  assetId: string;
  type: string;
  url: string;
  hash: string;
  uploadedAt: Date;
  uploadedBy: string;
}
