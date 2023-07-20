var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
const uuidAPIKey = require('uuid-apikey');
var User = require('../user/User')
var VerifyToken = require('./VerifyToken');
var address = require('../utils/addresses')
var bigchain = require('../src/bigchaindb/api');
var multichain = require('../src/multichain/multichain')
router.use(bodyParser.urlencoded({
  extended: false
}));
router.use(bodyParser.json());

var jwt = require('jsonwebtoken'); // used to create, sign, and verify tokens
var bcrypt = require('bcryptjs');
var config = require('../config'); // get config file
router.post('/login', async function (req, res) {
  const walletId = req.body.walletId;
  const password = req.body.password;
  if (!walletId || walletId === "" || walletId === undefined ||
    !password || password === "" || password === undefined) {
    res.send({
      success: false,
      error: "Invalid parameters"
    })
    return;
  }
  User.findOne({
    walletId: walletId
  }, function (err, user) {
    console.log("User data login " + user)
    if (err) return res.send({
      success: false,
      message: "Error on server"
    });
    if (!user) return res.send({
      success: false,
      message: "Wallet not found"
    });
    if (!user.status) {
      return res.send({
        success: false,
        message: "User is not verified"
      });
    }
    var passwordIsValid = bcrypt.compareSync(password, user.password);
    // console.log("Pass "+bcrypt(user.password));
    if (!passwordIsValid) return res.status(401).send({
      success: false,
      message: "Password is incorrect"
    });
    var token = jwt.sign({
      id: user._id
    }, config.secret, {
      expiresIn: 86400 // expires in 24 hours
    });

    // return the information including token as JSON
    res.status(200).send({
      success: true,
      token: token,
      user: user
    });
  });

});

router.get('/logout', function (req, res) {
  res.status(200).send({
    auth: false,
    token: null
  });
});

router.post('/signup', function (req, res) {

  const username = req.body.username;
  const email = req.body.email;
  const password = req.body.password;
  const network = req.body.network;
  var forgetPass = "";
  if (!username || username === "" || username === undefined ||
    !password || password === "" || password === undefined ||
    !email || email === "" || email === undefined) {
    return res.send({
      success: false,
      message: "Invalid parameters"
    })
  }
  try {
    let usernameLength = username.trim().length;
    console.log("Length:", usernameLength)
    if (usernameLength < 1)
      return res.send({
        success: false,
        message: "Please enter a valid username"
      })

    let emailvalid = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    let re = [/[0-9]/, /[a-z]/, /[A-Z]/]

    User.find({
      email
    }, async (err, docs) => {
      if (err) {
        return res.send({
          success: false,
          message: "Invalid paramets"
        })
      }
      if (docs.length) {
        return res.send({
          success: false,
          message: "Email Already Exists"
        })
      } else {
        if (password.length < 8)
          return res.send({
            success: false,
            message: "password must be 8 characters long!"
          })
        if (!re[0].test(password))
          return res.send({
            success: false,
            message: "password must contain at least one number (0-9)!"
          })
        if (!re[1].test(password))
          return res.send({
            success: false,
            message: "password must contain at least one lowercase letter (a-z)!"
          })
        if (!re[2].test(password))
          return res.send({
            success: false,
            message: "password must contain at least one uppercase letter (A-Z)!"
          })
        if (!emailvalid.test(email))
          return res.send({
            success: false,
            message: "Please enter a valid email address"
          })
        var verifyToken = Math.floor(100000 + Math.random() * 900000);
        var status = false;
        var hashedPassword = bcrypt.hashSync(password, 8);
        let random = uuidAPIKey.create();
        const walletId = random.uuid
        let multiAddress = {};
        var wallets = {};
        let keypair = {};
        let grant = ''
        keypair = await address.getaddress(network, 'btc');
        console.log("keypair", JSON.stringify(keypair.keys))
        wallets.btc = keypair.keys;
        keypair = await bigchain.getaddress();
        multiAddress = await multichain.getNewAddress()
        console.log(multiAddress);
        grant = await multichain.grantPermission(multiAddress);
        console.log("this is new address:" + multiAddress);
        wallets.bigchain = keypair.keys;
        User.create({
            walletId,
            username,
            email,
            password: hashedPassword,
            verifyToken,
            wallets,
            multiAddress,
            status,
            forgetPass
          },
          function (err, user) {
            if (err) {
              var errMessages = [];
              for (var errName in err.errors) {
                errMessages.push(err.errors[errName].message)
              }
              return res.send({
                success: false,
                message: errMessages
              });
            } else {
              console.log(user)
              var token = jwt.sign({
                id: user._id
              }, config.secret, {
                expiresIn: 86400 // expires in 24 hours
              });
              console.log(token);
              res.send({
                success: true,
                token: token,
                user
              }); // walletId,, verifyToken  updated
              return
            }
          })
      }
    })
  } catch (error) {
    res.send({
      success: false,
      message: error.message
    });
  }


});

