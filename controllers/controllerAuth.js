const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const catchAsync = require(`${__dirname}/../utils/catchAsync`);
const User = require(`${__dirname}/../models/userModel`);
const AppError = require('./../utils/appError');
const Email = require('./../utils/email');

const singToken = (id) => {
  //PAYLOAD: id of record, SECRET: long string, OPTIONS: expireIn after x days
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.EXPIRE_IN
  });
};

const sendToken = (user, statusCode, res) => {
  const token = singToken(user._id);

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 1000
    ),
    httpOnly: true
  };

  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
  res.cookie('jwt', token, cookieOptions);

  // REMOVE password from response
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    user
  });
};

exports.signUp = catchAsync(async (req, res, next) => {
  const user = await User.create(req.body);

  const url = `${req.protocol}://${req.get('host')}/me`;
  await new Email(user, url).sendWelcom();
  //TOKEN use to verify the sign in, expire time throw the session
  sendToken(user, 201, res);
});

exports.logIn = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1) Check email, password has values
  if (!email || !password)
    return next(new AppError('Please Enter password and email', 400));

  // 2) Check if email, password exist in database
  const user = await User.findOne({ email }).select('+password');
  // console.log(user);
  if (!user || !(await user.correctPassword(password, user.password)))
    return next(new AppError('incorrect password or email', 401));

  // 3) Ruturn a token
  sendToken(user, 200, res);
});

exports.protect = catchAsync(async (req, res, next) => {
  // 1) Get the token and check if it's exist
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) return next(new AppError('You not logged in, pleas log in'), 401);

  // 2) Verifying the token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 3) Check if the user still exist
  const currentUser = await User.findById(decoded.id);
  if (!currentUser)
    return next(new AppError('This user has no longer exist.', 401));
  // 4) check if the user changed his password
  if (currentUser.changedPassword(decoded.iat))
    return next(new AppError('password has changed, please login again', 401));

  //TOKEN has been verfiyied
  //Let's send out user throw middlewares to make some authorization
  //USER NOW is a prop of the req so we can use it in next
  req.user = currentUser;
  res.locals.user = currentUser;
  next();
});

exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });
  res.status(200).json({ status: 'success' });
};

exports.isLoggedIn = async (req, res, next) => {
  if (req.cookies.jwt) {
    try {
      // 1) verify the token
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );

      const currentUser = await User.findById(decoded.id);

      // 2) Check if the user still exist
      if (!currentUser) return next();

      // 3) check if the user changed his password
      if (currentUser.changedPassword(decoded.iat)) return next();

      // get the user in the frontEnd
      res.locals.user = currentUser;
      return next();
    } catch (error) {
      return next();
    }
  }
  next();
};

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(`Your don't have a permission for this Operation`, 403)
      );
    }
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) Check Existing User with Email
  const user = await User.findOne({ email: req.body.email });
  if (!user) return next(new AppError('No user exist with this email', 404));

  // 2) Create random Token for CURRENT USER, and save the encryption
  //ValidateBeforeSave to skip the validates while saving Encrypted Token
  const resetToken = user.creatPasswordResetToke();
  await user.save({ validateBeforeSave: false });

  // 3) Send token via email, URL for the reset password with token
  try {
    const resetUrl = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;
    await new Email(user, resetUrl).sendResetPassword();
    res.status(200).json({
      status: 'success',
      message: 'Token sent to Email.'
    });
  } catch (err) {
    user.PasswordResetToken = undefined;
    user.PasswordResetExpire = undefined;
    user.save({ validateBeforeSave: false });
    return next(new AppError('error sending email, try again later', 500));
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) Get ueser based pm random token
  const cryptoRandomToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    PasswordResetToken: cryptoRandomToken,
    PasswordResetExpire: { $gt: Date.now() }
  });

  // 2) If token hasn't expired, and there's a user, set the new password
  if (!user) return next(new AppError('invalid token, or expired token', 400));
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.PasswordResetExpire = undefined;
  user.PasswordResetToken = undefined;
  await user.save(); // don't use validateBeforeSave to check passwords

  // 3) Log in
  sendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) Get user from DB, password is false!
  const user = await User.findById(req.user._id).select('+password');

  // 2) Check of password is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('incorrect password, please try again', 401));
  }

  // 3) Update the password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();

  // 4) Create token and login
  sendToken(user, 200, res);
});
