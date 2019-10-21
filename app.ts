import express from 'express';
const app = express();
const CLIENT_URL = process.env.CLIENT_URL || '*';

// For Handling unhandled promise rejection
process.on('unhandledRejection', (reason: any) => {
  console.log('[Unhandled Rejection]::', reason.message);
  throw reason;
});
process.on('uncaughtException', error => {
  console.log('[Uncaught Exception]::', error.message);
  throw error;
});

// Cors
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', CLIENT_URL);
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});


// Controllers
app.get('/helloWorld', (req, res) => {
  res.send('Hello World!');
});

module.exports = app;
