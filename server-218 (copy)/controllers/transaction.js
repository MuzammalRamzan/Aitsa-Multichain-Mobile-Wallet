var express = require('express');
let price = require('crypto-price')
var router = express.Router();
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var db = mongoose.connection;
const buyBaiModel = require('../src/bitcoin/buyBaiModel');
var multichain = require('../src/multichain/multichain.js')
var VerifyToken = require('../auth/VerifyToken');
var bitcoin = require('../src/bitcoin/api')
var balance = require('../utils/balances')
var transaction = require('../utils/transaction')
var address = require('../utils/addresses')
const User = require('../user/User')
var config = require('../config')
var history = require('../utils/history')
let salePaypalBAIModel ={}
router.use(bodyParser.urlencoded({
    extended: false
}));
router.use(bodyParser.json());
//---------------Get balance of mainnet as well as testnet--------------------
router.get('/getBalance', VerifyToken, async function (req, res, next) {
    const userId = req.userId;
    const currency = req.query.currency;
    const network = req.query.network;
    let query = Object.keys(req.query).length
    if (query > 2) {
        res.send({
            success: false,
            message: "Page not found"
        })
        return;
    } else {
        console.log("ELSE PART")
        if (!userId || userId === "" || userId === undefined ||
            !currency || currency === "" || currency === undefined) {
            res.send({
                success: false,
                error: "Invalid parameters"
            })
            return;
        }
        try {
            var currentbalance = await balance.getbalance(userId, network, currency).
            catch((e) => {
                res.send({
                    success: false,
                    error: e.message
                })
            })
            console.log(typeof currentbalance);

            console.log("This is balance:" + currentbalance + ' ' + 'BTC');

            res.send({
                status: true,
                balance: currentbalance + ' ' + 'BTC'
            })
        } catch (err) {
            res.send({
                success: false,
                error: err.message
            })
        }
    }
});
//-----------------send bitcoin from one user to other----------------------
router.post('/sendCurrency', VerifyToken, async function (req, res, next) {
    const userId = req.userId;
    const currency = req.query.currency;
    const network = req.query.network;
    const options = {
        fee: req.body.fee,
        to: req.body.to,
        amount: req.body.amount,
        userId: userId,
        walletType: currency,
        network: network
    }
    if (!userId || userId === "", userId === undefined) {
        res.send({
            success: false,
            message: "Missing required parameter"
        })
    } else {

        User.findOne({
            _id: userId
        }, async (err, user) => {
            if (user) {
                options.from = user.wallets.btc.publicKey;
                let privateKey = await config.encodeDecode(user.wallets.btc.privateKey, 'd');
                console.log(privateKey);

                options.privateKey = privateKey;
                console.log("from:" + options.from, "to:" + options.to, "amount:" + options.amount, "privateKey:" + options.privateKey);

                let txId = await transaction.sendTx(options);
                console.log(txId);

                res.send(txId);
            } else {
                res.send({
                    success: false,
                    message: err
                });
            }
        });
    }
});
//-----------Get history of mainnet trasnactions-------------------

router.get('/getHistory', VerifyToken, async function (req, res, next) {
    const userId = req.userId;
    const currency = req.query.currency;
    console.log(userId);
    console.log(currency)
    if (!userId || userId === "" || userId === undefined ||
        !currency || currency === "" || currency === undefined) {
        res.send({
            success: false,
            error: "Invalid parameters"
        })
        return;
    }
    try {
        var historyList = await history.getHistory({
            userId,
            walletType: currency
        })
        res.send(historyList)
    } catch (err) {
        res.send(err)
    }

});

//---------------------Get Address of mainnet as well as testnet--------------
router.get('/getAddress', async function (req, res, next) {
    const network = req.query.network;
    let keyPair = await address.getaddress(network, "btc");
    console.log(keyPair);

    if (keyPair) {
        res.send({
            success: true,
            keyPair: keyPair
        })
    } else {
        res.send({
            success: false,
            message: "Address can not be fetched"
        })
    }
})

