const express = require('express');
const app = express();
var crypto = require('crypto');
var mongoose = require('mongoose');
var cors = require('cors');
app.use(cors());
const https = require('https');
const http = require('http');
const fs = require('fs');
const session = require('express-session')
mongoose.connect('mongodb://127.0.0.1:27017', {
  useNewUrlParser: true
});
const authController = require('./auth/AuthController.js');
const bigchainController = require('./controllers/bigchain')
const currencyConvert = require('./controllers/currency');

const transactioncontroller = require('./controllers/transaction');
const paypalTransactionController=require('./controllers/sellBAiPaypalTransaction')
const assetExchangeController=require('./controllers/assetExchange');
app.use(express.json())
app.use(session({
  secret: "bilal1122",
  resave: false,
  saveUninitialized: false
}))
var db = mongoose.connection;
app.use('/asset',assetExchangeController)
app.use('/transfer/baiToken', bigchainController);
app.use('/bai/trxId', bigchainController);
app.use('/api/users', authController);
app.use('/bigchain', bigchainController)
app.use('/api/currencyConvert', currencyConvert)
app.use('/api/transaction', transactioncontroller)
app.use('/api/paypaltransaction',paypalTransactionController)
process.on('unhandledRejection', error => {
  console.log(error.message);
});

var https_options = {

  key: fs.readFileSync("/home/bai-wallet/ssl.key"),

  cert: fs.readFileSync("/home/bai-wallet/ssl.cert"),

  ca: [

    fs.readFileSync('/home/bai-wallet/ssl.ca'),

    fs.readFileSync('/home/bai-wallet/ssl.everything')

  ]
};
const httpsServer = https.createServer(https_options, app);
httpsServer.listen(4001, () => {
  console.log('HTTPS Server running on port 4001');
});