import express, { NextFunction, Request, Response } from 'express';
const app = express();
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
  next();
});

// Controllers
app.get('/helloWorld', (req: Request, res: Response) => {
  res.send('Hello World!');
});
app.post('/todos', receipt.create);
app.get('/todos', receipt.get);

module.exports = app;
