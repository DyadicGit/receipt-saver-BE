import * as uuid from 'uuid';
import { Request } from 'express';
import { DocumentClient } from 'aws-sdk/lib/dynamodb/document_client';
import { PromisedResponse, ResponseData } from '../config/handlerCreator';
import { Receipt, RequestReceipt, setDefaults } from '../config/DomainTypes';
import { DeleteObjectsRequest, ObjectIdentifierList } from 'aws-sdk/clients/s3';
import GetItemOutput = DocumentClient.GetItemOutput;
import GetItemInput = DocumentClient.GetItemInput;
import UpdateItemInput = DocumentClient.UpdateItemInput;

const { s3, dynamoDb } = require('./AwsInstances');

const { TABLE_RECEIPT: TableName, BUCKET_RECEIPTS: Bucket } = process.env;

const getReceipt = async (id): Promise<Receipt | null> => {
  const params: GetItemInput = {
    TableName,
    Key: { id }
  };
  const result: GetItemOutput = await dynamoDb.get(params).promise();
  return result.Item ? (result.Item as Receipt) : null;
};
const updateReceipt = async (receipt: Receipt) => {
  const params: UpdateItemInput = {
    TableName,
    Key: { id: receipt.id },
    UpdateExpression: 'set images = :im, shopName = :sN, itemName = :iN, buyDate = :bD, totalPrice = :tP, warrantyPeriod = :w, userID = :u',
    ExpressionAttributeValues: {
      ':im': receipt.images,
      ':sN': receipt.shopName,
      ':iN': receipt.itemName,
      ':bD': receipt.buyDate,
      ':tP': receipt.totalPrice,
      ':w': receipt.warrantyPeriod,
      ':u': receipt.userID
    }
  };
  return await dynamoDb.update(params).promise();
};
const deleteImages = async (keys: ObjectIdentifierList) => {
  const s3Params: DeleteObjectsRequest = { Bucket, Delete: { Objects: keys } };
  return await s3.deleteObjects(s3Params).promise();
};

const create = async (req: Request & { files: any[] }): PromisedResponse => {
  const body: RequestReceipt = req.body;
  const newReceipt: Receipt = {
    ...setDefaults({
      ...body,
      creationDate: null,
      id: uuid.v1(),
      images: req.files.length ? req.files.map(f => f.key) : []
    })
  };

  try {
    await dynamoDb.put({ TableName, Item: newReceipt }).promise();
    return { body: newReceipt };
  } catch (e) {
    console.error('Error creating', e);
    return { code: 400, body: { error: 'Error creating', message: e.message } };
  }
};

interface NormalizedReceipts {
  byId: { [id: string]: Receipt };
  order: string[];
}
const byDate = (a, b) => (a.buyDate | a.creationDate) - (b.buyDate | b.creationDate);

const getAll = async (): PromisedResponse => {
  try {
    const result = await dynamoDb.scan({ TableName }).promise();
    const receipts: Receipt[] = result.Items;
    const initial: NormalizedReceipts = { byId: {}, order: [] };
    const normalizedReceipts = receipts.sort(byDate).reduce((acc: NormalizedReceipts, receipt: Receipt) => {
      acc.byId[receipt.id] = receipt;
      acc.order.push(receipt.id);
      return acc;
    }, initial);
    return { body: normalizedReceipts };
  } catch (e) {
    console.error('Error retrieving', e);
    return { code: 400, body: { error: 'Error retrieving', message: e.message } };
  }
};

const getById = async ({ params: { id } }: Request): PromisedResponse => {
  try {
    const receipt = getReceipt(id);
    if (receipt) {
      return { body: receipt };
    } else {
      return { code: 404, body: { error: `Receipt by id:${id} not found` } };
    }
  } catch (e) {
    console.error('Error retrieving', e);
    return { code: 400, body: { error: 'Error retrieving', message: e.message } };
  }
};
const edit = async (req): PromisedResponse => {
  const defaultedReceipt = setDefaults({...req.body, images: (typeof req.body.images === 'string') ? req.body.images.split('/') : req.body.images});
  const receipt: Receipt = {
    ...defaultedReceipt,
    images: req.files.length ? defaultedReceipt.images.concat(req.files.map(f => f.key)): defaultedReceipt.images
  };
  try {
    const receiptFromDb = await getReceipt(receipt.id);
    const deletedImages: ObjectIdentifierList = receiptFromDb.images.filter(dbId => !receipt.images.includes(dbId)).map(Key => ({ Key }));
    await deleteImages(deletedImages);
    await updateReceipt(receipt);
    return { body: receipt };
  } catch (error) {
    console.error(`Error updating, id: ${receipt.id}: `, error);
    return { code: 400, body: { error: 'Could not update' } };
  }
};

const deleteById = async ({ params: { id } }: Request): PromisedResponse => {
  try {
    const receiptFromDb = await getReceipt(id);
    const imagesToRemove: ObjectIdentifierList = receiptFromDb.images.map(Key => ({ Key }));
    await deleteImages(imagesToRemove);
    await dynamoDb.delete({ TableName, Key: { id } }).promise();
    return { body: { success: true } };
  } catch (e) {
    console.error(`Error deleting, id ${id}`, e);
    return { code: 400, body: { error: 'Could not delete' } };
  }
};

type AllImageResponse = ResponseData & { body: Array<{ Key: string; LastModified: string }> };
const getAllImages = async (): Promise<AllImageResponse> => {
  try {
    const { Contents } = await s3.listObjects({ Bucket }).promise();
    return { code: 200, body: Contents.map(({ Key, LastModified }) => ({ Key, LastModified })) };
  } catch (e) {
    console.error('Error getAllImages', e);
    return { code: 400, body: e };
  }
};

type ImageResponse = { buffer: { type: string; data: Buffer }; contentType: string; key: string };
const getImageResponse = async (key: string): Promise<ImageResponse> => {
  const resp = await s3.getObject({ Bucket, Key: key }).promise();
  return { buffer: resp.Body, contentType: resp.ContentType, key: resp.Metadata.fieldname };
};

const getImage = async ({ params: { key } }: Request): Promise<ResponseData & { body: ImageResponse }> => {
  try {
    const imageResponse: ImageResponse = await getImageResponse(key);
    return { code: 200, body: imageResponse };
  } catch (e) {
    console.log('Error', e);
    return { code: 400, body: e };
  }
};

const getImageByReceiptId = async ({ params: { id } }: Request): Promise<ResponseData & { body: ImageResponse[] }> => {
  try {
    const receipt: Receipt = await getReceipt(id);
    if (receipt) {
      const promisedImageResponses = Array.isArray(receipt.images) ? receipt.images.map(getImageResponse) : [];
      const imageResponses: ImageResponse[] = await Promise.all(promisedImageResponses);
      return { code: 200, body: imageResponses };
    } else {
      throw new Error(`Receipt by id:${id} not found`);
    }
  } catch (e) {
    console.log('Error', e);
    return { code: 400, body: e };
  }
};
module.exports = { create, getAll, getById, edit, deleteById, getAllImages, getImage, getImageByReceiptId };
