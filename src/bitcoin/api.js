// var bitcoinTransaction = require('bitcoin-transaction');
var bitcoin = require('bitcoinjs-lib');
let price = require('crypto-price')
var mongoose = require('mongoose');
var db = mongoose.connection;
const bitcoinModel = require('./bitcoinModel');
var Client = require('node-rest-client').Client;
var client = new Client();
var config = require('../../config');
var CronJob = require('cron').CronJob;
const request = require('request');
var sb = require('satoshi-bitcoin');
const multichain = require('../multichain/multichain')
var BITCOIN_DIGITS = 8
var BITCOIN_SAT_MULT = Math.pow(10, BITCOIN_DIGITS);
const bitcoinTransaction = require('./bitcoin-transaction');
async function getAddress(network) {
    return new Promise(async (resolve) => {
        var keyPair;
        if (network == 'testnet') {
            console.log("Testnetwork account generated " + network)
            testnet = bitcoin.networks.testnet
            keyPair = bitcoin.ECPair.makeRandom({
                network: testnet
            })
        } else {
            console.log("In main network")
            keyPair = bitcoin.ECPair.makeRandom()
        }
        const {
            address
        } = bitcoin.payments.p2pkh({
            pubkey: keyPair.publicKey
        });
        var privateKey = keyPair.toWIF()
        privateKey = await config.encodeDecode(privateKey, 'e');
        var keys = {
            publicKey: address,
            privateKey
        }
        resolve({
            success: true,
            keys
        });
    })
}
async function getBalance(addr, network) {
    return new Promise((resolve) => {
        if (network == 'testnet') {
            console.log("network Testnet " + network + " \n address  " + addr)
            bitcoinTransaction.getBalance(addr, {
                    network: network
                })
                .then((balanceInBTC) => {
                    resolve({
                        success: true,
                        balance: balanceInBTC + ' BTC'
                    });
                })
                .catch(err => {
                    resolve({
                        success: false,
                        error: err + ' ,Address Invalid'
                    })
                });
        } else {
            console.log("Main net")
            bitcoinTransaction.getBalance(addr, {
                    network: 'mainnet'
                })
                .then((balanceInBTC) => {
                    console.log("This is balance:" + balanceInBTC);

                    if (balanceInBTC.toString() == 'NaN')
                        balanceInBTC = '0.00';

                    resolve(balanceInBTC);

                })
                .catch(err => {
                    resolve(err)
                });
        }
    })
}

// function getBalance(addr, network) {
//     return new Promise((resolve) => {
//         if (network == 'testnet') {
//             resolve({ sucess: true, message: "At present not updated" })
//         }
//         else {
//             url = "https://blockchain.info/q/addressbalance/" + addr;
//             request({ url: url }, (err, res) => {
//                 if (err) {
//                     resolve({ sucess: false, message: "Server not responding" })
//                 }
//                 else {
//                     balance = res.body / BITCOIN_SAT_MULT
//                     resolve(balance)
//                 }
//             })
//         }
//     })

// }

async function sendTransaction(options) {

    console.log("from:" + options.from, "to:" + options.to, "amount:" + options.amount, "privateKey:" + options.privateKey, "fee:" + options.fee);
    balance = await getBalance(options.from, options.network)
    console.log("balance:" + balance);
    return new Promise(async (resolve) => {
        if (balance === 0) {
            resolve({
                success: false,
                message: "You have 0 balance"
            })
        }
        if (
            !options.from || options.from == "" || !options.hasOwnProperty('from') ||
            !options.privateKey || options.privateKey == "" || !options.hasOwnProperty('privateKey') ||
            !options.to || options.to == "" || !options.hasOwnProperty('to') ||
            !options.amount || options.amount == "" || !options.hasOwnProperty('amount')
        ) {
            resolve({
                success: false,
                error: "Provide all required parameters"
            })
        }
        try {
            console.log("private key:" + options.privateKey);
            let tx;
            return tx = await bitcoinTransaction.sendTransaction({
                    from: options.from,
                    to: options.to,
                    privKeyWIF: options.privateKey,
                    btc: options.amount,
                    network: options.network,
                    fee: options.fee,
                    minConfirmations: 1,
                    dryrun: false
                }).then(() => {
                    resolve({
                        success: true,
                        message: "Transacion is being processed!"
                    })
                })
                .catch((e => {
                    resolve({
                        success: false,
                        message: e
                    })
                }))
        } catch (e) {
            console.log(e);
            resolve(e)
        }
    })
}

