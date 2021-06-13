/**
 * Created by multi.pc on 3/14/2018.
 */
//var Web3 = require('web3')
var Transaction = require('ethereumjs-tx');
var Promise = require('bluebird')
/*

var provider = {
    testnet:'https://ropsten.infura.io/fijG2iQ8u29ePrk6h5Ni',
    mainnet:'https://mainnet.infura.io/fijG2iQ8u29ePrk6h5Ni'
}
var web3 = new Web3(new Web3.providers.HttpProvider(provider.testnet))*/
function sendTransaction(web3,publicaddr,privatekey,to,value,callback) {
    var keypair = { privateKey: privatekey,
        address: publicaddr }


    var amount = web3.toHex(web3.toWei(value, "ether"));
var gasPrice = web3.toHex(web3.eth.gasPrice)
var gasLimitHex = web3.toHex(300000)
//var To ='0xe22acf0d76de9c7c0c2ccd2c0d6e6b9a8fec4ad4';
web3.eth = Promise.promisifyAll(web3.eth)



    web3.eth.getTransactionCountAsync(keypair.address)
        .then(nonce => {
    var tx = new Transaction({
        to: to,
        value: amount,
        nonce: nonce,
        gasLimit: gasLimitHex,
        gasPrice:gasPrice
    })
    tx.sign(Buffer.from(keypair.privateKey.slice(2), 'hex'))
    var signedRawTx = '0x'+tx.serialize().toString('hex')

    return web3.eth.sendRawTransactionAsync(signedRawTx)
}).then(txHash => {
    console.log('Transaction Hash:'+txHash)

    callback('Transaction Hash:'+txHash);
   // return web3.eth.getTransactionReceiptAsync(txHash)
})
    .catch (function(err) {
        callback(err);
    });
/*
    .then(tx => {

    console.log('Gas used: ' + tx.gasUsed)
    return web3.eth.getBalanceAsync(keypair.address)
}).then(bal => {
    console.log('Balance after tx: ', bal.toNumber())
})
*/
}
function getTransactionsByAccount(web3,myaccount, startBlockNumber, endBlockNumber) {
    if (endBlockNumber == null) {
        endBlockNumber = web3.eth.getBlockNumber(
            (e, d) => {
                endBlockNumber = d;
                console.log("Using endBlockNumber: " + endBlockNumber);
                startBlock();
            }
        );

    }
    function startBlock() {



        if (startBlockNumber == null) {
            startBlockNumber = endBlockNumber - 1000;
            console.log("Using startBlockNumber: " + startBlockNumber);
        }
        console.log("Searching for transactions to/from account \"" + myaccount + "\" within blocks " + startBlockNumber + " and " + endBlockNumber);

        for (var i = startBlockNumber; i <= endBlockNumber; i++) {
            if (i % 1000 == 0) {
                console.log("Searching block " + i);
            }
            var block;
            web3.eth.getBlock(i, true, (e, d) => {
                block = d;
                if (block != null && block.transactions != null) {
                    block.transactions.forEach(function (e) {
                        if (myaccount == "*" || myaccount == e.from || myaccount == e.to) {
                            console.log("  tx hash          : " + e.hash + "\n"
                                + "   nonce           : " + e.nonce + "\n"
                                + "   blockHash       : " + e.blockHash + "\n"
                                + "   blockNumber     : " + e.blockNumber + "\n"
                                + "   transactionIndex: " + e.transactionIndex + "\n"
                                + "   from            : " + e.from + "\n"
                                + "   to              : " + e.to + "\n"
                                + "   value           : " + e.value + "\n"
                                + "   time            : " + block.timestamp + " " + new Date(block.timestamp * 1000).toGMTString() + "\n"
                                + "   gasPrice        : " + e.gasPrice + "\n"
                                + "   gas             : " + e.gas + "\n"
                                + "   input           : " + e.input);
                        }
                    })
                }


            });

        }
    }
}
module.exports={
    sendTransaction
}