var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var AssetSchema = new Schema({
    name: String
})

module.exports = mongoose.model('AssetType', AssetSchema);