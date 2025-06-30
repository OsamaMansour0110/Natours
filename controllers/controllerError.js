const AppError = require('./../utils/appError');

const handelCastError = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const handelDuplicatedDB = (err) => {
  const message = `Has duplicated value: ${err.errmsg.match(/(["'])(\\?.)*?\1/)[0]}..`;
  return new AppError(message, 404);
};

const handelValidatorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid data input : ${errors.join(' --- ')}`;
  return new AppError(message, 404);
};

const handeleTokenError = () =>
  new AppError('Invalid Token, please login again', 401);

const handelExpiredToken = () =>
  new AppError('Expired token pls login again', 401);

// IN development mode
const sendErrorDev = (err, req, res) => {
  // A) API
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack
    });
  }
  // B) Render Website
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong!',
    msg: err.message
  });
};

const sendErrorProd = (err, req, res) => {
  // A) API
  if (req.originalUrl.startsWith('/api')) {
    // A.1) Error That i Handled using (AppError)
    if (err.isOptional) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message
      });
    }
    // A.2) Error that's Unknow, not handled
    console.log('ERROR *_*: ', err);
    return res.status(500).json({
      status: 'ERROR',
      message: 'Something went wrong @_@'
    });
  }
  // B) Render website
  if (err.isOptional) {
    // B.1) Error that I handled in the production
    return res.status(err.statusCode).render('error', {
      title: 'Something went wrong!',
      msg: err.message
    });
  }
  // B.2) Error that's Unknow in the production phase
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong!',
    msg: 'Please try again Later'
  });
};

module.exports = (err, req, res, next) => {
  err.status = err.status || 'error';
  err.statusCode = err.statusCode || 500;

  if (process.env.NODE_ENV === 'development') {
    //DEVELOPMENT: for developer in test/code
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    //PRODUCTION: for user smth not exist or wired thing happened
    let error = err;
    error.message = err.message;
    if (error.name === 'CastError') error = handelCastError(error);
    if (error.code === 11000) error = handelDuplicatedDB(error);
    if (err.name === 'ValidationError') error = handelValidatorDB(error);
    if (err.name === 'JsonWebTokenError') error = handeleTokenError();
    if (err.name === 'TokenExpiredError') error = handelExpiredToken();
    sendErrorProd(error, req, res);
  }
  next();
};
