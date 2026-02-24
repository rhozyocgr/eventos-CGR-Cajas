import express from 'express';
import { getProducts, createProduct, updateProduct, deleteProduct, bulkCreateProducts, deleteAllProducts } from '../controllers/productController.js';

const router = express.Router();

router.get('/', getProducts);
router.post('/', createProduct);
router.post('/bulk', bulkCreateProducts);
router.put('/:id', updateProduct);
router.delete('/all', deleteAllProducts);
router.delete('/:id', deleteProduct);

export default router;
