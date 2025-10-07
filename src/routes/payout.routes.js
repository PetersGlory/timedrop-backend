const express = require('express');
const payoutController = require('../controllers/payout.controller');
const auth = require('../middleware/auth');

const router = express.Router();

// Apply authentication middleware to all payout routes
router.use(auth);

/**
 * @swagger
 * tags:
 *   name: Payouts
 *   description: Flutterwave payout operations for dual balance management
 */

/**
 * @swagger
 * /api/payouts/balances:
 *   get:
 *     tags: [Payouts]
 *     summary: Get all balances (collection and settlement)
 *     description: Retrieve current collection and settlement balances for all supported currencies from Flutterwave
 *     operationId: getAllBalances
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Balances retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     collection:
 *                       type: object
 *                       description: Collection balances by currency
 *                       additionalProperties:
 *                         type: object
 *                         properties:
 *                           amount:
 *                             type: number
 *                             format: float
 *                           currency:
 *                             type: string
 *                     settlement:
 *                       type: object
 *                       description: Settlement balances by currency
 *                       additionalProperties:
 *                         type: object
 *                         properties:
 *                           amount:
 *                             type: number
 *                             format: float
 *                           currency:
 *                             type: string
 *                     summary:
 *                       type: object
 *                       properties:
 *                         total_currencies:
 *                           type: integer
 *                         currencies:
 *                           type: array
 *                           items:
 *                             type: string
 *       401:
 *         description: Unauthorized - Authentication required
 *       500:
 *         description: Failed to fetch balances
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Failed to fetch balances"
 *                 error:
 *                   type: string
 */
router.get('/balances', payoutController.getAllBalances);

/**
 * @swagger
 * /api/payouts/transfer-to-settlement:
 *   post:
 *     tags: [Payouts]
 *     summary: Transfer funds from collection to settlement balance
 *     description: Move specified amount from collection balance to settlement balance for payout preparation
 *     operationId: transferToSettlement
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *             properties:
 *               amount:
 *                 type: number
 *                 format: float
 *                 minimum: 0.01
 *                 description: Amount to transfer from collection to settlement
 *                 example: 1000.00
 *               currency:
 *                 type: string
 *                 default: "NGN"
 *                 description: Currency code for the transfer
 *                 example: "NGN"
 *     responses:
 *       200:
 *         description: Transfer initiated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 transferId:
 *                   type: string
 *                   description: Flutterwave transfer ID
 *                 reference:
 *                   type: string
 *                   description: Transfer reference
 *                 message:
 *                   type: string
 *                   example: "Funds transferred to settlement balance"
 *       400:
 *         description: Invalid request - valid amount is required
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Valid amount is required"
 *       401:
 *         description: Unauthorized - Authentication required
 *       500:
 *         description: Transfer failed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Transfer failed"
 *                 error:
 *                   type: string
 */
router.post('/transfer-to-settlement', payoutController.transferToSettlement);

/**
 * @swagger
 * /api/payouts/prepare-collection:
 *   post:
 *     tags: [Payouts]
 *     summary: Move all collection balance to settlement
 *     description: Transfer the entire collection balance to settlement balance for payout preparation
 *     operationId: prepareCollection
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               currency:
 *                 type: string
 *                 default: "NGN"
 *                 description: Currency code for the transfer
 *                 example: "NGN"
 *     responses:
 *       200:
 *         description: Collection balance prepared successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 transferId:
 *                   type: string
 *                   description: Flutterwave transfer ID
 *                 reference:
 *                   type: string
 *                   description: Transfer reference
 *                 message:
 *                   type: string
 *                   example: "Funds transferred to settlement balance"
 *       400:
 *         description: No funds in collection balance to transfer
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "No funds in collection balance to transfer"
 *       401:
 *         description: Unauthorized - Authentication required
 *       500:
 *         description: Preparation failed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Preparation failed"
 *                 error:
 *                   type: string
 */
router.post('/prepare-collection', payoutController.prepareCollection);

