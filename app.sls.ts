import sls from 'serverless-http';
const app = require('./app');

module.exports.server = sls(app);
