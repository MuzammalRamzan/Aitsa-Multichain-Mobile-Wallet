var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');

var VerifyToken = require('../auth/VerifyToken');

router.use(bodyParser.urlencoded({ extended: true }));
var AssetType = require('./AssetType');


async function saveAssetType(name){

    console.log("Going Name Here")
    
    AssetType.findOne({name:name}, function (err, user) {
        if (err) {
        console.log("There was a problem finding the user.");
        return
        }
        if (!user) {
            console.log(" saving name "+ name)
           return AssetType.create({name:name})

        };
       return;
    });

}
async function getAllAssetType(callback){
    AssetType.find({},function(err,assets){
        if (err) {
            console.log("There was a problem finding the Asset Type.");
            callback({success:false,message:"Issue to query mongodb"})
            }
            if (!assets) {
                console.log("There is no any asset type");
                callback({success:false,message:"There is no any asset type"})
    
            };

            console.log("Assets " +assets)
            console.log("asset Length "+assets.length)
            var arr=[];
            for(i=0;i<assets.length ;i++){
                arr.push(assets[i].name);
            }
            console.log(" Asset Array "+ arr)
            callback({success:true,message:arr})
    })

}






module.exports = {
    saveAssetType,
    getAllAssetType
};