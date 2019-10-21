const app = require('./app');
import env from './config/env.json';
const { CLIENT_PORT, SERVER_PORT } = env;

app.listen(SERVER_PORT, () => {
  console.log(
    `server: listening on port ${SERVER_PORT}, UserDomain ${process.env.USERDOMAIN}, Front-end cors accessible with port ${CLIENT_PORT}"`
  );
});
