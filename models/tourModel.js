const mongoose = require('mongoose');
const slugfiy = require('slugify');
// const User = require('./userModel');
// const validator = require('validator');

//create scheme(for descripe collaction and validates)
const TourScheme = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
      trim: true,
      minlength: [10, 'Tour name must be gte 10'],
      maxlength: [40, 'Tour name must be lte 40']
      // validate: [validator.isAlpha, 'Name only char ']
    },
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration']
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size']
    },
    difficulty: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a difficulty'],
      enum: {
        values: ['easy', 'difficult', 'medium'],
        message: 'difficulty must be one of 3 (easy, medium, difficult)'
      }
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Tour ratingsAverage must be gte 1'],
      max: [5, 'Tour ratingsAverage must be lte 5'],
      set: (val) => Math.round(val * 10) / 10 //4.666 -> 46 -> 47 -> 4.7
    },
    ratingsQuantity: {
      type: Number,
      required: [true, 'ERROR: must have a quantity']
    },
    price: {
      type: Number,
      required: [true, 'ERROR: must have a price']
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          return val < this.price;
        },
        message: 'discount must be less than pirce'
      }
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a difficulty']
    },
    description: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a difficulty']
    },
    Slug: { type: String },
    SecretTour: {
      type: Boolean,
      default: false
    },
    imageCover: {
      type: String,
      trim: true,
      required: [true, 'A tour must have an image']
    },
    createdAt: {
      type: Date,
      default: Date.now()
    },
    images: [String],
    startDates: [String],
    startLocation: {
      type: {
        type: String,
        default: 'Point',
        enum: ['Point']
      },
      coordinates: [Number],
      description: String,
      address: String
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point']
        },
        coordinates: [Number],
        description: String,
        address: String,
        day: Number
      }
    ],
    guides: [
      {
        //To treat the id as real user id
        type: mongoose.Schema.ObjectId,
        ref: 'user'
      }
    ]
  },
  {
    //to Show up virtual property that it's not in schema
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

TourScheme.index({ price: 1 });
TourScheme.index({ ratingsAverage: 1 });
TourScheme.index({ Slug: 1 });
// MongoDB automatic search for index with 2dsphere to use as key (controller-tour/aggregation/geoNear).
TourScheme.index({ startLocation: '2dsphere' });

TourScheme.virtual('durationWeek').get(function () {
  return this.duration / 7;
});

//Match between getTourId(local) with tourId in reviews(foreign)
TourScheme.virtual('reviews', {
  ref: 'review',
  foreignField: 'tour',
  localField: '_id'
});

//DOCUMENTED MIDDLEWARE run before save or create
TourScheme.pre('save', function (next) {
  this.Slug = slugfiy(this.name, { lower: true });
  next();
});

// Promise all ids in guide array
// TourScheme.pre('save', async function (next) {
//   const guidesPromises = this.guides.map(async (el) => await User.findById(el));
//   this.guides = await Promise.all(guidesPromises);
//   next();
// });

// //RUN after save or create
// TourScheme.post('save', function (doc, next) {
//   console.log(doc);
//   next();
// });

//QUERY MIDDLEWARE
TourScheme.pre(/^find/, function (next) {
  this.find({ SecretTour: { $ne: true } });
  this.start = Date.now();
  next();
});

TourScheme.pre(/^find/, function (next) {
  this.populate({
    path: 'guides',
    select: '-__v -CreatedPasswordAt'
  });
  next();
});

TourScheme.post(/^find/, function (doc, next) {
  console.log(`Time has been taken: ${Date.now() - this.start} MilliSeconds`);
  next();
});

//AGGREGATE MIDDLEWARE
// TourScheme.pre('aggregate', function (next) {
//   this.pipeline().unshift({ $match: { SecretTour: { $ne: true } } });
//   next();
// });

//model for collaction
const Tour = mongoose.model('Tour', TourScheme);

module.exports = Tour;
