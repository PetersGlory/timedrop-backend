const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settings.controller');

/**
 * @swagger
 * /settings:
 *   get:
 *     tags: [Settings]
 *     summary: Get user settings
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User settings
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 settings:
 *                   type: object
 *                   description: Settings object
 */
router.get('/', settingsController.getSettings);

/**
 * @swagger
 * /settings:
 *   post:
 *     tags: [Settings]
 *     summary: Create or update user settings
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Settings updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 settings:
 *                   type: object
 *                   description: Settings object
 */
router.post('/', settingsController.updateSettings);

/**
 * @swagger
 * /settings/notifications:
 *   patch:
 *     tags: [Settings]
 *     summary: Update notification preferences
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Notification preferences updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 settings:
 *                   type: object
 *                   description: Settings object
 */
router.patch('/notifications', settingsController.updateNotifications);

module.exports = router; 