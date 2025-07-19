const express = require('express');
const router = express.Router();
const marketController = require('../controllers/market.controller');

/**
 * @swagger
 * /markets:
 *   get:
 *     tags: [Markets]
 *     summary: List all available markets/instruments
 *     responses:
 *       200:
 *         description: List of markets
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 markets:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Market'
 */
router.get('/', marketController.getMarkets);

/**
 * @swagger
 * /markets/{id}:
 *   get:
 *     tags: [Markets]
 *     summary: Get details for a specific market/instrument
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Market ID
 *     responses:
 *       200:
 *         description: Market details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 market:
 *                   $ref: '#/components/schemas/Market'
 *       404:
 *         description: Market not found
 */
router.get('/:id', marketController.getMarket);

/**
 * @swagger
 * /markets:
 *   post:
 *     tags: [Markets]
 *     summary: Create a new market
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Market'
 *     responses:
 *       201:
 *         description: Market created
 *       400:
 *         description: Invalid input
 */
router.post('/', marketController.createMarket);

/**
 * @swagger
 * /markets/{id}:
 *   put:
 *     tags: [Markets]
 *     summary: Update a market
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Market ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Market'
 *     responses:
 *       200:
 *         description: Market updated
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Market not found
 */
router.put('/:id', marketController.updateMarket);

/**
 * @swagger
 * /markets/{id}:
 *   delete:
 *     tags: [Markets]
 *     summary: Delete a market
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Market ID
 *     responses:
 *       204:
 *         description: Market deleted
 *       404:
 *         description: Market not found
 */
router.delete('/:id', marketController.deleteMarket);

/**
 * @swagger
 * /markets/categories:
 *   get:
 *     tags: [Markets]
 *     summary: List all market categories
 *     responses:
 *       200:
 *         description: List of categories
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 categories:
 *                   type: array
 *                   items:
 *                     type: object
 *   post:
 *     tags: [Markets]
 *     summary: Create a new market category
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: Category created
 *       400:
 *         description: Invalid input
 */
router.get('/categories', marketController.getCategories);
/**
 * @swagger
 * /markets/categories:
 *   post:
 *     tags: [Markets]
 *     summary: Create a new market category
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: The name of the category
 *     responses:
 *       201:
 *         description: Category created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   description: The ID of the created category
 *                 name:
 *                   type: string
 *                   description: The name of the created category
 *       400:
 *         description: Invalid input
 */
router.post('/categories', marketController.createCategory);

/**
 * @swagger
 * /markets/categories/{id}:
 *   put:
 *     tags: [Markets]
 *     summary: Update a market category
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Category ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       200:
 *         description: Category updated
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Category not found
 *   delete:
 *     tags: [Markets]
 *     summary: Delete a market category
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Category ID
 *     responses:
 *       204:
 *         description: Category deleted
 *       404:
 *         description: Category not found
 */
router.put('/categories/:id', marketController.updateCategory);
/**
 * @swagger
 * /markets/categories/{id}:
 *   delete:
 *     tags: [Markets]
 *     summary: Delete a market category
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Category ID
 *     responses:
 *       204:
 *         description: Category deleted
 *       404:
 *         description: Category not found
 */
router.delete('/categories/:id', marketController.deleteCategory);

module.exports = router; 