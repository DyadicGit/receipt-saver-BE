import { Request } from 'express';
import { ResponseData } from '../config/handlerCreator';
import {
  getReceiptFromRequest,
  ImageKey,
  Receipt,
  ReceiptWithImages,
  RequestWithReceiptAndFiles,
  ResponsiveImageDataList,
  setDefaults
} from '../config/DomainTypes';
import { ObjectIdentifierList } from 'aws-sdk/clients/s3';
import repository, { ImageMetadataList } from './repository';

const { db, storage } = repository;

type ReceiptWithImagesResponse = Promise<ResponseData & { body: ReceiptWithImages }>;
const create = async (req: RequestWithReceiptAndFiles): ReceiptWithImagesResponse => {
  try {
    const receiptFromRequest = getReceiptFromRequest(req);
    let imageKeys = [];
    if (req.body.uploadedImages.length) {
      imageKeys = await storage.resizeAndUploadImages(req.body.uploadedImages);
    }
    const newReceipt: Receipt = { ...receiptFromRequest, images: receiptFromRequest.images.concat(imageKeys) };
    await db.createReceiptInDB(newReceipt);
    const responsiveImageData = await storage.getImagesUrls(newReceipt.images);
    return { body: { receipt: setDefaults({} as any), images: responsiveImageData } } as any;
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
export const pipe = (...fns) => x => fns.reduce((v, f) => f(v), x);
const flattenToArray = (imageKeys: ImageKey[]): string[] => imageKeys.flatMap(img => [img.orig, img.px320, img.px600, img.px900]);
const dontExistIn = (imageKeysToSearch: ImageKey[]) => {
  const arrayToSearch = flattenToArray(imageKeysToSearch);
  return (imageKeys: string[]) => {
    imageKeys.filter(imgKey => !arrayToSearch.includes(imgKey));
  };
};
const toObjectIdentifiers = (imageKeys: string[]): ObjectIdentifierList => imageKeys.map(Key => ({ Key }));

const edit = async (req: RequestWithReceiptAndFiles): ReceiptWithImagesResponse => {
  const receiptFromRequest = getReceiptFromRequest(req);
  try {
    let uploadedImageKeys = [];
    if (req.body.uploadedImages.length) {
      uploadedImageKeys = await storage.resizeAndUploadImages(req.body.uploadedImages);
    }
    const receiptFromDb = await db.getReceiptFromDB(receiptFromRequest.id);
    const newReceipt: Receipt = { ...receiptFromRequest, images: receiptFromRequest.images.concat(uploadedImageKeys) };
    const imagesToRemove: ObjectIdentifierList = pipe(
      flattenToArray,
      dontExistIn(receiptFromRequest.images),
      toObjectIdentifiers
    )(receiptFromDb.images);
    if (imagesToRemove.length) {
      await storage.deleteImages(imagesToRemove);
    }
    await db.updateReceiptInDB(newReceipt);
    const images = await storage.getImagesUrls(newReceipt.images);
    return { body: { receipt: newReceipt, images } };
  } catch (e) {
    console.error(`Error updating, id: ${receiptFromRequest.id}: `, e);
    return { code: 400, body: { error: 'Could not update', message: e.message } } as any;
  }
};

const deleteById = async ({ params: { id } }: Request): Promise<ResponseData & { body: { success: boolean; error?: string } }> => {
  try {
    const receiptFromDb = await db.getReceiptFromDB(id);
    const imagesToRemove: ObjectIdentifierList = pipe(
      flattenToArray,
      toObjectIdentifiers
    )(receiptFromDb.images);
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

const getImagesByReceiptId = async ({ params: { id } }: Request): Promise<ResponseData & { body: ResponsiveImageDataList }> => {
  try {
    const receipt: Receipt = await db.getReceiptFromDB(id);
    if (receipt) {
      const responsiveImageData = await storage.getImagesUrls(receipt.images);
      return { code: 200, body: responsiveImageData };
    } else {
      return { code: 404, body: { error: `Receipt by id:${id} not found` } } as any;
    }
  } catch (e) {
    console.log('Error', e);
    return { code: 400, body: e };
  }
};
export default { create, getAll, getById, edit, deleteById, getAllImages, getImagesByReceiptId };
