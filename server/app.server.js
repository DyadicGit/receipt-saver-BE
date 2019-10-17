const app = require('./app');
const express = require('express');
const env = require('./config/env');
const path = require('path');

app.use(express.static(path.join(__dirname, '../client/build')));
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
});

app.listen(env.SERVER_PORT, () => {
    console.log(
        `server: listening on port ${env.SERVER_PORT}"`
    );
});
