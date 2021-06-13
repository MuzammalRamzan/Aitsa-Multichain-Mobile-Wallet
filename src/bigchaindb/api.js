
const driver = require('bigchaindb-driver')
const bip39 = require('bip39')
const API_PATH = 'http://localhost:9984/api/v1/'
const shake256 = require('js-sha3').shake256;
const uuid=require('uuid-random');
// const API_PATH = 'https://test.bigchaindb.com/api/v1/transactions?mode=commit'
const conn = new driver.Connection(API_PATH)
var config = require('../../config');
const session = require('express-session');
const random=uuid().toString();
let createTxId;
const nTokens = 750000000;
var getaddress = async () => {
     let keys={};
    return new Promise(async (resolve, reject) => {
        passphrase = await generatePassphrase();
        const seed = bip39.mnemonicToSeed(passphrase).slice(0, 32)
        const { privateKey, publicKey } = new driver.Ed25519Keypair(seed)
        console.log("priavateKey:"+privateKey)
        console.log("publicKey:"+publicKey)
        keys.privateKey = await config.encodeDecode(privateKey, 'e');
        keys.publicKey = publicKey;
        keys.passphrase = passphrase;
        resolve({ success: true, keys })
    })
}

var generatePassphrase = async () => {
    return new Promise((resolve) => {
        const passphrase = bip39.generateMnemonic()
        resolve(passphrase);
    })
}

var createAsset = async (publicKey, privateKey, payload, metadata) => {
    return new Promise(async (resolve, reject) => {
        try {
            const tx = driver.Transaction.makeCreateTransaction(
                payload,
                metadata,
                [
                    driver.Transaction.makeOutput(
                        driver.Transaction.makeEd25519Condition(publicKey))
                ],
                publicKey
            )
            const txSigned = await driver.Transaction.signTransaction(tx, privateKey)
            console.log(`tx_Id:${txSigned.id}`)
            const postedTx = await conn.postTransactionCommit(txSigned)
                .catch((err) => {
                    resolve({ success: 'false', message: "Asset already exist", status: err.status })
                    return
                })
            resolve({ success: true, result: postedTx, tx_Id: txSigned.id })
        } catch (err) {
            resolve({ success: 'false', message: "Error in sending transaction", status: err.status })
            return;
        }
    })
}


var getTransaction = async (txId) => {
    return new Promise(async (resolve, reject) => {
        const tx = await conn.getTransaction(txId).catch((e) => { reject(e) })
        resolve(tx)
    })
}

var transformToAsset = async (asset) => {
    return new Promise(async (resolve) => {
        const tx = await conn.getTransaction(asset.transaction_id)
        const { operation, metadata } = tx;
        console.log("tx::", tx)
        console.log("asset::", asset)
        resolve({ operation, metadata, txId: asset.transaction_id })
    })
}

var getAssets = async (publicKey, spent = false) => {
    return new Promise((resolve) => {
        conn.listOutputs(publicKey, spent)
            .then((assets) => {
                if (assets.length) {
                    const assetDetails = Promise.all(assets.map(transformToAsset))
                    resolve(assetDetails)
                } else {
                    resolve([])
                }

            })
    })
}


var listTransactions = async (options) => {
    return new Promise((resolve, reject) => {
        const { assetId } = options;
        conn.listTransactions(assetId)
            .then((txList) => {
                if (txList.length <= 1) {
                    resolve(txList)
                }
                const inputTransactions = []
                txList.forEach((tx) =>
                    tx.inputs.forEach(input => {
                        if (input.fulfills) {
                            inputTransactions.push(input.fulfills.transaction_id)
                        }
                    })
                )
                const unspents = txList.filter((tx) => inputTransactions.indexOf(tx.id) === -1)
                if (unspents.length) {
                    let tipTransaction = unspents[0]
                    let tipTransactionId = tipTransaction.inputs[0].fulfills.transaction_id
                    const sortedTxList = []
                    while (true) {
                        sortedTxList.push(tipTransaction)
                        try {
                            tipTransactionId = tipTransaction.inputs[0].fulfills.transaction_id
                        } catch (e) {
                            break
                        }
                        if (!tipTransactionId) {
                            break
                        }
                        tipTransaction = txList.filter((tx) =>
                            tx.id === tipTransactionId)[0]
                    }
                    resolve(sortedTxList.reverse())
                } else {
                    reject({ error: 'something went wrong while sorting transactions', txList, inputTransactions })
                }
                resolve(txList)
            })
    })
}


var searchByMetadata = async (search) => {
    return new Promise(async (resolve) => {
        const assets = await conn.searchMetadata(search)
        resolve(assets)
    })
}

var transferAsset = async (options) => {
    return new Promise(async (resolve, reject) => {
        const { signedTx, fromPrivateKey, toPublicKey, metadata } = options;
        const txTransfer = driver.Transaction.makeTransferTransaction(
            [{ tx: signedTx, output_index: 0 }],
            [
                driver.Transaction.makeOutput(
                    driver.Transaction.makeEd25519Condition(toPublicKey)
                )
            ],
            metadata
        )
        const txTransferSigned = driver.Transaction.signTransaction(txTransfer, fromPrivateKey)
        const postedTx = await conn.postTransactionCommit(txTransferSigned)
            .catch((e) => {
                reject({ success: false, message: "Transaction can't send", status: e.status })
                return;
            })
       

        resolve({ result: postedTx, tx_Id: txTransferSigned.id })

    })
}



// function tokenLaunch() {    // Launching Token




let tokensLeft
//const tokenCreator = new driver
    //.Ed25519Keypair(bip39.mnemonicToSeed('seedPhrase').slice(0, 32))
