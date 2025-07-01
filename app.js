const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');

const globalErrorHandling = require(`${__dirname}/controllers/controllerError`);
const appError = require(`${__dirname}/utils/appError`);
const tourRouter = require(`${__dirname}/Routes/tourRoutes`);
const userRouter = require(`${__dirname}/Routes/userRoutes`);
const reviewRouter = require(`${__dirname}/Routes/reviewRoutes`);
const viewRouter = require('./Routes/viewRoutes');
const bookingRouter = require('./Routes/bookingsRoutes');
const compression = require('compression');

const app = express();

app.enable('trust proxy');

// -Using pug with res.render To directory view
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// 1) GLOBAL MIDLEWARES

// -CROSS-ORIGIN RSOURCE SHARING: Make your api available to everyone to access
// -Note That you deployement your app -> anyone can hit api/v1/tours or whatever
// -The POWER of cors -> SHARING APIs ('Saving time, coding efforts') is it amazing?
app.use(cors());

// -Handle preflight requests (PUT/DELETE/PATCH)
app.options('*', cors());

// -Serving static files
app.use(express.static(path.join(__dirname, 'public')));

// -SET security HTTP headers
app.use(
  helmet({
    contentSecurityPolicy: false
  })
);

// -Development logging
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

// -LIMIT requests from same api: Bruto Force ATTACK
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Many request from this IP'
});
app.use('/api', limiter);

// -Body Parser: reading data from body into req.body
app.use(express.json({ limit: '10kb' }));

// -URL Parser: Get Data Came From Form action
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// -Cookie parser: get the cookies as prop into the req
app.use(cookieParser());

// -Data sanitization against noSql Query injection
app.use(mongoSanitize());

// -Data sanitization against xss: Input HTML in code
app.use(xss());

// -Prevent parameter pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'price',
      'ratingsQuantity',
      'difficulty',
      'ratingsAverage',
      'maxGroupSize'
    ]
  })
);

// -Test Middleware
app.use((req, res, next) => {
  req.CurrentTime = new Date().toISOString();
  // console.log(req.cookies);
  next();
});

// To compress the response text to client
app.use(compression());

// 2) ROUTES
app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

app.all('*', (req, res, next) => {
  next(new appError(`can't reach this: ${req.originalUrl}`, 404));
});

app.use(globalErrorHandling);

module.exports = app;
