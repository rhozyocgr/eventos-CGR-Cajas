import { Op } from 'sequelize';
import { Sale, Transaction, SalesDay, Product, PaymentType, CashClosing, Supplier, User, Event, sequelize } from '../models/index.js';

export const createSale = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { salesDayId, items, paymentTypeId, observation } = req.body;

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
            PaymentTypeId: paymentTypeId
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

export const getPendingSales = async (req, res) => {
    try {
        const { salesDayId } = req.query;
        const pendingType = await PaymentType.findOne({ where: { name: 'Pendiente' } });

        if (!pendingType) return res.json([]);

        const transactions = await Transaction.findAll({
            where: {
                SalesDayId: salesDayId,
                PaymentTypeId: pendingType.id
            },
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
        const { salesDayId } = req.query;
        if (!salesDayId) throw new Error('salesDayId is required');

        // Find the last cash closing for this day
        const lastClosing = await CashClosing.findOne({
            where: { SalesDayId: salesDayId },
            order: [['timestamp', 'DESC']]
        });

        const transactionWhere = { SalesDayId: salesDayId };

        // If there was a closing, only get transactions after that closing's timestamp
        if (lastClosing) {
            transactionWhere.createdAt = { [Op.gt]: lastClosing.timestamp };
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
                    } else {
                        sData.pendingTotal += saleTotal;
                    }

                    if (!sData.products[product.id]) {
                        sData.products[product.id] = {
                            name: product.name,
                            quantity: 0,
                            total: 0
                        };
                    }
                    sData.products[product.id].quantity += sale.quantity;
                    sData.products[product.id].total += saleTotal;
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
        const { salesDayId } = req.query;
        const where = {};
        if (salesDayId) where.SalesDayId = salesDayId;

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
            details: summary
        });

        res.status(201).json(closing);
    } catch (error) {
        console.error('ERROR IN createCashClosing:', error);
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
