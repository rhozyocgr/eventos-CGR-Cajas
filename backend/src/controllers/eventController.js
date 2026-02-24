import { Event, Product } from '../models/index.js';

export const getEvents = async (req, res) => {
    try {
        const events = await Event.findAll({
            include: [{ model: Product }]
        });
        res.json(events);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const createEvent = async (req, res) => {
    try {
        const { productIds, ...eventData } = req.body;
        const newEvent = await Event.create(eventData);
        if (productIds && productIds.length > 0) {
            await newEvent.setProducts(productIds);
        }
        const eventWithProducts = await Event.findByPk(newEvent.id, {
            include: [{ model: Product }]
        });
        res.status(201).json(eventWithProducts);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

export const updateEvent = async (req, res) => {
    try {
        const { id } = req.params;
        const { productIds, ...eventData } = req.body;
        await Event.update(eventData, { where: { id } });
        const event = await Event.findByPk(id);
        if (productIds) {
            await event.setProducts(productIds);
        }
        const updatedEvent = await Event.findByPk(id, {
            include: [{ model: Product }]
        });
        res.json(updatedEvent);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

export const deleteEvent = async (req, res) => {
    try {
        const { id } = req.params;
        await Event.destroy({ where: { id } });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
