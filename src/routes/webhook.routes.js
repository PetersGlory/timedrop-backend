const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhook.controller');
const { verifyFlutterwaveWebhook, captureRawBody } = require('../middleware/flutterwaveWebhookValidation');

/**
 * @swagger
 * /api/webhooks/flutterwave:
 *   post:
 *     summary: Flutterwave webhook endpoint
 *     description: Handles webhook events from Flutterwave for payments and transfers
 *     tags:
 *       - Webhooks
 *     security:
 *       - flutterwaveWebhook: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [transfer.completed, transfer.failed, transfer.reversed, charge.completed, charge.failed]
 *                 description: Type of webhook event
 *               data:
 *                 type: object
 *                 description: Event data from Flutterwave
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 message:
 *                   type: string
 *                   example: "Webhook processed"
 *       401:
 *         description: Invalid webhook signature
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Invalid signature"
 *       500:
 *         description: Webhook processing failed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "error"
 *                 message:
 *                   type: string
 *                   example: "Webhook processing failed"
 */

// Flutterwave webhook endpoint
// Note: This endpoint should NOT require authentication as it's called by Flutterwave
router.post('/flutterwave', 
  verifyFlutterwaveWebhook,  // Verify JWT token
  webhookController.handleWebhook
);

module.exports = router;
