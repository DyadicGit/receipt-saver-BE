const app = require('./app');
import { SERVER_PORT } from './default_env.json';
const { CLIENT_URL } = process.env;

app.listen(SERVER_PORT, () => {
  console.log(`server: listening on port ${SERVER_PORT}, Front-end cors accessible with port ${CLIENT_URL}"`);
});
