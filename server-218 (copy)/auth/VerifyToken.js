var jwt = require('jsonwebtoken'); // used to create, sign, and verify tokens
var config = require('../config'); // get our config file
function verifyToken(req, res, next) {

  // check header or url parameters or post parameters for token
  var token = req.headers['x-access-token'];
  if (!token)
    return res.status(403).send({
      success: false,
      message: 'No token provided.'
    });
  console.log("token:", token)
  // verifies secret and checks exp
  jwt.verify(token, config.secret, function (err, decoded) {
    if (err)
      return res.status(500).send({
        success: false,
        message: 'Token has been expired'
      });

    // if everything is good, save to request for use in other routes

    req.userId = decoded.id;
    console.log("This is request:" + req.userId);

    next();
  });

}

module.exports = verifyToken;