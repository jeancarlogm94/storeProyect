const express = require('express');

const productsRouter = express.Router();

//Middleware
const {
  protectSession,
  protectProduct,
} = require('../middlewares/auth.middleware');
const { productExist } = require('../middlewares/productExist.middleware');

//Controllers
const {
  newProduct,
  allProducts,
  productById,
  updateProduct,
  deleteProduct,
  productsCategories,
  newCategorie,
  updateCategorie,
} = require('../controllers/products.controller');

//utils
const {
  createProductValidators,
} = require('../middlewares/validators.middleware');
const { upload } = require('../utils/upload.util');

productsRouter.get('/', allProducts);
productsRouter.get('/categories', productsCategories);
productsRouter.get('/:id', productExist, productById);

//protected end points
productsRouter.use(protectSession);

productsRouter.post(
  '/',
  upload.array('imgFile', 5),
  createProductValidators,
  newProduct
);
productsRouter.patch('/:id', productExist, protectProduct, updateProduct);
productsRouter.delete('/:id', productExist, protectProduct, deleteProduct);
productsRouter.post('/categories', newCategorie);
productsRouter.patch('/categories/:id', updateCategorie);

module.exports = { productsRouter };
