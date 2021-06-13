var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var VerifyToken = require('../auth/VerifyToken');
var balance = require('../utils/balances')

router.use(bodyParser.urlencoded({ extended: false }));
router.use(bodyParser.json());


router.get('/', VerifyToken, async function (req, res, next) {
    const userId = req.userId;
    console.log(userId);
    
    const currency = req.query.currency;
    // let query = Object.keys(req.query).length
    // if (query > 2) {
    //     console.log(query);
    //     res.send({ success: false, message: "Page not found" })
    //     return;
    // } 
        console.log("ELSE PART")
        if (!userId || userId === "" || userId === undefined
            || !currency || currency === "" || currency === undefined) {
            res.send({ success: false, error: "Invalid parameters" })
            return;
        }
        try {
            var currentbalance = await balance.getbalance(userId,"mainnet",currency).
                catch((e) => {
                    res.send({ success: false, error: e.message })
                })
            console.log("balance:"+currentbalance);    
            res.send({success:true,balance:currentbalance +' '+'BTC'})
        } catch (err) {
            res.send({ success: false, error: err.message })
        }
    }
);


module.exports = router;

