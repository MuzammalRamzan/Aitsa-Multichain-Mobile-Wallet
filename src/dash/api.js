var dash = require('bitcore-lib-dash');
var Client = require('node-rest-client').Client;

async function getAddress() {
    return new Promise((resolve) => {
        var privateKey = new dash.PrivateKey();
        var address = privateKey.toAddress().toString();
        var keys = {
            privateKey: privateKey.toString(),
            publicKey: address
        }
        resolve({ suucess: true, keys })
    })
}

async function getBalance(addr) {
    return new Promise((resolve) => {
        try {
            var client = new Client();
            client.get("https://insight.dash.org/api/addr/" + addr + "/balance", function (data, res) {
                console.log("DATA::",data)
                resolve({ success: true, balance: data / 100000000 + " DASH" });
            })
        } catch (err) {
            resolve({ success: false, error: "Invalid request to resources" })
        }
    })
}

async function getHistory(options) {
    return new Promise((resolve) => {
        const { address } = options;
        var client = new Client();
        client.get("https://insight.dash.org/api/txs/?address=" + address, function (data, res) {
            if (data.txs.length) {
                let received = [];
                let sent = [];
                data.txs.forEach(tx => {
                    tx.vin.forEach((input) => {
                        received.push({ tx_id: input.txid, amount: input.value, from: input.addr })
                    })
                    tx.vout.forEach((output) => {
                        sent.push({ tx_id: tx.txid, amount: output.value, to: output.scriptPubKey.addresses[0] })
                    })
                });
                resolve({ success: true, tx_history: { from: received, to: sent } })
            }else{
                resolve({ success: true, tx_history: [] })
            }   

        })
    })
}

async function sendTransaction(options) {
    return new Promise((resolve, reject) => {
        if (
            !options.privateKey || options.privateKey == "" || !options.hasOwnProperty('privateKey')
            || !options.to || options.to == "" || !options.hasOwnProperty('to')
            || !options.amount || options.amount == "" || !options.hasOwnProperty('amount')

        ) {
            reject({ success: false, error: "Provide all required parameters" })
        }
        try {
            var client = new Client();
            var host = 'https://insight.dash.org';
            var privateKey = new dash.PrivateKey(options.privateKey, options.network);
            client.get(host + "/api/addr/" + privateKey.toAddress() + "/utxo", function (data, res) {
                var utxo = data;
                try {
                    var rawtx = new dash.Transaction()
                        .from(utxo)
                        .to(options.to, options.amount)
                        .sign(privateKey);
                } catch (e) {
                    reject({ success: false, error: e.message })
                }
                var baseURL = host;
                var axios = axios_1.default.create({
                    baseURL,
                });

                axios.post(`/api/tx/send`, {
                    rawtx
                }).then(res => {
                    resolve({ success: true, txId: res.data });
                }).catch(err => {
                    reject({ success: false, error: err.response.data });
                });
            })
        } catch (e) {
            reject({ success: false, error: e.message });
        }
    })
}

module.exports = {
    getAddress,
    getBalance,
    getHistory,
    sendTransaction
}