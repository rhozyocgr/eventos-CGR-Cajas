import { Event, Product, SalesDay } from '../models/index.js';

const getDates = (startDate, endDate) => {
    const dates = [];
    let currentDate = new Date(startDate);
    const lastDate = new Date(endDate);
    while (currentDate <= lastDate) {
        dates.push(new Date(currentDate).toISOString().split('T')[0]);
        currentDate.setDate(currentDate.getDate() + 1);
    }
    return dates;
};

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

        // Initialize SalesDays for the event range
        const dates = getDates(eventData.startDate, eventData.endDate);
        for (const date of dates) {
            const [day] = await SalesDay.findOrCreate({ where: { date, EventId: newEvent.id } });
            // By default, assign all event products to all days
            if (productIds && productIds.length > 0) {
                await day.setProducts(productIds);
            }
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

        // Sync SalesDays if dates changed
        const dates = getDates(eventData.startDate, eventData.endDate);
        for (const date of dates) {
            await SalesDay.findOrCreate({ where: { date, EventId: id } });
        }

        const updatedEvent = await Event.findByPk(id, {
            include: [{ model: Product }]
        });
        res.json(updatedEvent);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

export const getEventDays = async (req, res) => {
    try {
        const { id } = req.params;
        const days = await SalesDay.findAll({
            where: { EventId: id },
            include: [{ model: Product }],
            order: [['date', 'ASC']]
        });
        res.json(days);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const updateDayProducts = async (req, res) => {
    try {
        const { dayId } = req.params;
        const { productIds } = req.body;
        const day = await SalesDay.findByPk(dayId);
        if (!day) return res.status(404).json({ error: 'Day not found' });

        await day.setProducts(productIds);
        const updatedDay = await SalesDay.findByPk(dayId, {
            include: [{ model: Product }]
        });
        res.json(updatedDay);
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
