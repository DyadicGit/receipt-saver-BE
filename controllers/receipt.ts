import * as uuid from 'uuid';
import { Request } from 'express';
import { DocumentClient } from 'aws-sdk/lib/dynamodb/document_client';
import { PromisedResponse, ResponseData } from '../config/handlerCreator';
import { Receipt, RequestReceipt, setDefaults } from '../config/DomainTypes';
import GetItemOutput = DocumentClient.GetItemOutput;
import GetItemInput = DocumentClient.GetItemInput;
import UpdateItemInput = DocumentClient.UpdateItemInput;
import { PutObjectRequest } from 'aws-sdk/clients/s3';
const fs = require('fs');

const { s3, dynamoDb } = require('./AwsInstances');

const { TABLE_RECEIPT: TableName, BUCKET_RECEIPTS: Bucket } = process.env;

const create = async (req: Request): PromisedResponse => {
  const body: RequestReceipt = req.body;
  const newReceipt = { ...setDefaults({ ...body, creationDate: null, id: uuid.v1() }) };
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
const edit = async (req: Request): PromisedResponse => {
  const receipt: Receipt = setDefaults(req.body);
  const params: UpdateItemInput = {
    TableName,
    Key: { id: receipt.id },
    UpdateExpression: 'set image = :im, shopName = :sN, itemName = :iN, buyDate = :bD, totalPrice = :tP, warrantyPeriod = :w, userID = :u',
    ExpressionAttributeValues: {
      ':im': receipt.image,
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
type ImageResponse = ResponseData & { body: { buffer: { type: string; data: Buffer }; contentType: string } };
const getImage = async ({ params: { key } }: Request): Promise<ImageResponse> => {
  try {
    const { Body: buffer, ContentType: contentType } = await s3.getObject({ Bucket, Key: key }).promise();
    return { code: 200, body: { buffer, contentType } };
  } catch (e) {
    console.log('Error', e);
    return { code: 400, body: e };
  }
};

const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      res.send({
        status: false,
        message: 'No file uploaded'
      });
    } else {
      const file = req.file;
      console.log(file);
      const Key = file.key;
      // const params: PutObjectRequest = { Key, Bucket, Body: fs.createReadStream(file.path), ContentType: file.mimeType, ACL: 'public-read' };
      // const options = { partSize: 10 * 1024 * 1024, queueSize: 1 };
/*      const data = await s3.upload(params).promise();
      if (data) {
        fs.unlinkSync(req.file.path);
      }*/
      // console.log('s3:', data);
      res.send({
        status: true,
        message: 'File is uploaded',
        key: Key,
        fileMeta: file
      });
    }
  } catch (err) {
    res.status(500).send(err);
  }
};

module.exports = { create, getAll, getById, edit, deleteById, getAllImages, getImage, uploadImage };
