import express from 'express';
import { createSale, getPaymentTypes, getPendingSales, updatePaymentType, getSalesSummary, createCashClosing, createFinalCashClosing, getCashClosings, deleteTransaction, openCash, getActiveOpening, closeCash } from '../controllers/saleController.js';

const router = express.Router();

router.post('/', createSale);
router.get('/payment-types', getPaymentTypes);
router.get('/pending', getPendingSales);
router.get('/summary', getSalesSummary);
router.post('/closing', createCashClosing);
router.post('/final-closing', createFinalCashClosing);
router.get('/closings', getCashClosings);
router.put('/:id/payment-type', updatePaymentType);
router.delete('/:id', deleteTransaction);
router.post('/open-cash', openCash);
router.get('/active-opening', getActiveOpening);
router.put('/close-cash/:id', closeCash);

export default router;
