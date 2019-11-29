import { AttachmentFieldName, Receipt, ResponsiveImageData, ResponsiveImageDataList, UploadedImages } from '../config/DomainTypes';
import { DeleteObjectsRequest, ObjectIdentifierList, PutObjectRequest } from 'aws-sdk/clients/s3';
import { DocumentClient } from 'aws-sdk/lib/dynamodb/document_client';
import awsInstances from './AwsInstances';
import sharp from 'sharp';
import mime from 'mime';
import GetItemOutput = DocumentClient.GetItemOutput;
import GetItemInput = DocumentClient.GetItemInput;
import UpdateItemInput = DocumentClient.UpdateItemInput;
import PutItemInput = DocumentClient.PutItemInput;

const { s3, dynamoDb } = awsInstances;

const { TABLE_RECEIPT: TableName, BUCKET_RECEIPTS: Bucket } = process.env;

const getAllReceiptsFromDB = async (): Promise<Receipt[]> => {
  const data = await dynamoDb.scan({ TableName }).promise();
  return data.Items as Receipt[];
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

export type ImageMetadataList = Array<{ Key: string; LastModified: string }>;
const getAllImagesMetadata = async (): Promise<ImageMetadataList> => {
  const { Contents } = await s3.listObjects({ Bucket }).promise();
  return Contents.map(({ Key, LastModified }) => ({ Key, LastModified }));
};

const params = (fileName: string, buffer: Buffer, contentType): PutObjectRequest => ({
  Bucket,
  Key: fileName,
  Body: buffer,
  ACL: 'public-read',
  ContentEncoding: 'base64',
  ContentType: contentType
});
const generateFileName = (mimeType = 'image/jpeg') => {
  const baseName = `${AttachmentFieldName.RECEIPT}-${Date.now()}`;
  return {
    baseName,
    name: (suffix = 'orig') => baseName + `-${suffix}.${mime.getExtension(mimeType)}`
  };
};
const getBufferImage = base64 => {
  const buffer = Buffer.from(base64.replace(/^data:image\/\w+;base64,/, ''), 'base64');
  return {
    orig: buffer,
    resized: width =>
      sharp(buffer)
        .rotate()
        .resize(width)
        .toBuffer()
  };
};
type SimpleResponsiveImageData = { orig: string; px320: string; px600: string; px900: string };
const resizeAndUploadImages = async (uploadedImages: UploadedImages[]): Promise<ResponsiveImageDataList> => {
  const imageKeys: SimpleResponsiveImageData[] = [];
  for (const file of uploadedImages) {
    const { name } = generateFileName(file.contentType);
    const { orig: origBuffer, resized } = getBufferImage(file.base64);
    const px320Buffer = await resized(320);
    const px600Buffer = await resized(600);
    const px900Buffer = await resized(900);
    const { Key: origName } = await s3.upload(params(name('orig'), origBuffer, file.contentType)).promise();
    const { Key: origPx320 } = await s3.upload(params(name('320px'), px320Buffer, file.contentType)).promise();
    const { Key: origPx600 } = await s3.upload(params(name('600px'), px600Buffer, file.contentType)).promise();
    const { Key: origPx900 } = await s3.upload(params(name('900px'), px900Buffer, file.contentType)).promise();
    imageKeys.push({
      orig: origName,
      px320: origPx320,
      px600: origPx600,
      px900: origPx900
    });
  }
  return await getUrlsFromSimpleImageDataList(imageKeys);
};
const getUrlsFromSimpleImageDataList = (dataList: SimpleResponsiveImageData[]): Promise<ResponsiveImageDataList> => {
  return Promise.all(dataList.map(data => getUrl(property => data[property])));
};
const getUrlsFromImageDataList = (dataList: ResponsiveImageDataList): Promise<ResponsiveImageDataList> => {
  return Promise.all(dataList.map(data => getUrl(property => data[property].key)));
};

const widthProperties: Array<keyof ResponsiveImageData> = ['orig', 'px320', 'px600', 'px900'];
const signedUrlExpireSeconds = 1 * 60 * 60; // 1 hour
type NameByWidthPropertyFn = (property: keyof ResponsiveImageData) => string;
const getUrl = async (keyByPropertyFn: NameByWidthPropertyFn): Promise<ResponsiveImageData> => {
  const accumulator = {};
  for (const property of widthProperties) {
    accumulator[property] = {
      url: await s3.getSignedUrl('getObject', { Bucket, Key: keyByPropertyFn(property), Expires: signedUrlExpireSeconds }),
      key: keyByPropertyFn(property)
    };
  }
  return accumulator as ResponsiveImageData;
};

export default {
  storage: { deleteImages, getUrlsFromImageDataList, getAllImagesMetadata, resizeAndUploadImages },
  db: { getAllReceiptsFromDB, getReceiptFromDB, createReceiptInDB, updateReceiptInDB, deleteReceiptFromDB }
};
