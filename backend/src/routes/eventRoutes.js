import express from 'express';
import { getEvents, createEvent, updateEvent, deleteEvent, getEventDays, updateDayProducts } from '../controllers/eventController.js';

const router = express.Router();

router.get('/', getEvents);
router.post('/', createEvent);
router.put('/:id', updateEvent);
router.delete('/:id', deleteEvent);

router.get('/:id/days', getEventDays);
router.put('/days/:dayId/products', updateDayProducts);

export default router;
