import { Request } from 'express';
import uuid = require('uuid');

export interface Receipt {
  id: string;
  creationDate: number;
  images: string[];
  shopName: string;
  itemId: string;
  itemName: string;
  buyDate?: number;
  totalPrice: number;
  warrantyPeriod: number; // in seconds
  userID: string;
}

export interface Item {
  id: string;
  receiptID: string;
  name: string;
  attachment: string;
}

export interface User {
  id: string;
  email: string;
  social: string;
  receiptId: string;
}

export type ReceiptWithImages = { receipt: Receipt; images: ImageData[] };
export type ImageData = { url: string; key: string };

export const setDefaults = (receipt: Receipt): Receipt => ({
  id: receipt.id || uuid.v1(),
  images: receipt.images || [],
  shopName: receipt.shopName || null,
  itemId: receipt.itemId || null,
  itemName: receipt.itemName || null,
  buyDate: receipt.buyDate || new Date().getTime(),
  creationDate: receipt.creationDate || new Date().getTime(),
  totalPrice: receipt.totalPrice || null,
  warrantyPeriod: receipt.warrantyPeriod || null,
  userID: receipt.userID || null
});

export const getReceiptFromRequest = (request: RequestWithFiles): Receipt => setDefaults(JSON.parse(request.body.receipt));
export const getUploadedImageKeys = (request: RequestWithFiles): string[] => (request.files.length ? request.files.map(f => f.key) : []);

export interface RequestWithFiles extends Request {
  files: any[];
  body: { receipt: string };
}

export enum AttachmentFieldName {
  RECEIPT = 'uploadedReceiptImage'
}
