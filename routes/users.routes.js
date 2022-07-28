const express = require('express');

// Controllers
const {
  getUserProducts,
  getUserPurchases,
  getOrderById,
  createUser,
  updateUser,
  deleteUser,
  login,
} = require('../controllers/users.controller');

// Middlewares
const {
  createUserValidators,
} = require('../middlewares/validators.middleware');
const { userExists } = require('../middlewares/users.middleware');
const {
  protectSession,
  protectUserAccount,
} = require('../middlewares/auth.middleware');

const usersRouter = express.Router();

usersRouter.post('/', createUserValidators, createUser);

usersRouter.post('/login', login);

usersRouter.use(protectSession);

usersRouter.get('/me', getUserProducts);
usersRouter.get('/orders', getUserPurchases);
usersRouter.get('/orders/:id', getOrderById);

usersRouter
  .use('/:id', userExists)
  .route('/:id')
  .patch(protectUserAccount, updateUser)
  .delete(protectUserAccount, deleteUser);

module.exports = { usersRouter };
