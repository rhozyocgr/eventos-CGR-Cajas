import express from 'express';
import { getSuppliers, createSupplier } from '../controllers/supplierController.js';

const router = express.Router();

router.get('/', getSuppliers);
router.post('/', createSupplier);

export default router;
