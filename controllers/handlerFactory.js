const appError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const apiFeatures = require('./../utils/apiFeatures');

exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);
    if (!doc) return next(new appError('No doc exist with this ID', 404));
    res.status(204).json({
      status: 'success',
      data: null
    });
  });

exports.updateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!doc) return next(new appError('No document exist with this ID', 404));
    res.status(200).json({
      status: 'success',
      data: doc
    });
  });

exports.createOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.create(req.body);
    res.status(201).json({
      status: 'success',
      data: doc
    });
  });

exports.getOne = (Model, populateOption) =>
  catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);
    if (populateOption) query = query.populate(populateOption);
    const doc = await query;

    if (!doc) return next(new appError('No document exist with this ID', 404));
    res.status(200).json({
      status: 'success',
      data: doc
    });
  });

exports.getAll = (Mode) =>
  catchAsync(async (req, res, next) => {
    // handel nested route Review from tours
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId };

    const Features = new apiFeatures(Mode.find(filter), req.query)
      .filter()
      .sort()
      .limiting()
      .paginate();

    // const docs = await Features.query.explain();
    const docs = await Features.query;
    //SEND RESPONSE
    res.status(200).json({
      status: 'success',
      results: docs.length,
      data: docs
    });
  });
