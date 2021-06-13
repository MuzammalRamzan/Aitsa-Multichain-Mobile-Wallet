
//--------------------------------This is model of data inserting in db when user sell token---------------------------
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var multiModelSchema = new Schema({
    address:String,
    name:String,
    price:Number
})

module.exports = mongoose.model('multiModel', multiModelSchema);