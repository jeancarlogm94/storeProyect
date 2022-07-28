const express = require('express');

// Controllers
const {
  addProduct,
  updateCart,
  deleteProduct,
  purchase,
} = require('../controllers/carts.controller');

// Middlewares
const { protectSession } = require('../middlewares/auth.middleware');

const cartsRouter = express.Router();

cartsRouter.use(protectSession);

cartsRouter.post('/add-product', addProduct);

cartsRouter.patch('/update-cart', updateCart);

cartsRouter.delete('/:productId', deleteProduct);
cartsRouter.post('/purchases', purchase);

module.exports = { cartsRouter };
