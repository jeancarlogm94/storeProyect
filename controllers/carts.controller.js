//models
const { Cart } = require('../models/cart.model');
const { ProductInCart } = require('../models/productInCart.model');
const { Product } = require('../models/product.model');
const { Order } = require('../models/order.model');
const { Email } = require('../utils/email.util');
const { User } = require('../models/user.model');

// Utils
const { catchAsync } = require('../utils/catchAsync.util');
const { AppError } = require('../utils/appError.util');

//Functions
const addProduct = catchAsync(async (req, res, next) => {
  const { sessionUser } = req;
  const { productId, quantity } = req.body;

  const product = await Product.findOne({
    where: { id: productId, status: 'active' },
  });

  if (!product) {
    return next(new AppError('Invalid product', 404));
  } else if (quantity > product.quantity) {
    return next(
      new AppError(`This product only has ${product.quantity} items on stock`)
    );
  }

  const cart = await Cart.findOne({
    where: { userId: sessionUser.id, status: 'active' },
  });

  if (!cart) {
    const newCart = await Cart.create({
      userId: sessionUser.id,
    });

    await ProductInCart.create({
      cartId: newCart.id,
      productId,
      quantity,
    });
    return res.status(200).json({
      status: 'success',
    });
  }

  if (cart) {
    const productExist = await ProductInCart.findOne({
      where: { cartId: cart.id, productId },
    });

    if (!productExist) {
      await ProductInCart.create({
        cartId: cart.id,
        productId,
        quantity,
      });

      return res.status(200).json({
        status: 'success',
      });
    }

    if (productExist.status === 'removed') {
      await productExist.update({
        status: 'active',
        quantity,
      });

      return res.status(200).json({
        status: 'success',
        messsage: 'Product added',
      });
    }

    if (productExist.status === 'active') {
      return next(new AppError('This product already exist', 400));
    }
  }
});

const updateCart = catchAsync(async (req, res, next) => {
  const { sessionUser } = req;
  const { productId, quantity } = req.body;

  const productQty = await Product.findOne({
    where: { id: productId },
  });
  if (productQty.quantity < quantity) {
    return next(new AppError('this product is out of stock', 400));
  }

  const findCart = await Cart.findOne({
    where: { userId: sessionUser.id, status: 'active' },
  });

  if (!findCart) {
    return next(new AppError('This user dont have a active cart', 400));
  }

  const findProductInCart = await ProductInCart.findOne({
    where: { productId, cartId: findCart.id, status: 'active' }, //cambio aqui
  });

  if (!findProductInCart) {
    return next(new AppError('This user dont have this product on cart', 400));
  }

  if (quantity <= 0) {
    //cambio aqui
    await findProductInCart.update({
      quantity: 0,
      status: 'removed',
    });
  }

  if (quantity > 0) {
    await findProductInCart.update({
      quantity,
      status: 'active',
    });
  }

  res.status(201).json({
    status: 'success',
    message: 'product edited',
    findProductInCart,
  });
});
const deleteProduct = catchAsync(async (req, res, next) => {
  const { productId } = req.params;
  const { sessionUser } = req;

  const findCart = await Cart.findOne({
    where: { userId: sessionUser.id, status: 'active' },
  });

  if (!findCart) {
    return next(new AppError('Not active cart found', 400));
  }
  const findProductInCart = await ProductInCart.findOne({
    where: { productId, status: 'active', cartId: findCart.id },
  });

  if (!findProductInCart) {
    return next(new AppError('Not product found in cart', 400));
  }

  await findProductInCart.update({
    quantity: 0,
    status: 'removed',
  });

  res.status(201).json({
    status: 'success',
    message: 'Product deleted',
  });
});
const purchase = catchAsync(async (req, res, next) => {
  const { sessionUser } = req;
  const findCart = await Cart.findAll({
    where: { userId: sessionUser.id, status: 'active' },
    attributes: ['id', 'userId', 'status'],
    include: [
      {
        model: ProductInCart,
        where: { status: 'active' },
        attributes: ['id', 'cartId', 'productId', 'quantity', 'status'],
        required: false,
        include: [
          {
            model: Product,
            required: false,
            where: { status: 'active' },
            attributes: [
              'title',
              'description',
              'price',
              'categoryId',
              'quantity',
            ],
          },
        ],
      },
    ],
  });
  if (!findCart) {
    return next(new AppError('Not active cart found', 400));
  }

  let totalQuantity = 0;
  let caclPrice = 0;
  let finalPrice = 0;

  for (let index = 0; index < findCart[0].productInCarts.length; index++) {
    totalQuantity += +findCart[0].productInCarts[index].quantity;
    caclPrice += +findCart[0].productInCarts[index].product.price;
    finalPrice +=
      +findCart[0].productInCarts[index].quantity *
      +findCart[0].productInCarts[index].product.price;
  }

  const updateQtyOnProduct = findCart[0].productInCarts.map(async (product) => {
    const findProduct = await Product.findOne({
      where: { id: product.dataValues.productId, status: 'active' },
    });
    const resta = findProduct.quantity - product.dataValues.quantity;
    await findProduct.update({
      quantity: resta,
    });

    return await product.update({ status: 'purchased' });
  });
  await findCart[0].update({
    status: 'purchased',
  });

  await Promise.all(updateQtyOnProduct);

  const order = await Order.create({
    userId: sessionUser.id,
    cartId: findCart[0].id,
    totalPrice: finalPrice,
    status: 'purchased',
  });

  const infoUser = await User.findOne({ where: { id: sessionUser.id } });

  await new Email(sessionUser.email).sendInvoice(
    finalPrice,
    findCart[0],
    order,
    infoUser
  );

  res.status(200).json({
    status: 'success',
    message: 'Purchased',
    findCart,
    order,
  });
});

module.exports = {
  addProduct,
  updateCart,
  deleteProduct,
  purchase,
};
