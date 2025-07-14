const express = require('express');
const router = express.Router();
const portfolioController = require('../controllers/portfolio.controller');

/**
 * @swagger
 * /portfolio:
 *   get:
 *     tags: [Portfolio]
 *     summary: Get the user's portfolio, including holdings, open orders, and filled orders
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User portfolio
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 portfolio:
 *                   type: object
 *                   description: Portfolio object
 */
router.get('/', portfolioController.getPortfolio);

module.exports = router; 