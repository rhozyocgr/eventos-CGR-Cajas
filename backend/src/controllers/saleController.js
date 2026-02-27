import { Op } from 'sequelize';
import { Sale, Transaction, SalesDay, Product, PaymentType, CashClosing, Supplier, User, Event, CashOpening, TransactionRequest, sequelize } from '../models/index.js';

export const createSale = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { salesDayId, items, paymentTypeId, observation, userId } = req.body;

        // Validar apertura activa
        const activeOpening = await CashOpening.findOne({
            where: { SalesDayId: salesDayId, UserId: userId, status: 'active' }
        });

        if (!activeOpening) {
            await t.rollback();
            return res.status(403).json({ error: 'No tienes una apertura de caja autorizada para procesar ventas.' });
        }

        if (!items || items.length === 0) {
            throw new Error('No items in sale');
        }

        let transactionTotal = 0;
        const processedItems = [];

        for (const item of items) {
            const product = await Product.findByPk(item.productId);
            if (!product) throw new Error(`Product ${item.productId} not found`);

            const lineTotal = item.quantity * product.price;
            transactionTotal += lineTotal;
            processedItems.push({
                ProductId: item.productId,
                quantity: item.quantity,
                total: lineTotal
            });
        }

        const transaction = await Transaction.create({
            total: transactionTotal,
            observation: observation,
            SalesDayId: salesDayId,
            PaymentTypeId: paymentTypeId,
            UserId: userId || null
        }, { transaction: t });

        for (const item of processedItems) {
            await Sale.create({
                ...item,
                TransactionId: transaction.id
            }, { transaction: t });
        }

        await t.commit();
        res.status(201).json({ message: 'Transaction completed successfully', transaction });
    } catch (error) {
        await t.rollback();
        res.status(400).json({ error: error.message });
    }
};

