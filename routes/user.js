const express = require('express');
const router = express.Router();

const {
  signup,
  login,
  logout,
  forgotPassword,
  resetPassword,
  getLoggedInUserDetails,
  changePassword,
  updateUserDetails,
  adminAllUser,
  adminOneUser,
  adminUpdateUserDetails,
  adminDeleteOneUser,
  managerAllUser,
} = require('../controllers/userController');
const { isLoggedIn, customRole } = require('../middlewares/user');

router.route('/signup').post(signup);
router.route('/login').post(login);
router.route('/logout').get(logout);
router.route('/forgotPassword').post(forgotPassword);
router.route('/password/reset/:token').post(resetPassword);
router.route('/userdashboard').get(isLoggedIn, getLoggedInUserDetails);
router.route('/password/update').post(isLoggedIn, changePassword);
router.route('/userdashboard/update').put(isLoggedIn, updateUserDetails);

// admin only routes
router.route('/admin/users').get(isLoggedIn, customRole('admin'), adminAllUser);
router
  .route('/admin/user/:id')
  .get(isLoggedIn, customRole('admin'), adminOneUser);
router
  .route('/admin/user/:id')
  .put(isLoggedIn, customRole('admin'), adminUpdateUserDetails);
router
  .route('/admin/user/:id')
  .delete(isLoggedIn, customRole('admin'), adminDeleteOneUser);

// manager only routs
router
  .route('/manager/users')
  .get(isLoggedIn, customRole('manager'), managerAllUser);

module.exports = router;
