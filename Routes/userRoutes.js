const express = require('express');
const controllerUser = require('./../controllers/controllerUser');
const controllerAuth = require('./../controllers/controllerAuth');

const userRouter = express.Router();

userRouter.route('/signup').post(controllerAuth.signUp);
userRouter.route('/login').post(controllerAuth.logIn);
userRouter.route('/logout').get(controllerAuth.logout);

userRouter.route('/forgotPassowrd').post(controllerAuth.forgotPassword);
userRouter.route('/resetPassword/:token').patch(controllerAuth.resetPassword);

userRouter.use(controllerAuth.protect);

userRouter.route('/updatePassword').patch(controllerAuth.updatePassword);
userRouter.route('/me').get(controllerUser.getMe, controllerUser.getUser);
userRouter
  .route('/updateMe')
  .patch(
    controllerUser.UploadUserImage,
    controllerUser.ResizeUserPhoto,
    controllerUser.updateMe
  );
userRouter.route('/deleteMe').delete(controllerUser.deleteMe);

userRouter.use(controllerAuth.restrictTo('admin'));

userRouter
  .route('/')
  .get(controllerUser.getAllUsers)
  .post(controllerUser.createUser);

userRouter
  .route('/:id')
  .get(controllerUser.getUser)
  .patch(controllerUser.updateUser)
  .delete(controllerUser.deleteUser);

module.exports = userRouter;
