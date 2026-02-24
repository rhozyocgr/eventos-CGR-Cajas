import express from 'express';
import cors from 'cors';
import { sequelize, Supplier, Product, SalesDay, PaymentType } from './models/index.js';

import supplierRoutes from './routes/supplierRoutes.js';
import productRoutes from './routes/productRoutes.js';
import eventRoutes from './routes/eventRoutes.js';
import saleRoutes from './routes/saleRoutes.js';
import authRoutes from './routes/authRoutes.js';
import { authenticate } from './middleware/authMiddleware.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use((req, res, next) => {
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
    next();
});

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/products', productRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/sales', saleRoutes);

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
                { name: 'SINPE' },
                { name: 'Pendiente' }
            ]);
            console.log('Seed: Payment types created.');
        } else {
            // Ensure Transferencia is updated to SINPE if it exists from previous seed
            await PaymentType.update({ name: 'SINPE' }, { where: { name: 'Transferencia' } });

            // Ensure Pendiente exists
            await PaymentType.findOrCreate({ where: { name: 'Pendiente' } });
        }

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Unable to start server:', error);
    }
};

startServer();
