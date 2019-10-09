const express = require('express');
const server = express();
const PORT = process.env.port || 3000;

console.log(process)


server.listen(PORT, function () {
  console.log(`server: listening on port ${PORT}, hostname ${process.env.HOSTNAME}, environment is "${process.env.app_env}"`);
});

server.get('/', function (req, res) {
  res.send('Hello World!');
});

/**
 * For Handling unhandled promise rejection
 */
process.on("unhandledRejection", reason => {
    console.log("[Unhandled Rejection]::", reason.message);
    throw reason;
});
process.on("uncaughtException", error => {
    console.log("[Uncaught Exception]::", error.message);
    throw error;
});