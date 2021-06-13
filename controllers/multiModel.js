
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var BTCSchema = new Schema({
    Name: String,
})

module.exports = mongoose.model('multiAsset', BTCSchema);
