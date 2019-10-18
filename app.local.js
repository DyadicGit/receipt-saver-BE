const app = require('./app');
const env = require('./config/env');
const CLIENT_PORT = env.CLIENT_PORT ;
const SERVER_PORT = env.SERVER_PORT;

app.listen(SERVER_PORT, () => {
  console.log(
    `server: listening on port ${SERVER_PORT}, UserDomain ${process.env.USERDOMAIN}, Front-end cors accessible with port ${CLIENT_PORT}"`
  );
});
