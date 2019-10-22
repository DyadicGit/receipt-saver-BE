import * as uuid from 'uuid';
import { NextFunction, Request, Response } from 'express';
import { DYNAMODB_TABLE } from '../config/default_env.json';
const dynamoDb = require('./dynamodb');
const TODOS_TABLE =process .env.DYNAMODB_TABLE || DYNAMODB_TABLE;
type ToDoBody = { text: string };

const create = (req: Request, res: Response, next: NextFunction) => {
  const timestamp = new Date().getTime();
  const data: ToDoBody = req.body;
  if (typeof data.text !== 'string') {
    res.send({
      success: false,
      message: 'Validation Failed'
    });
  }

  const params = {
    TableName: TODOS_TABLE,
    Item: {
      id: uuid.v1(),
      text: data.text,
      checked: false,
      createdAt: timestamp,
      updatedAt: timestamp
    }
  };

  dynamoDb.put(params, (error, result) => {
    if (error) {
      console.log('Error creating Todo: ', error);
      res.status(400).json({ error: 'Could not create Todo' });
    }
    console.log('result.Item:', result.Item);
    res.json({text: data.text});
  });
};
const get = (req, res) => {
  const params = {
    TableName: TODOS_TABLE,
  };
  dynamoDb.scan(params, (error, result) => {
    if (error) {
      res.status(400).json({ error: 'Error retrieving Todos'});
    }
    const { Items: todos } = result;
    res.json({ todos });
  })
};

module.exports = { create, get };
