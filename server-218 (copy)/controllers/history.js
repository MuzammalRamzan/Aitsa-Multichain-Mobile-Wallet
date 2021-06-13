var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var VerifyToken = require('../auth/VerifyToken');
var history = require('../utils/history')

router.use(bodyParser.urlencoded({ extended: false }));
router.use(bodyParser.json());


router.get('/', VerifyToken, async function (req, res, next) {
    const userId = req.userId;
    const currency = req.query.currency;
    console.log(userId);
    console.log(currency)
    if (!userId || userId === "" || userId === undefined
        || !currency || currency === "" || currency === undefined) {
        res.send({ success: false, error: "Invalid parameters" })
        return;
    }
    try {
        var historyList = await history.getHistory({ userId, walletType: currency })
        res.send(historyList)
    } catch (err) {
        res.send(err)
    }

});


module.exports = router;