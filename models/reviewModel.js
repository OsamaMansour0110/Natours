const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Not empty value.']
    },
    rating: {
      type: Number,
      min: [1, 'The rating must be more than 1.'],
      max: [5, 'The rating must be less than 5.']
    },
    createdAt: Date,
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review belong to a tour.']
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'user',
      required: [true, 'Review belong to a user.']
    }
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Prevent duplicated reviews
reviewSchema.index({ user: 1, tour: 1 }, { unique: true });

reviewSchema.pre(/^find/, function (next) {
  // this.populate([
  //   { path: 'tour', select: 'name price' },
  //   { path: 'user', select: 'name role email' }
  // ]);
  this.populate({ path: 'user', select: 'photo name role email' });
  next();
});

reviewSchema.statics.calcAverageRatings = async function (tourId) {
  // stats point current
  const stats = await this.aggregate([
    {
      $match: { tour: tourId }
    },
    {
      $group: {
        _id: 'tourId',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' }
      }
    }
  ]);
  // Updating tour's Rating Count and average
  if (stats[0]) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsAverage: stats[0].avgRating,
      ratingsQuantity: stats[0].nRating
    });
  } else {
    // IN CASE users decide to delete all reviews
    await Tour.findByIdAndUpdate(tourId, {
      ratingsAverage: 4.5,
      ratingsQuantity: 0
    });
  }
};

reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

reviewSchema.post('save', function () {
  // this point to current review
  this.constructor.calcAverageRatings(this.tour);
});

// What if user decides to update/delete the review?
reviewSchema.pre(/^findOneAnd/, async function (next) {
  // Store review in r to send it through post middleware
  this.r = await this.model.findOne(this.getQuery());
  next();
});

reviewSchema.post(/^findOneAnd/, async function () {
  // Query already executed so await not work
  await this.r.constructor.calcAverageRatings(this.r.tour);
});

const Review = mongoose.model('review', reviewSchema);
module.exports = Review;
