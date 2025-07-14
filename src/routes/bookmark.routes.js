const express = require('express');
const router = express.Router();
const bookmarkController = require('../controllers/bookmark.controller');

/**
 * @swagger
 * /bookmarks:
 *   get:
 *     tags: [Bookmarks]
 *     summary: List all bookmarks for the user
 *     description: Retrieve all bookmarks associated with the authenticated user.
 *     operationId: getBookmarks
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of bookmarks
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 bookmarks:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Bookmark'
 *             examples:
 *               example:
 *                 value:
 *                   bookmarks: [{ "userId": "uuid", "marketId": "uuid" }]
 *   post:
 *     tags: [Bookmarks]
 *     summary: Add a new bookmark
 *     description: Add a new bookmark for the authenticated user.
 *     operationId: addBookmark
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
 *             properties:
 *               marketId:
 *                 type: string
 *           examples:
 *             example:
 *               value:
 *                 marketId: "uuid"
 *     responses:
 *       201:
 *         description: Bookmark added
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 bookmark:
 *                   $ref: '#/components/schemas/Bookmark'
 *       400:
 *         description: Invalid input
 */
router.get('/', bookmarkController.getBookmarks);
router.post('/', bookmarkController.addBookmark);
/**
 * @swagger
 * /bookmarks/{id}:
 *   delete:
 *     tags: [Bookmarks]
 *     summary: Remove a bookmark
 *     description: Remove a bookmark by its ID for the authenticated user.
 *     operationId: removeBookmark
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Bookmark ID
 *     responses:
 *       200:
 *         description: Bookmark removed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *             examples:
 *               example:
 *                 value:
 *                   success: true
 *       404:
 *         description: Bookmark not found
 */
router.delete('/:id', bookmarkController.removeBookmark);

module.exports = router; 