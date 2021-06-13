const driver = require('bigchaindb-driver')
const bip39 = require('bip39')
const API_PATH = 'http://localhost:9984/api/v1/'
const conn = new driver.Connection(API_PATH)
var config = require('../../config');
let createTxId;
//----Return address of bitcoin user--------
//------------------------------------------
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
//----------------Generate passpharase------------
//------------------------------------------------
var generatePassphrase = async () => {
    return new Promise((resolve) => {
        const passphrase = bip39.generateMnemonic()
        resolve(passphrase);
    })
}
//---------get transaction detail by tx id-----------
//--------------------------------------------------
var getTransaction = async (txId) => {
    return new Promise(async (resolve, reject) => {
        const tx = await conn.getTransaction(txId).catch((e) => { reject(e) })
        resolve(tx)
    })
}
//----------get Asset-----------
//-------------------------------
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

module.exports = {
    createTxId:createTxId,
    getaddress: getaddress,
    getAssets: getAssets,
    generatePassphrase:generatePassphrase
}

