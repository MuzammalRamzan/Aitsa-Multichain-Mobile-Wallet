const express = require('express');
const app = express();
var crypto = require('crypto');
var mongoose = require('mongoose');
var cors = require('cors'); 
app.use(cors());

 //mongoose.connect('mongodb://MongoAdminRoot:[[I@mM0ng0Adm1nP@$$w0rd]]@localhost', { useNewUrlParser: true, useUnifiedTopology: true })
 mongoose.connect('mongodb://173.208.153.218:27017',{ useNewUrlParser: true}); 
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
const bigchainController = require('./controllers/bigchain')
// const currencyConvert = require('./controllers/currency');

// const transactioncontroller = require('./controllers/transaction');

app.use(express.json())
//boot();
var db = mongoose.connection;
// db.on('error', console.error.bind(console, 'connection error:'));
// db.once('open', function () {
//     console.log("Connected to MongoDB")
// });
app.use('/bigchain', bigchainController)
process.on('unhandledRejection', error => {
   //Will print "unhandledRejection err is not defined"
  console.log( error.message);
});


var server = app.listen(4000, () => {
    console.log("Server is listening on port::", server.address().port);
    console.log("Server is listening on port::", server.address());
})
