import express from 'express';
import { createSale, getPaymentTypes, getPendingSales, updatePaymentType, getSalesSummary, createCashClosing, getCashClosings } from '../controllers/saleController.js';

const router = express.Router();

router.post('/', createSale);
router.get('/payment-types', getPaymentTypes);
router.get('/pending', getPendingSales);
router.get('/summary', getSalesSummary);
router.post('/closing', createCashClosing);
router.get('/closings', getCashClosings);
router.put('/:id/payment-type', updatePaymentType);

export default router;
