const btc = require('../src/bitcoin/api')
const eth = require('../src/ethereum/api');
const ethc = require('../src/ethereumclassic/api');
const lite = require('../src/litecoin/api')
const dash = require('../src/dash/api')
const bigchain = require('../src/bigchaindb/api')
const User = require('../user/User')
var getHistory = async (options) => {
    return new Promise(async (resolve) => {
        User.findOne({ _id: options.userId }, async (err, user) => {
            if (err) {
                resolve({ success: false, error: "User does not exist" })
            } else {
                if (user) {
                    switch (options.walletType) {
                        case 'bigchain':
                            try {
                                options.address = user.wallets.btc.publicKey
                                let tx_history = await bigchain.listTransactions(options)
                                resolve(tx_history);
                            } catch (err) {
                                resolve({ success: false, error: err.message })
                            }
                            break;
                        case 'btc':
                            try {
                                options.address = user.wallets.btc.publicKey
                                let tx_history = await btc.getHistory(options)
                                resolve(tx_history);
                            } catch (err) {
                                resolve({ success: false, error: err.message })
                            }
                            break;
                        case 'eth':
                            try {
                                options.address = user.wallets.eth.publicKey
                                let tx_history = await eth.getHistory(options)
                                resolve(tx_history)
                            } catch (err) {
                                resolve({ success: false, error: err.message })
                            }
                            break;
                        case 'ethc':
                            try {
                                options.address = user.wallets.ethc.publicKey
                                let tx_history = await ethc.getHistory(options)
                                resolve(tx_history)
                            } catch (err) {
                                resolve({ success: false, error: err.message })
                            }
                            break;
                        case 'lite':
                            try {
                                options.address = user.wallets.lite.publicKey
                                let tx_history = await lite.getHistory(options)
                                resolve(tx_history)
                            } catch (err) {
                                resolve({ success: false, error: err.message })
                            }
                            break;
                        case 'dash':
                            try {
                                options.address = user.wallets.dash.publicKey
                                let tx_history = await dash.getHistory(options)
                                resolve(tx_history);
                            } catch (err) {
                                resolve({ success: false, error: err.message })
                            }
                            break;
                        default:
                            resolve({ success: false, error: err.message })
                            break;
                    }
                }
            }
        })
    })


}

module.exports = {
    getHistory: getHistory
}