const btc = require('../src/bitcoin/api')
const eth = require('../src/ethereum/api');
const ethc = require('../src/ethereumclassic/api');
const lite = require('../src/litecoin/api')
const dash = require('../src/dash/api')
const User = require('../user/User')
var getbalance = async (userId, network, walletType) => {
    return new Promise(async (resolve) => {
        User.findOne({
            _id: userId
        }, async (err, user) => {
            if (err) {
                resolve({
                    success: false,
                    error: "User may not exist"
                })
            } else {
                if (user) {
                    switch (walletType) {
                        case 'btc':
                            try {
                                let balance = await btc.getBalance(user.wallets.btc.publicKey, network)
                                console.log("This is balance from utils:" + balance);

                                resolve(balance);
                            } catch (err) {
                                resolve({
                                    success: false,
                                    error: err.message
                                })
                            }
                            break;
                        case 'eth':
                            try {
                                let balance = await eth.getBalance(user.wallets.eth.publicKey, network)
                                resolve(balance)
                            } catch (err) {
                                resolve({
                                    success: false,
                                    error: err.message
                                })
                            }
                            break;
                        case 'ethc':
                            try {
                                let balance = await ethc.getBalance(user.wallets.ethc.publicKey)
                                resolve(balance)
                            } catch (err) {
                                resolve({
                                    success: false,
                                    error: err.message
                                })
                            }
                            break;
                        case 'lite':
                            try {
                                let balance = await lite.getBalance(user.wallets.lite.publicKey, network)
                                resolve(balance)
                            } catch (err) {
                                resolve({
                                    success: false,
                                    error: err.message
                                })
                            }
                            break;
                        case 'dash':
                            try {
                                let balance = await dash.getBalance(user.wallets.dash.publicKey)
                                resolve(balance);
                            } catch (err) {
                                resolve({
                                    success: false,
                                    error: err.message
                                })
                            }
                            break;
                        default:
                            resolve({
                                success: false,
                                error: "wallet does not exist"
                            })
                            break;
                    }
                } else {
                    resolve({
                        success: false,
                        error: "User does not exist"
                    })
                }
            }
        })

    })


}

module.exports = {
    getbalance: getbalance
}