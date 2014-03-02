var express = require('express');
var flash = require('express-flash');
var path = require('path');
var mongoose = require('mongoose');
var passport = require('passport');
var FacebookStrategy = require('passport-facebook').Strategy;
var expressValidator = require('express-validator');
var less = require('less-middleware');

var homeController = require('./controllers/home');

var config = require('./config');

var User = mongoose.model('User', new mongoose.Schema({
  facebookId: String,
  accessToken: String,
  email: String,
  firstName: String,
  lastName: String,
  profileUrl: String,
  gender: String,
  location: String,
  birthday: String,
  hereFor: String,
  picture: String,
  likes: Number,
  dislikes: Number
}));

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

passport.use(new FacebookStrategy(config.facebook, function(req, accessToken, refreshToken, profile, done) {
  User.findOne({ facebookId: profile.id }, function(err, existingUser) {
    if (existingUser) return done(null, existingUser);
    console.log(profile);
    var user = new User({
      facebookId: profile.id,
      accessToken: accessToken,
      email: profile._json.email,
      profileUrl: profile.profileUrl,
      firstName: profile.name.givenName,
      lastName: profile.name.familyName,
      gender: profile._json.gender,
      location: (profile._json.location) ? profile._json.location.name : '',
      birthday: profile._json.birthday,
      picture: 'https://graph.facebook.com/' + profile.id + '/picture?width=9999&height=9999'
    });
    user.save(function(err) {
      done(err, user);
    });
  });
}));

var isAuthenticated = function(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect('/login');
};

var isAuthorized = function(req, res, next) {
  var provider = req.path.split('/').slice(-1)[0];
  if (_.findWhere(req.user.tokens, { kind: provider })) next();
  else res.redirect('/auth/' + provider);
};


var app = express();

mongoose.connect('localhost');

app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.logger('dev'));
app.use(express.cookieParser());
app.use(express.json());
app.use(express.urlencoded());
app.use(expressValidator());
app.use(express.methodOverride());
app.use(express.session({ secret: 'Lux' }));
app.use(passport.initialize());
app.use(passport.session());
app.use(function(req, res, next) {
  res.locals.user = req.user;
  next();
});
app.use(flash());
app.use(less({ src: __dirname + '/public', compress: true }));
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.errorHandler());

/**
 * Application routes.
 */

app.get('/', homeController.index);
app.get('/logout', function(req, res) {
  req.logout();
  res.redirect('/');
});

/**
 * GET /signup
 * Signup page.
 */

app.get('/signup', isAuthenticated, function(req, res) {
  res.render('signup', {
    title: 'Create Account'
  });
});

/**
 * POST /signup
 * Create a new local account.
 * @param email
 * @param password
 */

app.post('/signup', function(req, res, next) {
  req.assert('firstName', 'First Name cannot be blank').notEmpty();
  req.assert('lastName', 'Last Name cannot be blank').notEmpty();
  req.assert('gender', 'You must select gender').notEmpty();
  req.assert('birthday', 'You must enter your birthday').notEmpty();
  req.assert('location', 'Location cannot be blank').notEmpty();
  req.assert('hereFor', 'You must select Here For reason').notEmpty();

  var errors = req.validationErrors();

  if (errors) {
    req.flash('errors', errors);
    return res.redirect('/signup');
  }

  User.findById(req.user.id, function(err, user) {
    user.firstName = req.body.firstName;
    user.lastName = req.body.lastName;
    user.gender = req.body.gender;
    user.birthday = req.body.birthday;
    user.location = req.body.location;
    user.hereFor = req.body.hereFor;
    user.save(function(err) {
      res.redirect('/');
    });
  });
});


/**
 * OAuth routes for sign-in.
 */

app.get('/auth/facebook', passport.authenticate('facebook', { scope: ['email', 'user_location', 'user_birthday'] }));
app.get('/auth/facebook/callback', passport.authenticate('facebook', { failureRedirect: '/' }), function(req, res) {
  if (!req.user.hereFor) {
    res.redirect('/signup');
  } else {
    res.redirect('/');
  }
});

app.listen(app.get('port'), function() {
  console.log('Express server listening on port ', app.get('port'));
});
