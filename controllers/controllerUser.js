const User = require('./../models/userModel');
const factory = require('./handlerFactory');
const AppError = require('../utils/appError');
const catchAsync = require('./../utils/catchAsync');
const multer = require('multer');
const sharp = require('sharp');

// 1) Remember we Access on user from Protect
// const multerStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'public/img/users');
//   },
//   filename: (req, file, cb) => {
//     const ext = file.mimetype.split('/')[1];
//     cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
//   }
// });

const multerStorage = multer.memoryStorage();

// 2) Use it to Specify the type of the uploaded file
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) cb(null, true);
  else cb(new AppError('not An image please upload Image', 400), false);
};

const upload = multer({ storage: multerStorage, fileFilter: multerFilter });

// Connect Multer With Field 'photo' In The Form, NOT Model
exports.UploadUserImage = upload.single('photo');

exports.ResizeUserPhoto = catchAsync(async (req, res, next) => {
  // Check if there's img.
  if (!req.file) return next();

  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

  // Now image in the buffer 'memory'
  // Resizing photo -> change format to jpeg -> less the size
  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);

  next();
});

const filterObj = (obj, ...options) => {
  const newObj = {};
  Object.keys(obj).forEach((element) => {
    if (options.includes(element)) {
      newObj[element] = obj[element];
    }
  });
  return newObj;
};

exports.updateMe = catchAsync(async (req, res, next) => {
  console.log(req.file, req.body);
  // 1) Handle password update
  if (req.body.password || req.body.passwordConfirm)
    return next(new AppError('change password in another route'), 400);

  const FilteredObject = filterObj(req.body, 'name', 'email');
  if (req.file) FilteredObject.photo = req.file.filename;

  const Updateduser = await User.findByIdAndUpdate(
    req.user._id,
    FilteredObject,
    {
      new: true,
      runValidators: true
    }
  );

  res.status(200).json({
    status: 'success',
    data: {
      user: Updateduser
    }
  });
});

exports.deleteMe = async (req, res, next) => {
  //INactive the user
  const up_user = await User.findByIdAndUpdate(req.user._id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null
  });
};

exports.getMe = (req, res, next) => {
  console.log('here ');
  req.params.id = req.user.id;
  next();
};

exports.getAllUsers = factory.getAll(User);
exports.getUser = factory.getOne(User);
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);
exports.createUser = factory.createOne(User);
