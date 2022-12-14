const BigPromise = require('../middlewares/bigPromise');
const stripe = require('stripe')(process.env.STRIPE_SECRET);
const Razorpay = require('razorpay');

exports.sendStripeKey = BigPromise(async (req, res, next) => {
  res.status(200).json({ stripeKey: process.env.STRIPE_API_KEY });
});

exports.captureStripePayment = BigPromise(async (req, res, next) => {
  // Create a PaymentIntent with the order amount and currency
  const paymentIntent = await stripe.paymentIntents.create({
    amount: req.body.amount,
    currency: 'inr',
    // optional
    metadata: {
      integration_check: 'accept_a_payment',
    },
  });

  res
    .status(200)
    .json({ success: true, client_secret: paymentIntent.client_secret });
});

exports.sendRazorpayKey = BigPromise(async (req, res, next) => {
  res.status(200).json({ razorpayKey: process.env.RAZORPAY_API_KEY });
});

exports.captureRazorpayPayment = BigPromise(async (req, res, next) => {
  var instance = new Razorpay({
    key_id: process.env.RAZORPAY_API_KEY,
    key_secret: process.env.RAZORPAY_SECRET,
  });

  const myOrder = await instance.orders.create({
    amount: req.body.amount,
    currency: 'INR',
    receipt: Date.now(), // use uuid instead
  });

  res.status(200).json({ success: true, order: myOrder });
});
