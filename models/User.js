var mongoose = require('mongoose');

var userSchema = new mongoose.Schema({
  facebookId: String,
  accessToken: String,
  name: String,
  gender: String,
  location: String,
  birthday: Date,
  hereFor: String,
  picture: String,
  likes: Number,
  dislikes: Number
});

module.exports = mongoose.model('User', userSchema);
