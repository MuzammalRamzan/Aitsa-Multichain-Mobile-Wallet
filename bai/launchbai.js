const driver = require('bigchaindb-driver')
const bip39 = require('bip39')
const API_PATH = 'http://localhost:9984/api/v1/'
const conn = new driver.Connection(API_PATH)

const nTokens = 10000000000000
let tokensLeft
// const tokenCreator = new BigchainDB
// .Ed25519Keypair(bip39.mnemonicToSeed('seedPhrase').slice(0,32))
let createTxId
function tokenLaunch() {
  console.log("Calling token Launch")
    // Construct a transaction payload
    const tx = BigchainDB.Transaction.makeCreateTransaction({
            token: 'BAI',
            number_tokens: nTokens
        },
        // Metadata field, contains information about the transaction itself
        // (can be `null` if not needed)
        {
            datetime: new Date().toString()
        },

        // Output: Divisible asset, include nTokens as parameter
        [BigchainDB.Transaction.makeOutput(BigchainDB.Transaction
          .makeEd25519Condition('D2M3RrH7JZq7BDaCLWjRLFmaGs5xycXSRuDNFD87MQ9k'), nTokens.toString())],
          'D2M3RrH7JZq7BDaCLWjRLFmaGs5xycXSRuDNFD87MQ9k'
    )

    // Sign the transaction with the private key of the token creator
    const txSigned = BigchainDB.Transaction
      .signTransaction(tx, 'HLevJz7KitcnqkuViwmvbWvjpnGnxf6Ko6EYuhMtjszr')

    // Send the transaction off to BigchainDB
    conn.postTransactionCommit(txSigned)
        .then(res => {
          console.log("response after launching token")
            createTxId = res.id
            tokensLeft = nTokens
            document.body.innerHTML ='<h3>Transaction created</h3>';
            // txSigned.id corresponds to the asset id of the tokens
            document.body.innerHTML +=txSigned.id
        })
        return({success:true, token:token, totalSupply:nTokens})
        
}
module.exports= {
  tokenLaunch
}