///////////////////////
function getConfirmation(callback) {
    client.get("https://chain.api.btc.com/v3/tx/unconfirmed?_ga=2.10915380.1246914578.1592205099-642298535.1592205099", function (data, responce) {
        let status;
        if (data) {
            console.log(data.data.list);

            callback(data.data.list)
        }
    })


}
async function getHistory(options) {
    status = 'confirmed!'
    console.log('get history called')
    console.log("history of address:" + options.address);

    return new Promise((resolve) => {
        let status;
        var {
            address
        } = options;
        try {
            client.get("https://blockchain.info/rawaddr/" + address, function (data, response) {
                if (data.txs.length) {
                    let senders = []
                    let sendTo = []
                    data.txs.forEach(tx => {
                        tx.inputs.forEach((input) => {
                            var date = new Date(tx.time * 1000);
                            senders.push({
                                sender: input.prev_out.addr || '17asDMbV4TQvTker4owdtkwjTLpceiVqfu',
                                amount: input.prev_out.value / 100000000,
                                hash: tx.hash,
                                time: tx.time
                            })
                        })
                        // sendTo.push({fee:tx.result});
                        ///////////////




                        ////////////////
                        tx.out.forEach((output) => {
                            // getConfirmation(
                            //     (data) => {
                            //         status = data.includes(tx.hash) ? "UnConfirmed" : "Confirmed"
                            //         console.log(status);



                            //     })
                            console.log(output.value);
                            // console.log(tx.inputs.prev_out.value);
                            tx.inputs.forEach((input) => {
                                fee = (output.value - input.prev_out.value) / 100000000
                            })
                            sendTo.push({
                                to: output.addr || "17asDMbV4TQvTker4owdtkwjTLpceiVqfu",
                                amount: output.value / 100000000,
                                hash: tx.hash,
                                fee: Math.abs(fee),
                                time: tx.time,
                                status: "Confirmed"
                            })
                        })

                    });
                    // console.log("this is sender:" + senders, '\n', "this is receiver:" + sendTo);
                    resolve({
                        success: true,
                        tx_history: {
                            received: senders,
                            sent: sendTo
                        }
                    })
                } else {
                    resolve({
                        success: true,
                        tx_history: {
                            received: [],
                            sent: []
                        }
                    })
                }
            });
        } catch (err) {
            reject({
                success: false,
                error: err.message
            })
        }
    })
}
////////////////////////////////////////////////////




async function saleToken(options) {
    balance = await getBalance("17asDMbV4TQvTker4owdtkwjTLpceiVqfu", "mainnet")
    console.log("balance:" + balance.balance);
    console.log("Token sell function is called!");
    return new Promise(async (resolve) => {
        price.getBasePrice('BTC', 'USD').then(obj => {
            btcPrice = options.token / obj.price;
            console.log("balance:" + balance, "btcPrice:" + btcPrice);

            if (balance < btcPrice) {
                resolve({
                    success: false,
                    message: "You can not sell token at this time!"
                })

            }
        })
        let asset = await multichain.transferToken(options.fromToken, options.toToken, options.token)
        console.log(asset);

        if (asset) {
            price.getBasePrice('BTC', 'USD').then(obj => {
                BTCPrice = options.token / obj.price;
                console.log(asset.result);
                if (asset.result) {
                    const bitcoinTrasaction = new bitcoinModel({
                        amount: options.token,
                        status: 0,
                        txID: asset.result,
                        BTCPrice: BTCPrice.toFixed(8),
                        bitcoinAddress: options.toBtc
                    })
                    db.collection("sellTokenData").insert(bitcoinTrasaction, (err, UpdatedOn) => {
                        if (err) {
                            resolve({
                                success: false,
                                message: "Data inseting problem!"
                            })
                        } else {
                            resolve({
                                success: true,
                                message: " Successfully !You will receive BTC after confirmation!"
                            })
                        }
                    })
                } else {
                    resolve({
                        success: false,
                        message: "You may have insufficient tokens!"
                    })
                    console.log("You have not token!");

                }
            })

        }
    })
}

var job = new CronJob('* * * * *', function (err, res, next) {
    let data = []
    db.collection("sellTokenData").find({
        status: 0
    }).toArray((err, result) => {
        if (err) {
            console.log(err);

        } else {
            console.log(result);

            for (i = 0; i < result.length; i++) {
                data.push(result[i])
            }
            console.log(data)
        }
        for (i = 0; i < data.length; i++) {
            console.log("BTC to send:" + data[i].BTCPrice, "address of receiver:" + data[i].bitcoinAddress)
            ///////////////////////////////
            return new Promise(async (resolve) => {
                balance = await getBalance("17asDMbV4TQvTker4owdtkwjTLpceiVqfu", "mainnet")
                if (balance === 0) {
                    console.log("You have 0 balance");

                }
                if (!data[i].toBtc || !data[i].toBtc == "" ||
                    !data[i].BTCPrice || data[i].BTCPrice == ""
                ) {
                    console.log("No pending request!");

                }
                try {
                    tx = await bitcoinTransaction.sendTransaction({
                        from: "17asDMbV4TQvTker4owdtkwjTLpceiVqfu",
                        to: data[i].bitcoinAddress,
                        privKeyWIF: "L5T7Bfo9fwfLkF8fmBognYQKeVFNqCVG3VgNoUNCwP757eEqfJkD",
                        btc: data[i].BTCPrice,
                        network: "mainnet",
                        fee: 'hour',
                        minConfirmations: 1,
                    }, (responce) => {
                        console.log("Transaction in progress");
                        console.log(responce);
                    }).catch((e => {
                        console.log(e)
                    }))
                    if (tx) {
                        console.log(tx);

                        db.collection('sellTokenData').update({
                            "txID": data[i].txID
                        }, {
                            $set: {
                                "status": 1
                            }
                        });
                    }
                } catch (e) {
                    console.log(e);
                }
            })
        }
    })
}, null, true, 'America/Los_Angeles');
job.start();

/////////////////////////////////////////////////
module.exports = {
    getAddress,
    getBalance,
    sendTransaction,
    getHistory,
    saleToken,
}