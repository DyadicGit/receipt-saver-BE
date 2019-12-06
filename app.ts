import express, { Request, Response } from 'express';
import { handler } from './config/utils';
import receipt from './controllers/receipt';

const { CLIENT_URL: ALLOWED_CORS_ORIGIN } = process.env;

const app = express();

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
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: false }));

// Cors
const cacheHours = 24 * 60 * 60; // 24 hours
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', ALLOWED_CORS_ORIGIN || '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', '*');
  res.header('Access-Control-Max-Age', `${cacheHours}`);
  next();
});

// Controllers
app.get('/helloWorld', (req: Request, res: Response) => {
  res.send('Hello World!');
});
app.get('/receipt', handler(receipt.getAll));
app.get('/receipt/:id', handler(receipt.getById));
app.put('/receipt', handler(receipt.edit));
app.post('/receipt', handler(receipt.create));
app.delete('/receipt/:id', handler(receipt.deleteById));
app.get('/image/all', handler(receipt.getAllImages));
app.get('/image/byReceiptId/:id', handler(receipt.getImagesByReceiptId));
app.post('/image/detectUploaded', handler(receipt.detectUploaded));
app.post('/image/detectExisting', handler(receipt.detectExisting));

module.exports = app;
