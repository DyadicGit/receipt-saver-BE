const express = require('express');
const app = express();

// For Handling unhandled promise rejection
process.on('unhandledRejection', reason => {
  console.log('[Unhandled Rejection]::', reason.message);
  throw reason;
});
process.on('uncaughtException', error => {
  console.log('[Uncaught Exception]::', error.message);
  throw error;
});


// Controllers
app.get('/helloWorld', (req, res) => {
  res.send('Hello World!');
});

module.exports = app;
