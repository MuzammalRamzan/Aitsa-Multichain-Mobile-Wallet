var Client = require('node-rest-client').Client;
const crypto = require('crypto');
var ethUtils = require('ethereumjs-util');
var Transaction = require('ethereumjs-tx');
var Web3 = require('web3')

var client = new Client();

async function getAddress() {
    return new Promise((resolve, reject) => {
        var randbytes = crypto.randomBytes(32);
        var address = '0x' + ethUtils.privateToAddress(randbytes).toString('hex');
        var priv = '0x' + randbytes.toString('hex');
        var keys = { publicKey: address, privateKey: priv }
        resolve({ success: true, keys })
    })
}

async function getBalance(addr) {
    return new Promise((resolve, reject) => {
        try {
            client.get("https://api.nanopool.org/v1/etc/balance/" + addr, function (data, response) {
                console.log(data)
                if (data.status) {
                    resolve({ success: true, balance: data.data + " ETC" });
                } else {
                    resolve({ success: true, balance: 0.00 + " ETC" });
                }

            });
        } catch (err) {
            reject({ success: false, error: err.message })
        }

    })
}

async function getHistory(options) {
    return new Promise((resolve) => {
        const { address, page, offset } = options
        console.log(address)
        client.get("https://api.nanopool.org/v1/etc/payments/" + address, function (data, response) {
            console.log(data)
            resolve({ success: true, tx_history: data.data });
        });
    })
}

async function sendTransaction(options) {
    return new Promise((resolve, reject) => {
        if (
            !options.from || options.from == "" || options.hasOwnProperty('from')
            || !options.privateKey || options.privateKey == "" || options.hasOwnProperty('privateKey')
            || !options.to || options.to == "" || options.hasOwnProperty('to')
            || !options.amount || options.amount == "" || options.hasOwnProperty('amount')
            || !options.gaslimit || options.gaslimit == "" || options.hasOwnProperty('gaslimit')

        ) {
            reject({ success: false, error: "Provide all required parameters" })
        }

        let keypair =
        {
            privateKey: options.privateKey,
            address: options.from
        }
        let gasPrice;
        let gasLimitHex = "0x" + gaslimit.toString(16);
        let nonce;
        client.get("http://etcchain.com/gethProxy/eth_getTransactionCount?address=" + options.from + "&tag=pending", function (data, response) {
            nonce = "0x" + data;
            client.get("http://etcchain.com/gethProxy/eth_gasPrice", function (data, response) {
                gasPrice = "0x" + data;

                var tx = new Transaction({
                    to: options.to,
                    value: "0x" + options.amount.toString(16),
                    nonce: nonce,
                    gasLimit: gasLimitHex,
                    gasPrice: gasPrice
                })
                tx.sign(Buffer.from(keypair.privateKey.slice(2), 'hex'))
                var signedRawTx = '0x' + tx.serialize().toString('hex')
                client.get("http://etcchain.com/gethProxy/eth_sendRawTransaction?hex=" + signedRawTx, function (data, response) {
                    if (response.statusCode === 200)
                        resolve({ success: true, txId: data })
                    else
                        reject({ success: false, error: "Transaction failed, please make sure you've enough funds" });
                });

            });
        });
    })
}

function sendToEth(raw, callback) {

    web3 = new Web3(new Web3.providers.HttpProvider("https://ropsten.infura.io/fijG2iQ8u29ePrk6h5Ni"))
    callback(web3.eth.sendRawTransaction(raw));
}

module.exports = {
    getAddress,
    getBalance,
    getHistory,
    sendTransaction
}
