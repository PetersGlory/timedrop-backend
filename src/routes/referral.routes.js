const express = require('express');
const router = express.Router();
const referralController = require('../controllers/referral.controller');
const auth = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Referrals
 *   description: Referral tracking and statistics
 */

/**
 * @swagger
 * /referrals/track:
 *   post:
 *     tags: [Referrals]
 *     summary: Track a referral usage
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - referralCode
 *               - marketId
 *             properties:
 *               referralCode:
 *                 type: string
 *                 description: Agent's referral code
 *                 example: JOHN4A2B3C
 *               marketId:
 *                 type: string
 *                 description: Market ID where the code was used
 *               orderAmount:
 *                 type: number
 *                 description: Amount of the order
 *                 example: 5000
 *               orderId:
 *                 type: string
 *                 description: Optional order ID for tracking
 *               orderType:
 *                 type: string
 *                 enum: [BUY, SELL]
 *                 description: Type of order
 *     responses:
 *       201:
 *         description: Referral tracked successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 tracking:
 *                   type: object
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: Invalid referral code
 *       500:
 *         description: Server error
 */
router.post('/track', auth, referralController.trackReferral);

/**
 * @swagger
 * /referrals/stats:
 *   get:
 *     tags: [Referrals]
 *     summary: Get referral statistics for an agent
 *     parameters:
 *       - in: query
 *         name: referralCode
 *         required: true
 *         schema:
 *           type: string
 *         description: Agent's referral code
 *         example: JOHN4A2B3C
 *     responses:
 *       200:
 *         description: Referral statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 agent:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *                     referralCode:
 *                       type: string
 *                     memberSince:
 *                       type: string
 *                       format: date-time
 *                 stats:
 *                   type: object
 *                   properties:
 *                     totalReferrals:
 *                       type: integer
 *                     totalVolume:
 *                       type: number
 *                     last30Days:
 *                       type: object
 *                       properties:
 *                         referrals:
 *                           type: integer
 *                         volume:
 *                           type: number
 *                 recentReferrals:
 *                   type: array
 *                   items:
 *                     type: object
 *       400:
 *         description: Referral code required
 *       404:
 *         description: Agent not found
 *       500:
 *         description: Server error
 */
router.get('/stats', referralController.getReferralStats);

/**
 * @swagger
 * /referrals/validate:
 *   get:
 *     tags: [Referrals]
 *     summary: Validate a referral code
 *     parameters:
 *       - in: query
 *         name: referralCode
 *         required: true
 *         schema:
 *           type: string
 *         description: Referral code to validate
 *         example: JOHN4A2B3C
 *     responses:
 *       200:
 *         description: Referral code validation result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 valid:
 *                   type: boolean
 *                 agent:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     referralCode:
 *                       type: string
 *       400:
 *         description: Referral code required
 *       404:
 *         description: Invalid referral code
 *       500:
 *         description: Server error
 */
router.get('/validate', referralController.validateReferralCode);

/**
 * @swagger
 * /referrals/my-history:
 *   get:
 *     tags: [Referrals]
 *     summary: Get user's referral usage history
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User's referral history retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 referrals:
 *                   type: array
 *                   items:
 *                     type: object
 *       401:
 *         description: Not authenticated
 *       500:
 *         description: Server error
 */
router.get('/my-history', auth, referralController.getUserReferralHistory);

module.exports = router;