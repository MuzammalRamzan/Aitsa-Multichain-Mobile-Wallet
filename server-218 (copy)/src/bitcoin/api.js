//-----------Libraries------------------
var bitcoin = require('bitcoinjs-lib');
let price = require('crypto-price')
var mongoose = require('mongoose');
const request = require('request');
var db = mongoose.connection;
var CronJob = require('cron').CronJob;
var Client = require('node-rest-client').Client;
var client = new Client();
//-----------Files importing here------------
const bitcoinModel = require('./bitcoinModel');
var config = require('../../config');
var format = require('date-format');
const multichain = require('../multichain/multichain')
const bitcoinTransaction = require('./bitcoin-transaction');
const {
    resolve
} = require('bluebird');
const {
    json
} = require('body-parser');
const {
    collection
} = require('./bitcoinModel');
//----------------Get address of mainnet as well as of testnet by using this function-----------
//----------------------------------------------------------------------------------------------
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
//--------It returns the balance on specific bitcoin address--------------------
//-------------------------------------------------------------------------------
function getBalance(addr, network) {
    return new Promise((resolve) => {
        if (network == 'testnet') {
            url = "https://api.blockcypher.com/v1/btc/test3/addrs/" + addr + "/full"
            request({
                url: url
            }, (err, res) => {
                if (err) {
                    resolve({
                        sucess: false,
                        message: "Server not responding"
                    })
                } else {
                    let data = JSON.parse(res.body);
                    console.log("This is balance in function file:" + data.final_balance);

                    balance = data.balance / 100000000;
                    resolve(balance)
                }
            });
        } else {
            url = "https://www.bitgo.com/api/v1/address/"+addr;
            request({
                url: url
            }, (err, res) => {
                if (err) {
                    resolve({
                        sucess: false,
                        message: "Server not responding"
                    })
                } else {

                    let data=JSON.parse(res.body)
                    let balance = data.balance/ 100000000;
                    console.log("This is balance from function:" + balance);
                    resolve(balance);
                }
            })
        }
    })

}
//---------This function is for sending real as well as fucet btc from one user to other-------
//---------------------------------------------------------------------------------------------
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

//------------This function returns array of unconfirmed transaction on bitcoin network------
//-------------------------------------------------------------------------------------------
//------------

function getConfirmation(txID) {
    return new Promise((resolve) => {
        client.get("https://sochain.com/api/v2/get_confidence/BITCOIN/" + txID, function (data, responce) {
            let status;
            if (data) {
                console.log(data.data);
                if (data.data.confirmations == 0) {
                    console.log("Unconfirmed!");
                    resolve("Unconfirmed!")

                } else {
                    console.log("confirmed!");
                    resolve("Confirmed!")
                }
            }
        })

    })
}

//-------
// function getConfirmation() {
//     return new Promise((resolve) => {
//         client.get("https://sochain.com/api/v2/get_confidence/BITCOIN/"+txID, function (data, responce) {
//             let status;
//             let unConfiremed = [];
//             if (data.data.list) {
//                 console.log(data.data.list);

//                 for (i = 0; i <= data.data.list.length; i++) {
//                     unConfiremed.push(data.data.list[i])
//                 }
//                 resolve(unConfiremed);
//             } else {
//                 resolve("Server Error");
//             }
//         })

