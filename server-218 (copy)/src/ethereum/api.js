const crypto = require('crypto');
var ethUtils = require('ethereumjs-util');
var Web3 = require('web3')
var Promise = require('bluebird')
var txsender = require('./txsigner')
var provider = {
    testnet: '	https://ropsten.infura.io/v3/32e8833d78054890b364106c5b759454',
    mainnet: 'https://mainnet.infura.io/v3/32e8833d78054890b364106c5b759454'
}
var web3 = new Web3(new Web3.providers.HttpProvider(provider.testnet))

/**
 * @summary return address and private key-pair
 */
async function getWallet() {
    return new Promise((resolve, reject) => {
        var randbytes = crypto.randomBytes(32);
        var address = '0x' + ethUtils.privateToAddress(randbytes).toString('hex');
        var priv = '0x' + randbytes.toString('hex');
        var out = { publicKey: address, privateKey: priv }
        resolve({ success: true, keys: out });
    })

}
/**
 * @param {string} addressHexString Ethereum address 
 * @param {string} network For development use "testnet"
 * @summary return ethereum balace of given address
 */
async function getBalance(addressHexString, network) {
    return new Promise((resolve, reject) => {
        if (network == 'testnet') {
            web3 = new Web3(new Web3.providers.HttpProvider(provider.testnet))
        } else {
            web3 = new Web3(new Web3.providers.HttpProvider(provider.mainnet))
        }
        web3.eth = Promise.promisifyAll(web3.eth)
        web3.eth.getBalanceAsync(addressHexString).then(data => {
            var balance = web3.utils.fromWei(data);
            resolve({ success: true, balance: balance + 'ETH' });
        })
            .catch(function (err) {
                reject({ success: false, error: err + "Invalid Address" });
            })
    })
}

async function sendTransaction(options) {
    return new Promise((resolve, reject) => {
        let network = options.network || "testnet"
        switch (network) {
            case 'testnet':
                web3 = new Web3(new Web3.providers.HttpProvider(provider.testnet))
                break;
            default:
                web3 = new Web3(new Web3.providers.HttpProvider(provider.mainnet))
                break;
        }
        if (
            !options.from || options.from == "" || !options.hasOwnProperty('from')
            || !options.privateKey || options.privateKey == "" || !options.hasOwnProperty('privateKey')
            || !options.to || options.to == "" || !options.hasOwnProperty('to')
            || !options.amount || options.amount == "" || !options.hasOwnProperty('amount')
        ) {
            reject({ success: false, error: "Provide all required parameters" })
        }
        txsender.sendTransaction(web3, options.from, options.privateKey, options.to, options.amount, (response) => {
            resolve({ success: true, txId: response })
        })
    })
}

function getHistory(options) {
    return new Promise((resolve, reject) => {
        const { address, network } = options;
        var api = require('etherscan-api').init('38NKNJIHRBIGQ6SHC2KF625EUJ8ZIM7ZKW');
        if (network == 'testnet') {
            api = require('etherscan-api').init('38NKNJIHRBIGQ6SHC2KF625EUJ8ZIM7ZKW', 'ropsten', '3000');
        }
        var list = api.account.txlist(address, 0, 999999999999999, 'latest');
        list.then(function (listdata) {
            if (listdata.result.length) {
                let history = [];
                listdata.result.forEach(tx => {
                    history.push({ from: tx.from, to: tx.to, amount: web3.utils.fromWei(tx.value), hash: tx.hash })
                });
                resolve({ success: true, history: history })
            } else {
                resolve({ success: true, listdata })
            }

        }).catch(function (err) {
            reject({ success: false, error: err })
        });
    })
}

module.exports = {
    getWallet,
    getBalance,
    sendTransaction,
    getHistory
}
{
                        $and: [{
                            $or: [{
                                fromDate: {
                                    $gt: Date.parse(date)
                                },
                            }, {
                                toDate: {
                                    $eq: Date.parse(date)
                                }
                            }],
                            $eq:[fromDate,toDate]
                        }]

                    }