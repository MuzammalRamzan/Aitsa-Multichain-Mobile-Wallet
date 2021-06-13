  var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var VerifyToken = require('../auth/VerifyToken');
const bigchain = require('../src/bigchaindb/api2')
const User = require('../user/User')
const config = require('../config')
const launch = require('../bai/launchbai');
const request = require('request');
const AssetController = require('../user/AssetController');
router.use(bodyParser.urlencoded({ extended: false }));
router.use(bodyParser.json());



router.post('/create', VerifyToken, async function (req, res, next) {
    console.log('Hello from create');
	return res.send({ success: false, message: "Asset already exist" });
    
	const userId = req.userId;
    const payload = req.body.payload;
    const metadata = payload;
    if (!payload || payload === "" || payload === undefined
        || !userId || userId === "" || userId === undefined
        || !payload.hasOwnProperty('name')
	|| !payload.hasOwnProperty('type')
	|| !payload.hasOwnProperty('quantity')
        ) {
        res.send({ success: false, error: "Please fill required parameters" })
        return;
    }
   if(typeof  payload['name'] != 'string' || payload['name'].trim() =="")
      return res.send({success:false,message:"name must be a valid string"})
  if(typeof payload['type'] != 'string' || payload['type'].trim() == "")
	return res.send({success:false,message:"type must be a valid string"})
  if(typeof payload['quantity'] != 'number' || payload['quantity'] == 0 )
	return res.send({success:false,message:"amount must be a valid Integer"})
    try {
        let nameLength = payload.name.trim().length;
        if (nameLength < 1)
            return res.send({ success: false, message: "Please enter a valid asset name" })

        User.findOne({ _id: userId }, async (err, user) => {
            if (err) {
                res.send({ success: false, message: "Incorrect wallet id" })
            } else {
                if (user) {
                    let privateKey = await config.encodeDecode(user.wallets.bigchain.privateKey, 'd')
					console.log("creating asset");
                    var asset = await bigchain.createAsset(user.wallets.bigchain.publicKey, privateKey, payload, metadata)
                        .catch((err) => {
                            console.log("In catch Block")
                            return res.send({ success: false, message: "Asset already exist" })
                        })
                        console.log(asset);
                        console.log("asset "+asset.status+"  \n\n")
                        console.log("asset "+JSON.stringify(asset))
                    if (asset) {
                        console.log("Asset "+JSON.stringify(asset))
                        if(asset.status == '400 BAD REQUEST'){

                            console.log("File in false")
                                return res.send({success:false,msg:"Asset already exist" })
                        }
                        console.log("Type Sending "+ asset.result.asset.data.type)
                     await AssetController.saveAssetType(asset.result.asset.data.type);
                        res.send(asset)
                    }
                   
                }
                else {
                    res.send({ success: false, message: "User bigchain wallet not found" })
                }
            }
        })
    } catch (err) {
        res.send(err)
    }

});

router.get('/assets', VerifyToken, async (req, res, next) => {
    const userId = req.userId;
    if (!userId || userId === "", userId === undefined) {
        res.send({ success: false, message: "Missing userId parameter" })
    }
    else {
        User.findOne({ _id: userId }, async (err, user) => {
            if (err) {
                res.send({ success: false, message: "Incorrect wallet id" })
                return;
            }
            else {
                if (user) {
                    const arrAssets = await bigchain.getAssets(user.wallets.bigchain.publicKey)
                        .catch((e) => {
                            res.send({ success: false, message: "Incorrect public key" })
                            return;
                        })
                        // if(assets.length>0){
                            var assets = [];
                            console.log("assets  "+ JSON.stringify(arrAssets));
                            console.log("Asset length  "+arrAssets.length);
                            for(i= 0;i<arrAssets.length;i++){
                                if(arrAssets[i].metadata.name !="" && arrAssets[i].metadata.name !=null && arrAssets[i].metadata.name !=undefined
                                && arrAssets[i].metadata.type !="" && arrAssets[i].metadata.type !=null && arrAssets[i].metadata.type !=undefined
                                && arrAssets[i].metadata.quantity !="" && arrAssets[i].metadata.quantity !=null && arrAssets[i].metadata.quantity !=undefined)
                            assets.push(arrAssets[i])
                            }
                            console.log("Arr Assets "+ JSON.stringify(assets))
                        res.send({ success: true, assets })
                            
                        // }
                        
                } else {
                    res.send({ success: false, message: "Incorrect Token" })
                }

            }
        })
    }
})

router.get('/bitcoin/address', VerifyToken, async (req, res, next) => {   // Get public address of Bitcoin of User
    const userId = req.userId;
    if (!userId || userId === "", userId === undefined) {
        res.send({ success: false, message: "Missing userId parameter" })
    }
    else {
        User.findOne({ _id: userId }, async (err, user) => {
            if (err) {
                res.send({ success: false, message: "Incorrect wallet id" })
                return;
            }
            else {
                if (user) {
                    const pubKey = user.wallets.btc.publicKey
                    res.send({ success: true, msg: pubKey })
                } else {
                    res.send({ success: false, message: "Incorrect Token" })
                }

            }
        })
    }
})
router.get('/bai/address', VerifyToken, async (req, res, next) => {   // Get public BAI address   of User
    const userId = req.userId;
    if (!userId || userId === "", userId === undefined) {
        res.send({ success: false, message: "Missing userId parameter" })
    }
    else {
        User.findOne({ _id: userId }, async (err, user) => {
            if (err) {
                res.send({ success: false, message: "Incorrect wallet id" })
                return;
            }
            else {
                if (user) {
                    const pubKey = user.wallets.bigchain.publicKey
                    res.send({ success: true, msg: pubKey })
                } else {
                    res.send({ success: false, message: "Incorrect Token" })
                }

            }
        })
    }
})

