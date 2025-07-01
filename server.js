const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: './config.env' });

// in case un defined varialbe
process.on('uncaughtException', (err) => {
  console.log('UNHANDLER REJECTION @_@ server shutting down...');
  console.log(err.message, err.name);
  process.exit();
});

const app = require(`${__dirname}/app`);

//connect to atlas
const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

mongoose.connect(DB).then(() => console.log('Connection successful'));

//Server
const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log('Now Listening');
});

// in case smth in database connection happened
// wrong password
process.on('unhandledRejection', (err) => {
  console.log('UNHANDLER REJECTION @_@ server shutting down...');
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

// For deployment on Render or Railway
process.on('SIGTERM', () => {
  console.log('SIGTERM RECEIVED, Shutting down gracefully...');
  server.close(() => {
    console.log('Process terminated');
  });
});
