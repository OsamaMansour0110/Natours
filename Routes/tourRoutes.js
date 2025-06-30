const express = require('express');
const controllerTour = require('./../controllers/controllerTour');
const controllerAuth = require('./../controllers/controllerAuth');
const reviewRouter = require('./../Routes/reviewRoutes');
const tourRouter = express.Router();

//param for paramter in url req
//middleware of stack much as we can
// tourRouter.param('id', controllerTour.CheckId);

//nested routes
// With this route go to review router
//it's like chaining app.use with tour.use then the full path is
// POST/GET:  api/v1/tours/13asag423/reviews
tourRouter.use('/:tourId/reviews', reviewRouter);

tourRouter
  .route('/top-5-cheap')
  .get(controllerTour.aliestopTours, controllerTour.getAllTours);

tourRouter.route('/tours-stats').get(controllerTour.tourStatus);
tourRouter
  .route('/monthly-plan/:year')
  .get(
    controllerAuth.protect,
    controllerAuth.restrictTo('admin', 'lead-guide', 'guide'),
    controllerTour.monthlyPlan
  );

tourRouter
  .route('/tour-within/:distance/center/:latlng/unit/:unit')
  .get(controllerTour.tourWithin);

tourRouter
  .route('/distances/:latlng/unit/:unit')
  .get(controllerTour.tourDistances);

tourRouter
  .route('/')
  .get(controllerTour.getAllTours)
  .post(
    controllerAuth.protect,
    controllerAuth.restrictTo('admin', 'lead-guide'),
    controllerTour.createTour
  );

tourRouter
  .route('/:id')
  .get(controllerTour.getTour)
  .patch(
    controllerAuth.protect,
    controllerAuth.restrictTo('admin', 'lead-guide'),
    controllerTour.UploadTourImages,
    controllerTour.ResizeTourImages,
    controllerTour.updateTour
  )
  .delete(
    controllerAuth.protect,
    controllerAuth.restrictTo('admin', 'lead-guide'),
    controllerTour.deleteTour
  );

module.exports = tourRouter;
