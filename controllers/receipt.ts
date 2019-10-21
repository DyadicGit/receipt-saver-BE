import * as uuid from 'uuid';
import { NextFunction, Request, Response } from 'express';
import { DYNAMODB_TABLE } from '../config/default_env.json';
const dynamoDb = require('./dynamodb');

type ToDoBody = { text: string };

module.exports.create = async (req: Request, res: Response, next: NextFunction) => {
  const timestamp = new Date().getTime();
  const data: ToDoBody = req.body;
  if (typeof data.text !== 'string') {
    res.send({
      success: false,
      message: 'Validation Failed'
    });
  }

  const params = {
    TableName: process.env.DYNAMODB_TABLE || DYNAMODB_TABLE,
    Item: {
      id: uuid.v1(),
      text: data.text,
      checked: false,
      createdAt: timestamp,
      updatedAt: timestamp
    }
  };

  // write the todo to the database
  dynamoDb.put(params, (error, result) => {
    // handle potential errors
    if (error) {
      res.send({
        success: false,
        message: "Couldn't create the todo item."
      });
    }
    res.send({
      success: true,
      statusCode: 200,
      body: JSON.stringify(result.Item)
    });
  });
};
