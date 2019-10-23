const AWS = require('aws-sdk');
import { DocumentClient } from 'aws-sdk/lib/dynamodb/document_client';

const dynamoDb: DocumentClient = process.env.IS_OFFLINE
  ? new AWS.DynamoDB.DocumentClient({
      region: 'localhost',
      endpoint: 'http://localhost:8000'
    })
  : new AWS.DynamoDB.DocumentClient();

module.exports = dynamoDb;
