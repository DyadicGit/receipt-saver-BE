import { DynamoDB } from 'aws-sdk';
import { IS_OFFLINE } from '../config/default_env.json';

let options = {};

// connect to local DB if running offline
if (process.env.IS_OFFLINE || IS_OFFLINE) {
  options = {
    region: 'localhost',
    endpoint: `http://localhost:8000}`
  };
}

const client = new DynamoDB.DocumentClient(options);

module.exports = client;
