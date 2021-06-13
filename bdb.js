const express = require('express');
const app = express();
var crypto = require('crypto');
var mongoose = require('mongoose');
var cors = require('cors'); 
app.use(cors());
const https = require('https');
const http=require('http');
const fs = require('fs');
const session = require('express-session')
 //mongoose.connect('mongodb://MongoAdminRoot:[[I@mM0ng0Adm1nP@$$w0rd]]@localhost', { useNewUrlParser: true, useUnifiedTopology: true })
//mongoose.connect('mongodb://MongoAdminRoot:AMCOyurgHJH67GHFBigChainPPy@173.208.153.218:27017/admin');
mongoose.connect('mongodb://127.0.0.1:27017',{ useNewUrlParser: true});
// mongoose.connect('mongodb://173.208.153.218:27017',{ useNewUrlParser: true}); 
//mongoose.connect('mongodb://localhost:27017',{ useNewUrlParser: true}); 
// mongoose.createConnection(
//   "mongodb:localhost/users",
//   {
//     "auth": {
//       "authSource": "MongoAdminRoot"
//     },
//     "user": "MongoAdminRoot",
//     "pass": "[[I@mM0ng0Adm1nP@$$w0rd]]"
//   }
// );
//mongo "mongodb://mM0ng0Adm1nP@173.208.153.218:27017/?authSource=admin"

const authController = require('./auth/AuthController.js');
const balanceController = require('./controllers/balances')
const historyController = require('./controllers/history')
const bigchainController = require('./controllers/bigchain')
const currencyConvert = require('./controllers/currency');

const transactioncontroller = require('./controllers/transaction');

app.use(express.json())
app.use(session({
secret:"bilal1122",
resave:false,
saveUninitialized:false
}))
//boot();
var db = mongoose.connection;
// db.on('error', console.error.bind(console, 'connection error:'));
// db.once('open', function () {
//     console.log("Connected to MongoDB")
// });
app.use('/transfer/baiToken',bigchainController);
app.use('/bai/trxId',bigchainController);
app.use('/api/users', authController);
app.use('/api/balances', balanceController)
app.use('/api/history', historyController)
app.use('/bigchain', bigchainController)
app.use('/api/currencyConvert', currencyConvert)
app.use('/api/transaction',transactioncontroller)

process.on('unhandledRejection', error => {
   //Will print "unhandledRejection err is not defined"
  console.log( error.message);
});


// var server = app.listen(4000, () => {
//     console.log("Server is listening on port::", server.address().port);
//     console.log("Server is listening on port::", server.address());
// })
/////////////////////////////////////
/////////////////////////////////////
var https_options = {

  key: fs.readFileSync("/home/bai-wallet/ssl.key"),

  cert: fs.readFileSync("/home/bai-wallet/ssl.cert"),

  ca: [

         fs.readFileSync('/home/bai-wallet/ssl.ca'),

         fs.readFileSync('/home/bai-wallet/ssl.everything')

       ]
};
const httpsServer = https.createServer(https_options,app);
httpsServer.listen(4000, () => {
    console.log('HTTPS Server running on port 4000');
});

