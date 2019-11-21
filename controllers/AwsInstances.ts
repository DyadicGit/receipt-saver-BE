const AWS = require('aws-sdk');
import { DocumentClient } from 'aws-sdk/lib/dynamodb/document_client';
const { ACCESS_KEY_ID, SECRET_ACCESS_KEY, NODE_ENV } = process.env;

console.log('dyno', process.env);
const dynamoDb: DocumentClient =
  NODE_ENV === 'development'
    ? new AWS.DynamoDB.DocumentClient({
        region: 'localhost',
        endpoint: 'http://localhost:8000'
      })
    : new AWS.DynamoDB.DocumentClient();

const s3 = new AWS.S3({ accessKeyId: ACCESS_KEY_ID, secretAccessKey: SECRET_ACCESS_KEY });

module.exports = { dynamoDb, s3 };
