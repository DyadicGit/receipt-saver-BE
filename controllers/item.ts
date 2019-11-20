import * as uuid from 'uuid';
import { Request, Response } from 'express';

const dynamoDb = require('./AwsInstances');
const { TABLE_ITEM: TableName } = process.env;
