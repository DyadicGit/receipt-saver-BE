import * as uuid from 'uuid';
import { Request } from 'express';
import { DocumentClient } from 'aws-sdk/lib/dynamodb/document_client';
import { ResponseData } from '../config/handlerCreator';
import { Receipt, RequestReceipt, setDefaults } from '../config/DomainTypes';
import GetItemOutput = DocumentClient.GetItemOutput;
import GetItemInput = DocumentClient.GetItemInput;
import UpdateItemInput = DocumentClient.UpdateItemInput;

const dynamoDb = require('./dynamodb');
const { TABLE_RECEIPT: TableName } = process.env;

const create = async (req: Request): ResponseData => {
  const body: RequestReceipt = req.body;
  const newReceipt = { ...setDefaults({ ...body, creationDate: null, id: uuid.v1() }) };
  try {
    await dynamoDb.put({ TableName, Item: newReceipt }).promise();
    return { body: newReceipt };
  } catch (error) {
    console.error('Error creating', error);
    return { code: 400, body: { error: 'Error creating', message: error.message } };
  }
};

interface NormalizedReceipts {
  byId: { [id: string]: Receipt };
  order: string[];
}
const byDate = (a, b) => (a.buyDate | a.creationDate) - (b.buyDate | b.creationDate);

const getAll = async (): ResponseData => {
  try {
    const result = await dynamoDb.scan({ TableName }).promise();
    const receipts: Receipt[] = result.Items;
    const initial: NormalizedReceipts = { byId: {}, order: [] };
    const normalizedReceipts = receipts
      .sort(byDate)
      .reduce((acc: NormalizedReceipts, receipt: Receipt) => {
        acc.byId[receipt.id] = receipt;
        acc.order.push(receipt.id);
        return acc;
      }, initial);
    return { body: normalizedReceipts };
  } catch (error) {
    console.error('Error retrieving', error);
    return { code: 400, body: { error: 'Error retrieving', message: error.message } };
  }
};

const getById = async ({ params: { id } }: Request): ResponseData => {
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
  } catch (error) {
    console.error('Error retrieving', error);
    return { code: 400, body: { error: 'Error retrieving', message: error.message } };
  }
};
const edit = async (req: Request): ResponseData => {
  const receipt: Receipt = setDefaults(req.body);
  const params: UpdateItemInput = {
    TableName,
    Key: { id: receipt.id },
    UpdateExpression:
      'set image = :im, shopName = :sN, itemName = :iN, buyDate = :bD, totalPrice = :tP, warrantyPeriod = :w, userID = :u',
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

const deleteById = async ({ params: { id } }: Request): ResponseData => {
  try {
    await dynamoDb.delete({ TableName, Key: { id } }).promise();
    return { body: { success: true } };
  } catch (error) {
    console.error(`Error deleting, id ${id}`, error);
    return { code: 400, body: { error: 'Could not delete' } };
  }
};

module.exports = { create, getAll, getById, edit, deleteById };