//tokenLaunch();
function tokenLaunch(privatekey,publickey) {
    // Construct a transaction payload
    const tx = driver.Transaction.makeCreateTransaction({
        token: 'BAI',
        number_tokens: nTokens
    },
        // Metadata field, contains information about the transaction itself
        // (can be `null` if not needed)
        {
            datetime: new Date().toString()
        },
        // Output: Divisible asset, include nTokens as parameter
        [driver.Transaction.makeOutput(driver.Transaction
            .makeEd25519Condition(publickey), nTokens.toString())],
        publickey
    )

    // Sign the transaction with the private key of the token creator
    const txSigned = driver.Transaction
        .signTransaction(tx,privatekey)
    console.log("Pk " + privatekey+ "  pubkey " + publickey);

    // Send the transaction off to driver
    conn.postTransactionCommit(txSigned)
        .then(res => {
            createTxId = res.id
            tokensLeft = nTokens
            console.log("CreateTxID " + createTxId)
            //document.body.innerHTML = '<h3>Transaction created</h3>';
            // txSigned.id corresponds to the asset id of the tokens
            //document.body.innerHTML += txSigned.id
            console.log("txSigned Id  " + txSigned.id)
        })
    return ({ "Pk ": privatekey, "  pubkey ": publickey, "token ": nTokens,"txID":createTxId })
}



const amountToSend = 200

const newUser = new driver
    .Ed25519Keypair(bip39.mnemonicToSeed('newUserseedPhrase')
        .slice(0, 32))

function transferBai() {
    // User who will receive the 200 tokens
    console.log("Bai Transfer called ")
    const newUser = new driver.Ed25519Keypair()

    // Search outputs of the transactions belonging the token creator
    // False argument to retrieve unspent outputs
    conn.getTransaction('a2769c3f4c838b1b3f53b3e03b2abb595554e0a2e5598aac8f2ec74ed556ae74')
        .then((txOutputs) => {
            console.log("TRXID "+createTxId + "  output  "+JSON.stringify(txOutputs))
            // Create transfer transaction
            const createTranfer = driver.Transaction
                .makeTransferTransaction(
                    [{
                        tx: txOutputs,
                        output_index: 0
                    }],
                    // Transaction output: Two outputs, because the whole input
                    // must be spent
                    [driver.Transaction.makeOutput(
                            driver.Transaction
                            .makeEd25519Condition(tokenCreator.publicKey),
                            (tokensLeft - amountToSend.parseInt()).toString()),
                        driver.Transaction.makeOutput(
                            driver.Transaction
                            .makeEd25519Condition(newUser.publicKey),
                            amountToSend)
                    ],
                    // Metadata (optional)
                    {
                        transfer_to: 'john',
                        tokens_left: tokensLeft,
                        
                    }
                )

            // Sign the transaction with the tokenCreator key
            const signedTransfer = driver.Transaction
                .signTransaction(createTranfer, tokenCreator.privateKey)

            return conn.postTransactionCommit(signedTransfer)
        })
        .then(res => {
            // Update tokensLeft
            tokensLeft -= amountToSend
            console.log("Token Left "+tokensLeft)
            // document.body.innerHTML += '<h3>Transfer transaction created</h3>'
            // document.body.innerHTML += res.id
            console.log("response  res.id  "+ res.id)
            resolve(res)
        })

}
//async function transferBai()
async function transferTokens(amountToSend, pk, pubkey_sender, pubkey_receiver) {
    console.log("transferToken called");
    console.log("transactionID:",createTxId);
    return new Promise(async (resolve) => {
    await conn.getTransaction(createTxId)  // "f5b0deb405eb0c5873205bbbebb0651941d858957821ba8991e0a5e8586f4216"
        .then((txOutputs) => {
            //shake256(random,256)
            const createTranfer = driver.Transaction
                .makeTransferTransaction(

                    [{
                        tx: txOutputs,
                        output_index: 0
                    }],
                    // Transaction output: Two outputs, because the whole input
                    // must be spent
                    [driver.Transaction.makeOutput(

                        driver.Transaction
                            .makeEd25519Condition(pubkey_sender),
                        (tokensLeft - amountToSend).toString()),
                    driver.Transaction.makeOutput(
                        driver.Transaction
                            .makeEd25519Condition(pubkey_receiver),
                        amountToSend)

                    ],

                    // Metadata (optional)
                    {
                        //transfer_to: username,
                        tokens_left: tokensLeft
                    }
                )
            // Sign the transaction with the tokenCreator key
            const signedTransfer = driver.Transaction
                .signTransaction(createTranfer, pk)
            console.log("before post TransactionCommit",signedTransfer)
            return conn.postTransactionCommit(signedTransfer)
            
        })
        .then(res => {
                createTxId=res.id;
            // Update tokensLeft
            console.log("Token Left before " + tokensLeft)
            tokensLeft -= amountToSend
            // document.body.innerHTML += '<h3>Transfer transaction created</h3>'
            console.log("Token Left after " + tokensLeft)
            // document.body.innerHTML += res.id
            //console.log("res id",res.id)
            resolve(res)
           
        })
    }) 

}

module.exports = {
    createTxId:createTxId,
    tokensLeft:tokensLeft,
    getaddress: getaddress,
    createAsset: createAsset,
    transferAsset: transferAsset,
    getAssets: getAssets,
    getTransaction: getTransaction,
    listTransactions: listTransactions,
    searchByMetadata: searchByMetadata,
    tokenLaunch: tokenLaunch,
    transferTokens: transferTokens, // This is same as transferBai
    transferBai:transferBai
}


