// const fs = require('fs');
const Tour = require(`${__dirname}/../models/tourModel`);
const catchAsync = require('./../utils/catchAsync');
const factory = require('./handlerFactory');
const appError = require('./../utils/appError');
const AppError = require('./../utils/appError');
const multer = require('multer');
const sharp = require('sharp');

const multerStorage = multer.memoryStorage();
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) cb(null, true);
  else cb(new AppError('Please Upload only images...', 400), false);
};
const upload = multer({ storage: multerStorage, fileFilter: multerFilter });

exports.UploadTourImages = upload.fields([
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 3 }
]);

exports.ResizeTourImages = catchAsync(async (req, res, next) => {
  if (!req.files.imageCover || !req.files.images) return next();

  // 1) Handle Imagecover
  req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;
  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/tours/${req.body.imageCover}`);

  // 2) Handle images
  req.body.images = [];
  await Promise.all(
    req.files.images.map(async (file, index) => {
      const fileName = `tour-${req.params.id}-${Date.now()}-${index}-image.jpeg`;

      await sharp(file.buffer)
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/tours/${fileName}`);

      req.body.images.push(fileName);
    })
  );
  next();
});

//MiddleWare Function
exports.aliestopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,ratingsAverage,price,summary,difficulty';
  //V5 EXPRESS
  // const url = new URL(req.originalUrl, `http://${req.headers.host}`);
  // url.searchParams.set('limit', '5');
  // url.searchParams.set('sort', '-ratingsAverage,price');
  // url.searchParams.set(
  //   'fields',
  //   'name,ratingsAverage,price,summary,difficulty'
  // );
  // req.url = url.pathname + url.search;
  next();
};

exports.getAllTours = factory.getAll(Tour);
exports.getTour = factory.getOne(Tour, { path: 'reviews' });
exports.createTour = factory.createOne(Tour);
exports.updateTour = factory.updateOne(Tour);
exports.deleteTour = factory.deleteOne(Tour);

exports.tourStatus = catchAsync(async (req, res, next) => {
  const data = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } }
    },
    {
      $group: {
        _id: '$difficulty',
        numTours: { $sum: 1 },
        numRatings: { $sum: '$ratingsQuantity' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
        avgRatings: { $avg: '$ratingsAverage' }
      }
    },
    {
      $sort: { maxprice: 1 }
    }
  ]);
  res.status(200).json({
    status: 'success',
    data
  });
});

exports.monthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1;
  const data = await Tour.aggregate([
    {
      $unwind: '$startDates'
    },
    {
      $match: {
        startDates: {
          $gte: `${year}-01-01,00:00`,
          $lte: `${year}-12-31,00:00`
        }
      }
    },
    {
      $addFields: {
        startDateobj: { $dateFromString: { dateString: '$startDates' } }
      }
    },
    {
      $group: {
        _id: { $month: '$startDateobj' },
        numTourStarts: { $sum: 1 },
        tours: { $push: '$name' }
      }
    },
    {
      $addFields: {
        month: '$_id'
      }
    },
    {
      $project: {
        _id: 0
      }
    }
  ]);
  res.status(200).json({
    status: 'success',
    plan: data
  });
});

// tour-within/:distance/center/:latlng/unit/:unit
exports.tourWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');
  const raduis = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

  if (!lat || !lng)
    next(new appError('Please provide latitude and longtude values...', 400));

  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], raduis] } }
  });
  res
    .status(200)
    .json({ status: 'success', results: tours.length, data: { tours } });
});

exports.tourDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');
  const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

  if (!lat || !lng)
    next(new appError('Please provide latitude and longtude values...', 400));

  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [lng * 1, lat * 1]
        },
        distanceField: 'distance',
        distanceMultiplier: multiplier,
        key: 'startLocation'
      }
    },
    {
      $project: {
        distance: 1,
        name: 1
      }
    }
  ]);
  res.status(200).json({ status: 'success', data: { distances } });
});
