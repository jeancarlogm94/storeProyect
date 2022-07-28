const { Product } = require('../models/product.model');
const { ProductImg } = require('../models/productImg.model');

//Utils
const { AppError } = require('../utils/appError.util');
const { catchAsync } = require('../utils/catchAsync.util');

const productExist = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const product = await Product.findOne({
    where: { id },
    include: [{ model: ProductImg, required: false }],
  });

  if (!product) {
    return next(new AppError('Product not found', 400));
  }

  req.product = product;

  next();
});

module.exports = { productExist };
