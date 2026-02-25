import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const User = sequelize.define('User', {
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    name: { type: DataTypes.STRING },
    role: { type: DataTypes.ENUM('user', 'admin'), defaultValue: 'user' }
});

const Supplier = sequelize.define('Supplier', {
    name: { type: DataTypes.STRING, allowNull: false },
    contact: { type: DataTypes.STRING },
    phone: { type: DataTypes.STRING },
    email: { type: DataTypes.STRING },
    type: { type: DataTypes.STRING, defaultValue: 'General' },
    hasDataphone: { type: DataTypes.BOOLEAN, defaultValue: false },
    dataphoneCommission: { type: DataTypes.DECIMAL(5, 2), defaultValue: 0 },
    commission: { type: DataTypes.DECIMAL(5, 2), defaultValue: 0 }
});

const Product = sequelize.define('Product', {
    name: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT },
    price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    stock: { type: DataTypes.INTEGER, defaultValue: 0 }
});

const SalesDay = sequelize.define('SalesDay', {
    date: { type: DataTypes.DATEONLY, allowNull: false },
    description: { type: DataTypes.STRING }
});

const PaymentType = sequelize.define('PaymentType', {
    name: { type: DataTypes.STRING, allowNull: false }
});

const Transaction = sequelize.define('Transaction', {
    total: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    observation: { type: DataTypes.TEXT, allowNull: true },
    timestamp: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
});

const Sale = sequelize.define('Sale', {
    quantity: { type: DataTypes.INTEGER, allowNull: false },
    total: { type: DataTypes.DECIMAL(10, 2), allowNull: false }
});

const Event = sequelize.define('Event', {
    name: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT },
    startDate: { type: DataTypes.DATE, allowNull: false },
    endDate: { type: DataTypes.DATE, allowNull: false },
    logo: { type: DataTypes.TEXT('long') }
});

const CashClosing = sequelize.define('CashClosing', {
    totalEfectivo: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    totalTarjeta: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    totalSinpe: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    totalGeneral: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    totalComisiones: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    details: { type: DataTypes.JSON },
    timestamp: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
});

// Associations
Supplier.hasMany(Product);
Product.belongsTo(Supplier);

SalesDay.hasMany(Transaction);
Transaction.belongsTo(SalesDay);

Transaction.hasMany(Sale);
Sale.belongsTo(Transaction);

Product.hasMany(Sale);
Sale.belongsTo(Product);

PaymentType.hasMany(Transaction);
Transaction.belongsTo(PaymentType);

Event.hasMany(SalesDay);
SalesDay.belongsTo(Event);

User.hasMany(CashClosing);
CashClosing.belongsTo(User);

SalesDay.hasMany(CashClosing);
CashClosing.belongsTo(SalesDay);

Event.belongsToMany(Product, { through: 'EventProducts' });
Product.belongsToMany(Event, { through: 'EventProducts' });

SalesDay.belongsToMany(Product, { through: 'DayProducts' });
Product.belongsToMany(SalesDay, { through: 'DayProducts' });

export { sequelize, User, Supplier, Product, SalesDay, PaymentType, Transaction, Sale, Event, CashClosing };
