import * as uuid from 'uuid';
import { Request, Response } from 'express';
import { DocumentClient } from 'aws-sdk/lib/dynamodb/document_client';
import GetItemOutput = DocumentClient.GetItemOutput;
import GetItemInput = DocumentClient.GetItemInput;
import UpdateItemInput = DocumentClient.UpdateItemInput;

const dynamoDb = require('./dynamodb');
const { TABLE_RECEIPT: TableName } = process.env;

const create = (req: Request, res: Response) => {
  const newReceipt: Receipt = ((data: RequestReceipt): Receipt => ({
    id: uuid.v1(),
    image: data.image || null,
    shopName: data.shopName || null,
    itemId: data.itemId || null,
    itemName: data.itemName || null,
    buyDate: data.buyDate || new Date().getTime(),
    creationDate: new Date().getTime(),
    totalPrice: data.totalPrice || 0,
    warrantyPeriod: data.warrantyPeriod || 0,
    userID: data.userID || null
  }))(req.body);

  dynamoDb.put({ TableName, Item: newReceipt }, (error, result) => {
    if (error) {
      console.error('Error creating receipt', error);
      res.status(400).json({ error: 'Error creating', message: error.message });
    }
    res.json({ id: newReceipt.id });
  });
};

const getAll = (req: Request, res: Response) => {
  dynamoDb.scan({ TableName }, (error, result) => {
    if (error) {
      res.status(400).json({ error: 'Error retrieving', message: error.message });
    }
    const receipts: Receipt[] = result.Items || [];
    res.json(receipts);
  });
};

const getById = ({ params: { id } }: Request, res: Response) => {
  const params: GetItemInput = {
    TableName,
    Key: { id }
  };
  dynamoDb.get(params, (err, result: GetItemOutput) => {
    if (err) {
      res.status(400).json({ error: 'Error retrieving', message: err.message });
      return;
    }
    if (result && result.Item) {
      res.json(result.Item as Receipt);
    } else {
      res.status(404).json({ error: `Receipt by id:${id} not found` });
    }
  });
};
const edit = (req, res) => {
  const receipt: Receipt = req.body;

  const params: UpdateItemInput = {
    TableName,
    Key: { id: receipt.id },
    UpdateExpression: 'set #a = :itemName, #b = :shopName',
    ExpressionAttributeNames: { '#a': 'itemName', '#b': 'shopName' },
    ExpressionAttributeValues: { ':itemName': receipt.itemName, ':shopName': receipt.shopName }
  };

  dynamoDb.update(params, error => {
    if (error) {
      console.log(`Error updating, id: ${receipt.id}: `, error);
      res.status(400).json({ error: 'Could not update' });
    }

    res.json(receipt);
  });
};

const deleteById = ({ params: { id } }, res) => {
  dynamoDb.delete({ TableName, Key: { id } }, error => {
    if (error) {
      console.log(`Error deleting, id ${id}`, error);
      res.status(400).json({ error: 'Could not delete' });
    }

    res.json({ success: true });
  });
};
module.exports = { create, getAll, getById, edit, deleteById };
