const User = require('../models/user');
const sha256 = require('sha256');
const randomstring = require('randomstring');
const aes256 = require('aes256');
const key = 'userToken';
const cipher = aes256.createCipher(key);
const fs = require('fs');

module.exports.create = function(req,res){
  const user = new User();
  const salt = randomstring.generate(10);
  const pepper = randomstring.generate(10);

  user.username = req.body.username;
  user.email = req.body.email;
  user.salt = salt;
  user.pepper = pepper;
  user.password = sha256(user.salt) + sha256(req.body.password) + sha256(pepper);
  user.firstName = req.body.forename;
  user.lastName = req.body.surname;
  user.profilePic = req.body.pic;
  user.save(function(err, user){
    res.redirect('/');
  });
}

module.exports.login = function(req,res){
  console.log(req.body);
  User.find({username: req.body.username}, function(err,docs){
    if(docs.length > 0){
      const user = docs[0];
      const salt = sha256(user.salt);
      const pepper = sha256(user.pepper);
      const passwordEntry = salt + sha256(req.body.password) + pepper;
      if(passwordEntry == user.password){
        const userToken = {
          "id": user._id,
          "username": user.username,
          "firstName": user.firstName,
          "lastName": user.lastName,
          "email": user.email,
          "profilePic": user.profilePic
        };
        const key = 'userToken';
        const cipher = aes256.createCipher(key);
        const enc = cipher.encrypt(JSON.stringify(userToken));
        console.log(enc);
        res.cookie('user', enc);
        // res.cookie('userPic', user.profilePic);
        res.redirect('/');
      }
    } else {
      res.redirect('/');
    }
  })
}

module.exports.signout = function(req,res){
  res.clearCookie('user');
  res.redirect('/');
}

module.exports.profile = function(req,res){
  User.find({"_id" : req.params.id}, function(err, docs){
    fs.readdir('./public/img/cutesprays', function(err,files){
      res.render('profile', {user: docs[0], loggedIn: true, pics: files})
    })
  })
}

module.exports.updateProfile = function(req,res){
  User.findById(req.params.id, function(err,user){
    if(!(typeof(user) == 'undefined')){
      user.firstName = req.body.firstName;
      user.lastName = req.body.surname;
      user.email = req.body.email;
      user.profilePic = req.body.pic;
      console.log(user);
      user.save(function(err, updatedUser){
        res.redirect('/')
      })
    }
  })
}
