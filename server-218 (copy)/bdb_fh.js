var mongoose = require('mongoose');
mongoose.set('useNewUrlParser', true);
mongoose.set('useUnifiedTopology', true);
const MONGO_DB = 'mongodb://MongoAdminRoot:AMCOyurgHJH67GHFBigChainPPy@127.0.0.1:27017/users?authSource=admin';
mongoose.connect(MONGO_DB);

mongoose.connection.on('open', function() {
  console.log("Connection successful");
});
  
mongoose.connection.on('error', function(error) {
  console.log("Error in connection", error);    
});