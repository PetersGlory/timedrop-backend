const express = require('express');
const router = express.Router();
const walletController = require('../controllers/wallet.controller');
const auth = require('../middleware/auth');
const verifyFlutterwaveKey = require('../middleware/flutterwaveValidation');

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


/**
 * @route   POST /api/wallet/withdraw
 * @desc    Request a withdrawal from the authenticated user's wallet
 * @access  Private
 * @body    { amount: number, currency?: string }
 * @returns { withdrawal: object }
 */
router.post('/withdraw', auth, walletController.withdraw);



/**
 * @route   GET /api/wallet/banks/:country
 * @desc    Retrieve a list of all banks for a specified country using Flutterwave
 * @access  Private
 * @param   {string} country - The country code (e.g., 'NG' for Nigeria)
 * @returns { data: object }
 * @response
 *   200: { success: true, data: [ ...banks ] }
 *   401: Unauthorized - Authentication required
 *   404: User not found
 *   500: Server error
 */
router.get('/banks/:country', auth, walletController.getAllBanks);

/**
 * @route   POST /api/wallet/verify-account
 * @desc    Verify bank account details using Paystack
 * @access  Private
 * @body    { account_number: string, account_bank: string }
 * @returns { data: object }
 * @response
 *   200: { success: true, data: { ...accountDetails } }
 *   400: account_number and account_bank are required
 *   401: Unauthorized - Authentication required
 *   500: Account verification failed or server error
 */
router.post('/verify-account', auth, walletController.verifyBankAccount);


/**
 * @route   GET /api/wallet/withdrawals
 * @desc    Get all withdrawal history for the authenticated user
 * @access  Private
 * @returns { withdrawals: array }
 * @response
 *   200: { success: true, withdrawals: [ ... ] }
 *   401: Unauthorized - Authentication required
 *   500: Failed to fetch withdrawals
 */
router.get('/withdrawals', auth, walletController.getWithdrawals);


/**
 * @route   GET /api/wallet/transactions
 * @desc    Get all transaction history for the authenticated user
 * @access  Private
 * @returns { transactions: array }
 * @response
 *   200: { success: true, transactions: [ ... ] }
 *   401: Unauthorized - Authentication required
 *   500: Failed to fetch transactions
 */
router.get('/transactions', auth, walletController.getTransactions);







/**
 * @route   POST /api/wallet/webhook
 * @desc    Legacy webhook endpoint (deprecated)
 * @access  Public (Flutterwave)
 * @returns { error: string, newEndpoint: string }
 * @response
 *   410: Deprecated endpoint - use /api/webhooks/flutterwave instead
 */
router.post('/webhook', walletController.payoutWebhook);


// veifying account
/**
 * @swagger
 * /api/wallet/verify-withdrawals:
 *   post:
 *     summary: Validate a withdrawal transaction status with Flutterwave
 *     description: Checks the status of a withdrawal transaction using the Flutterwave transfer ID.
 *     tags:
 *       - Wallet
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - transactionId
 *             properties:
 *               transactionId:
 *                 type: integer
 *                 description: The ID of the withdrawal transaction to validate.
 *                 example: 123
 *     responses:
 *       200:
 *         description: Transaction validation result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   description: Flutterwave transfer response data
 *       404:
 *         description: Withdrawal not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 error:
 *                   type: string
 *       500:
 *         description: Failed to process validation
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 error:
 *                   type: string
 */
router.post("/verify-withdrawals", auth, walletController.validateTransactionFlutterwave);

module.exports = router;
