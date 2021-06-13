var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var VerifyToken = require('../auth/VerifyToken');
const bigchain = require('../src/bigchaindb/api')
const User = require('../user/User')
const config = require('../config')
const launch = require('../bai/launchbai');
const request = require('request');
var multiAsset = require('./multiModel');
var mongoose = require('mongoose');
var db = mongoose.connection;
const multichain = require('../src/multichain/multichain')
const AssetController = require('../user/AssetController');
const {
    modelName
} = require('../user/User');
const {
    resolve
} = require('bluebird');
router.use(bodyParser.urlencoded({
    extended: false
}));
router.use(bodyParser.json());
//---------Create Asset of multichain--------------------
//------------------------------------------------------
router.post('/create', VerifyToken, async function (req, res, next) {
    const payload = req.body.payload;
    const userId = req.userId;
    const metadata = payload;
    if (!payload || payload === "" || payload === undefined ||
        !userId || userId === "" || userId === undefined ||
        !payload.hasOwnProperty('name') ||
        !payload.hasOwnProperty('quantity') ||
        !payload.hasOwnProperty('type') ||
        !payload.hasOwnProperty('price') ||
        !payload.hasOwnProperty('unit')
    ) {
        res.send({
            success: false,
            error: "Please fill required parameters"
        })
        return;
    }
    if (typeof payload['name'] != 'string' || payload['name'].trim() == "")
        return res.send({
            success: false,
            message: "name must be a valid string"
        })
    if (typeof payload['type'] != 'string' || payload['type'].trim() == "")
        return res.send({
            success: false,
            message: "type must be a valid string"
        })
    if (typeof payload['price'] != 'number' || payload['price'] == 0)
        return res.send({
            success: false,
            message: "price must be a valid number"
        })
    if (typeof payload['unit'] != 'string' || payload['unit'].trim() == "")
        return res.send({
            success: false,
            message: "unit must be a valid string"
        })
    if (typeof payload['quantity'] != 'number' || payload['quantity'] == 0)
        return res.send({
            success: false,
            message: "amount must be a valid Integer"
        })
    let nameLength = payload.name.trim().length;
    if (nameLength < 1)
        return res.send({
            success: false,
            message: "Please enter a valid asset name"
        })

    User.findOne({
        _id: userId
    }, async (err, user) => {
        if (err) {
            res.send({
                success: false,
                message: "Incorrect wallet id"
            })
        } else {
            if (user) {

                let multiAddress = user.multiAddress;
                var quantity = payload.quantity;
                var name = payload.name;
                var unit = payload.unit;
                var price = payload.price;
                var type = payload.type;
                console.log("multiAddress:" + multiAddress,
                    "quantity:" + quantity,
                    "name:" + name)

                var asset = await multichain.createAsset(multiAddress, name, quantity, unit, price, type)
                if (asset) {
                    res.send(asset)
                }

            } else {
                res.send({
                    success: false,
                    message: "User multichain wallet not found"
                })
            }
        }
    })

});
//---------Get All asset of multichain blockchain-----------------
//--------------------------------------------------------------
router.get('/assets', VerifyToken, async function (req, res, next) {
    const userId = req.userId;
    User.findOne({
        _id: userId
    }, async (err, user) => {
        if (err) {
            res.send({
                success: false,
                message: "Incorrect wallet id"
            })
        } else {
            if (user) {


                var address = user.multiAddress;
                var asset = await multichain.getAssets(address)
                if (asset) {
                    res.send(asset)
                }

            } else {
                res.send({
                    success: false,
                    message: "User multichain wallet not found"
                })
            }
        }
    })

});
//--------Get public address against token--------------------
//-----------------------------------------------------------
router.get('/bitcoin/address', VerifyToken, async (req, res, next) => {
    const userId = req.userId;
    if (!userId || userId === "", userId === undefined) {
        res.send({
            success: false,
            message: "Missing userId parameter"
        })
    } else {
        User.findOne({
            _id: userId
        }, async (err, user) => {
            if (err) {
                res.send({
                    success: false,
                    message: "Incorrect wallet id"
                })
                return;
            } else {
                if (user) {
                    const pubKey = user.wallets.btc.publicKey
                    res.send({
                        success: true,
                        msg: pubKey
                    })
                } else {
                    res.send({
                        success: false,
                        message: "Incorrect Token"
                    })
                }

            }
        })
    }
})
//----------Get any public address of any token--------------------
//----------------------------------------------------------------


