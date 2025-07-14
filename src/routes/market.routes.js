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

module.exports = router; 