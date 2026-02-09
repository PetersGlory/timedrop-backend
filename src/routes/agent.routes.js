const express = require('express');
const router = express.Router();
const agentController = require('../controllers/agent.controller');
const auth = require('../middleware/auth');
const isAdmin = require('../middleware/adminMiddleware');

/**
 * @swagger
 * tags:
 *   name: Agents
 *   description: Agent registration and management
 */

/**
 * @swagger
 * /agents/register:
 *   post:
 *     tags: [Agents]
 *     summary: Register as an agent
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *             properties:
 *               name:
 *                 type: string
 *                 description: Agent's full name
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Agent's email address
 *                 example: john.doe@example.com
 *     responses:
 *       201:
 *         description: Agent registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 agent:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *                     referralCode:
 *                       type: string
 *                       example: JOHN4A2B3C
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Invalid input data
 *       409:
 *         description: Email already registered
 *       500:
 *         description: Server error
 */
router.post('/register', agentController.register);

/**
 * @swagger
 * /agents:
 *   get:
 *     tags: [Agents]
 *     summary: Get agent details by email or referral code
 *     parameters:
 *       - in: query
 *         name: email
 *         schema:
 *           type: string
 *         description: Agent's email address
 *       - in: query
 *         name: referralCode
 *         schema:
 *           type: string
 *         description: Agent's referral code
 *     responses:
 *       200:
 *         description: Agent details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 agent:
 *                   type: object
 *       400:
 *         description: Email or referral code required
 *       404:
 *         description: Agent not found
 *       500:
 *         description: Server error
 */
router.get('/', agentController.getAgent);

/**
 * @swagger
 * /agents/all:
 *   get:
 *     tags: [Agents]
 *     summary: Get all agents (admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Items per page
 *     responses:
 *       200:
 *         description: List of all agents
 *       401:
 *         description: Not authenticated
 *       500:
 *         description: Server error
 */
router.get('/all', auth, isAdmin, agentController.getAllAgents);

/**
 * @swagger
 * /agents/{id}/status:
 *   patch:
 *     tags: [Agents]
 *     summary: Update agent status (admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Agent ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - isActive
 *             properties:
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Agent status updated
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: Agent not found
 *       500:
 *         description: Server error
 */
router.patch('/:id/status', auth, isAdmin, agentController.updateAgentStatus);

module.exports = router;