const fileUpload = require('express-fileupload');
const cloudinary = require('cloudinary');
const crypto = require('crypto');
const User = require('../models/user');
const BigPromise = require('../middlewares/bigPromise');
const CustomError = require('../utils/customError');
const cookieToken = require('../utils/cookieToken');
const mailHelpre = require('../utils/emailHelper');

exports.signup = BigPromise(async (req, res, next) => {
  const { name, email, password } = req.body;

  if (!email || !name || !password) {
    return next(new CustomError('Please enter complete user details', 400));
  }

  if (!req.files) {
    return next(new CustomError('image is required', 400));
  }

  const file = req.files.image;
  const result = await cloudinary.v2.uploader.upload(file.tempFilePath, {
    folder: 'users',
    width: 150,
    crop: 'scale',
  });

  const user = await User.create({
    name,
    email,
    password,
    image: {
      id: result.public_id,
      secure_url: result.secure_url,
    },
  });

  cookieToken(user, res);
});

exports.login = BigPromise(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return next(new CustomError('email and password required', 400));
  }

  // get user from DB
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    return next(new CustomError('user not registerd', 400));
  }

  const isPasswordValid = await user.isPasswordValid(password);

  if (!isPasswordValid) {
    return next(new CustomError('password incorrect', 400));
  }

  cookieToken(user, res);
});

exports.logout = BigPromise(async (req, res, next) => {
  res.cookie('token', null, { expires: new Date(Date.now()), httpOnly: true });
  res.status(200).json({
    success: true,
    message: 'logout success',
  });
});

exports.forgotPassword = BigPromise(async (req, res, next) => {
  const { email } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    return next(new CustomError('email not found', 400));
  }

  const forgotPasswordToken = user.getForgotPasswordToken();

  await user.save({ validateBeforeSave: false });

  const url = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/password/reset/${forgotPasswordToken}`;

  const message = `Copy paste this link in your URL and hit enter \n \n ${url}`;

  try {
    await mailHelpre({ email: user.email, subject: 'Reset passwort', message });
    res.status(200).json({
      success: true,
      message: `email sent to ${user.email}`,
    });
  } catch (error) {
    user.forgotPasswordToken = undefined;
    user.forgotPasswordExpiry = undefined;
    await user.save({ validateBeforeSave: false });
    return next(new CustomError(error.message, 500));
  }
});

exports.resetPassword = BigPromise(async (req, res, next) => {
  const token = req.params.token;

  const forgotPasswordToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  const user = await User.findOne({
    forgotPasswordToken,
    forgotPasswordExpiry: { $gt: Date.now() },
  });

  if (!user) {
    return next(new CustomError('Token is invalid'), 400);
  }

  if (req.body.password !== req.body.confirmPassword) {
    return next(new CustomError('password should be match'));
  }

  console.log(req.body.password);

  user.password = req.body.password;
  user.forgotPasswordExpiry = undefined;
  user.forgotPasswordToken = undefined;

  await user.save();

  // send a JSON response or send token

  cookieToken(user, res);
});

exports.getLoggedInUserDetails = BigPromise(async (req, res, next) => {
  const user = await User.findById(req.user._id);

  res.status(200).json({ success: true, user });
});

exports.changePassword = BigPromise(async (req, res, next) => {
  const userId = req.user._id;

  const user = await User.findById(userId).select('+password');

  const isCorrectOldPassword = await user.isPasswordValid(req.body.oldPassword);

  if (!isCorrectOldPassword) {
    return next(new CustomError('Incorrect Password', 400));
  }

  user.password = req.body.password;

  await user.save();

  cookieToken(user, res);
});

exports.updateUserDetails = BigPromise(async (req, res, next) => {
  const userId = req.user._id;

  const newData = {
    name: req.body.name,
    email: req.body.email,
  };

  if (req.files?.image) {
    const user = await User.findById(userId);
    const imageId = user.image.id;

    // deleting old image
    const response = await cloudinary.v2.uploader.destroy(imageId);

    // uploading new image
    const result = await cloudinary.v2.uploader.upload(
      req.files.image.tempFilePath,
      {
        folder: 'users',
        width: 150,
        crop: 'scale',
      }
    );

    newData.image = {
      id: result.public_id,
      secure_url: result.secure_url,
    };
  }

  const user = await User.findByIdAndUpdate(userId, newData, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });

  res.status(200).json({ success: true, user });
});

exports.adminAllUser = BigPromise(async (req, res, next) => {
  const users = await User.find();
  res.status(200).json({
    success: true,
    users,
  });
});

exports.adminOneUser = BigPromise(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    next(new CustomError('No user found', 400));
  }

  res.status(200).json({
    success: true,
    user,
  });
});

exports.adminUpdateUserDetails = BigPromise(async (req, res, next) => {
  const userId = req.params.id;

  const newData = {
    name: req.body.name,
    email: req.body.email,
    role: req.body.role,
  };

  const user = await User.findByIdAndUpdate(userId, newData, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });

  res.status(200).json({ success: true, user });
});

exports.adminDeleteOneUser = BigPromise(async (req, res, next) => {
  const userId = req.params.id;

  const user = await User.findById(userId);

  if (!user) {
    return next(new CustomError('User not found', 401));
  }

  const imageId = user.image.id;

  await cloudinary.v2.uploader.destroy(imageId);

  await user.remove();

  res.status(200).json({ success: true });
});

exports.managerAllUser = BigPromise(async (req, res, next) => {
  const users = await User.find({ role: 'user' });

  res.status(200).json({
    success: true,
    users,
  });
});
