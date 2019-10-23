import * as uuid from 'uuid';
import { Request, Response } from 'express';
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

const getAll = (req, res) => {
  dynamoDb.scan({ TableName }, (error, result) => {
    if (error) {
      res.status(400).json({ error: 'Error retrieving', message: error.message });
    }
    const receipts: Receipt[] = result.Items || [];
    res.json(receipts);
  });
};

module.exports = { create, getAll };
