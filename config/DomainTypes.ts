import uuid = require('uuid');
import { Request } from 'express';

export interface Receipt {
  id: string;
  creationDate: number;
  images: ResponsiveImageDataList;
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
export type ReceiptWithImages = { receipt: Receipt; images: ResponsiveImageDataList };
export type ResponsiveImageDataList = ResponsiveImageData[];
export type ResponsiveImageData = { orig: ImageData; px320: ImageData; px600: ImageData; px900: ImageData };
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

export const getReceiptFromRequest = (request: RequestWithReceiptAndFiles): Receipt => setDefaults(request.body.receipt);

export interface RequestWithReceiptAndFiles extends Request {
  body: {
    receipt: Receipt;
    uploadedImages: UploadedImages[];
  };
}
export interface UploadedImages {
  base64: string;
  contentType: string;
}
export enum AttachmentFieldName {
  RECEIPT = 'uploadedReceiptImage'
}
