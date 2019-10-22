import AWS from 'aws-sdk';
import { IS_OFFLINE } from '../config/default_env.json';

const dynamoDb =
  (process.env.IS_OFFLINE || IS_OFFLINE)
    ? new AWS.DynamoDB.DocumentClient({
        region: 'localhost',
        endpoint: 'http://localhost:8000'
      })
    : new AWS.DynamoDB.DocumentClient();

module.exports = dynamoDb;
