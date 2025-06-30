const express = require('express');
const reviewController = require('./../controllers/controllerReview');
const authController = require('./../controllers/controllerAuth');

// Here have access from app.js and tourRoutes
// From tourRoutes POST/GET:  api/v1/tours/13asag423/reviews
// From app.js api/v1/reviews
// merge params mean use any params came from last route here
const reviewRouter = express.Router({ mergeParams: true });

reviewRouter.use(authController.protect);

reviewRouter
  .route('/')
  .get(reviewController.getAllReviews)
  .post(
    authController.restrictTo('user'),
    reviewController.setToursUserId,
    reviewController.createReview
  );

reviewRouter
  .route('/:id')
  .get(reviewController.getReview)
  .delete(
    authController.restrictTo('user', 'admin'),
    reviewController.deleteReview
  )
  .patch(
    authController.restrictTo('user', 'admin'),
    reviewController.updateReview
  );

module.exports = reviewRouter;
