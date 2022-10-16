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
