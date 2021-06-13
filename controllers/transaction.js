var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var VerifyToken = require('../auth/VerifyToken');
var bitcoin=require('../src/bitcoin/api')
var balance = require('../utils/balances')
var transaction =require('../utils/transaction')
const User = require('../user/User')
var config = require('../config')
let price = require('crypto-price')
router.use(bodyParser.urlencoded({ extended: false }));
router.use(bodyParser.json());


router.get('/getBalance', VerifyToken,async function (req, res, next) {
    const userId = req.userId;
    const currency = req.query.currency;
    let query = Object.keys(req.query).length
    if (query > 1) {
        res.send({ success: false, message: "Page not found" })
        return;
    } 
    else {
        console.log("ELSE PART")
        if (!userId || userId === "" || userId === undefined
            || !currency || currency === "" || currency === undefined) {
            res.send({ success: false, error: "Invalid parameters" })
            return;
        }
        try {
            var currentbalance = await balance.getbalance(userId, "mainnet", currency).
                catch((e) => {
                    res.send({ success: false, error: e.message })
                })
            res.send({success:true,balance:currentbalance+' '+'BTC'})
        } catch (err) {
            res.send({ success: false, error: err.message })
        }
    }
});
///////////////////
router.post('/sendCurrency',VerifyToken, async function (req, res, next) {
    const userId = req.userId;
    const currency=req.query.currency;
    const network=req.query.network;
    const options= {
                fee:req.body.fee,
                to:req.body.to,
                amount:req.body.amount,
                userId:userId,
                walletType:currency,
                network:network
            }
    if (!userId || userId === "", userId === undefined){
        res.send({ success: false, message: "Missing required parameter" })
    }
    else{

        User.findOne({ _id:userId }, async (err, user) => {
            if(user){
                options.from = user.wallets.btc.publicKey;
                let privateKey =await config.encodeDecode(user.wallets.btc.privateKey, 'd');
                console.log(privateKey);
                
                options.privateKey = privateKey;
                console.log("from:"+options.from,"to:"+options.to,"amount:"+options.amount,"privateKey:"+options.privateKey);
                
                let txId = await transaction.sendTx(options);
                console.log(txId);
                
                res.send(txId);            }
            else{
                res.send({success:false,message:err});
            }
        });        
    }
});
////////////////
router.get('/getHistory',VerifyToken, async function(req,res,next){
    const userId=req.userId;
    const options={}
   User.findOne({ _id:userId }, async (err, user) => {
       if(user){
        options.address=user.wallets.btc.publicKey;
        let history=await bitcoin.getHistory(options);
        res.send(history);
       }
       else{
           res.send({success:false,error:err})
       }
   })
})
/////////////////
router.get('/getAddress',async function (req, res, next) {
    const network=req.query.network;
   let keyPair=await transaction.getAddress(network);
   if(keyPair){
       res.send({success:true,keyPair:keyPair})
   }else{
       res.send({success:false,message:"Address can not be fetched"})
   }
})
///////////////////
router.post('/sendTestnetBtc', async function (req, res, next) {
    const option={
    network:'testnet',
    to:req.body.to,
    from:"mpuZcN8gQ6n53cJpZrCcp2zYpr3AfRNkmW",
    privateKey:"cPyW8HV3fo4FTPU9617FmYSnjYRCJuNFLWGEn5tcBboSpCtNt3HS",
    amount:req.body.amount,
    fee:req.body.fee
    }
    let txid=await bitcoin.sendTransaction(option);
    console.log("This is transaction id:"+txid);
    
    if(txid){
    res.send(txid);
    }
    else{
    res.send({success:true,message:"Transaction sending problem"});
    
    }
    })
    ///////////////////////////
    router.post('/sellToken',VerifyToken, async function (req, res, next) {
        console.log("token sell api called!");
        
         const userId = req.userId;
         const options= {
                     toToken:"1S9VFudAKsCAMiQnVBJgTHmhDEQZcBBAWwPzBQ",
                     token:req.body.token,
                     userId:userId,
                 }
         if (!userId || userId === "", userId === undefined){
             res.send({ success: false, message: "Missing required parameter" })
         }
         else{
     
             User.findOne({ _id:userId }, async (err, user) => {
                 if(user){
                     options.toBtc = user.wallets.btc.publicKey;
                     options.fromToken=user.multiAddress;
                     let txId = await bitcoin.saleToken(options);
                     res.send(txId);            }
                 else{
                     res.send({success:false,message:err});
                 }
             });        
         }
     });
  ////////////////////////

module.exports = router;

