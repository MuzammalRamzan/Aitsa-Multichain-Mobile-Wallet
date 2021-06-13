let multichain = require("multichain-node")({
    port: 4350,
    host: '127.0.0.1',
    user: "multichainrpc",
    pass: "5vndzH7FXX8JVAygvs4DgoTZnKENroHxJTpf4ThuKDtY"
});
const multiModel = require('./multiModel');
var uniqid = require('uniqid');
const {
    db,
    update
} = require("./multiModel");
const {
    address
} = require("bitcoinjs-lib");
var getNewAddress = async () => {
    return new Promise(async (resolve) => {
        const assets = await multichain.getNewAddress()
        resolve(assets)
    })
}

var createAsset = async (multiAddress, name, quantity, unit, price, type) => {
    console.log("multiAddress:" + multiAddress, "name:" + name, "quantity:" + quantity, "price:" + price, "type:" + type, "unit:" + unit);

    return new Promise(async (resolve) => {
        console.log("multiAddress:" + multiAddress, "name:" + name, "quantity:" + quantity);
        await multichain.issue({
            address: multiAddress,
            asset: name,
            qty: quantity,
            details: {
                units: unit,
                type: type,
                price: price
            }
        }, (err, res) => {
            if (res) {
                const newMultiModel = new multiModel({
                    address: multiAddress,
                    name: name,
                    price: price
                })
                db.collection('updateAssetPrice').insert(newMultiModel, (err, updateOn) => {
                    if (err) {
                        throw (err);
                    } else {
                        console.log("Data has inserted!");
                    }
                })
                console.log("res:" + res)
                resolve({
                    success: true,
                    result: res
                });
            } else {
                console.log(err)
                resolve({
                    success: false,
                    message: err
                })
            }



        })

    })
}
var transferAsset = async (multiAddress, toAddress, name, quantity) => {
    return new Promise(async (resolve) => {
        db.collection("updateAssetPrice").find({
            "address": multiAddress,
            "name": name
        }).toArray(async (err, result) => {
            if (result[0]) {
                price = result[0].price;
            } else {
                price = 0
            }
            console.log(multiAddress, name, quantity);
            await multichain.sendAssetFrom({
                from: multiAddress,
                to: toAddress,
                asset: name,
                qty: quantity
            }, (err, res) => {
                if (res) {
                    console.log(res)
                    const newMultiModel = new multiModel({
                        address: toAddress,
                        name: name,
                        price: price
                    })
                    db.collection("updateAssetPrice").find({
                        "address": toAddress,
                        "name": name
                    }).toArray(async (err, result) => {
                        if (result[0]) {
                            console.log("data has updated!");
                            db.collection('updateAssetPrice').update({
                                "address": toAddress,
                                "name": name
                            }, {
                                $set: {
                                    "price": price
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
                    resolve({
                        success: true,
                        result: res
                    });
                } else {
                    console.log(err)
                    resolve({
                        success: false,
                        message: err
                    })
                }


            })
        })

    })
}
var getAssets = async (address) => {
    return new Promise(async (resolve) => {
        await multichain.getAddressBalances({
            address: address
        }, (err, res) => {
            if (res) {
                var result = res.filter(token => token.name !== "BAI")
                resolve({
                    success: true,
                    result: result
                });
            } else {
                console.log(err)
                resolve({
                    success: false,
                    message: err
                })
            }


        })

    })
}
var grantPermission = async (multiAddress) => {
    await multichain.grant([multiAddress, "send,receive"], (err, info) => {
        if (err) {
            console.log(err);

        } else {
            console.log(info);

        }
    })
}
var launchToken = async (multiAddress, quantity) => {
    console.log(multiAddress, quantity);
    return new Promise(async (resolve) => {
        await multichain.issue({
            address: multiAddress,
            asset: "BAI",
            qty: quantity
        }, (err, res) => {
            if (res) {
                console.log(res)
                resolve({
                    success: true,
                    result: res
                });
            } else {
                console.log(err)
                resolve({
                    success: false,
                    message: err
                })
            }



        })

    })
}
var getTokens = async (address) => {
    return new Promise(async (resolve) => {
        await multichain.getAddressBalances({
            address: address
        }, (err, res) => {
            if (res) {
                var result = res.filter(token => token.name == "BAI")
                resolve({
                    success: true,
                    balance: result
                });
            } else {
                console.log(err)
                resolve({
                    success: false,
                    message: err
                })
            }


        })

    })
}
var transferToken = async (multiAddress, toAddress, quantity) => {
    return new Promise(async (resolve) => {
        console.log('multiAddress:' + multiAddress, 'toAddress:' + toAddress, 'quantity:' + quantity);
        await multichain.sendAssetFrom({
            from: multiAddress,
            to: toAddress,
            asset: "BAI",
            qty: quantity
        }, (err, res) => {
            if (res) {
                console.log(res)
                resolve({
                    success: true,
                    result: res
                });
            } else {
                console.log(err)
                resolve({
                    success: false,
                    message: err
                })
            }

        })

    })
}
var getDetail = async (name, address) => {
    return new Promise(async (resolve) => {
        console.log("this is name:" + name, address);
        await multichain.listAssets({
            asset: name
        }, (err, res) => {
            if (res) {
                db.collection('updateAssetPrice').find({
                    "address": address,
                    "name": name,
                }).toArray((err, result) => {
                    console.log(result);
                    if (result[0]) {
                        resolve({
                            success: true,
                            result: {
                                name: res[0].name,
                                txId: res[0].issuetxid,
                                units: res[0].details.unit || res[0].details.units,
                                type: res[0].details.type,
                                price: result[0].price
                            }
                        });
                    } else {
                        resolve({
                            success: true,
                            result: {
                                name: res[0].name,
                                txId: res[0].issuetxid,
                                units: res[0].details.unit || res[0].details.units,
                                type: res[0].details.type,
                                price: res[0].details.price
                            }
                        })
                    }
                })
            } else {
                resolve({
                    success: false,
                    message: err.message
                })
            }


        })

    })
}
var getAssetType = async () => {
    return new Promise(async (resolve) => {
        await multichain.listAssets((err, res) => {
            let type = [];
            if (res) {
                var result = res.filter(token => token.name !== "BAI")
                // console.log(result);

                for (i = 0; i < result.length; i++) {
                    console.log("this is type:" + result[i].details.type);
                    type.push(result[i].details.type);
                }
                var typeOF = type.filter((a, b) => type.indexOf(a) === b)
                resolve({
                    success: true,
                    result: typeOF
                });
            } else {
                console.log(err)
                resolve({
                    success: false,
                    message: err
                })
            }



        })

    })
}

module.exports = {
    getDetail: getDetail,
    getTokens: getTokens,
    transferToken: transferToken,
    launchToken: launchToken,
    getNewAddress: getNewAddress,
    createAsset: createAsset,
    transferAsset: transferAsset,
    getAssets: getAssets,
    grantPermission: grantPermission,
    getAssetType: getAssetType
}