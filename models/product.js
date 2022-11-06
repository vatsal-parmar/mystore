const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'please provide product name'],
    trim: true,
    maxlength: [120, 'product name should not be more then 120 characters'],
  },
  price: {
    type: Number,
    required: [true, 'please provide product price'],
    maxlength: [6, 'product price should not be more then 6 digits'],
  },
  description: {
    type: String,
    required: [true, 'please provide product description'],
  },
  photos: [
    {
      id: { type: String, required: true },
      secure_url: { type: String, required: true },
    },
  ],
  category: {
    type: String,
    required: [true, 'please select category'],
    enum: {
      values: ['shortsleeves', 'longsleeves', 'sweatshirts', 'hoodies'],
      message:
        'please select category from - short-sleeves, long-sleeves, sweat-shirts, hoodies',
    },
  },
  brand: {
    type: String,
    required: [true, 'please add a brand for clothing'],
  },
  ratings: {
    type: Number,
    default: 0,
  },
  numberOfReviews: {
    type: Number,
    default: 0,
  },
  reviews: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
      rating: {
        type: Number,
        required: true,
      },
      comment: {
        type: String,
        required: true,
      },
    },
  ],
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Product', productSchema);
