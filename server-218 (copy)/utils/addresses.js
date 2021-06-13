const btc = require('../src/bitcoin/api.js')

const eth = require('../src/ethereum/api.js');
const ethc = require('../src/ethereumclassic/api.js');
const lite = require('../src/litecoin/api.js')
const dash = require('../src/dash/api.js')

var getaddress = async (network, walletType) => {
    return new Promise(async (resolve) => {
        switch (walletType) {
            case 'btc':
                try {
                    let address = await btc.getAddress(network)
                    resolve(address);
                } catch (err) {
                    resolve({ success: false, error: err.message })
                }
                break;
            case 'eth':
                try {
                    let address = await eth.getWallet();
                    resolve(address)
                } catch (err) {
                    resolve({ success: false, error: err.message })
                }
                break;
            case 'ethc':
                try {
                    let address = await ethc.getAddress();
                    resolve(address)
                } catch (err) {
                    resolve({ success: false, error: err.message })
                }
                break;
            case 'lite':
                try {
                    let address = await lite.getAddress(network);
                    resolve(address)
                } catch (err) {
                    resolve({ success: false, error: err.message })
                }
                break;
            case 'dash':
                try {
                    let address = await dash.getAddress();
                    resolve(address);
                } catch (err) {
                    resolve({ success: false, error: err.message })
                }
                break;
            default:
                break;
        }
    })
}

module.exports = {
    getaddress: getaddress
}