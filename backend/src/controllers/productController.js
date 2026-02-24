import { Product, Supplier } from '../models/index.js';

export const getProducts = async (req, res) => {
    try {
        const products = await Product.findAll({
            include: [{ model: Supplier, attributes: ['id', 'name'] }]
        });
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const createProduct = async (req, res) => {
    try {
        const product = await Product.create(req.body);
        const productWithSupplier = await Product.findByPk(product.id, {
            include: [{ model: Supplier, attributes: ['id', 'name'] }]
        });
        res.status(201).json(productWithSupplier);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

export const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        await Product.update(req.body, { where: { id } });
        const updatedProduct = await Product.findByPk(id, {
            include: [{ model: Supplier, attributes: ['id', 'name'] }]
        });
        res.json(updatedProduct);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

export const bulkCreateProducts = async (req, res) => {
    try {
        const { products } = req.body;
        // Basic validation and creation
        const createdProducts = await Product.bulkCreate(products);
        res.status(201).json(createdProducts);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

export const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        await Product.destroy({ where: { id } });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
