const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');

/**
 * @swagger
 * /orders:
 *   get:
 *     tags: [Orders]
 *     summary: Get the user's open and filled orders
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of open and filled orders
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 openOrders:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Order'
 *                 filledOrders:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Order'
 */
router.get('/', orderController.getOrders);

/**
 * @swagger
 * /orders:
 *   post:
 *     tags: [Orders]
 *     summary: Place a new order (trade) on a market
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - marketId
 *               - type
 *               - quantity
 *             properties:
 *               marketId:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [BUY, SELL]
 *               quantity:
 *                 type: number
 *     responses:
 *       201:
 *         description: Order placed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 order:
 *                   $ref: '#/components/schemas/Order'
 *       400:
 *         description: Invalid input
 */
router.post('/', orderController.createOrder);

/**
 * @swagger
 * /orders/{id}/cancel:
 *   post:
 *     tags: [Orders]
 *     summary: Cancel an open order
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Order ID
 *     responses:
 *       200:
 *         description: Order cancelled
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *       404:
 *         description: Order not found
 */
router.post('/:id/cancel', orderController.cancelOrder);

module.exports = router; 