import express from 'express';
import cors from 'cors';
import { sequelize, Supplier, Product, SalesDay, PaymentType } from './models/index.js';

import supplierRoutes from './routes/supplierRoutes.js';
import productRoutes from './routes/productRoutes.js';
import eventRoutes from './routes/eventRoutes.js';
import saleRoutes from './routes/saleRoutes.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
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
app.use('/api/users', userRoutes);

// Basic test route
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
});

// Routes will be added here...
// For now, let's add a sync route or just sync on start
const startServer = async () => {
    let connected = false;
    let attempts = 0;
    const maxAttempts = 10;

    while (!connected && attempts < maxAttempts) {
        try {
            attempts++;
            await sequelize.authenticate();
            connected = true;
            console.log('Database connected successfully.');
        } catch (error) {
            console.error(`Database connection attempt ${attempts} failed. Retrying in 5 seconds...`);
            if (attempts >= maxAttempts) {
                console.error('Max connection attempts reached. Exiting.');
                process.exit(1);
            }
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }

    try {
        // Sync models
        await sequelize.sync({ alter: false });
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
        console.error('Unable to finalize server startup:', error);
        process.exit(1);
    }
};

startServer();
