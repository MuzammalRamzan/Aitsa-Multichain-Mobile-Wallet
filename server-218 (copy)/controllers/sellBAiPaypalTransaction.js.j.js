var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var db = mongoose.connection;
var uniqid = require('uniqid');
var VerifyToken = require('../auth/VerifyToken');
const sellBAIToken = require('../src/bitcoin/saleBAIModel');
var multichain = require('../src/multichain/multichain.js')
const User = require('../user/User')
router.use(bodyParser.urlencoded({
    extended: false
}));

router.use(bodyParser.json());
//--------------------sale token by paypal----------------------
router.post('/saleTokenPaypal', VerifyToken, async function (req, res, next) {
    const userId = req.userId;
    const email = req.body.email;
    let emailvalid = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailvalid.test(email))
        return res.send({
            success: false,
            message: "Please enter a valid email address"
        })
    const amount = req.body.amount;
    if (!email || email === "" || email === undefined ||
        !amount || amount == "" || amount === undefined ||
        !userId || userId == "" || userId === undefined) {
        return res.send({
            success: false,
            message: "Invalid parameters"
        })
    }
    if (typeof amount !== "number") {
        res.send({
            status: false,
            message: "Amount should be in number!"
        })
    }
    User.findOne({
        _id: userId
    }, async (err, user) => {
        if (user) {
            const fromAddress = user.multiAddress;
            const toAddress = "1S9VFudAKsCAMiQnVBJgTHmhDEQZcBBAWwPzBQ";
            const tx = await multichain.transferToken(fromAddress, toAddress, amount);
            console.log("1" + typeof fromAddress, "2" + typeof tx.result, "3" + typeof email, "4" + typeof uniqid())
            const saleBAIModel = new sellBAIToken({
                sentBai: amount,
                UsdAmount:amount,
                status: 0,
                email: email,
                txId: tx.result,
                multiAddress: fromAddress
            })
            console.log(saleBAIModel);

            res.send(tx)
            console.log(tx.success);

            if (tx.success) {
                db.collection("saleBAIByPaypal").insert(saleBAIModel, (err, UpdatedOn) => {
                    if (err) {
                        console.log("Data inserting problem!");

                    } else {
                        console.log("Data has inserted!", typeof uniqid());

                    }
                })
            }

        }
    })

});
//-------------Get all unconfirmed User Data----------
router.get("/getUnconfirmedData", VerifyToken, async (req, res) => {
    const userId = req.userId;
    User.findOne({
        _id: userId
    }, async (err, user) => {
        if (user) {
            if (user.walletId == "b4ed06fc-ad37-4c60-b843-4337da2cbd63") {

                db.collection("saleBAIByPaypal").find({
                    status: 0
                }, {
                    projection: {
                        _id: 0
                    }
                }).toArray((err, result) => {
                    if (err) {
                        res.send({
                            status: false,
                            error: err
                        })
                    } else {
                        res.send({
                            status: true,
                            result: result
                        })
                    }
                })
            } else {
                res.send({
                    status: false,
                    message: "Only Admin can view this record!"
                })
            }
        }
    })
})
//----------Updated status from unconfirmed to COnfirmed-------------
router.post("/UpdateStatusPaypal", VerifyToken, async (req, res, next) => {
    const userId = req.userId;
    const id = req.body.id;
    if (!id || id === "" || id === undefined) {
        return res.send({
            success: false,
            message: "Invalid parameters"
        })
    }
    User.findOne({
        _id: userId
    }, async (err, user) => {
        if (user.walletId == "b4ed06fc-ad37-4c60-b843-4337da2cbd63") {
            var query = {
                "txId": id
            }
            db.collection("saleBAIByPaypal").find(
                query, {
                    projection: {
                        _id: 0,
                        sentBai: 0,
                        multiAddress: 0,
                        email: 0
                    }
                }).toArray((err, result) => {
                console.log(result[0]?true:false);
                
                if (result[0]) {
                            if (result[0].status == 0) {
                            db.collection('saleBAIByPaypal').update({
                                "txId": id
                            }, {
                                $set: {
                                    "status": 1
                                }
                            })
                            res.send({
                                status: true,
                                message: "Status updated",
                            })
                        } else {
                            res.send({
                                status: false,
                                message: "Status has already updated!"
                            })
                        }
                    
                } else {
                    res.send({
                        success: false,
                        message: "Invalid transaction id!"
                    })
                }

            })

        } else {
            res.send({
                status: false,
                message: "Status can only updated by Admin!"
            })
        }
    })
})
user.find
//-----------------Get history-------------
router.get('/getSellBAIHistory', VerifyToken, async function (req, res, next) {
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
                console.log("multiAddress:" + multiAddress)
                db.collection('saleBAIByPaypal').find({status:0,
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
//-----------------------------------------------
module.exports = router;