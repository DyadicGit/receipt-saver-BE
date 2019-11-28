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

const signedUrlExpireSeconds = 1 * 60 * 60; // 1 hour
const getImageUrl = async (data: ResponsiveImageData): Promise<ResponsiveImageData> => {
  const accumulator = {};
  if (!Object.getOwnPropertyNames(data).length) throw Error('imageKeys are empty');

  for (const key in data) {
    accumulator[key] = {
      url: await s3.getSignedUrl('getObject', { Bucket, Key: data[key].key, Expires: signedUrlExpireSeconds }),
      key: data[key].key
    };
  }
  return accumulator as any;
};

const getImagesUrls = async (imageKeys: ResponsiveImageDataList): Promise<ResponsiveImageDataList> => {
  const promisedImages = imageKeys && Array.isArray(imageKeys) ? imageKeys.map(getImageUrl) : [];
  return await Promise.all(promisedImages);
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
export type ImageKey = { orig: string; px320: string; px600: string; px900: string };
const resizeAndUploadImages = async (uploadedImages: UploadedImages[]): Promise<ImageKey[]> => {
  const res: ImageKey[] = [];
  for (const file of uploadedImages) {
    const { name } = generateFileName(file.contentType);
    const { orig: origBuffer, resized } = getBufferImage(file.base64);
    const px320Buffer = await resized(320);
    const px600Buffer = await resized(600);
    const px900Buffer = await resized(900);
    await s3.upload(params(name('orig'), origBuffer, file.contentType)).promise();
    await s3.upload(params(name('320px'), px320Buffer, file.contentType)).promise();
    await s3.upload(params(name('600px'), px600Buffer, file.contentType)).promise();
    await s3.upload(params(name('800px'), px900Buffer, file.contentType)).promise();
    res.push({
      orig: name('orig'),
      px320: name('320px'),
      px600: name('600px'),
      px900: name('800px')
    });
  }
  return res;
};

export default {
  storage: { deleteImages, getImageUrl, getImagesUrls, getAllImagesMetadata, resizeAndUploadImages },
  db: { getAllReceiptsFromDB, getReceiptFromDB, createReceiptInDB, updateReceiptInDB, deleteReceiptFromDB }
};
