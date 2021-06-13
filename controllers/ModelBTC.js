
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var BTCSchema = new Schema({
    Name: String,
    Price: Number,
    UpdatedOn: Date
})

module.exports = mongoose.model('BTCRate', BTCSchema);