router.post('/verifyCode', async function (req, res, next) { // Code Verification for Registration
  console.log("usernaem " + req.body.username)
  console.log("code " + req.body.code)
  var toAddress = '';
  User.findOne({
    walletId: req.body.username
  }, function (err, user) {
    toAddress = user.multiAddress;
    if (err) return res.status(500).send("There was a problem finding the user.");
    if (!user) return res.status(404).send("No user found.");
    if (req.body.code == user.verifyToken) {
      if (user.status == true) {
        return res.status(400).send({
          "status": false,
          "msg": "User Already Verified "
        });
      }
      User.updateOne({
        walletId: req.body.username
      }, {
        status: true
      }, async function (err, res) {
        if (err) {
          console.log("Some Issues in mongdb");
          return res.status(400).send({
            "status": false,
            "msg": "DB Issue"
          });
        }
        console.log("1 document updated");
        // db.close();
      });
      return res.status(200).send({
        "status": true,
        "msg": "User has verified "
      });
    } else {
      return res.status(200).send({
        "status": false,
        "msg": "Authentication Invalid"
      });
    }
    // res.status(200).send(user);
  });
})


router.post('/generateString', async function (req, res) { // Generate  a spacific 20 character code 
  var email = req.body.email;

  var result = '';
  var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var charactersLength = characters.length;
  for (var i = 0; i < 20; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  console.log("Email " + email + "    Result  " + result);

  User.findOne({
    email: req.body.email
  }, function (err, user) {
    if (err) return res.status(500).send("There was a problem finding the user.");
    if (!user) return res.status(404).send({
      "success": false,
      "msg": "No user found."
    });
    User.updateOne({
      email: email
    }, {
      forgetPass: result
    }, function (err, res) {
      if (err) {
        console.log("Some Issues in mongdb");
        return res.status(400).send({
          "success": false,
          "msg": "DB Issue"
        });
      }
      console.log("1 document updated");
    });
    return res.status(200).send({
      "success": true,
      "msg": result
    });
  });

})


router.post('/validateUser', async function (req, res) { //  Validate Email and forget Password String
  var email = req.body.email;
  var code = req.body.code;



  User.findOne({
    email: req.body.email,
    forgetPass: code
  }, function (err, user) {
    if (err) return res.status(500).send("There was a problem finding the user.");
    if (!user) return res.status(404).send({
      "success": false,
      "msg": "No user found or link expired"
    });
    return res.status(200).send({
      "success": true,
      "msg": "User exist"
    });
  });

})



router.post('/updatePassword', function (req, res) { // Update Password When User Enter Password

  console.log("Forget Password Called with  Email");
  const email = req.body.email;
  // const email = req.body.email;
  const password = req.body.password;
  if (!password || password === "" || password === undefined) {
    return res.send({
      success: false,
      message: "Invalid Password "
    })
  }
  try {

    console.log("Forget Password Called In try with  Email " + email + "  Password  " + password);

    let re = [/[0-9]/, /[a-z]/, /[A-Z]/]

    if (password.length < 8)
      return res.send({
        success: false,
        message: "password must be 8 characters long!"
      })
    if (!re[0].test(password))
      return res.send({
        success: false,
        message: "password must contain at least one number (0-9)!"
      })
    if (!re[1].test(password))
      return res.send({
        success: false,
        message: "password must contain at least one lowercase letter (a-z)!"
      })
    if (!re[2].test(password))
      return res.send({
        success: false,
        message: "password must contain at least one uppercase letter (A-Z)!"
      })

    var status = false;
    var updatePassword;
    var hashedPassword = bcrypt.hashSync(password, 8);

    User.findOne({
      email: email
    }, function (err, user) {
      console.log("Find User " + user);
      if (err) return res.status(500).send("There was a problem finding the user.");
      if (!user) return res.status(404).send({
        "success": false,
        "msg": "No user found."
      });

      console.log("Calling Update User ")
      User.updateOne({
        email: email
      }, {
        password: hashedPassword
      }, function (err, res) {
        if (err) {
          console.log("Some Issues in mongdb");
          return res.status(400).send({
            "success": false,
            "msg": "DB Issue"
          });
        }
        console.log("1 document updated");
        // db.close();
      });
      return res.status(200).send({
        "success": true,
        "msg": "User password updated"
      });

    });

  } catch (error) {
    res.send({
      success: false,
      message: error.message
    });
  }


});
////////////////////////////////////////////////////
router.post('/changePassword', VerifyToken, function (req, res) { // Update Password When User Enter Password
  const userId = req.userId;
  console.log("Forget Password Called with  Email");
  const walletId = req.body.walletId;
  const oldPassword = req.body.oldPassword;
  const password = req.body.password;
  if (!password || password === "" || password === undefined) {
    return res.send({
      success: false,
      message: "Invalid Password "
    })
  }
  try {

    // console.log("Forget Password Called In try with  Email " + email + "  Password  " + password);

    let re = [/[0-9]/, /[a-z]/, /[A-Z]/]

    if (password.length < 8)
      return res.send({
        success: false,
        message: "password must be 8 characters long!"
      })
    if (!re[0].test(password))
      return res.send({
        success: false,
        message: "password must contain at least one number (0-9)!"
      })
    if (!re[1].test(password))
      return res.send({
        success: false,
        message: "password must contain at least one lowercase letter (a-z)!"
      })
    if (!re[2].test(password))
      return res.send({
        success: false,
        message: "password must contain at least one uppercase letter (A-Z)!"
      })

    var status = false;
    var updatePassword;
    var hashedPassword = bcrypt.hashSync(password, 8);
    User.findOne({
      _id: userId
    }, function (err, user) {
      var defaultToken = jwt.sign({
        id: user._id
      }, config.secret, {
        expiresIn: 86400 // expires in 24 hours
      });
      console.log("Find User " + user);
      var isValidOld = bcrypt.compareSync(oldPassword, user.password);
      if (password == oldPassword) {
        return res.send({
          success: false,
          message: "Old and new password are same"
        })
      };
      if (!isValidOld) {
        return res.send({
          success: false,
          message: "Old password is incorrect"
        })
      }
      if (err) return res.status(500).send("There was a problem finding the user.");
      if (!user) return res.status(404).send({
        "success": false,
        "msg": "No user found."
      });

      console.log("Calling Update User ")
      User.updateOne({
        _id: userId
      }, {
        password: hashedPassword
      }, function (err, res) {
        if (err) {
          console.log("Some Issues in mongdb");
          return res.status(400).send({
            "success": false,
            "msg": "DB Issue"
          });
        }
        console.log("1 document updated");
        // db.close();
      });
      return res.status(200).send({
        "success": true,
        "msg": "User password has changed"
      });

    });

  } catch (error) {
    console.log(error);

    res.send({
      success: false,
      message: error.message
    });
  }


});

////////////////////////////////////////////////////

router.get('/me', VerifyToken, function (req, res, next) {

  User.findById(req.userId, {
    password: 0
  }, function (err, user) {
    if (err) return res.status(500).send("There was a problem finding the user.");
    if (!user) return res.status(404).send("No user found.");
    res.status(200).send(user);
  });

});

router.get('/password/decrypt', async (req, res) => {
  var pass = req.body.pass;
  console.log("Pass " + bcrypt(pass));
  res.send(res);
})

module.exports = router;