//--------------------Sell token to client-------------------
router.post('/sellToken', VerifyToken, async function (req, res, next) {
    console.log("token sell api called!");
    const network = req.query.network;
    const userId = req.userId;
    const options = {
        token: req.body.token,
        userId: userId,
        network: network
    }
    if (network === "testnet") {
        options.toToken = "1PuCmWACRtTfMSCNNpDFAhzqzaybP7jHGtsWrr";
    } else {
        options.toToken = "1S9VFudAKsCAMiQnVBJgTHmhDEQZcBBAWwPzBQ"
    }
    if (!userId || userId === "", userId === undefined) {
        res.send({
            success: false,
            message: "Missing required parameter"
        })
    } else {

        User.findOne({
            _id: userId
        }, async (err, user) => {
            if (user) {
                options.toBtc = user.wallets.btc.publicKey;
                options.fromToken = user.multiAddress;
                let txId = await bitcoin.saleToken(options);
                res.send(txId);
            } else {
                res.send({
                    success: false,
                    message: err
                });
            }
        });
    }
});
//-----------------------Buy BAI token-------------------------
router.post('/buyToken', VerifyToken, async function (req, res, next) {
    const fromAddress = "1S9VFudAKsCAMiQnVBJgTHmhDEQZcBBAWwPzBQ";
    const toAddress = req.body.toAddress;
    const amount = req.body.amount;
    const txId = req.body.txId;
    console.log("toAddress:"+toAddress,"amount:"+amount,"txId:"+txId);
    
    if ( !toAddress || toAddress === "" || toAddress === undefined ||
        !amount || amount === "" || amount === undefined ||
        !txId || txId === "" || txId === undefined
    ) {
        return res.send({
            success: false,
            message: "Invalid parameters"
        })
    }

    const baiAmount = await bitcoin.btcToBai(amount);
    const status = await bitcoin.getConfirmation();
    const fixedAmount = baiAmount.toFixed(0);
    const token = parseInt(fixedAmount);
    console.log(typeof fromAddress, typeof toAddress, typeof token);
    const buyBaiTransactionModel = new buyBaiModel({
        sentBai: token,
        status: status,
        txID: txId,
        receivedBtc: amount,
        multiAddress: fromAddress
    })
    db.collection("BuyBaiHistory").insert(buyBaiTransactionModel, (err, UpdatedOn) => {
        if (err) {
            console.log("Data inserting problem!");

        } else {
            console.log("Data has inserted!");

        }
    })
    if (typeof token !== "number") {
        res.send({
            status: false,
            message: "Converstion issue form string value to number!"
        })
    }
    const tx = await multichain.transferToken(fromAddress, toAddress, token);
    if (tx) {
        res.send(tx)
    }

})
//---------------------Buy token From USD
router.post('/buyTokenPaypal', VerifyToken, async function (req, res, next) {
    const fromAddress = "1S9VFudAKsCAMiQnVBJgTHmhDEQZcBBAWwPzBQ";
    const toAddress = req.body.toAddress;
    const amount = req.body.amount;
    if (!fromAddress || fromAddress === "" || fromAddress === undefined ||
        !toAddress || toAddress === "" || toAddress === undefined ||
        !amount || amount === undefined) {
        return res.send({
            success: false,
            message: "Invalid parameters"
        })
    }
    if (typeof amount !== "number") {
        res.send({
            success: false,
            message: "Amount should be in number!"
        })
    }
    console.log("From Address:" + fromAddress, "ToAddress:" + toAddress, "Amount:" + amount);
    const tx = await multichain.transferToken(fromAddress, toAddress, amount);
    if (tx) {
        res.send(tx)
    } else {
        res.send({
            success: false,
            message: "There is a problem in transaction!"
        })
    }

})
//------------get Buy BAI history------------------
router.get('/getBuyHistory', VerifyToken, async function (req, res, next) {
    const userId = req.userId;
    if (!userId || userId === "", userId === undefined) {
        res.send({
            success: false,
            message: "Missing required parameter"
        })
    } else {

        User.findOne({
            _id: userId
        }, async (err, user) => {
            if (user) {
                const multiAddress = user.multiAddress;
                db.collection('BuyBaiHistory').find({
                    multiAddress: multiAddress
                }).toArray((err, result) => {
                    if (err) {
                        res.send(err)
                    } else {

                        res.send({
                            success: true,
                            result: result
                        })
                    }
                })
            } else {
                res.send({
                    success: false,
                    message: err
                });
            }
        });
    }
})
module.exports = router;