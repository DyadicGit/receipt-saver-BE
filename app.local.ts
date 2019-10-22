const app = require('./app');
import { CLIENT_PORT, SERVER_PORT } from './config/default_env.json';

app.listen(SERVER_PORT, () => {
  console.log(
    `server: listening on port ${SERVER_PORT}, Front-end cors accessible with port ${CLIENT_PORT}"`
  );
});
