const express = require('express');
const viewController = require('./../controllers/controllerView');
const authController = require('./../controllers/controllerAuth');
const bookingControler = require('../controllers/controllerBookings');
const viewRouter = express.Router();

viewRouter.use(viewController.alerts);

viewRouter.get(
  '/',
  // bookingControler.CreateBookingCheckout,
  authController.isLoggedIn,
  viewController.getOverview
);

viewRouter.get(
  '/tour/:slug',
  authController.isLoggedIn,
  viewController.getTour
);

viewRouter.get('/login', authController.isLoggedIn, viewController.LoginForm);
viewRouter.get('/me', authController.protect, viewController.getAccount);
viewRouter.get(
  '/my-bookings',
  authController.protect,
  bookingControler.MyBookings
);

// In case Using Form Acion we Have to create new route
viewRouter
  .route('/submit-user-data')
  .post(authController.protect, viewController.UpdateUserData);

module.exports = viewRouter;
