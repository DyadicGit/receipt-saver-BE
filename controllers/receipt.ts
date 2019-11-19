import * as uuid from 'uuid';
import { Request } from 'express';
import { DocumentClient } from 'aws-sdk/lib/dynamodb/document_client';
import { PromisedResponse, ResponseData } from '../config/handlerCreator';
import { Receipt, RequestReceipt, setDefaults } from '../config/DomainTypes';
import GetItemOutput = DocumentClient.GetItemOutput;
import GetItemInput = DocumentClient.GetItemInput;
import UpdateItemInput = DocumentClient.UpdateItemInput;

const { s3, dynamoDb } = require('./AwsInstances');

const { TABLE_RECEIPT: TableName, BUCKET_RECEIPTS: Bucket } = process.env;

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
  const params: GetItemInput = {
    TableName,
    Key: { id }
  };
  try {
    const result: GetItemOutput = await dynamoDb.get(params).promise();
    if (result.Item) {
      return { body: result.Item as Receipt };
    } else {
      return { code: 404, body: { error: `Receipt by id:${id} not found` } };
    }
  } catch (e) {
    console.error('Error retrieving', e);
    return { code: 400, body: { error: 'Error retrieving', message: e.message } };
  }
};
const edit = async (req): PromisedResponse => {
  const receipt: Receipt = { ...setDefaults(req.body), images: req.files.length ? req.files.map(f => f.key) : [] };
  const params: UpdateItemInput = {
    TableName,
    Key: { id: receipt.id },
    UpdateExpression: 'set image = :im, shopName = :sN, itemName = :iN, buyDate = :bD, totalPrice = :tP, warrantyPeriod = :w, userID = :u',
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
  try {
    await dynamoDb.update(params).promise();
    return { body: receipt };
  } catch (error) {
    console.error(`Error updating, id: ${receipt.id}: `, error);
    return { code: 400, body: { error: 'Could not update' } };
  }
};

const deleteById = async ({ params: { id } }: Request): PromisedResponse => {
  try {
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

const getImageByReceiptId = async ({ params: { id } }: Request): Promise<ResponseData & { body: ImageResponse[]}> => {
  const params: GetItemInput = {
    TableName,
    Key: { id }
  };
  try {
    const result: GetItemOutput = await dynamoDb.get(params).promise();
    if (result.Item) {
      const receipt: Receipt = result.Item as Receipt;
      const promisedImageResponses
        = Array.isArray(receipt.images)
        ? receipt.images.map(getImageResponse)
        : [];
      const imageResponses: ImageResponse[] = await Promise.all(promisedImageResponses);
      return { code: 200, body: imageResponses};
    } else {
      throw new Error(`Receipt by id:${id} not found`);
    }
  } catch (e) {
    console.log('Error', e);
    return { code: 400, body: e };
  }
};
module.exports = { create, getAll, getById, edit, deleteById, getAllImages, getImage, getImageByReceiptId };
