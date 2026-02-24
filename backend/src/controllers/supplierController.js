import { Supplier } from '../models/index.js';

export const getSuppliers = async (req, res) => {
    try {
        const suppliers = await Supplier.findAll();
        res.json(suppliers);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const createSupplier = async (req, res) => {
    try {
        const supplier = await Supplier.create(req.body);
        res.status(201).json(supplier);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

export const updateSupplier = async (req, res) => {
    try {
        const { id } = req.params;
        await Supplier.update(req.body, { where: { id } });
        const updatedSupplier = await Supplier.findByPk(id);
        res.json(updatedSupplier);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

export const deleteSupplier = async (req, res) => {
    try {
        const { id } = req.params;
        await Supplier.destroy({ where: { id } });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
