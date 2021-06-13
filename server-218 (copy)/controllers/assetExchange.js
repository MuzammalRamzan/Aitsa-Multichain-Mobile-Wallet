var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
const multer = require('multer');
var uniqid = require('uniqid');
var db = mongoose.connection;
var VerifyToken = require('../auth/VerifyToken');
const assetExchangeModel = require('../src/bitcoin/assetExchangeModel');
const notificationModel = require('../src/bitcoin/notificationModel');
const User = require('../user/User');
const multichain = require('../src/multichain/multichain');
const assetBuyModel = require('../src/bitcoin/BuyAssetModel');
const multiModel = require('../src/multichain/multiModel');
//-------------------------functions-------------------

//---------------------Notification function!-----------------
async function notification(Notification, from, to) {
    const notificationModelOf = new notificationModel({
        Notification,
        from,
        to,
        createdAt: Date.now() || 0
    })
    db.collection("notifications").insert(notificationModelOf, (err, UpdatedOn) => {
        if (err) {
            resolve({
                success: false,
                message: "DB Issue while transering asset!"
            })
        } else {
            console.log("notification Data has inserted!")
        }
    })
}
//-------------------------------------------------
async function checkTxId(tx, payload) {
    return new Promise(async (resolve, reject) => {
        if (tx.result) {
            const assetBuyModelOf = new assetBuyModel({
                txID: tx.result,
                AssetName: payload.name,
                AssetType: payload.type,
                AssetUnit: payload.unit,
                price: payload.price,
                Quantity: payload.quantity,
                status: payload.status,
                BuyerMultichainAddress: payload.buyerAddress,
                SellerMultichainAddress: payload.sellerAddress
            })
            var price = payload.price * payload.quantity;
            var buyerNotification = `You have received ${payload.quantity} ${payload .name}  against ${price} BAI`;
            var sellerNotification = `${payload.username} has transfered ${price} BAI to buy ${payload.quantity} ${payload.name} from you`;
            notification(sellerNotification, payload.walletIdOfBuyer, payload.walletId);
            db.collection('BuyAssetRequests').insert(assetBuyModelOf, (err, UpdatedOn) => {
                if (err) {
                    resolve({
                        success: false,
                        message: "Buyer Request, DB storing issue in DB!"
                    })
                } else {
                    console.log("Data has inserted!");
                }
            })
            const txIdAsset = await multichain.transferAsset(payload.sellerAddress, payload.buyerAddress, payload.name, payload.quantity)
            if (tx.result) {
                notification(buyerNotification, payload.walletId, payload.walletIdOfBuyer);
                db.collection('BuyAssetRequests').update({
                    "txID": tx.result
                }, {
                    $set: {
                        "status": "Confirmed"
                    }
                })
                resolve({
                    success: true,
                    message: `You have received ${payload.quantity} Asset`
                })
            }

        } else {
            resolve({
                success: false,
                message: tx.message.message
            })
        }
    })

}

async function statusUpdate(walletID, promotionPrice, status, id) {
    return new Promise((resolve, reject) => {
        console.log(status);
        const Notification = `Your asset promotional post request has been accepted please pay ${promotionPrice} BAI to admin then your post will be promoted!`;
        db.collection("AssetExchangeData").find({
            id: id
        }).toArray((err, result) => {
            if (result[0]) {
                if (result[0].walletId === walletID && result[0].promotionPrice == promotionPrice) {
                    console.log(status, result[0].status);
                    if (result[0].status === "Accepted" || result[0].status === "Rejected") {
                        resolve({
                            success: false,
                            message: "Status has already updated!"
                        })
                    }
                    db.collection('AssetExchangeData').update({
                        "id": id
                    }, {
                        $set: {
                            "status": status
                        }
                    })
                    notification(Notification, "b4ed06fc-ad37-4c60-b843-4337da2cbd63", walletID)
                    resolve({
                        success: true,
                        message: "Status updated",
                    })
                } else {
                    resolve({
                        success: false,
                        message: "walletId and promotionPrice not matching!"
                    })
                }
            } else {
                resolve({
                    success: false,
                    message: "Data not found!"
                })
            }

        })
    })
}
//-------------------------------Check file type functions------------------
async function getExtension(filename) {
    var parts = filename.split('.');
    return parts[parts.length - 1];
}

async function isImage(filename) {
    var ext = await getExtension(filename);
    console.log(ext.toLowerCase());
    switch (ext.toLowerCase()) {
        case 'jpg':
        case 'gif':
        case 'png':
        case 'tiff':
        case 'svg':

            return true;
    }
    return false;
}

