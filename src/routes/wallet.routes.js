const express = require('express');
const router = express.Router();
const walletController = require('../controllers/wallet.controller');
const auth = require('../middleware/auth');

/**
 * @swagger
 * /api/wallet:
 *   get:
 *     summary: Get the wallet for the authenticated user
 *     description: Retrieve the wallet details (balance, currency, etc.) for the currently authenticated user.
 *     tags:
 *       - Wallet
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Wallet retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 wallet:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     userId:
 *                       type: string
 *                       format: uuid
 *                     balance:
 *                       type: string
 *                       example: "100.00"
 *                     currency:
 *                       type: string
 *                       example: "USD"
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: Unauthorized - Authentication required
 *       404:
 *         description: Wallet not found
 *       500:
 *         description: Server error
 */
router.get('/', auth, walletController.getWallet);

/**
 * @route   POST /api/wallet
 * @desc    Create a new wallet for the authd user
 * @access  Private
 */
router.post('/', auth, walletController.createWallet);

/**
 * @route   PUT /api/wallet
 * @desc    Update wallet balance (deposit or withdraw)
 * @access  Private
 */
router.put('/', auth, walletController.updateWallet);

/**
 * @route   POST /api/wallet/deposit
 * @desc    Deposit funds into the authenticated user's wallet
 * @access  Private
 * @body    { amount: number }
 * @returns { wallet: object }
 */
router.post('/deposit', auth, walletController.deposit);


module.exports = router;