/**
 * @swagger
 * /api/payouts/from-settlement:
 *   post:
 *     tags: [Payouts]
 *     summary: Initiate payout from settlement balance
 *     description: Create a direct payout from settlement balance to a bank account
 *     operationId: initiatePayoutFromSettlement
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - accountBank
 *               - accountNumber
 *             properties:
 *               amount:
 *                 type: number
 *                 format: float
 *                 minimum: 0.01
 *                 description: Amount to payout
 *                 example: 1000.00
 *               currency:
 *                 type: string
 *                 default: "NGN"
 *                 description: Currency code
 *                 example: "NGN"
 *               accountBank:
 *                 type: string
 *                 description: Bank code for the destination account
 *                 example: "044"
 *               accountNumber:
 *                 type: string
 *                 description: Destination bank account number
 *                 example: "1234567890"
 *               beneficiaryName:
 *                 type: string
 *                 description: Name of the account holder
 *                 example: "John Doe"
 *               narration:
 *                 type: string
 *                 description: Transfer narration/description
 *                 example: "Payment for services"
 *     responses:
 *       200:
 *         description: Payout initiated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 transferId:
 *                   type: string
 *                   description: Flutterwave transfer ID
 *                 reference:
 *                   type: string
 *                   description: Transfer reference
 *                 source:
 *                   type: string
 *                   example: "settlement_balance"
 *                 data:
 *                   type: object
 *                   description: Flutterwave response data
 *       400:
 *         description: Invalid request - required fields missing
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Amount, account bank, and account number are required"
 *       401:
 *         description: Unauthorized - Authentication required
 *       500:
 *         description: Payout from settlement failed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Payout from settlement failed"
 *                 error:
 *                   type: string
 */
router.post('/from-settlement', payoutController.initiatePayoutFromSettlement);

/**
 * @swagger
 * /api/payouts/from-collection:
 *   post:
 *     tags: [Payouts]
 *     summary: Initiate payout from collection balance (2-step process)
 *     description: |
 *       Create a payout from collection balance using a 2-step process:
 *       1. Transfer funds from collection to settlement balance
 *       2. Initiate payout from settlement balance
 *     operationId: initiatePayoutFromCollection
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - accountBank
 *               - accountNumber
 *             properties:
 *               amount:
 *                 type: number
 *                 format: float
 *                 minimum: 0.01
 *                 description: Amount to payout
 *                 example: 1000.00
 *               currency:
 *                 type: string
 *                 default: "NGN"
 *                 description: Currency code
 *                 example: "NGN"
 *               accountBank:
 *                 type: string
 *                 description: Bank code for the destination account
 *                 example: "044"
 *               accountNumber:
 *                 type: string
 *                 description: Destination bank account number
 *                 example: "1234567890"
 *               beneficiaryName:
 *                 type: string
 *                 description: Name of the account holder
 *                 example: "John Doe"
 *               narration:
 *                 type: string
 *                 description: Transfer narration/description
 *                 example: "Payment for services"
 *     responses:
 *       200:
 *         description: Payout initiated successfully from collection balance
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 transferId:
 *                   type: string
 *                   description: Flutterwave transfer ID
 *                 reference:
 *                   type: string
 *                   description: Transfer reference
 *                 source:
 *                   type: string
 *                   example: "collection_balance"
 *                 intermediateTransferId:
 *                   type: string
 *                   description: ID of the intermediate transfer from collection to settlement
 *                 data:
 *                   type: object
 *                   description: Flutterwave response data
 *       400:
 *         description: Invalid request or insufficient collection balance
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Amount, account bank, and account number are required"
 *       401:
 *         description: Unauthorized - Authentication required
 *       500:
 *         description: Payout from collection failed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Payout from collection failed"
 *                 error:
 *                   type: string
 */
router.post('/from-collection', payoutController.initiatePayoutFromCollection);

