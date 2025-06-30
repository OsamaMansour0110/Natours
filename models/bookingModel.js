const mongoose = require('mongoose');

const BookingSchema = mongoose.Schema({
  tour: {
    type: mongoose.Schema.ObjectId,
    ref: 'Tour',
    required: [true, 'Each Booking belongs to specific Tour']
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'user',
    required: [true, 'Each Booking belongs to sepcific User']
  },
  price: {
    type: Number,
    required: [true, 'Each Booking must has a price']
  },
  createdAt: {
    type: Date,
    default: Date.now()
  },
  paid: {
    type: Boolean
  }
});

BookingSchema.pre(/^find/, function (next) {
  // this.populate([
  //   { paht: 'user', select: 'email name' },
  //   {
  //     path: 'tour',
  //     select: 'name'
  //   }
  // ]);
  this.populate({ path: 'user' }).populate({ path: 'tour', select: 'name' });
  next();
});

const Booking = mongoose.model('Booking', BookingSchema);
module.exports = Booking;
