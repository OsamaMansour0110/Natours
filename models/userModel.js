const crypto = require('crypto');
const mongoose = require('mongoose');
const validators = require('validator');
const bcrypt = require('bcrypt');

//BIG note: always use reqular function with middlewares and methods
const UserScheme = mongoose.Schema({
  name: {
    type: String,
    required: [true, 'User must has a name'],
    minlength: [4, 'Username length must be > 5 digits'],
    maxlength: [30, 'Username length must be < 30 digis'],
    trim: true
    // validate: [validators.isAlpha, 'Username must be in alphabetic']
  },
  email: {
    type: String,
    required: [true, 'User must have an email'],
    unique: true,
    trim: true,
    lowercase: true,
    validate: [validators.isEmail, 'Email must be valid']
  },
  photo: {
    type: String,
    default: 'default.jpg'
  },
  role: {
    type: String,
    enum: ['admin', 'lead-guide', 'user', 'guide'],
    default: 'user'
  },
  password: {
    type: String,
    required: [true, 'User must has a password'],
    minlength: [6, 'User password must be > 6 digits'],
    maxlength: [30, 'User password must be < 30 digis'],
    select: false
  },
  passwordConfirm: {
    type: String,
    required: [true, 'User must has a password'],
    minlength: [6, 'User password must be > 6 digits'],
    maxlength: [30, 'User password must be < 30 digis'],
    validate: {
      validator: function (el) {
        return el === this.password;
      },
      messsage: 'Confirm password incorrect'
    }
  },
  CreatedPasswordAt: Date,
  PasswordResetToken: String,
  PasswordResetExpire: Date,
  active: {
    type: Boolean,
    default: true
  }
});

//Encrypt pasword when it's created
UserScheme.pre('save', async function (next) {
  //Make sure it's used only when the password is modified
  if (!this.isModified('password')) return next();

  //Encrpt the password
  this.password = await bcrypt.hash(this.password, 12);

  //Get rid of PasswordConfirm
  this.passwordConfirm = undefined;

  //Continue to the next middleware
  next();
});

UserScheme.pre('save', function (next) {
  // Modified and not new => set createdpassword
  if (!this.isModified || this.isNew) return next();
  this.CreatedPasswordAt = Date.now() - 1000;
  next();
});

//With all find operations Select Active users
UserScheme.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});

UserScheme.methods.correctPassword = async function (InpPassword, password) {
  return await bcrypt.compare(InpPassword, password);
};

UserScheme.methods.changedPassword = function (jwtTime) {
  if (this.CreatedPasswordAt) {
    const createdTimeStamp = parseInt(
      this.CreatedPasswordAt.getTime() / 1000,
      10
    );
    return createdTimeStamp > jwtTime;
  }
  return false;
};

UserScheme.methods.creatPasswordResetToke = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');
  //Store encrypted token within user Document
  this.PasswordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  //Have 10 min to reset your password
  this.PasswordResetExpire = Date.now() + 10 * 60 * 1000;
  //Return unEncrypted to send it via email
  return resetToken;
};

const User = mongoose.model('user', UserScheme);
module.exports = User;
