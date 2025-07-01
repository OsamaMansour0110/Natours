const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Tour = require('./../models/tourModel');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const Booking = require('../models/bookingModel');
const factory = require('./handlerFactory');
const AppError = require('./../utils/appError');

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  // Get tour based on id
  const tour = await Tour.findById(req.params.tourId);

  // Create checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment', // used with price data
    // success_url: `${req.protocol}://${req.get('host')}/my-bookings/?tour=${tour.id}&user=${req.user.id}&price=${tour.price}`,
    success_url: `${req.protocol}://${req.get('host')}/my-bookings`,
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.Slug}`,
    customer_email: req.user.email,
    client_reference_id: req.params.tourId,
    line_items: [
      {
        price_data: {
          currency: 'usd',
          unit_amount: Math.round(tour.price * 100),
          product_data: {
            name: `${tour.name} Tour`,
            description: tour.summary,
            images: [`https://www.natours.dev/img/tours/${tour.imageCover}`]
          }
        },
        quantity: 1
      }
    ]
  });

  // create response
  res.status(200).json({ status: 'success', session });
});

// WHY COMMENT? Not secure to send senstive data throw URL

// exports.CreateBookingCheckout = catchAsync(async (req, res, next) => {
//   const { tour, user, price } = req.query;

//   if (!tour && !user && !price) return next();
//   await Booking.create({ tour, user, price });

//   // Sending to home page with empty query
//   res.redirect(req.originalUrl.split('?')[0]);
// });

const creatBookingCheckout = async (session) => {
  const tour = session.client_reference_id;
  const user = (await User.findOne({ email: session.customer_email })).id;
  const price = session.line_items[0].price_data.unit_amount / 100;
  await Booking.create({ tour, user, price });
};

exports.webhookCheckout = (req, res, next) => {
  const signature = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    return res.status(200).send(`Webhook error: ${error.message}`);
  }
};

exports.CreateBooking = factory.createOne(Booking);
exports.getAllBooking = factory.getAll(Booking);
exports.getBooking = factory.getOne(Booking);
exports.UpdateBooking = factory.updateOne(Booking);
exports.DeleteBooking = factory.deleteOne(Booking);

exports.MyBookings = catchAsync(async (req, res, next) => {
  // Get all user bookings
  const UserBookings = await Booking.find({ user: req.user.id });

  // Get all user tours id
  const UserToursIds = UserBookings.map((element) => element.tour);

  // Get all tours
  const UserTours = await Tour.find({ _id: { $in: UserToursIds } });

  // VERY IMPORTANT TO PUT THIS IN YOUR MIND ALL TIME.
  // Render to overview page.
  // The full path from the link u click to render response you get.
  // '/my-bookings' in a link's href -> click it -> moving to viewRoutes why?: because it's '127.0.0.0/' so app.js will access the routes that has this path and it's viewRoutes -> access route with '/my-bookings'.
  // Why don't use axios/fetch? -> good question bro, the answer it's simple we can use it -> Using DOM and creating new file with async function that's using axios to excute our BACKEND API Then from this function you can asign to new pug page but you can't send data except if u used another middleware with req.locals.'' = ''.
  //THE BEST CASE FOR USING AXIOS when user input some data so u need to patch or post smth.

  res.status(200).render('overview', {
    title: 'My bookings Tours',
    tours: UserTours
  });
  // in this response w ce
});