router.get('/token/address', async (req, res, next) => {   // Get Any Token public address   of User
    const userId = req.body.walletId;
    const token = req.body.token;
    if (!userId || userId === "", userId === undefined) {
        res.send({ success: false, message: "Missing userId parameter" })
    }
    if(token == 'btc' || token == 'bai'){
        var tokenType;
        
        // console.log("Invalid token")
        User.findOne({ walletId: userId }, async (err, user) => {
            if (err) {
                res.send({ success: false, message: "Incorrect wallet id" })
                return;
            }
            else {
                if (user) {
                    var pubKey; //= user.wallets.bigchain.publicKey
                    if(token=='btc'){
                        pubKey = user.wallets.btc.publicKey
                    }
                    else
                    pubKey = user.wallets.bigchain.publicKey
                    res.send({ success: true, msg: pubKey })
                } else {
                    res.send({ success: false, message: "Incorrect Token" })
                }

            }
        })
    }
    else {
        res.send({ success: false, message: "Incorrect token" })
    }
})

router.post('/transfer', VerifyToken, async (req, res, next) => {
    const userId = req.userId;
    const txId = req.body.txId;
    const walletId = req.body.walletId;
    if (!userId || userId === "", userId === undefined
        || !txId || txId === "" || txId === undefined
        || !walletId || walletId == "" || walletId === undefined) {
        res.send({ success: false, message: "Missing required parameter" })
    }
    else {
        User.findOne({ _id: userId }, (err, user) => {
            if (err) {
                res.send({ success: false, message: "Incorrect user id" })
                return;
            }
            else {
                if (user) {
                    User.findOne({ walletId }, async (err2, to) => {
                        if (err2) {
                            res.send({ success: false, message: "Receiver may be not exist" })
                            return;
                        } else {
                            if (to && (to.walletId != user.walletId)) {
                                const signedTx = await bigchain.getTransaction(txId)
                                    .catch((e) => {
                                        res.send({ success: false, message: "Transaction Id does not exist", status: e.status })
                                        return;
                                    })
                                const { metadata } = signedTx;
                                let privateKey = await config.encodeDecode(user.wallets.bigchain.privateKey, 'd')
                                const assets = await bigchain.transferAsset({ signedTx, fromPrivateKey: privateKey, toPublicKey: to.wallets.bigchain.publicKey, metadata })
                                    .catch((e) => {
                                        res.send({ success: false, message: "Asset cannot be transfer" })
                                        return
                                    })

                                res.send({ success: true, assets })
                                return;
                            }
                            else {
                                if(!to)
                                    return res.send({success:false,message:"Invalid wallet Id"})
                                res.send({ success: false, message: "Owner can't send to itself" })
                                return;
                            }
                        }
                    })
                } else {
                    res.send({ success: false, message: "Sender does not exist" })
                }

            }
        })
    }
})

router.post('/bai/launch', async(req,res)=>{   // Launch token on BAI
    var token = await bigchain.tokenLaunch();
    console.log("token  "+ token);
    res.send(token);
})

router.post('/bai/asset/burn',VerifyToken, async(req,res)=>{   // Burn Asset not working
    const assets = await bigchain.getBalance('BajxkAFigKPdyZVLXyyNk3XQGg8n7iHTACjNSY3se65B')
    .catch((e) => {
        res.send({ success: false, message: "Incorrect public key" })
        return;
    })
res.send({ success: true, assets })

})

router.post('/bai/transfer',VerifyToken, async(req,res)=>{
    //amountToSend, pk, pubkey_sender,pubkey_receiver,username
    var amountToSend = req.body.amountToSend;
    var pk = req.body.pk;
    var pubkey_receiver = req.body.pubkey_receiver;
    var pubkey_sender = req.body.pubkey_sender;
    var username = req.body.username;

    var transaction = await bigchain.transferTokens(amountToSend, pk, pubkey_sender,pubkey_receiver,username);
    if(transaction){
        console.log("this is bigchain/bai/transfer false"+transaction);
        return res.send({success:true, msg:transaction})
    }
    else{
        console.log("this is bigchain/bai/transfer true***************"+transaction);
       return res.send({success:false, msg:"Unsuccesfull Transaction"})
    }
})

router.post('/get/pk',async(req,res)=>{  // Get Decoded value
    var enc_data = req.body.enc_data;
    console.log("enc_data "+enc_data)
    let privateKey = await config.encodeDecode(enc_data, 'd')
res.send({pk: privateKey});

} )
router.get('/bai/trxId',async(req,res)=>{
    var trxid = req.body.trxid;
   var detail =  await bigchain.getTransaction(trxid);
   res.send({success:true,msg:detail})
})
router.post('/transfer/baiToken',async(req,res)=>{

    var response = await bigchain.transferBai();
    if(response){
        res.send({success:true, msg:res})
    }
    else
    res.send({success:false, msg:response})
})

router.get('/asset/types', VerifyToken, async(req,res)=>{
  await AssetController.getAllAssetType(function(response){
    res.send(response)
  });

})

module.exports = router;