router.get('/bai/address', VerifyToken, async (req, res, next) => { // Get public BAI address   of User
    const userId = req.userId;
    if (!userId || userId === "", userId === undefined) {
        res.send({
            success: false,
            message: "Missing userId parameter"
        })
    } else {
        User.findOne({
            _id: userId
        }, async (err, user) => {
            if (err) {
                res.send({
                    success: false,
                    message: "Incorrect wallet id"
                })
                return;
            } else {
                if (user) {
                    const pubKey = user.wallets.bigchain.publicKey
                    res.send({
                        success: true,
                        msg: pubKey
                    })
                } else {
                    res.send({
                        success: false,
                        message: "Incorrect Token"
                    })
                }

            }
        })
    }
})

//------------------------------------------------------------------
router.get('/token/address', async (req, res, next) => {
    const userId = req.body.walletId;
    const token = req.body.token;
    if (!userId || userId === "", userId === undefined) {
        res.send({
            success: false,
            message: "Missing userId parameter"
        })
    }
    if (token == 'btc' || token == 'bai') {
        var tokenType;

        // console.log("Invalid token")
        User.findOne({
            walletId: userId
        }, async (err, user) => {
            if (err) {
                res.send({
                    success: false,
                    message: "Incorrect wallet id"
                })
                return;
            } else {
                if (user) {
                    var pubKey; //= user.wallets.bigchain.publicKey
                    if (token == 'btc') {
                        pubKey = user.wallets.btc.publicKey
                    } else
                        pubKey = user.wallets.bigchain.publicKey
                    res.send({
                        success: true,
                        msg: pubKey
                    })
                } else {
                    res.send({
                        success: false,
                        message: "Incorrect Token"
                    })
                }

            }
        })
    } else {
        res.send({
            success: false,
            message: "Incorrect token"
        })
    }
})
//-------------Transfer Asset from one user to other--------------
//----------------------------------------------------------------
router.post('/transfer', VerifyToken, async function (req, res, next) {
    const toAddress = req.body.toAddress;
    const payload = req.body.payload;
    const userId = req.userId;
    const metadata = payload;
    if (!payload || payload === "" || payload === undefined ||
        !userId || userId === "" || userId === undefined ||
        !payload.hasOwnProperty('name') ||
        !payload.hasOwnProperty('quantity')
    ) {
        res.send({
            success: false,
            error: "Please fill required parameters"
        })
        return;
    }
    if (typeof payload['name'] != 'string' || payload['name'].trim() == "")
        return res.send({
            success: false,
            message: "name must be a valid string"
        })
    if (typeof payload['quantity'] != 'number' || payload['quantity'] == 0)
        return res.send({
            success: false,
            message: "amount must be a valid Integer"
        })
    let nameLength = payload.name.trim().length;
    if (nameLength < 1)
        return res.send({
            success: false,
            message: "Please enter a valid asset name"
        })

    User.findOne({
        _id: userId
    }, async (err, user) => {
        if (err) {
            res.send({
                success: false,
                message: "Incorrect wallet id"
            })
        } else {
            if (user) {
                let multiAddress = user.multiAddress;
                var quantity = payload.quantity;
                var name = payload.name;
                console.log("multiAddress:" + multiAddress,
                    "quantity:" + quantity,
                    "name:" + name)

                var asset = await multichain.transferAsset(multiAddress, toAddress, name, quantity)
                if (asset) {
                    res.send(asset)
                }

            } else {
                res.send({
                    success: false,
                    message: "User multichain wallet not found"
                })
            }
        }
    })

});
//-------launched BAI token by using this api-------------------
//----------------------------------------------------------------
router.post('/bai/launch', VerifyToken, async function (req, res, next) {
    const quantity = req.body.quantity;
    const userId = req.userId;
    if (!userId || userId === "" || userId === undefined ||
        !quantity || quantity === "" || quantity === undefined
    ) {
        res.send({
            success: false,
            error: "Please fill required parameters"
        })
        return;
    }
    if (typeof quantity != 'number' || quantity == 0)
        return res.send({
            success: false,
            message: "amount must be a valid Integer"
        })
    User.findOne({
        _id: userId
    }, async (err, user) => {
        if (err) {
            res.send({
                success: false,
                message: "Incorrect wallet id"
            })
        } else {
            if (user) {
                let multiAddress = user.multiAddress;
                var asset = await multichain.launchToken(multiAddress, quantity)
                if (asset) {
                    res.send(asset)
                }

            } else {
                res.send({
                    success: false,
                    message: "User multichain wallet not found"
                })
            }
        }
    })

});
//------------Transfer BAI token by using this API-----------------
//-----------------------------------------------------------------
router.post('/bai/transfer', VerifyToken, async function (req, res, next) {
    const toAddress = req.body.toAddress;
    const quantity = req.body.quantity;
    const userId = req.userId;
    if (!userId || userId === "" || userId === undefined ||
        !quantity || quantity === "" || quantity === undefined ||
        !toAddress || toAddress === "" || toAddress === undefined
    ) {
        res.send({
            success: false,
            error: "Please fill required parameters"
        })
        return;
    }
    if (typeof quantity != 'number' || quantity == 0)
        return res.send({
            success: false,
            message: "amount must be a valid Integer"
        })
    User.findOne({
        _id: userId
    }, async (err, user) => {
        if (err) {
            res.send({
                success: false,
                message: "Incorrect wallet id"
            })
        } else {
            if (user) {
                let multiAddress = user.multiAddress;
                var asset = await multichain.transferToken(multiAddress, toAddress, quantity)
                if (asset) {
                    res.send(asset)
                }

            } else {
                res.send({
                    success: false,
                    message: "User multichain wallet not found"
                })
            }
        }
    })

});
//---------Get original private key from encripted text-------------
//------------------------------------------------------------------
router.post('/get/pk', async (req, res) => { // Get Decoded value
    var enc_data = req.body.enc_data;
    console.log("enc_data " + enc_data)
    let privateKey = await config.encodeDecode(enc_data, 'd')
    res.send({
        pk: privateKey
    });

})

