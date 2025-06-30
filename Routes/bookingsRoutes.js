const express = require('express');
const authController = require('./../controllers/controllerAuth');
const bookingControler = require('./../controllers/controllerBookings');
const bookingRouter = express.Router();

bookingRouter.use(authController.protect);

bookingRouter
  .route('/checkout-session/:tourId')
  .get(bookingControler.getCheckoutSession);

bookingRouter.use(authController.restrictTo('admin', 'lead-guide'));

bookingRouter
  .route('/')
  .get(bookingControler.getAllBooking)
  .post(bookingControler.CreateBooking);

bookingRouter
  .route('/:id')
  .get(bookingControler.getBooking)
  .patch(bookingControler.UpdateBooking)
  .delete(bookingControler.DeleteBooking);

module.exports = bookingRouter;
