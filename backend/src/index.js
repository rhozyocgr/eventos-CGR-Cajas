import express from 'express';
import cors from 'cors';
import { sequelize, Supplier, Product, SalesDay, PaymentType } from './models/index.js';

import supplierRoutes from './routes/supplierRoutes.js';
import productRoutes from './routes/productRoutes.js';
import eventRoutes from './routes/eventRoutes.js';
import authRoutes from './routes/authRoutes.js';
import { authenticate } from './middleware/authMiddleware.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/products', productRoutes);
app.use('/api/events', eventRoutes);

// Basic test route
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
});

// Routes will be added here...
// For now, let's add a sync route or just sync on start
const startServer = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connected successfully.');

        // Sync models
        await sequelize.sync({ alter: true });
        console.log('Models synced.');

        // Seed basic data if empty
        const paymentTypesCount = await PaymentType.count();
        if (paymentTypesCount === 0) {
            await PaymentType.bulkCreate([
                { name: 'Efectivo' },
                { name: 'Tarjeta' },
                { name: 'Transferencia' }
            ]);
            console.log('Seed: Payment types created.');
        }

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Unable to start server:', error);
    }
};

startServer();
