const { body, validationResult } = require('express-validator');

const { AppError } = require('../utils/appError.util');

const checkResult = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    // Array has errors
    const errorMsgs = errors.array().map((err) => err.msg);

    const message = errorMsgs.join('. ');

    return next(new AppError(message, 400));
  }

  next();
};

const createUserValidators = [
  body('username').notEmpty().withMessage('Name cannot be empty'),
  body('email').isEmail().withMessage('Must provide a valid email'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .isAlphanumeric()
    .withMessage('Password must contain letters and numbers'),
  checkResult,
];

const createProductValidators = [
  body('title').notEmpty().withMessage('Title cannot be empty'),
  body('description').notEmpty().withMessage('Description cannot be empty'),
  body('price').notEmpty().withMessage('Price cannot be empty'),
  body('categoryId').notEmpty().withMessage('CategoryId cannot be empty'),
  body('quantity').notEmpty().withMessage('Quantity cannot be empty'),
  checkResult,
];

module.exports = { createUserValidators, createProductValidators };
