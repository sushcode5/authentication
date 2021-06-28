require('dotenv').config()
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const OutlookStrategy = require('passport-outlook').Strategy;
const findOrCreate = require('mongoose-findorcreate');


const app = express();
app.set('trust proxy', 1);
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));


app.use(session({
  secret: "our little secret",
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 100000 }

}));

app.use(passport.initialize());
app.use(passport.session());



mongoose.connect("mongodb://localhost:27017/userDB", {useNewUrlParser: true, useUnifiedTopology: true});
mongoose.set('useCreateIndex', true);


const userSchema = new mongoose.Schema({
  useremail: String,
  username: String,
  outlookId: String,
});


userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);



const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});



passport.use(new OutlookStrategy({
    authorizationURL: 'https://login.microsoftonline.com/850aa78d-94e1-4bc6-9cf3-8c11b530701c/oauth2/v2.0/authorize',
    tokenURL: 'https://login.microsoftonline.com/850aa78d-94e1-4bc6-9cf3-8c11b530701c/oauth2/v2.0/token',
    clientID: "719794fa-6853-471c-bb8f-c25eedb3bb03",
    clientSecret: "XoBOR3dzXww03o-WQPZK_9jeDXO3_50-s7",
    callbackURL: "http://localhost:3000/auth/outlook/redirect",

  //  userProfileURL: 'https://login.microsoftonline.com/850aa78d-94e1-4bc6-9cf3-8c11b530701c/oauth2/v2.0/authorize'
  },
  function(accessToken, refreshToken, profile, done) {

    console.log(profile);
    var user = {
       useremail: profile.emails[0].value,
       username: profile.displayName,
       outlookId: profile.id
    };

  User.findOrCreate(user, function (err, user) {
    return done(err, user);
  });
}
));
//     if (refreshToken)
//       user.refreshToken = refreshToken;
//     if (profile.MailboxGuid)
//       user.mailboxGuid = profile.MailboxGuid;
//     if (profile.Alias)
//       user.alias = profile.Alias;
//     User.findOrCreate(user, function (err, user) {
//       return done(err, user);
//     });
//   }
// ));


app.get('/auth/outlook',
  passport.authenticate('windowslive', {
    scope: [
      'openid',
      'profile',
      'offline_access',
      'https://outlook.office.com/Mail.Read'
    ]
  })
);

app.get('/auth/outlook/redirect',
  passport.authenticate('windowslive', { failureRedirect: '/auth/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/auth/login/success');
  });



app.get('/auth/login/success', function(req, res){
  User.find({'useremail': {$ne: null}}, function(err, foundUser){
    if(err){
      console.log(err);
    }
    else{
      if(foundUser){
        res.render('success');
      }
    }
  });
});


app.get("/",function(req,res){
  res.render("home");
});

app.get("/auth/login", function(req, res){
  res.render("login");
});

app.get('/auth/logout', function (req, res) {
  res.clearCookie('connect.sid');
  res.redirect('/');
});



app.listen(3000,function(){
  console.log("Server is running on port 3000");
})
