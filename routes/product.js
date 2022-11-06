const express = require('express');
const router = express.Router();
const {
  addProduct,
  getAllProducts,
  adminGetAllProducts,
  getSingleProduct,
  adminUpdateOneProduct,
  adminDeleteOneProduct,
} = require('../controllers/productController');
const { isLoggedIn, customRole } = require('../middlewares/user');

// user routes
router.route('/products').get(getAllProducts);
router.route('/products/:id').get(getSingleProduct);

// admin routes
router
  .route('/admin/product/add')
  .post(isLoggedIn, customRole('admin'), addProduct);

router
  .route('/admin/products')
  .get(isLoggedIn, customRole('admin'), adminGetAllProducts);

router
  .route('/admin/product/:id')
  .put(isLoggedIn, customRole('admin'), adminUpdateOneProduct)
  .delete(isLoggedIn, customRole('admin'), adminDeleteOneProduct);

module.exports = router;
