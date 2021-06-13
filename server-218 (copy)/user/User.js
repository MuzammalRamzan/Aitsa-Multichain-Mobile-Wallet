var mongoose = require('mongoose');
const Schema = mongoose.Schema;

const User = new Schema({
  walletId: { type: String, maxlength: 255, required: true },
  username: { type: String, maxlength: 60, required: true },
  password: { type: String,minlength:8, maxlength: 60, required: true },
  email: { type: String, maxlength: 255, required: true,match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address'] },
  verifyToken: { type: String, maxlength: 60, required: true },
  wallets: { },
  multiAddress:{},
  status:{ type:Boolean, required:true},
  forgetPass:{ type:String}

});


module.exports = mongoose.model('User', User);
