import Rekognition from "aws-sdk/clients/rekognition";
import { DocumentClient } from 'aws-sdk/lib/dynamodb/document_client';
import defaultEnv from '../default_env.json';

const AWS = require('aws-sdk');
const { ACCESS_KEY_ID, SECRET_ACCESS_KEY, NODE_ENV } = process.env;

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

const rek = new AWS.Rekognition({accessKeyId: ACCESS_KEY_ID, secretAccessKey: SECRET_ACCESS_KEY});

export default { dynamoDb, s3, rek };