async function isVideo(filename) {
    var ext = await getExtension(filename);
    switch (ext.toLowerCase()) {
        case 'm4v':
        case 'avi':
        case 'mpg':
        case 'mp4':
        case 'mov':
        case 'wmv':
        case 'flv':
        case 'avi':
        case 'avchd':
        case 'webm':
        case 'mkv':

            return true;
    }
    return false;
}
//------------------
//-----------------------API for sending request to admin of assets--------------
router.post('/postAssetRequest', VerifyToken, async function (req, res, next) {
    const fileLink = req.body.fileLink
    const name = req.body.name;
    const type = req.body.type;
    const price = req.body.price;
    const unit = req.body.unit;
    const description = req.body.description;
    const fromDate = req.body.fromDate;
    const toDate = req.body.toDate;
    const promotionPrice = req.body.promotionPrice;
    const userId = req.userId;
    if (!name || name === "" || name === undefined ||
        !type || type == "" || type === undefined ||
        !promotionPrice || promotionPrice == "" || promotionPrice === undefined ||
        !fromDate || fromDate == "" || fromDate === undefined ||
        !toDate || toDate == "" || toDate === undefined ||
        !userId || userId == "" || userId === undefined ||
        !price || price == "" || price === undefined ||
        !unit || unit == "" || unit === undefined) {
        return res.send({
            success: false,
            message: "Invalid parameters"
        })
    }
    if (Date.parse(fromDate) > Date.parse(toDate)) {
        res.send({
            success: false,
            message: "From Date should not be greater than to Date"
        })
    }
    User.findOne({
        _id: userId
    }, async (err, user) => {
        if (user) {
            if (fileLink) {
                const imageFileType = await isImage(fileLink);
                const videoFileType = await isVideo(fileLink);
                if (imageFileType !== true && videoFileType !== true) {
                    res.send({
                        success: false,
                        message: "Only Image Or video are allowed!"
                    })
                }
            }

            const walletId = user.walletId;
            const multiAddress = user.multiAddress;
            console.log("This is multiAddress:" + multiAddress);
            console.log("This is wallet id:" + walletId);
            if (walletId == "b4ed06fc-ad37-4c60-b843-4337da2cbd63") {
                status = "Accepted";
                promotionStatus = "enable"
            } else {
                status = "Pending";
                promotionStatus = "disabled";

            }
            const assetExchangeModelOf = new assetExchangeModel({
                id: uniqid(),
                walletId,
                name,
                type,
                unit,
                price,
                description,
                fromDate: Date.parse(fromDate),
                toDate: Date.parse(toDate),
                promotionPrice,
                currency: "BAI",
                status: status,
                fileLink: fileLink,
                promotionStatus,
                multiAddress,
            })
            const Notification = user.username + ' ' + 'has send you a Asset promotion request!';
            db.collection("AssetExchangeData").insert(assetExchangeModelOf, (err, UpdatedOn) => {
                if (err) {
                    console.log("Data inserting problem!")
                } else {
                    console.log("Data has inserted!")
                }
            })
            if (user.walletId !== "b4ed06fc-ad37-4c60-b843-4337da2cbd63") {
                notification(Notification, user.walletId, "b4ed06fc-ad37-4c60-b843-4337da2cbd63")
            }
            res.send({
                success: true,
                message: "Your Request has been submitted!"
            })
        } else {
            res.send({
                success: false,
                message: "No user found!"
            })
        }
    })

});
//----------------------Get posted request for admin only-----------
router.get("/GetAdminAssetDetail", VerifyToken, async (req, res, next) => {
    var nowDate = new Date();
    var date = nowDate.getFullYear() + '/' + (nowDate.getMonth() + 1) + '/' + nowDate.getDate();
    console.log(Date.parse(date));
    const userId = req.userId;
    User.findOne({
        _id: userId
    }, async (err, user) => {
        if (user.walletId == "b4ed06fc-ad37-4c60-b843-4337da2cbd63") {
            var query = {
                $and: [{
                    $or: [{
                        status: {
                            $eq: "Pending"
                        }
                    }, {
                        status: {
                            $eq: "Accepted"
                        }
                    }]
                }, {
                    $or: [{
                            $and: [{
                                fromDate: {
                                    $gt: Date.parse(date)
                                },
                            }, {
                                toDate: {
                                    $gt: Date.parse(date)
                                }
                            }]
                        },
                        {
                            $and: [{
                                fromDate: {
                                    $lt: Date.parse(date)
                                },
                            }, {
                                toDate: {
                                    $gt: Date.parse(date)
                                }
                            }]
                        },
                        {
                            $and: [{
                                fromDate: {
                                    $eq: Date.parse(date)
                                },
                            }, {
                                toDate: {
                                    $gt: Date.parse(date)
                                }
                            }]
                        },
                        {
                            $and: [{
                                fromDate: {
                                    $lt: Date.parse(date)
                                },
                            }, {
                                toDate: {
                                    $eq: Date.parse(date)
                                }
                            }]
                        },
                        {
                            $and: [{
                                fromDate: {
                                    $eq: Date.parse(date)
                                },
                            }, {
                                toDate: {
                                    $eq: Date.parse(date)
                                }
                            }]
                        },


                    ],
                }]



            }
            db.collection("AssetExchangeData").find(query).toArray((err, result) => {

                res.send({
                    success: true,
                    result: result
                })
            })

        } else {
            res.send({
                success: false,
                message: "Record can only accessed by Admin!"
            })
        }
    })
});
//------------------------Get User promotion details------------
router.get("/GetUserPromotionDetail", VerifyToken, async (req, res, next) => {
    var nowDate = new Date();
    var date = nowDate.getFullYear() + '/' + (nowDate.getMonth() + 1) + '/' + nowDate.getDate();
    console.log(Date.parse(date));
    const userId = req.userId;
    User.findOne({
        _id: userId
    }, async (err, user) => {
        if (user) {
            var projectionQuery = {
                projection: {
                    _id: 0,
                    id: 0,
                    fromDate: 0,
                    toDate: 0,
                    promotionPrice: 0,
                    status: 0,
                    promotionStatus: 0,
                    walletId: 0
                }
            }
            var query = {
                $and: [{
                    status: "Accepted",
                    promotionStatus: "enable",
                }, {
                    walletId: {
                        $ne: user.walletId
                    }
                }, {
                    $or: [{
                            $and: [{
                                fromDate: {
                                    $lt: Date.parse(date)
                                },
                            }, {
                                toDate: {
                                    $gt: Date.parse(date)
                                }
                            }]
                        },
                        {
                            $and: [{
                                fromDate: {
                                    $eq: Date.parse(date)
                                },
                            }, {
                                toDate: {
                                    $gt: Date.parse(date)
                                }
                            }]
                        },
                        {
                            $and: [{
                                fromDate: {
                                    $eq: Date.parse(date)
                                },
                            }, {
                                toDate: {
                                    $eq: Date.parse(date)
                                }
                            }]
                        },
                        {
                            $and: [{
                                fromDate: {
                                    $lt: Date.parse(date)
                                },
                            }, {
                                toDate: {
                                    $eq: Date.parse(date)
                                }
                            }]
                        },


                    ],
                }]



            }
            db.collection("AssetExchangeData").find(query, projectionQuery).toArray((err, result) => {

                res.send({
                    success: true,
                    result: result
                })
            })

        } else {
            res.send({
                success: false,
                message: "User not found!"
            })
        }
    })
});

