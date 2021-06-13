//--------------------------------This is model of data inserting in db when user sale token against USD---------------------------
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var User = new Schema({
    walletId:{ type: String, maxlength: 255, required: true },
    name:String,
    type:String,
    price:Number,
    description:{ type: String, maxlength: 255, required: true },
    fromDate:String,
    toDate:String,
    promotionPrice:Number,
    status:String,
    fileLink:String,
    promotionStatus:String
})

module.exports = mongoose.model('assetExchangeModel', User);