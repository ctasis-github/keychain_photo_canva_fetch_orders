const express = require('express');
const app = express();
const cors = require('cors');
const { fetchAllOrdersFromAmazon } = require('./get-order.controller');
const dotenv = require('dotenv');
const config = require('./config');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../.env') });
app.use(cors({ origin: true, credentials: true }));

app.use(express.static(`${__dirname}/../uploads`));
let server;
app.listen(config.port, () => {
  console.log(`Server running on port ${config.port} 🚀 `);
});

const exitHandler = () => {
  if (server) {
    server.close(() => {
      console.log('Server closed');
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
};

const unexpectedErrorHandler = (error) => {
  console.error(error);
  exitHandler();
};

process.on('uncaughtException', unexpectedErrorHandler);
process.on('unhandledRejection', unexpectedErrorHandler);

process.on('SIGTERM', () => {
  console.info('SIGTERM received');
  if (server) {
    server.close();
  }
});

setTimeout(() => {
  fetchAllOrdersFromAmazon();
}, 2000);

// Get AMAZON inventory Report
// cron.schedule('*/10 * * * *', fetchAllOrdersFromAmazon);
