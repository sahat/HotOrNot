module.exports = {
  db: 'localhost',

  sessionSecret: "Your Session Secret goes here",

  sendgrid: {
    user: 'Your SendGrid Username',
    password: 'Your SendGrid Password'
  },

  facebook: {
    clientID: '633254040073197',
    clientSecret: '4a6e8aaea247410fa04bd9e8a4a42869',
    callbackURL: '/auth/facebook/callback',
    passReqToCallback: true
  }
};