export const openCash = async (req, res) => {
    try {
        const { salesDayId, userId } = req.body;

        let initialStatus = 'pending';
        let authorizedById = null;

        const user = await User.findByPk(userId);
        if (user && user.role === 'admin') {
            initialStatus = 'authorized'; // Admin is self-authorized
            authorizedById = user.id;
        }

        const opening = await CashOpening.create({
            SalesDayId: salesDayId,
            UserId: userId,
            initialCash: 0,
            status: initialStatus,
            authorizedById: authorizedById
        });
        res.status(201).json(opening);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

export const getActiveOpening = async (req, res) => {
    try {
        const { salesDayId, userId } = req.query;
        const opening = await CashOpening.findOne({
            where: {
                SalesDayId: salesDayId,
                UserId: userId
            },
            order: [['id', 'DESC']]
        });
        res.json(opening);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getPendingOpenings = async (req, res) => {
    try {
        const openings = await CashOpening.findAll({
            where: { status: 'pending' },
            include: [
                { model: User, attributes: ['name', 'email'] },
                { model: SalesDay, attributes: ['date', 'description'] }
            ],
            order: [['openingTime', 'DESC']]
        });
        res.json(openings);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const authorizeOpening = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, adminId } = req.body; // status: 'authorized' o 'denied'

        const opening = await CashOpening.findByPk(id);
        if (!opening) throw new Error('Solicitud de apertura no encontrada');

        opening.status = status;
        opening.authorizedById = adminId;
        await opening.save();

        res.json({ message: `Apertura ${status === 'authorized' ? 'autorizada' : 'denegada'} con éxito`, opening });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

export const confirmOpening = async (req, res) => {
    try {
        const { id } = req.params;
        const { initialCash } = req.body;

        const opening = await CashOpening.findByPk(id);
        console.log(`Intentando confirmar apertura ID: ${id}. Actual:`, opening?.get({ plain: true }));

        if (!opening) throw new Error('Apertura no encontrada en la base de datos');
        if (opening.status !== 'authorized') {
            throw new Error(`La caja no se puede confirmar porque su estado es '${opening.status}' (se requiere 'authorized')`);
        }

        opening.initialCash = initialCash || 0;
        opening.status = 'active';
        opening.openingTime = new Date(); // Update opening time to when they actually start
        await opening.save();

        res.json({ message: 'Caja abierta correctamente', opening });
    } catch (error) {
        console.error('ERROR EN confirmOpening:', error.message);
        res.status(400).json({ error: error.message });
    }
};

export const getDashboardStats = async (req, res) => {
    try {
        // Usamos un rango que incluya las últimas 24 horas para evitar problemas de zona horaria
        // o mejor, el día actual en la zona de la base de datos
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        // Si estamos muy temprano en UTC (noche en CR), retrocedemos un poco
        // para capturar las ventas de la noche anterior si es necesario, 
        // pero lo ideal es buscar por el día calendario local.
        // Como parche rápido para el dashboard "Hoy":
        const todayStr = new Date().toISOString().split('T')[0];

        // Ventas de hoy (calendario)
        const todaySales = await Transaction.findAll({
            where: {
                [Op.or]: [
                    { timestamp: { [Op.gte]: startOfToday } },
                    { SalesDayId: { [Op.in]: sequelize.literal(`(SELECT id FROM SalesDays WHERE date = '${todayStr}')`) } }
                ]
            },
            attributes: [
                [sequelize.fn('SUM', sequelize.col('total')), 'total'],
                [sequelize.fn('COUNT', sequelize.col('id')), 'count']
            ]
        });

        const totalToday = parseFloat(todaySales[0]?.dataValues?.total || 0);
        const countToday = todaySales[0]?.dataValues?.count || 0;

        // Distribución por método de pago hoy
        const todayCondition = {
            [Op.or]: [
                { timestamp: { [Op.gte]: startOfToday } },
                { SalesDayId: { [Op.in]: sequelize.literal(`(SELECT id FROM SalesDays WHERE date = '${todayStr}')`) } }
            ]
        };

        const paymentStatsRaw = await Transaction.findAll({
            where: todayCondition,
            include: [{ model: PaymentType, attributes: ['name'] }],
            attributes: [
                'PaymentTypeId',
                [sequelize.fn('SUM', sequelize.col('total')), 'totalValue']
            ],
            group: ['PaymentTypeId', 'PaymentType.id']
        });

        const paymentStats = paymentStatsRaw.map(ps => ({
            name: ps.PaymentType?.name || 'Otro',
            value: parseFloat(ps.dataValues.totalValue || 0)
        }));

        // Top 10 productos más vendidos (de todos los tiempos para el dashboard)
        const topProductsRaw = await Sale.findAll({
            attributes: [
                'ProductId',
                [sequelize.fn('SUM', sequelize.col('quantity')), 'totalQuantity']
            ],
            include: [{ model: Product, attributes: ['name'], required: true }],
            group: ['ProductId', 'Product.id'],
            order: [[sequelize.literal('totalQuantity'), 'DESC']],
            limit: 10
        });

        const topProducts = topProductsRaw.map(tp => ({
            name: tp.Product?.name || 'Desconocido',
            total: parseInt(tp.dataValues.totalQuantity || 0)
        }));

        const productCount = await Product.count();
        const supplierCount = await Supplier.count();

        res.json({
            summary: {
                totalToday,
                countToday,
                productCount,
                supplierCount
            },
            paymentStats,
            topProducts
        });
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ error: error.message });
    }
};

export const closeCash = async (req, res) => {
    try {
        const { id } = req.params; // ID de la apertura (CashOpening)
        const { userId } = req.body;

        const opening = await CashOpening.findByPk(id);
        if (!opening) throw new Error('Apertura no encontrada');

        opening.status = 'closed';
        opening.closingTime = new Date();
        opening.closedById = userId || null;
        await opening.save();

        // Si se envió un resumen, creamos el reporte de cierre automáticamente
        const { summary } = req.body;
        if (summary) {
            await CashClosing.create({
                SalesDayId: opening.SalesDayId,
                UserId: opening.UserId,
                totalEfectivo: summary.totalEfectivo || 0,
                totalTarjeta: summary.totalTarjeta || 0,
                totalSinpe: summary.totalSinpe || 0,
                totalGeneral: summary.totalGeneral || 0,
                totalComisiones: summary.totalComisiones || 0,
                openingTime: opening.openingTime,
                details: { ...summary, cashOpeningId: opening.id }
            });
        }

        res.json({ message: 'Caja cerrada correctamente' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

export const getPendingSales = async (req, res) => {
    try {
        const { salesDayId, userId } = req.query;
        const pendingType = await PaymentType.findOne({ where: { name: 'Pendiente' } });

        if (!pendingType) return res.json([]);

        const whereClause = {
            SalesDayId: salesDayId,
            PaymentTypeId: pendingType.id
        };

        if (userId) {
            whereClause.UserId = userId;
        }

        const transactions = await Transaction.findAll({
            where: whereClause,
            include: [
                {
                    model: Sale,
                    include: [Product]
                }
            ],
            order: [['timestamp', 'DESC']]
        });
        res.json(transactions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const updatePaymentType = async (req, res) => {
    try {
        const { id } = req.params;
        const { paymentTypeId } = req.body;

        const transaction = await Transaction.findByPk(id);
        if (!transaction) throw new Error('Transaction not found');

        transaction.PaymentTypeId = paymentTypeId;
        await transaction.save();

        res.json({ message: 'Payment updated successfully', transaction });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

export const getSalesSummary = async (req, res) => {
    try {
        const { salesDayId, userId, since } = req.query;
        console.log(`FETCH SUMMARY - Day: ${salesDayId}, User: ${userId}, Since: ${since}`);

        if (!salesDayId) throw new Error('salesDayId is required');

        // Find the last cash closing for this day
        const lastClosing = await CashClosing.findOne({
            where: { SalesDayId: salesDayId },
            order: [['timestamp', 'DESC']]
        });

        const transactionWhere = { SalesDayId: salesDayId };
        if (userId) transactionWhere.UserId = userId;

        // Determine the start time for the summary
        const startTime = since ? new Date(since) : (lastClosing ? lastClosing.timestamp : null);

        if (startTime) {
            transactionWhere.timestamp = { [Op.gte]: startTime };
        }

        const transactions = await Transaction.findAll({
            where: transactionWhere,
            include: [
                {
                    model: Sale,
                    include: [
                        {
                            model: Product,
                            include: [Supplier]
                        }
                    ]
                },
                { model: PaymentType }
            ]
        });

        const summary = {
            totalGeneral: 0,
            totalEfectivo: 0,
            totalTarjeta: 0,
            totalSinpe: 0,
            totalPendiente: 0,
            totalComisiones: 0,
            totalGananciaGrupos: 0,
            bySupplier: {}
        };

        transactions.forEach(tx => {
            const amount = parseFloat(tx.total);
            const pType = tx.PaymentType?.name?.toLowerCase() || 'desconocido';
            const isPending = pType.includes('pendiente');

            if (!isPending) {
                summary.totalGeneral += amount;
                if (pType.includes('efectivo')) summary.totalEfectivo += amount;
                else if (pType.includes('tarjeta')) summary.totalTarjeta += amount;
                else if (pType.includes('sinpe')) summary.totalSinpe += amount;
            } else {
                summary.totalPendiente += amount;
            }

            if (tx.Sales) {
                tx.Sales.forEach(sale => {
                    const product = sale.Product;
                    if (!product) return;

                    const supplier = product.Supplier;
                    const supplierId = supplier?.id || 'sin-proveedor';
                    const supplierName = supplier?.name || 'Varios / Sin Proveedor';

                    if (!summary.bySupplier[supplierId]) {
                        summary.bySupplier[supplierId] = {
                            name: supplierName,
                            type: supplier?.type || 'General',
                            total: 0,
                            cashTotal: 0,
                            cardTotal: 0,
                            sinpeTotal: 0,
                            pendingTotal: 0,
                            cardCommission: 0,
                            groupProfit: 0,
                            products: {}
                        };
                    }

                    const sData = summary.bySupplier[supplierId];
                    const saleTotal = parseFloat(sale.total);

                    if (!isPending) {
                        sData.total += saleTotal;

                        let bankComm = 0;
                        if (pType.includes('tarjeta')) {
                            const bankCommRate = parseFloat(supplier?.dataphoneCommission || 0);
                            bankComm = saleTotal * (bankCommRate / 100);
                            sData.cardTotal += saleTotal;
                            sData.cardCommission += bankComm;
                            summary.totalComisiones += bankComm;
                        } else if (pType.includes('efectivo')) {
                            sData.cashTotal += saleTotal;
                        } else if (pType.includes('sinpe')) {
                            sData.sinpeTotal += saleTotal;
                        }

                        // Liquidación y ganancia
                        const netAfterBank = saleTotal - bankComm;
                        const supplierCommRate = parseFloat(supplier?.commission || 0);
                        const supplierPayment = netAfterBank * (supplierCommRate / 100);
                        const profit = netAfterBank - supplierPayment;

                        sData.groupProfit += profit;
                        summary.totalGananciaGrupos += profit;

                        // Solo sumar productos si NO es pendiente
                        if (!sData.products[product.id]) {
                            sData.products[product.id] = {
                                name: product.name,
                                quantity: 0,
                                total: 0
                            };
                        }
                        sData.products[product.id].quantity += sale.quantity;
                        sData.products[product.id].total += saleTotal;
                    } else {
                        sData.pendingTotal += saleTotal;
                    }
                });
            }
        });

        res.json(summary);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getCashClosings = async (req, res) => {
    try {
        const { salesDayId, userId } = req.query;
        const where = {};
        if (salesDayId) where.SalesDayId = salesDayId;
        if (userId) where.UserId = userId;

        const closings = await CashClosing.findAll({
            where,
            include: [
                { model: User, attributes: ['id', 'name', 'email'] },
                {
                    model: SalesDay,
                    include: [{ model: Event, attributes: ['id', 'name'] }]
                }
            ],
            order: [['timestamp', 'DESC']]
        });
        res.json(closings);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const createCashClosing = async (req, res) => {
    try {
        const { salesDayId, userId, summary } = req.body;

        if (!salesDayId || !summary) {
            return res.status(400).json({ error: 'salesDayId and summary are required' });
        }

        const closing = await CashClosing.create({
            SalesDayId: salesDayId,
            UserId: userId || null,
            totalEfectivo: summary.totalEfectivo || 0,
            totalTarjeta: summary.totalTarjeta || 0,
            totalSinpe: summary.totalSinpe || 0,
            totalGeneral: summary.totalGeneral || 0,
            totalComisiones: summary.totalComisiones || 0,
            openingTime: summary.openingTime || null,
            details: summary
        });

        res.status(201).json(closing);
    } catch (error) {
        console.error('ERROR IN createCashClosing:', error);
        res.status(400).json({ error: error.message });
    }
};

export const createFinalCashClosing = async (req, res) => {
    try {
        const { salesDayId, userId } = req.body;

        if (!salesDayId) {
            return res.status(400).json({ error: 'salesDayId is required' });
        }

        // Obtener todos los cortes previos que no sean finales
        const partialClosings = await CashClosing.findAll({
            where: {
                SalesDayId: salesDayId,
                isFinal: false
            }
        });

        if (partialClosings.length === 0) {
            return res.status(400).json({ error: 'No hay cortes parciales para realizar el corte definitivo' });
        }

        // Sumarizar totales
        const finalSummary = {
            totalEfectivo: 0,
            totalTarjeta: 0,
            totalSinpe: 0,
            totalGeneral: 0,
            totalComisiones: 0,
            totalGananciaGrupos: 0,
            totalPendiente: 0,
            bySupplier: {}
        };

        partialClosings.forEach(closing => {
            const details = typeof closing.details === 'string' ? JSON.parse(closing.details) : closing.details;

            finalSummary.totalEfectivo += parseFloat(closing.totalEfectivo || 0);
            finalSummary.totalTarjeta += parseFloat(closing.totalTarjeta || 0);
            finalSummary.totalSinpe += parseFloat(closing.totalSinpe || 0);
            finalSummary.totalGeneral += parseFloat(closing.totalGeneral || 0);
            finalSummary.totalComisiones += parseFloat(closing.totalComisiones || 0);
            finalSummary.totalGananciaGrupos += parseFloat(details?.totalGananciaGrupos || 0);
            finalSummary.totalPendiente += parseFloat(details?.totalPendiente || 0);

            // Consolidar por proveedor
            if (details && details.bySupplier) {
                Object.entries(details.bySupplier).forEach(([suppId, suppData]) => {
                    if (!finalSummary.bySupplier[suppId]) {
                        // Deep copy of supplier data so we avoid mutating products
                        finalSummary.bySupplier[suppId] = JSON.parse(JSON.stringify(suppData));
                    } else {
                        const target = finalSummary.bySupplier[suppId];
                        target.total += parseFloat(suppData.total || 0);
                        target.cashTotal += parseFloat(suppData.cashTotal || 0);
                        target.cardTotal += parseFloat(suppData.cardTotal || 0);
                        target.sinpeTotal += parseFloat(suppData.sinpeTotal || 0);
                        target.pendingTotal += parseFloat(suppData.pendingTotal || 0);
                        target.cardCommission += parseFloat(suppData.cardCommission || 0);
                        target.groupProfit += parseFloat(suppData.groupProfit || 0);

                        // Consolidar productos
                        if (suppData.products) {
                            Object.entries(suppData.products).forEach(([prodId, prodData]) => {
                                if (!target.products[prodId]) {
                                    target.products[prodId] = { ...prodData };
                                } else {
                                    target.products[prodId].quantity += parseFloat(prodData.quantity || 0);
                                    target.products[prodId].total += parseFloat(prodData.total || 0);
                                }
                            });
                        }
                    }
                });
            }
        });

        const finalClosing = await CashClosing.create({
            SalesDayId: salesDayId,
            UserId: userId || null, // El admin que cierra
            totalEfectivo: finalSummary.totalEfectivo,
            totalTarjeta: finalSummary.totalTarjeta,
            totalSinpe: finalSummary.totalSinpe,
            totalGeneral: finalSummary.totalGeneral,
            totalComisiones: finalSummary.totalComisiones,
            isFinal: true,
            details: finalSummary
        });

        res.status(201).json(finalClosing);
    } catch (error) {
        console.error('ERROR IN createFinalCashClosing:', error);
        res.status(400).json({ error: error.message });
    }
};

export const deleteTransaction = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        const transaction = await Transaction.findByPk(id);
        if (!transaction) throw new Error('Transacción no encontrada');

        // Podríamos marcarla como cancelada o eliminarla físicamente. 
        // Por la simplicidad actual del sistema, vamos a eliminarla físicamente pero registrando en logs si fuera necesario.
        // Opcionalmente: transaction.status = 'cancelled'; transaction.observation = reason; await transaction.save();

        // Actualizamos la observación antes de borrar por si acaso persistimos algo, 
        // pero mejor vamos a borrarla directamente ya que el usuario pide "eliminar".
        await transaction.destroy();

        res.json({ message: 'Transacción eliminada correctamente' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

export const getPaymentTypes = async (req, res) => {
    try {
        const types = await PaymentType.findAll();
        res.json(types);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
export const getRecentTransactions = async (req, res) => {
    try {
        const { salesDayId, userId } = req.query;
        const whereClause = { SalesDayId: salesDayId };
        if (userId) whereClause.UserId = userId;

        const transactions = await Transaction.findAll({
            where: whereClause,
            include: [
                { model: PaymentType },
                { model: Sale, include: [Product] },
                { model: User, attributes: ['name'] }
            ],
            order: [['timestamp', 'DESC']]
        });
        res.json(transactions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const createAdjustmentRequest = async (req, res) => {
    try {
        const { transactionId, type, reason, details, requesterId } = req.body;

        const request = await TransactionRequest.create({
            TransactionId: transactionId,
            requesterId,
            type,
            reason,
            details,
            status: 'pending'
        });

        res.status(201).json(request);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

export const getPendingAdjustments = async (req, res) => {
    try {
        const requests = await TransactionRequest.findAll({
            where: { status: 'pending' },
            include: [
                { model: User, as: 'requester', attributes: ['name', 'email'] },
                {
                    model: Transaction,
                    include: [
                        { model: PaymentType },
                        { model: SalesDay, include: [Event] },
                        { model: Sale, include: [Product] }
                    ]
                }
            ],
            order: [['createdAt', 'DESC']]
        });
        res.json(requests);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const processAdjustment = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { id } = req.params;
        const { status, adminId } = req.body; // 'approved' or 'denied'

        const request = await TransactionRequest.findByPk(id, {
            include: [Transaction]
        });

        if (!request) throw new Error('Solicitud no encontrada');
        if (request.status !== 'pending') throw new Error('La solicitud ya ha sido procesada');

        request.status = status;
        request.authorizedById = adminId;
        request.authorizedAt = new Date();
        await request.save({ transaction: t });

        if (status === 'approved') {
            const transaction = request.Transaction;
            if (request.type === 'payment_change') {
                transaction.PaymentTypeId = request.details.newPaymentTypeId;
                await transaction.save({ transaction: t });
            } else if (request.type === 'deletion') {
                await transaction.destroy({ transaction: t });
            } else if (request.type === 'product_edit') {
                const { items } = request.details; // Array of { saleId, newQuantity }

                for (const item of items) {
                    const sale = await Sale.findByPk(item.saleId, { include: [Product] });
                    if (sale) {
                        if (item.newQuantity <= 0) {
                            await sale.destroy({ transaction: t });
                        } else {
                            sale.quantity = item.newQuantity;
                            sale.total = item.newQuantity * sale.Product.price;
                            await sale.save({ transaction: t });
                        }
                    }
                }

                // Recalculate transaction total
                const allSales = await Sale.findAll({
                    where: { TransactionId: transaction.id },
                    transaction: t
                });

                const newTotal = allSales.reduce((sum, s) => sum + parseFloat(s.total), 0);

                if (newTotal === 0) {
                    await transaction.destroy({ transaction: t });
                } else {
                    transaction.total = newTotal;
                    await transaction.save({ transaction: t });
                }
            }
        }

        await t.commit();
        res.json({ message: `Solicitud ${status === 'approved' ? 'aprobada' : 'rechazada'} con éxito`, request });
    } catch (error) {
        await t.rollback();
        res.status(400).json({ error: error.message });
    }
};
