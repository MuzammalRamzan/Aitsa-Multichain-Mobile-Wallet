var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var Client = require('coinbase').Client;
var client = new Client({ 'apiKey': '0ahMNMyTvIHkrqXU', 'apiSecret': 'uzIpUjnhVg6MixGCXwrGCMCysaNVxwkv' });
// var request_promise = require('request-promise');
var BAI = require('./BAI_model')
var PayPal = require('./PayPalModel.js')
var BTCRate = require('./ModelBTC')
var User = require('../user/User')
var mongoose = require('mongoose');
var db = mongoose.connection;
var CronJob = require('cron').CronJob;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
  //console.log("Connected to MongoDB" + new Date().toISOString())
});
router.use(bodyParser.urlencoded({ extended: false }));
router.use(bodyParser.json());




let price = require('crypto-price')
router.post('/npm/btc', async function (req, res, next) {
price.getBasePrice('BTC', 'USD').then(obj => { // Base for ex - USD, Crypto for ex - ETH 
    console.log(obj.price)
    res.send({success:true,msg:obj.price});
}).catch(err => {
    console.log(err)
    res.send({success:false, msg:err})
})
})




router.post('/', async function (req, res, next) {
  var btc = req.body.btc;
  console.log("BTC " + btc)
  if (!btc || btc == NaN) {
    return res.send({ success: false, "msg": "Enter correct amount" });
  }

  price.getBasePrice('BTC', 'USD').then(obj => { // Base for ex - USD, Crypto for ex - 
    var btcUsd = btc * obj.price;
    console.log(btcUsd)
    res.send({success:true,msg:btcUsd});
}).catch(err => {
    console.log(err)
    res.send({success:false, msg:"Conversion Issue from BTC"})
})
})
// // This is crone
var job = new CronJob('20 0 * * *', function (err,res,next) {
  console.log("This is 23 Hours  Cron********")
  price.getBasePrice('BTC','USD').then(obj=>{
    var btcUsd=1*obj.price;
    console.log(btcUsd);
    const newPrice = new BTCRate({
      Name: "BTC",
      Price: btcUsd,
      UpdatedOn: Date.now()
    })
  
    db.collection("BTCRate").insertOne(newPrice, (err, UpdatedOn) => {
      if (err) {
        console.log("this is else of cron")
        console.log(err);
  
      } else if (UpdatedOn) {
        console.log(UpdatedOn);
      }
  
    })
    
  })

}, null, true, 'America/Los_Angeles');
job.start();




// this is 1btc To USd
router.post('/1btc', async function (req, res) {


  price.getBasePrice('BTC', 'USD').then(obj => { // Base for ex - USD, Crypto for ex - ETH 
    console.log(obj.price)
    res.send({success:true,msg:obj.price});
}).catch(err => {
    console.log(err)
    res.send({success:false, msg:"Conversion Issue from BTC"})
})
})
////////////////////////////
router.post('/BaiToEth', async function (req, res, next) {
  var usd = req.body.usd;
  console.log("BTC " + usd)
  if (!usd || usd == NaN) {
    return res.send({ success: false, "msg": "Enter correct amount" });
  }

  price.getBasePrice('ETH', 'USD').then(obj => { // Base for ex - USD, Crypto for ex - 
    console.log(obj.price);
    var btcUsd = usd / obj.price;
    console.log(btcUsd)
    res.send({success:true,msg:btcUsd});
}).catch(err => {
    console.log(err)
    res.send({success:false, msg:"Conversion Issue from BTC"})
})
})
//////////////////////////////
////////////////////////////
router.post('/BaiToBTC', async function (req, res, next) {
  var usd = req.body.usd;
  console.log("BTC " + usd)
  if (!usd || usd == NaN) {
    return res.send({ success: false, "msg": "Enter correct amount" });
  }

  price.getBasePrice('BTC', 'USD').then(obj => { // Base for ex - USD, Crypto for ex - 
    console.log(obj.price);
    var btcUsd = usd / obj.price;
    console.log(btcUsd)
    res.send({success:true,msg:btcUsd});
}).catch(err => {
    console.log(err)
    res.send({success:false, msg:"Conversion Issue from BTC"})
})
})
//////////////////////////////
////////////////////////////
router.post('/BaiToBCH', async function (req, res, next) {
  var usd = req.body.usd;
  console.log("BTC " + usd)
  if (!usd || usd == NaN) {
    return res.send({ success: false, "msg": "Enter correct amount" });
  }

  price.getBasePrice('BCH', 'USD').then(obj => { // Base for ex - USD, Crypto for ex - 
    console.log(obj.price);
    var btcUsd = usd / obj.price;
    console.log(btcUsd)
    res.send({success:true,msg:btcUsd});
}).catch(err => {
    console.log(err)
    res.send({success:false, msg:"Conversion Issue from BTC"})
})
})
//////////////////////////////

