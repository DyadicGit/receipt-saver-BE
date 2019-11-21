import { Request } from 'express';
import { ResponseData } from '../config/handlerCreator';
import { getReceiptFromRequest, getUploadedImageKeys, ImageData, Receipt, ReceiptWithImages, RequestWithFiles } from '../config/DomainTypes';
import { ObjectIdentifierList } from 'aws-sdk/clients/s3';
import repository, { ImageMetadataList } from './repository';

const { db, storage } = repository;

type ReceiptWithImagesResponse = Promise<ResponseData & { body: ReceiptWithImages }>;

const create = async (req: RequestWithFiles): ReceiptWithImagesResponse => {
  const uploadedImageKeys = getUploadedImageKeys(req);
  const receiptFromRequest = getReceiptFromRequest(req);
  const newReceipt: Receipt = { ...receiptFromRequest, images: receiptFromRequest.images.concat(uploadedImageKeys) };
  try {
    await db.createReceiptInDB(newReceipt);
    const images = await storage.getImagesUrls(newReceipt.images);
    return { body: { receipt: newReceipt, images } };
  } catch (e) {
    console.error('Error creating', e);
    return { code: 400, body: { error: 'Error creating', message: e.message } } as any;
  }
};

interface NormalizedReceipts {
  byId: { [id: string]: Receipt };
  order: string[];
}
const byDate = (a, b) => (a.buyDate | a.creationDate) - (b.buyDate | b.creationDate);

const getAll = async (): Promise<ResponseData & { body: NormalizedReceipts }> => {
  try {
    const receipts: Receipt[] = await db.getAllReceiptsFromDB();
    const initial: NormalizedReceipts = { byId: {}, order: [] };
    const normalizedReceipts = receipts.sort(byDate).reduce((acc: NormalizedReceipts, receipt: Receipt) => {
      acc.byId[receipt.id] = receipt;
      acc.order.push(receipt.id);
      return acc;
    }, initial);
    return { body: normalizedReceipts };
  } catch (e) {
    console.error('Error retrieving', e);
    return { code: 400, body: { error: 'Error retrieving', message: e.message } } as any;
  }
};

const getById = async ({ params: { id } }: Request): Promise<ResponseData & { body: Receipt }> => {
  try {
    const receipt = await db.getReceiptFromDB(id);
    if (receipt) {
      return { body: receipt };
    } else {
      return { code: 404, body: { error: `Receipt by id:${id} not found` } } as any;
    }
  } catch (e) {
    console.error('Error retrieving', e);
    return { code: 400, body: { error: 'Error retrieving', message: e.message } } as any;
  }
};
const edit = async (req: RequestWithFiles): ReceiptWithImagesResponse => {
  const uploadedImageKeys = getUploadedImageKeys(req);
  const receiptFromRequest = getReceiptFromRequest(req);
  const newReceipt: Receipt = { ...receiptFromRequest, images: receiptFromRequest.images.concat(uploadedImageKeys) };
  try {
    const receiptFromDb = await db.getReceiptFromDB(receiptFromRequest.id);
    const imagesToRemove: ObjectIdentifierList = receiptFromDb.images.filter(dbId => !receiptFromRequest.images.includes(dbId)).map(Key => ({ Key }));
    if (imagesToRemove.length) {
      await storage.deleteImages(imagesToRemove);
    }
    await db.updateReceiptInDB(newReceipt);
    const images = await storage.getImagesUrls(newReceipt.images);
    return { body: { receipt: newReceipt, images } };
  } catch (e) {
    console.error(`Error updating, id: ${newReceipt.id}: `, e);
    return { code: 400, body: { error: 'Could not update', message: e.message } } as any;
  }
};

const deleteById = async ({ params: { id } }: Request): Promise<ResponseData & { body: { success: boolean; error?: string } }> => {
  try {
    const receiptFromDb = await db.getReceiptFromDB(id);
    const imagesToRemove: ObjectIdentifierList = receiptFromDb.images.map(Key => ({ Key }));
    if (imagesToRemove.length) {
      await storage.deleteImages(imagesToRemove);
    }
    await db.deleteReceiptFromDB(id);
    return { body: { success: true } };
  } catch (e) {
    console.error(`Error deleting, id ${id}`, e);
    return { code: 400, body: { success: false, error: 'Could not delete' } };
  }
};

const getAllImages = async (): Promise<ResponseData & { body: ImageMetadataList }> => {
  try {
    return { code: 200, body: await storage.getAllImagesMetadata() };
  } catch (e) {
    console.error('Error getAllImages', e);
    return { code: 400, body: e };
  }
};

const getImage = async ({ params: { key } }: Request): Promise<ResponseData & { body: ImageData }> => {
  try {
    const imageResponse: ImageData = await storage.getImageUrl(key);
    return { code: 200, body: imageResponse };
  } catch (e) {
    console.log('Error', e);
    return { code: 400, body: e };
  }
};

const getImagesByReceiptId = async ({ params: { id } }: Request): Promise<ResponseData & { body: ImageData[] }> => {
  try {
    const receipt: Receipt = await db.getReceiptFromDB(id);
    if (receipt) {
      const imageResponses: ImageData[] = await storage.getImagesUrls(receipt.images);
      return { code: 200, body: imageResponses };
    } else {
      return { code: 404, body: { error: `Receipt by id:${id} not found` } } as any;
    }
  } catch (e) {
    console.log('Error', e);
    return { code: 400, body: e };
  }
};
module.exports = { create, getAll, getById, edit, deleteById, getAllImages, getImage, getImagesByReceiptId };
