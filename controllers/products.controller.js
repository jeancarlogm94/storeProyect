const { ref, uploadBytes, getDownloadURL } = require('firebase/storage');

//Models
const { Product } = require('../models/product.model');
const { ProductImg } = require('../models/productImg.model');
const { Categorie } = require('../models/categorie.model');

//Utils
const { AppError } = require('../utils/appError.util');
const { catchAsync } = require('../utils/catchAsync.util');
const { storage } = require('../utils/firebase.util');

const newProduct = catchAsync(async (req, res, next) => {
  const { sessionUser } = req;
  const { title, description, price, categoryId, quantity } = req.body;

  const categoryExist = await Categorie.findOne({ where: { id: categoryId } });

  if (!categoryExist) {
    return next(new AppError('Categorie not exist', 400));
  }

  const data = await Product.create({
    title,
    description,
    price,
    categoryId,
    quantity,
    userId: sessionUser.id,
  });

  if (req.files.length > 0) {
    const filesPromises = req.files.map(async (file) => {
      const imgRef = ref(storage, `${Date.now()}_${file.originalname}`);
      const imgRes = await uploadBytes(imgRef, file.buffer);

      return await ProductImg.create({
        imgUrl: imgRes.metadata.fullPath,
        productId: data.id,
      });
    });

    await Promise.all(filesPromises);
  }

  res.status(201).json({
    status: 'success',
    data,
  });
});

const allProducts = catchAsync(async (req, res, next) => {
  const data = await Product.findAll({
    where: { status: 'active' },
    include: [{ model: Categorie, required: false }],
  });

  res.status(200).json({
    status: 'success',
    data,
  });
});

const productById = catchAsync(async (req, res, next) => {
  const { product } = req;

  const productImgsPromises = product.productImgs.map(async (ProductImg) => {
    console.log(ProductImg.imgUrl);
    const imgRef = ref(storage, ProductImg.imgUrl);
    const imgFullPath = await getDownloadURL(imgRef);
    ProductImg.imgUrl = imgFullPath;
  });

  await Promise.all(productImgsPromises);

  res.status(200).json({
    status: 'success',
    product,
  });
});

const updateProduct = catchAsync(async (req, res, next) => {
  const { product } = req;
  const { title, description, price, quantity } = req.body;

  await product.update({
    title,
    description,
    price,
    quantity,
  });

  res.status(204).json({});
});

const deleteProduct = catchAsync(async (req, res, next) => {
  const { product } = req;

  await product.update({
    status: 'deleted',
  });

  res.status(204).json({});
});

const productsCategories = catchAsync(async (req, res, next) => {
  const allCategories = await Categorie.findAll({});

  res.status(200).json({
    status: 'success',
    allCategories,
  });
});

const newCategorie = catchAsync(async (req, res, next) => {
  const { name } = req.body;

  const data = await Categorie.create({
    name,
  });

  res.status(201).json({
    status: 'success',
    data,
  });
});

const updateCategorie = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { name } = req.body;

  const categorie = await Categorie.findOne({ where: { id } });

  if (!categorie) {
    return next(new AppError('Categorie not found', 400));
  }

  await categorie.update({
    name,
  });

  res.status(204).json({
    status: 'success',
    categorie,
  });
});

module.exports = {
  newProduct,
  allProducts,
  productById,
  updateProduct,
  deleteProduct,
  productsCategories,
  newCategorie,
  updateCategorie,
};
