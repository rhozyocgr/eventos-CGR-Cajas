import express from 'express';
import { getProducts, createProduct, updateProduct, deleteProduct, bulkCreateProducts } from '../controllers/productController.js';

const router = express.Router();

router.get('/', getProducts);
router.post('/', createProduct);
router.post('/bulk', bulkCreateProducts);
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);

export default router;
