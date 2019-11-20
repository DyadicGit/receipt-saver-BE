import express, { Request, Response } from 'express';
import mime from 'mime';
import multer from 'multer';
import multerS3 from "multer-s3";
import { handler } from './config/handlerCreator';
import { AttachmentFieldName } from "./config/DomainTypes";

const { s3 } = require('./controllers/AwsInstances');
const { BUCKET_RECEIPTS: bucket } = process.env;
const app = express();

const generateFileName = (file) => `${file.fieldname}-${Date.now()}.${mime.getExtension(file.mimetype)}`;

const upload = multer({
  limits: { fileSize: 10 * 1024 * 1024 },
  storage: multerS3({
    s3: s3,
    bucket: bucket,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: function (req, file, cb) {
      cb(null, generateFileName(file))
    }
  })
});

const CLIENT_URL = process.env.CLIENT_URL || '*';
const receipt = require('./controllers/receipt');

// For Handling unhandled promise rejection
process.on('unhandledRejection', (reason: any) => {
  console.log('[Unhandled Rejection]::', reason.message);
  throw reason;
});
process.on('uncaughtException', error => {
  console.log('[Uncaught Exception]::', error.message);
  throw error;
});
// request.body parser
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Cors
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', CLIENT_URL);
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  next();
});

// Controllers
app.get('/helloWorld', (req: Request, res: Response) => {
  res.send('Hello World!');
});
app.post('/receipt', upload.array(AttachmentFieldName.RECEIPT), handler(receipt.create));
app.get('/receipt', handler(receipt.getAll));
app.get('/receipt/:id', handler(receipt.getById));
app.put('/receipt', upload.array(AttachmentFieldName.RECEIPT), handler(receipt.edit));
app.delete('/receipt/:id', handler(receipt.deleteById));
app.get('/image/all', handler(receipt.getAllImages));
app.get('/image/:key', handler(receipt.getImage));
app.get('/image/byReceiptId/:id', handler(receipt.getImageByReceiptId));

module.exports = app;