/**
 * @swagger
 * /api/payouts/smart:
 *   post:
 *     tags: [Payouts]
 *     summary: Smart payout - automatically choose best balance source
 *     description: |
 *       Intelligently select the best balance source (settlement or collection) for the payout.
 *       The system will automatically choose the most appropriate balance based on availability.
 *     operationId: initiateSmartPayout
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - accountBank
 *               - accountNumber
 *             properties:
 *               amount:
 *                 type: number
 *                 format: float
 *                 minimum: 0.01
 *                 description: Amount to payout
 *                 example: 1000.00
 *               currency:
 *                 type: string
 *                 default: "NGN"
 *                 description: Currency code
 *                 example: "NGN"
 *               accountBank:
 *                 type: string
 *                 description: Bank code for the destination account
 *                 example: "044"
 *               accountNumber:
 *                 type: string
 *                 description: Destination bank account number
 *                 example: "1234567890"
 *               beneficiaryName:
 *                 type: string
 *                 description: Name of the account holder
 *                 example: "John Doe"
 *               narration:
 *                 type: string
 *                 description: Transfer narration/description
 *                 example: "Payment for services"
 *               preferredSource:
 *                 type: string
 *                 enum: ["settlement", "collection"]
 *                 default: "settlement"
 *                 description: Preferred balance source (system will use this if available)
 *                 example: "settlement"
 *     responses:
 *       200:
 *         description: Smart payout initiated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 transferId:
 *                   type: string
 *                   description: Flutterwave transfer ID
 *                 reference:
 *                   type: string
 *                   description: Transfer reference
 *                 source:
 *                   type: string
 *                   enum: ["settlement_balance", "collection_balance"]
 *                   description: The balance source that was actually used
 *                 data:
 *                   type: object
 *                   description: Flutterwave response data
 *       400:
 *         description: Invalid request or insufficient funds
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Amount, account bank, and account number are required"
 *       401:
 *         description: Unauthorized - Authentication required
 *       500:
 *         description: Smart payout failed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Smart payout failed"
 *                 error:
 *                   type: string
 */
router.post('/smart', payoutController.initiateSmartPayout);

/**
 * @swagger
 * /api/payouts/initiate:
 *   post:
 *     tags: [Payouts]
 *     summary: General payout endpoint with source selection
 *     description: |
 *       Universal payout endpoint that allows you to specify the balance source or use auto-selection.
 *       Supports settlement, collection, or automatic source selection.
 *     operationId: initiatePayout
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - accountBank
 *               - accountNumber
 *             properties:
 *               amount:
 *                 type: number
 *                 format: float
 *                 minimum: 0.01
 *                 description: Amount to payout
 *                 example: 1000.00
 *               currency:
 *                 type: string
 *                 default: "NGN"
 *                 description: Currency code
 *                 example: "NGN"
 *               accountBank:
 *                 type: string
 *                 description: Bank code for the destination account
 *                 example: "044"
 *               accountNumber:
 *                 type: string
 *                 description: Destination bank account number
 *                 example: "1234567890"
 *               beneficiaryName:
 *                 type: string
 *                 description: Name of the account holder
 *                 example: "John Doe"
 *               narration:
 *                 type: string
 *                 description: Transfer narration/description
 *                 example: "Payment for services"
 *               source:
 *                 type: string
 *                 enum: ["settlement", "collection", "auto"]
 *                 default: "auto"
 *                 description: |
 *                   Balance source selection:
 *                   - "settlement": Use settlement balance only
 *                   - "collection": Use collection balance (2-step process)
 *                   - "auto": Automatically choose best available balance
 *                 example: "auto"
 *     responses:
 *       200:
 *         description: Payout initiated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 transferId:
 *                   type: string
 *                   description: Flutterwave transfer ID
 *                 reference:
 *                   type: string
 *                   description: Transfer reference
 *                 source:
 *                   type: string
 *                   enum: ["settlement_balance", "collection_balance"]
 *                   description: The balance source that was actually used
 *                 data:
 *                   type: object
 *                   description: Flutterwave response data
 *       400:
 *         description: Invalid request - required fields missing
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Amount, account bank, and account number are required"
 *       401:
 *         description: Unauthorized - Authentication required
 *       500:
 *         description: Payout initiation failed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Payout initiation failed"
 *                 error:
 *                   type: string
 */
router.post('/initiate', payoutController.initiatePayout);

/**
 * GET /api/payouts/balance-status
 * Check if sufficient balance exists for a payout
 */
router.get('/balance-status', payoutController.getBalanceStatus);

module.exports = router;
