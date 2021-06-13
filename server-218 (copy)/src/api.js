let multichain = require("multichain-node")({
    port: 4350,
    host: '127.0.0.1',
    user: "multichainrpc",
    pass: "5vndzH7FXX8JVAygvs4DgoTZnKENroHxJTpf4ThuKDtY"
});
//-------when user create account address is assigned!----------
//--------------------------------------------------------------
var getNewAddress = async() => {
    return new Promise(async(resolve) => {
        const assets = await multichain.getNewAddress()
        resolve(assets)
    })
    
}
//------Create multichain Asset------------
//--------------------------------------
var createAsset = async(multiAddress, name, quantity, unit, price, type) => {
    console.log("multiAddress:" + multiAddress, "name:" + name, "quantity:" + quantity, "price:" + price, "type:" + type, "unit:" + unit);

    return new Promise(async(resolve) => {
        console.log("multiAddress:" + multiAddress, "name:" + name, "quantity:" + quantity);
        await multichain.issue({
            address: multiAddress,
            asset: name,
            qty: quantity,
            details: {
                unit: unit,
                type: type,
                price: price
            }
        }, (err, res) => {
            if (res) {
                console.log(res)
                resolve({ success: true, result: res });
            } else {
                console.log(err)
                resolve({ success: false, message: err })
            }



        })

    })
}
//----------Transfer assset from one user to other------
//--------------------------------------------------------
var transferAsset = async(multiAddress, toAddress, name, quantity) => {
    return new Promise(async(resolve) => {
        console.log(multiAddress, name, quantity);
        await multichain.sendAssetFrom({ from: multiAddress, to: toAddress, asset: name, qty: quantity }, (err, res) => {
            if (res) {
                console.log(res)
                resolve({ success: true, result: res });
            } else {
                console.log(err)
                resolve({ success: false, message: err })
            }


        })

    })
}
//---------Get all asset on specific address------------
//------------------------------------------------------
var getAssets = async(address) => {
    return new Promise(async(resolve) => {
        await multichain.getAddressBalances({ address: address }, (err, res) => {
            if (res) {
                var result = res.filter(token => token.name !== "BAI")
                resolve({ success: true, result: result });
            }  else {
                console.log(err)
                resolve({ success: false, message: err })
            }


        })

    })
}
//------------We have to provide permission in multichain for sending and receiving asset or token
var grantPermission = async(multiAddress) => {
    await multichain.grant([multiAddress, "send,receive"], (err, info) => {
        if (err) {
            console.log(err);

        } else {
            console.log(info);

        }
    })
}
//------------Token launch function
var launchToken = async(multiAddress, quantity) => {
    console.log(multiAddress, quantity);
    return new Promise(async(resolve) => {
        await multichain.issue({ address: multiAddress, asset: "BAI", qty: quantity }, (err, res) => {
            if (res) {
                console.log(res)
                resolve({ success: true, result: res });
            } else {
                console.log(err)
                resolve({ success: false, message: err })
            }



        })

    })
}
//------Get token quantity on specific address-------
//--------------------------------------------------
var getTokens = async(address) => {
    return new Promise(async(resolve) => {
        await multichain.getAddressBalances({ address: address }, (err, res) => {
            if (res) {
                var result = res.filter(token => token.name == "BAI")
                resolve({ success: true, result: result });
            } else {
                console.log(err)
                resolve({ success: false, message: err })
            }


        })

    })
}
//------------Transfer token form one user to other-------
//--------------------------------------------------------
var transferToken = async(multiAddress, toAddress, quantity) => {
    return new Promise(async(resolve) => {
        console.log('multiAddress:' + multiAddress, 'toAddress:' + toAddress, 'quantity:' + quantity);
        await multichain.sendAssetFrom({ from: multiAddress, to: toAddress, asset: "BAI", qty: quantity }, (err, res) => {
            if (res) {
                console.log(res)
                resolve({ success: true, result: res });
            } else {
                console.log(err)
                resolve({ success: false, message: err })
            }


        })

    })
}
//---------------------Get detail of asset----------
//--------------------------------------------------
var getDetail = async(name) => {
    return new Promise(async(resolve) => {
        await multichain.listAssets({ asset: name }, (err, res) => {
            if (res) {
                console.log(res)
                resolve({ success: true, result: { name: res[0].name, issuetxid: res[0].issuetxid, detail: res[0].details } });
            } else {
                console.log(err)
                resolve({ success: false, message: err })
            }


        })

    })
}
//----------Get asset type-------------------
//-----------------------------------------
var getAssetType = async () => {
    return new Promise(async (resolve) => {
        await multichain.listAssets((err, res) => {
            let type=[];
            if (res) {
                var result = res.filter(token => token.name !== "BAI")
                // console.log(result);
                
                for (i=0;i<result.length;i++){
                    console.log("this is type:"+result[i].details.type);
                    type.push(result[i].details.type);
                }
                var typeOF=type.filter((a, b) => type.indexOf(a) === b)
                resolve({ success: true, result: typeOF });
            }  else {
                console.log(err)
                resolve({ success: false, message: err })
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
    getAssetType:getAssetType
}