const AWS = require('aws-sdk');
import { DocumentClient } from 'aws-sdk/lib/dynamodb/document_client';
const { ACCESS_KEY_ID, SECRET_ACCESS_KEY, NODE_ENV } = process.env;
import defaultEnv from '../default_env.json';

const dynamoDb: DocumentClient =
  NODE_ENV === 'development'
    ? new AWS.DynamoDB.DocumentClient({
        region: 'localhost',
        endpoint: `http://localhost:${defaultEnv.DB_PORT}`,
        accessKeyId: 'DEFAULT_ACCESS_KEY',
        secretAccessKey: 'DEFAULT_SECRET'
      })
    : new AWS.DynamoDB.DocumentClient();

const s3 =
  NODE_ENV === 'development'
    ? new AWS.S3({
        s3ForcePathStyle: true,
        accessKeyId: 'S3RVER',
        secretAccessKey: 'S3RVER',
        endpoint: new AWS.Endpoint(`http://localhost:${defaultEnv.S3_PORT}`)
      })
    : new AWS.S3({ accessKeyId: ACCESS_KEY_ID, secretAccessKey: SECRET_ACCESS_KEY });

module.exports = { dynamoDb, s3 };
