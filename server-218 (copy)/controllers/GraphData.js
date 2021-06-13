const express = require('express');
const app = express();
var crypto = require('crypto');
var mongoose = require('mongoose');
var CronJob = require('cron').CronJob;
var BAI = require('./BAI_model');


var job = new CronJob('* * 24 * * *', function() {
  console.log('You will see this message every second');
}, null, true, 'America/Los_Angeles');
job.start();


router.post('/updateBTCPrice', (req,res) => {
    const newPrice = new BTCRate({
    Name : "BTC",
    Price : req.body.price,
    UpdatedOn : Date.now()
     })
    //  if(newPrice.Price !== ''  ){
    db.collection("UpdatedOn").insertOne(newPrice,(err, UpdatedOn) => {
        if(err){
            console.log(err);
            
        }else if(UpdatedOn){
            return res.send({success:false , "msg":"Enter correct amount"});
        }
    })
    //  }else{
    //  res.send({success: false, message: `please enter a valid price`})
    //  }
  })
