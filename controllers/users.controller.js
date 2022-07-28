const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

// Models
const { User } = require('../models/user.model');
const { Product } = require('../models/product.model');
const { Cart } = require('../models/cart.model');
const { Order } = require('../models/order.model');
const { ProductInCart } = require('../models/productInCart.model');

// Utils
const { catchAsync } = require('../utils/catchAsync.util');
const { AppError } = require('../utils/appError.util');
const { Email } = require('../utils/email.util');

// Gen secrets for JWT, require('crypto').randomBytes(64).toString('hex')

dotenv.config({ path: './config.env' });

const getUserProducts = catchAsync(async (req, res, next) => {
  const { sessionUser } = req;
  const userProduct = await Product.findAll({
    where: { userId: sessionUser.id },
  });

  if (!userProduct) {
    return next(new AppError('No products to show', 400));
  }

  res.status(200).json({
    status: 'success',
    userProduct,
  });
});

const getUserPurchases = catchAsync(async (req, res, next) => {
  const { sessionUser } = req;
  const userOrders = await Order.findAll({
    include: [
      {
        model: Cart,
        required: false,
        include: {
          model: ProductInCart,
          required: false,
          include: { model: Cart, required: false },
        },
      },
    ],
    where: { userId: sessionUser.id },
  });

  if (!userOrders) {
    return next(new AppError('No orders to show', 400));
  }

  res.status(200).json({
    status: 'success',
    userOrders,
  });
});

const getOrderById = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const userOrders = await Order.findOne({
    include: [],
    where: { id },
  });

  if (!userOrders) {
    return next(new AppError('No orders to show', 400));
  }

  res.status(200).json({
    status: 'success',
    userOrders,
  });
});

const createUser = catchAsync(async (req, res, next) => {
  const { username, email, password } = req.body;

  // Hash password
  const salt = await bcrypt.genSalt(12);
  const hashPassword = await bcrypt.hash(password, salt);

  const newUser = await User.create({
    username,
    email,
    password: hashPassword,
  });

  // Remove password from response
  newUser.password = undefined;

  // Send welcome email
  await new Email(email).sendWelcome(username);

  res.status(201).json({
    status: 'success',
    newUser,
  });
});

const updateUser = catchAsync(async (req, res, next) => {
  const { user } = req;
  const { username } = req.body;

  await user.update({ username });

  res.status(204).json({ status: 'success' });
});

const deleteUser = catchAsync(async (req, res, next) => {
  const { user } = req;

  // await user.destroy();
  await user.update({ status: 'deleted' });

  res.status(204).json({ status: 'success' });
});

const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // Validate credentials (email)
  const user = await User.findOne({
    where: {
      email,
      status: 'active',
    },
  });

  if (!user) {
    return next(new AppError('Credentials invalid', 400));
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    return next(new AppError('Credentials invalid', 400));
  }

  const token = await jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
    expiresIn: '1d',
  });

  // Send response
  res.status(200).json({
    status: 'success',
    token,
  });
});

module.exports = {
  getUserProducts,
  getUserPurchases,
  getOrderById,
  createUser,
  updateUser,
  deleteUser,
  login,
};