//---------------------------------------------------------------
//------------update status of promotion--------------------
router.post("/statusUpdatePost", VerifyToken, async (req, res, next) => {
    const userId = req.userId;
    const id = req.body.id;
    const walletID = req.body.walletId;
    const promotionPrice = req.body.promotionPrice;
    const status = req.body.status;
    if (!id || id === "" || id === undefined ||
        !walletID || walletID === "" || id === undefined ||
        !status || status === "" || status === undefined ||
        !promotionPrice || promotionPrice === "" || promotionPrice === undefined) {
        return res.send({
            success: false,
            message: "Invalid parameters"
        })
    }
    User.findOne({
        _id: userId
    }, async (err, user) => {
        if (user.walletId == "b4ed06fc-ad37-4c60-b843-4337da2cbd63") {
            const validity = await statusUpdate(walletID, promotionPrice, status, id)
            res.send(validity)
        } else {
            res.send({
                success: false,
                message: "Only admin can update this status!"
            })
        }
    })
})
router.get('/getNotification', VerifyToken, async (req, res) => {
    const userId = req.userId;
    if (!userId || userId === "" || userId === undefined) {
        res.send({
            success: false,
            message: "Invalid parameters"
        })
    }
    User.findOne({
        _id: userId
    }, async (err, user) => {
        if (user) {
            const walletId = user.walletId;
            db.collection("notifications").find({
                to: walletId
            }).toArray((err, result) => {
                res.send({
                    success: true,
                    result: result
                })
            })
        } else {
            res.send({
                success: false,
                message: "User not found!"
            })
        }

    })
});
router.post('/BuyAsset', VerifyToken, async (req, res) => {
    const userId = req.userId;
    const payload = {
        name: req.body.name,
        type: req.body.type,
        unit: req.body.unit,
        sellerAddress: req.body.sellerAddress,
        quantity: req.body.quantity,
        price: req.body.price,
        walletId: req.body.walletId,
        status: "Pending",
    }
    console.log(typeof payload.price, typeof payload.quantity);
    if (typeof payload.price !== "number" || typeof payload.quantity !== "number") {
        res.send({
            success: false,
            message: "Type of Price and Quantity should be Number!"
        })
    }
    if (!payload.name || payload.name === "" || payload.name === undefined ||
        !payload.type || payload.type === "" || payload.type === undefined ||
        !payload.sellerAddress || payload.sellerAddress === "" || payload.sellerAddress === undefined ||
        !payload.quantity || payload.quantity === "" || payload.quantity === undefined ||
        !payload.price || payload.price === "" || payload.price === undefined ||
        !payload.walletId || payload.walletId === "" || payload.walletId === undefined |
        !payload.unit || payload.unit === "" || payload.unit === undefined) {
        return res.send({
            success: false,
            message: "Invalid parameters"
        })

    }
    User.findOne({
        _id: userId
    }, async (error, user) => {
        if (user) {
            payload.username = user.username;
            payload.walletIdOfBuyer = user.walletId;
            payload.buyerAddress = user.multiAddress;
            const assets = await multichain.getAssets(payload.sellerAddress);
            var result = assets.result.filter(asset => asset.name === payload.name);
            console.log(result);
            if (!result[0]) {
                res.send({
                    success: false,
                    message: "No asset with this name available!!"
                })
            } else if (result[0].qty < payload.quantity) {
                res.send({
                    success: false,
                    message: `Total Quantity of asset available is ${result[0].qty} `
                })
            } else {
                let price = payload.price * payload.quantity;
                console.log("This is BAI transfered amount" + price);
                tx = await multichain.transferToken(payload.buyerAddress, payload.sellerAddress, price)
                if (tx) {
                    const newMultiModel = new multiModel({
                        address: user.multiAddress,
                        name: payload.name,
                        price: payload.price
                    })
                    db.collection("updateAssetPrice").find({
                        "address": user.multiAddress,
                        "name": payload.name
                    }).toArray(async (err, result) => {
                        if (result[0]) {
                            console.log("This is result:"+result[0]);
                            console.log("data has updatedd!");
                            db.collection('updateAssetPrice').update({
                                "address": user.multiAddress,
                                "name": payload.name
                            }, {
                                $set: {
                                    "price": payload.price
                                }
                            })
                        } else {
                            db.collection('updateAssetPrice').insert(newMultiModel, (err, updateOn) => {
                                if (err) {
                                    resolve({
                                        success: false,
                                        message: err
                                    })
                                } else {
                                    console.log("Data has inserted!");
                                }
                            })
                        }
                    })
                    const assetTx = await checkTxId(tx, payload, user.walletId);
                    console.log(assetTx);
                    res.send(assetTx)
                } else {
                    res.send({
                        success: false,
                        message: "Multichain Transaction Problem!"
                    })
                }
            }


        }
    })
});
//-------------------------------
router.get("/getPostDataDetails", VerifyToken, async (req, res, next) => {
    var nowDate = new Date();
    var date = nowDate.getFullYear() + '/' + (nowDate.getMonth() + 1) + '/' + nowDate.getDate();
    console.log(Date.parse(date));
    const userId = req.userId;
    User.findOne({
        _id: userId
    }, async (err, user) => {
        if (user) {
            var projectionQuery = {
                projection: {
                    _id: 0,
                }
            }
            var query = {
                $and: [{
                    walletId: user.walletId,
                }, {
                    $or: [{
                            $and: [{
                                fromDate: {
                                    $gt: Date.parse(date)
                                },
                            }, {
                                toDate: {
                                    $gt: Date.parse(date)
                                }
                            }]
                        },
                        {
                            $and: [{
                                fromDate: {
                                    $lt: Date.parse(date)
                                },
                            }, {
                                toDate: {
                                    $gt: Date.parse(date)
                                }
                            }]
                        },
                        {
                            $and: [{
                                fromDate: {
                                    $eq: Date.parse(date)
                                },
                            }, {
                                toDate: {
                                    $gt: Date.parse(date)
                                }
                            }]
                        },
                        {
                            $and: [{
                                fromDate: {
                                    $lt: Date.parse(date)
                                },
                            }, {
                                toDate: {
                                    $eq: Date.parse(date)
                                }
                            }]
                        },
                        {
                            $and: [{
                                fromDate: {
                                    $eq: Date.parse(date)
                                },
                            }, {
                                toDate: {
                                    $eq: Date.parse(date)
                                }
                            }]
                        },


                    ],
                }]



            }
            db.collection("AssetExchangeData").find(query, projectionQuery).toArray((err, result) => {

                res.send({
                    success: true,
                    result: result
                })
            })

        } else {
            res.send({
                success: false,
                message: "User not found!"
            })
        }
    })
});
//---------------update promotionss status----------------------
router.post("/updatePromotionStatus", VerifyToken, async (req, res, next) => {
    var nowDate = new Date();
    var date = nowDate.getFullYear() + '/' + (nowDate.getMonth() + 1) + '/' + nowDate.getDate();
    console.log(Date.parse(date));
    const id = req.body.id;
    const userId = req.userId;
    User.findOne({
        _id: userId
    }, async (err, user) => {
        if (user) {
            db.collection("AssetExchangeData").find({
                id: id
            }).toArray(async (err, result) => {
                console.log("This is main result:" + result[0]);
                if (result[0]) {
                    if (result[0].walletId !== user.walletId) {
                        res.send({
                            success: false,
                            message: "This id does not belong to this user!"
                        })
                    } else {
                        var query = {
                            $and: [{
                                promotionStatus: "disabled",
                                id: id,
                                status: "Accepted",
                            }, {
                                $or: [{
                                        $and: [{
                                            fromDate: {
                                                $gt: Date.parse(date)
                                            },
                                        }, {
                                            toDate: {
                                                $gt: Date.parse(date)
                                            }
                                        }]
                                    },
                                    {
                                        $and: [{
                                            fromDate: {
                                                $lt: Date.parse(date)
                                            },
                                        }, {
                                            toDate: {
                                                $gt: Date.parse(date)
                                            }
                                        }]
                                    },
                                    {
                                        $and: [{
                                            fromDate: {
                                                $eq: Date.parse(date)
                                            },
                                        }, {
                                            toDate: {
                                                $gt: Date.parse(date)
                                            }
                                        }]
                                    },
                                    {
                                        $and: [{
                                            fromDate: {
                                                $lt: Date.parse(date)
                                            },
                                        }, {
                                            toDate: {
                                                $eq: Date.parse(date)
                                            }
                                        }]
                                    },
                                    {
                                        $and: [{
                                            fromDate: {
                                                $eq: Date.parse(date)
                                            },
                                        }, {
                                            toDate: {
                                                $eq: Date.parse(date)
                                            }
                                        }]
                                    },


                                ],
                            }]



                        }
                        db.collection("AssetExchangeData").find(query).toArray(async (err, result) => {
                            console.log("This is sub result:" + result);
                            if (result[0]) {
                                let token = result[0].promotionPrice;
                                let fromAddress = user.multiAddress;
                                let toAddress = "1S9VFudAKsCAMiQnVBJgTHmhDEQZcBBAWwPzBQ";
                                tx = await multichain.transferToken(fromAddress, toAddress, token);
                                if (tx.result) {
                                    var userNotification = `${user.username} has paid ${token} BAI to enable promotional post!`;
                                    var adminNotification = `your post has been enabled`;
                                    notification(userNotification, user.walletId, 'b4ed06fc-ad37-4c60-b843-4337da2cbd63');
                                    db.collection('AssetExchangeData').update({
                                        "id": id
                                    }, {
                                        $set: {
                                            "promotionStatus": "enable"
                                        }
                                    })
                                    notification(adminNotification, 'b4ed06fc-ad37-4c60-b843-4337da2cbd63', user.walletId);
                                    res.send({
                                        success: true,
                                        message: "Your Promotion status has enabled!"
                                    })
                                } else {
                                    res.send({
                                        success: false,
                                        message: tx.message.message
                                    })
                                }

                            } else {
                                res.send({
                                    success: false,
                                    message: "You have no pending record against this Id"
                                })
                            }

                        })
                    }
                } else {
                    res.send({
                        success: false,
                        message: "You have no pending record against this Id!"
                    })
                }
            })

        } else {
            res.send({
                success: false,
                message: "User not found!"
            })
        }
    })
});

module.exports = router;