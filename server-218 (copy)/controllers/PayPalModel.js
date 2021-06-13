var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var PayPalSchema = new Schema({
    username: String,
    tokkenname: String,
    amountUSD:Number,
    totaltokkens:Number,
    time: Date,
    status:String
})

module.exports = mongoose.model('PayPal', PayPalSchema);