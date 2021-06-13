//--------------------------------This is model of data inserting in db when user Buy Asset against USD---------------------------
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var User = new Schema({
    txID:{ type: String, maxlength: 255, required: true },
    AssetName:{ type: String, required: true },
    AssetType:{ type: String,required: true },
    price:{ type: Number, required: true },
    Quantity:{ type: Number,required: true },
    status:{ type: String,  required: true },
    BuyerMultichainAddress:{ type: String, maxlength: 255, required: true },
    SellerMultichainAddress:{ type: String, maxlength: 255, required: true }
})

module.exports = mongoose.model('assetBuyModel', User);