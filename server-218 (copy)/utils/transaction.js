
const btc = require('../src/bitcoin/api')
const eth = require('../src/ethereum/api');
const ethc = require('../src/ethereumclassic/api');
const lite = require('../src/litecoin/api')
const dash = require('../src/dash/api')
const User = require('../user/User')
var config = require('../config')
var sendTx = async (options) => {
    return new Promise(async (resolve) => {
        User.findOne({ _id: options.userId }, async (err, user) => {
            if (err) {
                resolve({ success: false, error: "User may be not exist" })
                return;
            } else {
                if (user) {
                    switch (options.walletType) {
                        case 'btc':
                            try { console.log("from:"+options.from,"to:"+options.to,"amount:"+options.amount,"privateKey:"+options.privateKey,"fee:"+options.fee);
                                let txId = await btc.sendTransaction(options)
                                resolve(txId);
                            } catch (err) {
                                resolve({ success: false, error: err.message })
                            }
                            break;
                        case 'eth':
                            try {
                                delete options.walletType;
                                delete options.userId
                                options.from = user.wallets.eth.publicKey;
                                options.privateKey = user.wallets.eth.privateKey;
                                options.network = "mainnet"
                                let txId = await eth.sendTransaction(options)
                                resolve(txId)
                            } catch (err) {
                                resolve({ success: false, error: err.message })
                            }
                            break;
                        case 'ethc':
                            try {
                                delete options.walletType;
                                delete options.userId
                                //options.from = user.wallets.ethc.publicKey;
                                //options.privateKey = user.wallets.ethc.privateKey
                                //options.gaslimit = '0x2710';
                                let txId = await ethc.sendTransaction(options)
                                resolve(txId)
                            } catch (err) {
                                resolve({ success: false, error: err.message })
                            }
                            break;
                        case 'lite':
                            try {
                                let txId = await lite.sendTransaction(options)
                                resolve(txId)
                            } catch (err) {
                                resolve({ success: false, error: err.message })
                            }
                            break;
                        case 'dash':
                            try {
                                let txId = await dash.sendTransaction(options)
                                resolve(txId);
                            } catch (err) {
                                resolve({ success: false, error: err.message })
                            }
                            break;
                        default:
                            resolve({ success: false, error: "wallet does not exist" })
                            break;
                    }
                } else {
                    resolve({ success: false, error: "User may be not exist" })
                    return;
                }
            }
        })
    })
}

module.exports = {
    sendTx: sendTx
}