//---------------Get all Asset types-------------
//-----------------------------------------------
router.get('/asset/types', VerifyToken, async (req, res) => {
    await AssetController.getAllAssetType(function (response) {
        res.send(response)
    });

})
//------------Get token balance,mean balance of BAI of specific user------------
//----------------------------------------------------------------------------- 
router.get('/get/tokens', VerifyToken, async function (req, res, next) {
    const userId = req.userId;
    User.findOne({
        _id: userId
    }, async (err, user) => {
        if (err) {
            res.send({
                success: false,
                message: "Incorrect wallet id"
            })
        } else {
            if (user) {


                var address = user.multiAddress;
                var asset = await multichain.getTokens(address)
                if (asset) {
                    res.send(asset)
                }

            } else {
                res.send({
                    success: false,
                    message: "User multichain wallet not found"
                })
            }
        }
    })

});
//----------------Get detail of asset created on multichain---------------
//----------------------------------------------------------------------
router.get('/get/details', VerifyToken, async function (req, res, next) {
    const name = req.body.name;
    if (!name || name === "" || name === undefined) {
        res.send({
            success: false,
            error: "Please fill required parameters"
        })
        return;
    }
    if (typeof name != 'string' || name.trim() == "")
        return res.send({
            success: false,
            message: "name must be a valid string"
        })
    const userId = req.userId;
    User.findOne({
        _id: userId
    }, async (err, user) => {
        if (err) {
            res.send({
                success: false,
                message: "Incorrect wallet id"
            })
        } else {
            if (user) {

                let address=user.multiAddress;
                console.log(address);
                var asset = await multichain.getDetail(name,address)
                if (asset) {
                    res.send(asset)
                }

            } else {
                res.send({
                    success: false,
                    message: "User multichain wallet not found"
                })
            }
        }
    })

});
//-----------Inserting data on db of asset types created by user of this wallet
//-----------------------------------------------------------------------------
router.post('/put/type', VerifyToken, async function (req, res, next) {
    const name = req.body.name;
    if (!name || name === "" || name === undefined) {
        res.send({
            success: false,
            message: "Please enter valid Asset type name"
        })
    }
    if (typeof name != 'string' || name.trim() == "")
        return res.send({
            success: false,
            message: "Asset type must be a valid string"
        })
    const asset = [];
    const multiAssetTypes = new multiAsset({
        Name: name
    })
    db.collection("multiAsset").find().toArray((err, result) => {
        for (i = 0; i < result.length; i++) {
            console.log(result[i].Name);

            asset.push(result[i].Name)
        }

        if (asset.indexOf(name) >= 0) {
            console.log("index:" + asset.indexOf(name));

            res.send({
                success: true,
                message: "You have successfully creat Asset type"
            })
        } else {
            db.collection("multiAsset").insert(multiAssetTypes, (err, UpdatedOn) => {
                if (err) {
                    console.log("Data is not inserting in db")
                    console.log(err);

                } else if (UpdatedOn) {}
                res.send({
                    success: true,
                    message: "You have successfully creat Asset type"
                });

            })
        }
    });
});
//-----------------Get all asset types------------
//----------------------------------------------
router.get('/get/assetType', async function (req, res, next) {
    db.collection("multiAsset").find().toArray((err, result) => {
        if (err) {
            res.send({
                success: false,
                message: "Db is not responding at this time"
            })
            console.log(err)
        } else {
            res.send({
                success: true,
                assets: result
            })

        }
    })

});
//------------User detail if exist or not----------
//-------------------------------------------------
router.get('/user/details', VerifyToken, async function (req, res, next) {
    const userId = req.userId;
    User.findOne({
        _id: userId
    }, async (err, user) => {
        if (err) {
            res.send({
                success: false,
                message: "Incorrect wallet id"
            })
        } else {
            if (user) {
                var userName = user.username;
                var email = user.email;
                var walletId = user.walletId;
                var address = user.multiAddress;
                var password = user.password
                res.send({
                    success: true,
                    result: {
                        user_name: userName,
                        email: email,
                        wallet_id: walletId,
                        Multichain_address: address,
                        password: password
                    }
                })

            } else {
                res.send({
                    success: false,
                    message: "User multichain wallet not found"
                })
            }
        }
    })

});
router.get('/updatePrice', VerifyToken, async function (req, res, next) {
    const userId = req.userId;
    const name = req.body.name;
    const price = req.body.price;
    if (!name || name === "" || name === undefined ||
        !userId || userId === "" || userId === undefined ||
        !price || price === "" || price === undefined) {
        res.send({
            success: false,
            message: "Invalid arguments!"
        })
    }
    User.findOne({
        _id: userId
    }, async (err, user) => {
        if (user) {
            console.log(name, price, user.multiAddress);
            db.collection("updateAssetPrice").find({
                "address": user.multiAddress,
                "name": name
            }).toArray((err, result) => {
                if (result[0]) {
                    db.collection('updateAssetPrice').updateOne({
                        "address": user.multiAddress,
                        "name": name
                    }, {
                        $set: {
                            "price": price
                        }
                    }, function (error, responce) {
                        if (error) {
                            res.send({
                                success: false,
                                message: error
                            })
                        } else {
                            res.send({
                                success: true,
                                message: "Price has updated!"
                            })
                        }
                    })
                } else {
                    res.send({
                        success: false,
                        message: "Asset with this name isn't available!"
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