const Product = require('../models/product');
const BigPromise = require('../middlewares/bigPromise');
const CustomError = require('../utils/customError');
const cloudinary = require('cloudinary');
const WhereClause = require('../utils/whereClause');

exports.addProduct = BigPromise(async (req, res, next) => {
  // images

  let imagesArray = [];

  if (!req.files) {
    return next(new CustomError('images are required', 401));
  }

  if (req.files) {
    for (let index = 0; index < req.files.photos.length; index++) {
      const result = await cloudinary.v2.uploader.upload(
        req.files.photos[index].tempFilePath,
        {
          folder: 'products',
        }
      );

      imagesArray.push({
        id: result.public_id,
        secure_url: result.secure_url,
      });
    }
  }

  req.body.photos = imagesArray;
  req.body.user = req.user._id;

  const product = await Product.create(req.body);

  res.status(200).json({
    success: true,
    product,
  });
});

exports.getAllProducts = BigPromise(async (req, res, next) => {
  const resultPerPage = 6;
  const totalProductsCount = await Product.countDocuments();

  const productsObj = new WhereClause(Product.find(), req.query)
    .search()
    .filter();

  let products = await productsObj.base;

  const filteredProductsCount = products.length;

  productsObj.pager(resultPerPage);

  products = await productsObj.base.clone();

  res.status(200).json({
    success: true,
    products,
    filteredProductsCount,
    totalProductsCount,
  });
});

exports.getSingleProduct = BigPromise(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(new CustomError('No Product Found', 401));
  }

  res.status(200).json({ success: true, product });
});

exports.adminGetAllProducts = BigPromise(async (req, res, next) => {
  const products = await Product.find({});

  res.status(200).json({ success: true, products });
});

exports.adminUpdateOneProduct = BigPromise(async (req, res, next) => {
  let product = await Product.findById(req.params.id);

  if (!product) {
    return next(new CustomError('No Product Found', 401));
  }

  let imagesArray = [];

  if (req.files) {
    // destroy the existing images
    for (let i = 0; i < product.photos.length; i++) {
      const res = await cloudinary.v2.uploader.destroy(product.photos[i].id);
    }

    // upload new images
    for (let index = 0; index < req.files.photos.length; index++) {
      const result = await cloudinary.v2.uploader.upload(
        req.files.photos[index].tempFilePath,
        {
          folder: 'products',
        }
      );

      imagesArray.push({
        id: result.public_id,
        secure_url: result.secure_url,
      });
    }
  }

  req.body.photos = imagesArray;
  product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });

  res.status(200).json({ success: true, product });
});

exports.adminDeleteOneProduct = BigPromise(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(new CustomError('No Product Found', 401));
  }

  // destroy the existing images
  for (let i = 0; i < product.photos.length; i++) {
    const res = await cloudinary.v2.uploader.destroy(product.photos[i].id);
  }

  await product.remove();

  res.status(200).json({ success: true, message: 'product is deleted' });
});