//     })
// }
//------------------This function returns the history of mainnet transactions----------------
//-------------------------------------------------------------------------------------------
async function getHistory(options) {
    console.log('get history called')
    console.log("history of address:" + options.address);
    return new Promise(async (resolve, reject) => {
        var {
            address
        } = options;
        try {
            await client.get("https://api.blockcypher.com/v1/btc/main/addrs/" + address + "/full/?token=244507c893644337a946c8f68dc7cbd2", async function (data, response) {
                console.log(data);
                if (data.txs) {
                    let senders = []
                    let sendTo = []
                    data.txs.forEach(tx => {
                        tx.inputs.forEach((input) => {
                            senders.push({
                                sender: input.addresses[0],
                                amount: (input.output_value / 100000000).toExponential(3),
                                hash: tx.hash,
                                time: new Date(tx.confirmed)
                            })
                        })
                        tx.outputs.forEach((output) => {
                            status=tx.confirmations!==0?"Confirmed!":"Unconfirmed!"
                            console.log("This is fee:" + tx.fees / 100000000);
                            sendTo.push({
                                to: output.addresses[0],
                                amount: (output.value / 100000000).toExponential(3),
                                hash: tx.hash,
                                fee: (tx.fees / 100000000).toExponential(3),
                                time: tx.confirmed,
                                status: status
                            })
                        })

                    });
                    resolve({
                        success: true,
                        tx_history: {
                            received: senders,
                            sent: sendTo,

                        }
                    })
                } else {
                    resolve({
                        success: true,
                        tx_history: {
                            received: [],
                            sent: [],

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
//------------------This function convert USD to BTC-------------------------------
//----------------------------------------------------------------------------------

async function baiToBtc(token) {
    return new Promise(async (resolve) => {
        price.getBasePrice('BTC', 'USD').then(obj => {
            btcPrice = token / obj.price;
            resolve(btcPrice);
        })
    })
}
//------------------This function convert USD to BTC-------------------------------
//----------------------------------------------------------------------------------

async function btcToBai(token) {
    return new Promise(async (resolve) => {
        price.getBasePrice('BTC', 'USD').then(obj => {
            btcPrice = token * obj.price;
            resolve(btcPrice);
        })
    })
}
//-------------sell token function that store data in db------------------------
//------------------------------------------------------------------------------


async function saleToken(options) {
    let balance;
    let collection;
    if (options.network === "testnet") {
        collection = "sellTokenTestnetData"
        balance = await getBalance("mpuZcN8gQ6n53cJpZrCcp2zYpr3AfRNkmW", "testnet");

    } else {
        collection = "sellTokenData"
        balance = await getBalance("17asDMbV4TQvTker4owdtkwjTLpceiVqfu", "mainnet");
    }
    console.log("Token sell function is called!");
    let price = await baiToBtc(options.token)
    return new Promise(async (resolve) => {
        console.log("Balance:" + balance, "price:" + price);
        if (price > balance) {
            resolve({
                success: false,
                message: "Currently!This Service is Not Available"
            })

        } else {
            console.log("From Token" + options.fromToken, "ToToken:" + options.toToken, "Token:" + options.token);

            let asset = await multichain.transferToken(options.fromToken, options.toToken, options.token)
            console.log(asset);
            if (asset.result) {
                const bitcoinTrasaction = new bitcoinModel({
                    amount: options.token,
                    status: 0,
                    txID: asset.result,
                    BTCPrice: price.toFixed(8),
                    bitcoinAddress: options.toBtc
                })

                db.collection(collection).insert(bitcoinTrasaction, (err, UpdatedOn) => {
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
                    message: asset.message.message
                })
            }
        }
    })
}
//----------------Crone for mainnet and automatically execute after every 30 second------
//---------------------------------------------------------------------------------------
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
//--------------Crone for testnet and automatically execute after every second-----------------
//---------------------------------------------------------------------------------------------
var job = new CronJob('* * * * *', function (err, res, next) {
    let data = []
    db.collection("sellTokenTestnetData").find({
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
                        from: "mpuZcN8gQ6n53cJpZrCcp2zYpr3AfRNkmW",
                        to: data[i].bitcoinAddress,
                        privKeyWIF: "cPyW8HV3fo4FTPU9617FmYSnjYRCJuNFLWGEn5tcBboSpCtNt3HS",
                        btc: data[i].BTCPrice,
                        network: "testnet",
                        fee: 'fastest',
                        minConfirmations: 1,
                    }, (responce) => {
                        console.log("Transaction in progress");
                        console.log(responce);
                    }).catch((e => {
                        console.log(e)
                    }))
                    if (tx) {
                        console.log(tx);

                        db.collection('sellTokenTestnetData').update({
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
    btcToBai,
    getConfirmation
}