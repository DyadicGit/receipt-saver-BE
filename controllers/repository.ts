import { ImageData, Receipt } from '../config/DomainTypes';
import { DeleteObjectsRequest, ObjectIdentifierList } from 'aws-sdk/clients/s3';
import { DocumentClient } from 'aws-sdk/lib/dynamodb/document_client';
import GetItemOutput = DocumentClient.GetItemOutput;
import GetItemInput = DocumentClient.GetItemInput;
import UpdateItemInput = DocumentClient.UpdateItemInput;
import PutItemInput = DocumentClient.PutItemInput;

const { s3, dynamoDb } = require('./AwsInstances');

const { TABLE_RECEIPT: TableName, BUCKET_RECEIPTS: Bucket } = process.env;

const getAllReceiptsFromDB = async (): Promise<Receipt[]> => {
  const data = await dynamoDb.scan({ TableName }).promise();
  return data.Items;
};
const getReceiptFromDB = async (id): Promise<Receipt | null> => {
  const params: GetItemInput = {
    TableName,
    Key: { id }
  };
  const data: GetItemOutput = await dynamoDb.get(params).promise();
  return data.Item ? (data.Item as Receipt) : null;
};
const createReceiptInDB = async (newReceipt: Receipt) => {
  const params: PutItemInput = { TableName, Item: newReceipt };
  return await dynamoDb.put(params).promise();
};
const updateReceiptInDB = async (receipt: Receipt) => {
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

const deleteReceiptFromDB = async receiptId => await dynamoDb.delete({ TableName, Key: { id: receiptId } }).promise();

// Cloud Storage
const deleteImages = async (keys: ObjectIdentifierList) => {
  const s3Params: DeleteObjectsRequest = { Bucket, Delete: { Objects: keys } };
  return await s3.deleteObjects(s3Params).promise();
};

const getImageData = async (key: string): Promise<ImageData> => {
  const resp = await s3.getObject({ Bucket, Key: key }).promise();
  return { buffer: resp.Body, contentType: resp.ContentType, key };
};

const getImagesData = async (keys: string[]): Promise<ImageData[]> => {
  const promisedImageResponses = keys && Array.isArray(keys) ? keys.map(getImageData) : [];
  return await Promise.all(promisedImageResponses);
};

export type ImageMetadataList = Array<{ Key: string; LastModified: string }>;
const getAllImagesMetadata = async (): Promise<ImageMetadataList> => {
  const { Contents } = await s3.listObjects({ Bucket }).promise();
  return Contents.map(({ Key, LastModified }) => ({ Key, LastModified }));
};

export default {
  storage: { deleteImages, getImageData, getImagesData, getAllImagesMetadata },
  db: { getAllReceiptsFromDB, getReceiptFromDB, createReceiptInDB, updateReceiptInDB, deleteReceiptFromDB }
};
