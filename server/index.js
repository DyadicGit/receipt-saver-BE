const express = require('express');
const app = express();
const PORT = process.env.port || 5000;
const CLIENT_PORT = 3000;
// console.log(process)

app.listen(PORT, function() {
    console.log(
        `server: listening on port ${PORT}, hostname ${process.env.HOSTNAME}, environment is "${process.env.app_env}"`
    );
});

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", `http://localhost:${CLIENT_PORT}`);
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.get('/', (req, res) => {
    res.send('Hello World!');
});

/**
 * For Handling unhandled promise rejection
 */
process.on('unhandledRejection', reason => {
    console.log('[Unhandled Rejection]::', reason.message);
    throw reason;
});
process.on('uncaughtException', error => {
    console.log('[Uncaught Exception]::', error.message);
    throw error;
});
