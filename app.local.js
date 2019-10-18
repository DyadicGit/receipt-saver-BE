const app = require('./app');
const env = require('./config/env');
const CLIENT_PORT = env.CLIENT_PORT ;
const SERVER_PORT = env.SERVER_PORT;

// Cors
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', `http://localhost:${CLIENT_PORT}`);
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

app.listen(SERVER_PORT, () => {
  console.log(
    `server: listening on port ${SERVER_PORT}, UserDomain ${process.env.USERDOMAIN}, Front-end cors accessible with port ${CLIENT_PORT}"`
  );
});
