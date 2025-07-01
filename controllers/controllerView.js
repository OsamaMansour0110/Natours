const AppError = require('../utils/appError');
const Tour = require('./../models/tourModel');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');

exports.alerts = (req, res, next) => {
  const { alert } = req.query;
  if (alert === 'booking')
    req.locals.alert = 'Your booking was success please check your email';
  next();
};

exports.getOverview = catchAsync(async (req, res, next) => {
  const tours = await Tour.find();

  res.status(200).render('overview', {
    title: 'All tours',
    tours
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findOne({ Slug: req.params.slug }).populate({
    path: 'reviews',
    select: 'review rating user',
    populate: {
      path: 'user',
      select: 'name -email'
    }
  });
  if (!tour) next(new AppError('There is now tour with this name', 404));
  res.status(200).render('tour', {
    title: `${tour.name} Tour`,
    tour
  });
});

exports.LoginForm = (req, res) => {
  res.status(200).render('login', {
    title: 'log into your account'
  });
};

exports.getAccount = (req, res) => {
  res.status(200).render('account', {
    title: 'Your Account'
  });
};

// Work with Action Forma and Method
exports.UpdateUserData = catchAsync(async (req, res) => {
  console.log(req.body);
  // Remember Only protected User See his Data -> Have full acces on his data
  const UpdatedUser = await User.findByIdAndUpdate(
    req.user.id,
    {
      name: req.body.name,
      email: req.body.email
    },
    {
      new: true,
      runValidators: true
    }
  );

  // Same Page with new data,
  res.status(200).render('account', {
    title: 'Your Account',
    user: UpdatedUser
  });
});
