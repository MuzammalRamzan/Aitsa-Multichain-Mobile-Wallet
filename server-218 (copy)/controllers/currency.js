var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var BAI = require('./BAI_model')
var BTCRate = require('./ModelBTC')
var User = require('../user/User')
var mongoose = require('mongoose');
let price = require('crypto-price');
var db = mongoose.connection;
var CronJob = require('cron').CronJob;
db.on('error', console.error.bind(console, 'connection error:'));
var Client = require('coinbase').Client;
var client = new Client({
  'apiKey': '3joOCKOmk57gA4Sr',
  'apiSecret': 'ozyxaJMatcFlRrhBxiASnHFaJtITow5H',
  strictSSL: false
});
db.once('open', function () {});
router.use(bodyParser.urlencoded({
  extended: false
}));
async function coinbase(conversion) {
  return new Promise(async (resolve, reject) => {
    try {
      client.getBuyPrice({
        'currencyPair': conversion
      }, function (err, price) {
        if (err) {
          throw (err);
        } else {
          console.log(price);
          resolve(price)
        }
      })
    } catch (error) {
      reject(err)
    }
  })
}
router.use(bodyParser.json());
router.post('/', async function (req, res, next) {
  var btc = req.body.btc;
  console.log("BTC " + btc)
  try {
    if (!btc || btc == NaN) {
      throw ('Enter correct amount!');
    }
    const data = await coinbase('BTC-USD');
    if (data) {
      const result = data.data.amount;
      res.send({
        success: true,
        result: `${result} USD`
      })
    } else {
      throw ('Coinbase service unavailable!');
    }
  } catch (code) {
    res.send({
      success: false,
      message: code
    })
  }
})
//-----Crone run every day and get updated value of btc------------
//----------------------------------------------------------------
var job = new CronJob('20 0 * * *', async function (err, res, next) {
  console.log("This is 23 Hours  Cron********")
  const data = await coinbase('BTC-USD');
  try {

    const newPrice = new BTCRate({
      Name: "BTC",
      Price: data.data.amount,
      UpdatedOn: Date.now()
    })

    db.collection("BTCRate").insertOne(newPrice, (err, UpdatedOn) => {
      if (err) {
        console.log("this is else of cron");
        throw(err)
      } else if (UpdatedOn) {
        console.log(UpdatedOn);
      }

    })

  } catch (error) {
   res.send({success:false,message:error})
  }

}, null, true, 'America/Los_Angeles');
job.start();
//--------BAI to ETH conversion----------
//----------------------------------------
router.post('/BaiToEth', async function (req, res, next) {
  var usd = req.body.usd;
  console.log("BTC " + usd)
  if (!usd || usd == NaN) {
    return res.send({
      success: false,
      "msg": "Enter correct amount"
    });
  }
  const data = await coinbase('ETH-USD');
  if (data) {
    console.log(data);
    const result = (usd / data.data.amount).toFixed(8);
    console.log(result);
    res.send({
      success: true,
      result: `${result} ETH`
    })
  } else {
    res.send({
      success: false,
      message: "Coinbase service unavailable!"
    })
  }
})
//--------BAI to BTC conversion----------
//----------------------------------------
router.post('/BaiToBTC', async function (req, res, next) {
  var usd = req.body.usd;
  console.log("BTC " + usd)
  try {
    if (!usd || usd == NaN) {
      throw ('Enter Correct Amcount!')
    }
    const data = await coinbase('BTC-USD');
    if (data) {
      console.log(data);
      const result = (usd / data.data.amount).toFixed(8);
      console.log(result);
      res.send({
        success: true,
        result: `${result} BTC`
      })
    } else {
      throw ('Coinbase service unavailable!')
    }

  } catch (error) {
    res.send({
      success: false,
      message: error
    })
  }

})
//--------BAI to BCH conversion----------
//----------------------------------------
router.post('/BaiToBCH', async function (req, res, next) {
  var usd = req.body.usd;
  console.log("BTC " + usd)
  try {
    if (!usd || usd == NaN) {
      throw ("Enter Correct Amount")
    }
    const data = await coinbase('BCH-USD');
    if (data) {
      console.log(data);
      const result = (usd / data.data.amount).toFixed(8);
      console.log(result);
      res.send({
        success: true,
        result: `${result} BCH`
      })
    } else {
      throw ("Coinbase Service Issue!")
    }
  } catch (error) {
    res.send({
      success: false,
      message: error
    })
  }
})
//-----------------Get 30 days data of btc price----------------
//--------------------------------------------------------------
router.get('/getBTCrate30day', (req, res) => {
  db.collection("BTCRate").find().toArray((err, result) => {
    console.log(result);
    try {
      if (err) {
        throw (err)
      } else {
        var n = result.length;
        console.log(n);

        if (n <= 30) {

          res.send({
            success: true,
            message: result
          });
        } else {
          result = result.slice(Math.max(result.length - 30, 0));
          res.send({
            success: true,
            message: result
          });

        }
      }
    } catch (error) {
      res.send({
        success: false,
        message: error
      })
    }
  })
})

module.exports = router;