var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var BAISchema = new Schema({
    Name: String,
    Price: Number,
    Time: Date
})

module.exports = mongoose.model('BAI', BAISchema);