const router = require("express").Router();
const passport = require("passport");

//auth - Login

router.get("/login", function(req,res){

  res.render("login");
});


//auth Logout

router.get("/logout", function(req,res){
  res.send("logging out");
});

router.get("/outlook", passport.authenticate("windowslive",
{
  scope: [
    'openid',
    'profile'
  ]
}
));

//callback route for outlook to redirect to
router.get("/outlook/redirect",passport.authenticate("windowslive"), function(req,res){
  res.send("you reached the callback URL");
});

module.exports = router;