// Update BAI APi
router.post('/update_price', (req, res) => {
  const newPrice = new BAI({
    Name: "BAI",
    Price: req.body.price,
    Time: Date.now()
  })
  //  if(newPrice.Price !== ''  ){
  db.collection("BAI").insertOne(newPrice, (err, BAI) => {
    if (err) {
      console.log(err);

    } else if (BAI) {
      res.send({ success: true, message: `BAI Price Updated` })
      res.send('ok entered')
    }
  })
  //  }else{
  //  res.send({success: false, message: `please enter a valid price`})
  //  }
})

//create Papypal 
router.post('/create_paypal', (req, res) => {
  const newPayPal = new PayPal({
    username: req.body.username,
    tokkenname: req.body.tokkenname,
    amountUSD: req.body.amountUSD,
    totaltokkens: req.body.totaltokkens,
    time: Date.now(),
    status: req.body.status
  })
  var paypalcreated = false;
  if (newPayPal.username || newPayPal.username == "" || !req.body.tokkenname || newPayPal.tokkenname == "" || !newPayPal.amountUSD || newPayPal.amountUSD == "" || !newPayPal.totaltokkens || newPayPal.totaltokkens == "" || !newPayPal.status || newPayPal.status == "")
    return res.send({ success: false, message: `Kindly enter all the fields` });
  else
    console.log("these are valid inputs")
  db.collection("PayPal").insertOne(newPayPal, (err, PayPal) => {
    if (err) {
      console.log(err);
      return res.send({ success: false, message: err })

    }
    if (PayPal) {
      paypalcreated = true;
      res.send({ success: true, message: `PayPal Transaction  Created` })
    }
    else {
      res.send({ success: false, message: `PayPal Transaction Not Created` })
    }
  });
  // console.log("created2    ",paypalcreated)
  //  res.send({success: false, message: `PayPal Transaction Not Created`})

});


// Current Price in USD
router.get('/getlatest_bai', (req, res) => {
  db.collection("BAI").find().toArray((err, result) => {
    if (err) {
      console.log(err)
    } else {
      var n = result.length;
      console.log(n);
      res.send(result[n - 1])
    }
  })
})

router.get('/getBTCrate30day', (req, res) => {
  db.collection("BTCRate").find().toArray((err, result) => {
    console.log(result);
    
    if (err) {
      console.log(err)
    } else {
      var n = result.length;
      console.log(n);

      if (n <= 30) {

        res.send({success:true,message:result});
      }
      else {
        result = result.slice(Math.max(result.length - 30, 0));
        res.send({success:true,message:result});

      }
    }
  })
})

router.get('/buy', async function (req, res) {
  client.getBuyPrice({ 'currencyPair': 'BTC-USD' }, function (err, obj) {
    console.log('total amount: ' + obj.data.amount);
    res.send("1 BTC " + obj.data.amount)
  });
})

router.get('/sell', async function (req, res, next) {
  client.getSellPrice({ 'currencyPair': 'BTC-USD' }, function (err, obj) {
    console.log('total amount: ' + obj.data.amount);
    res.send("1 BTC " + obj.data.amount)
  });
})

module.exports = router;

