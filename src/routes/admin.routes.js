const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const auth = require('../middleware/auth');

// Simple isAdmin middleware
function isAdmin(req, res, next) {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'super_admin')) {
    return next();
  }
  return res.status(403).json({ message: 'Forbidden: Admins only' });
}

// --- Users ---
/**
 * @swagger
 * /admin/users:
 *   get:
 *     tags: [Admin]
 *     summary: Get all users
 *     description: Retrieve a list of all users in the system. Admin access only.
 *     operationId: adminGetAllUsers
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *             examples:
 *               example:
 *                 value:
 *                   users: [{ "id": "uuid", "email": "admin@example.com", "role": "admin" }]
 *   post:
 *     tags: [Admin]
 *     summary: Create a new user
 *     description: Create a new user with the specified details. Admin access only.
 *     operationId: adminCreateUser
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *           examples:
 *             example:
 *               value:
 *                 email: "newuser@example.com"
 *                 password: "password123"
 *                 firstName: "New"
 *                 lastName: "User"
 *                 role: "user"
 *     responses:
 *       201:
 *         description: User created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid input
 */
router.get('/users', auth, isAdmin, adminController.getAllUsers);
router.post('/users', auth, isAdmin, adminController.createUser);
/**
 * @swagger
 * /admin/users/{id}:
 *   get:
 *     tags: [Admin]
 *     summary: Get a user by ID
 *     description: Retrieve a user by their unique ID. Admin access only.
 *     operationId: adminGetUser
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: User ID
 *     responses:
 *       200:
 *         description: User found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 *   put:
 *     tags: [Admin]
 *     summary: Update a user
 *     description: Update user details by ID. Admin access only.
 *     operationId: adminUpdateUser
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       200:
 *         description: User updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid input
 *       404:
 *         description: User not found
 *   delete:
 *     tags: [Admin]
 *     summary: Delete a user
 *     description: Delete a user by its unique ID. Admin access only.
 *     operationId: adminDeleteUser
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: User ID
 *     responses:
 *       204:
 *         description: User deleted
 *       404:
 *         description: User not found
 */
router.get('/users/:id', auth, isAdmin, adminController.getUser);
router.put('/users/:id', auth, isAdmin, adminController.updateUser);
router.delete('/users/:id', auth, isAdmin, adminController.deleteUser);

// --- Markets ---
/**
 * @swagger
 * /admin/markets:
 *   get:
 *     tags: [Admin]
 *     summary: Get all markets
 *     description: Retrieve a list of all markets. Admin access only.
 *     operationId: adminGetAllMarkets
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of markets
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 markets:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Market'
 *   post:
 *     tags: [Admin]
 *     summary: Create a new market
 *     description: Create a new market. Admin access only.
 *     operationId: adminCreateMarket
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Market'
 *     responses:
 *       201:
 *         description: Market created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Market'
 *       400:
 *         description: Invalid input
 */
router.get('/markets', auth, isAdmin, adminController.getAllMarkets);
router.post('/markets', auth, isAdmin, adminController.createMarket);
/**
 * @swagger
 * /admin/markets/{id}:
 *   get:
 *     tags: [Admin]
 *     summary: Get a market by ID
 *     description: Retrieve a market by its unique ID. Admin access only.
 *     operationId: adminGetMarket
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Market ID
 *     responses:
 *       200:
 *         description: Market found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Market'
 *       404:
 *         description: Market not found
 *   put:
 *     tags: [Admin]
 *     summary: Update a market
 *     description: Update market details by ID. Admin access only.
 *     operationId: adminUpdateMarket
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Market ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Market'
 *     responses:
 *       200:
 *         description: Market updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Market'
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Market not found
 *   delete:
 *     tags: [Admin]
 *     summary: Delete a market
 *     description: Delete a market by its unique ID. Admin access only.
 *     operationId: adminDeleteMarket
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Market ID
 *     responses:
 *       204:
 *         description: Market deleted
 *       404:
 *         description: Market not found
 */
router.get('/markets/:id', auth, isAdmin, adminController.getMarket);
router.put('/markets/:id', auth, isAdmin, adminController.updateMarket);
router.delete('/markets/:id', auth, isAdmin, adminController.deleteMarket);

// --- Orders ---
/**
 * @swagger
 * /admin/orders:
 *   get:
 *     tags: [Admin]
 *     summary: Get all orders
 *     description: Retrieve a list of all orders. Admin access only.
 *     operationId: adminGetAllOrders
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of orders
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 orders:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Order'
 *   post:
 *     tags: [Admin]
 *     summary: Create a new order
 *     description: Create a new order. Admin access only.
 *     operationId: adminCreateOrder
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Order'
 *     responses:
 *       201:
 *         description: Order created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       400:
 *         description: Invalid input
 */
router.get('/orders', auth, isAdmin, adminController.getAllOrders);
router.post('/orders', auth, isAdmin, adminController.createOrder);
/**
 * @swagger
 * /admin/orders/{id}:
 *   get:
 *     tags: [Admin]
 *     summary: Get an order by ID
 *     description: Retrieve an order by its unique ID. Admin access only.
 *     operationId: adminGetOrder
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
 *         description: Order found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       404:
 *         description: Order not found
 *   put:
 *     tags: [Admin]
 *     summary: Update an order
 *     description: Update order details by ID. Admin access only.
 *     operationId: adminUpdateOrder
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Order ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Order'
 *     responses:
 *       200:
 *         description: Order updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Order not found
 *   delete:
 *     tags: [Admin]
 *     summary: Delete an order
 *     description: Delete an order by its unique ID. Admin access only.
 *     operationId: adminDeleteOrder
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
 *       204:
 *         description: Order deleted
 *       404:
 *         description: Order not found
 */
router.get('/orders/:id', auth, isAdmin, adminController.getOrder);
router.put('/orders/:id', auth, isAdmin, adminController.updateOrder);
router.delete('/orders/:id', auth, isAdmin, adminController.deleteOrder);

// --- Portfolios ---
/**
 * @swagger
 * /admin/portfolios:
 *   get:
 *     tags: [Admin]
 *     summary: Get all portfolios
 *     description: Retrieve a list of all portfolios. Admin access only.
 *     operationId: adminGetAllPortfolios
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of portfolios
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 portfolios:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Portfolio'
 *   post:
 *     tags: [Admin]
 *     summary: Create a new portfolio
 *     description: Create a new portfolio. Admin access only.
 *     operationId: adminCreatePortfolio
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Portfolio'
 *     responses:
 *       201:
 *         description: Portfolio created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Portfolio'
 *       400:
 *         description: Invalid input
 */
router.get('/portfolios', auth, isAdmin, adminController.getAllPortfolios);
router.post('/portfolios', auth, isAdmin, adminController.createPortfolio);
/**
 * @swagger
 * /admin/portfolios/{id}:
 *   get:
 *     tags: [Admin]
 *     summary: Get a portfolio by ID
 *     description: Retrieve a portfolio by its unique ID. Admin access only.
 *     operationId: adminGetPortfolio
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Portfolio ID
 *     responses:
 *       200:
 *         description: Portfolio found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Portfolio'
 *       404:
 *         description: Portfolio not found
 *   put:
 *     tags: [Admin]
 *     summary: Update a portfolio
 *     description: Update portfolio details by ID. Admin access only.
 *     operationId: adminUpdatePortfolio
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Portfolio ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Portfolio'
 *     responses:
 *       200:
 *         description: Portfolio updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Portfolio'
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Portfolio not found
 *   delete:
 *     tags: [Admin]
 *     summary: Delete a portfolio
 *     description: Delete a portfolio by its unique ID. Admin access only.
 *     operationId: adminDeletePortfolio
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Portfolio ID
 *     responses:
 *       204:
 *         description: Portfolio deleted
 *       404:
 *         description: Portfolio not found
 */
router.get('/portfolios/:id', auth, isAdmin, adminController.getPortfolio);
router.put('/portfolios/:id', auth, isAdmin, adminController.updatePortfolio);
router.delete('/portfolios/:id', auth, isAdmin, adminController.deletePortfolio);

// --- Settings ---
/**
 * @swagger
 * /admin/settings:
 *   get:
 *     tags: [Admin]
 *     summary: Get all settings
 *     description: Retrieve a list of all settings objects. Admin access only.
 *     operationId: adminGetAllSettings
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of settings
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 settings:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Settings'
 *   post:
 *     tags: [Admin]
 *     summary: Create a new settings object
 *     description: Create a new settings object. Admin access only.
 *     operationId: adminCreateSettings
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Settings'
 *     responses:
 *       201:
 *         description: Settings object created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Settings'
 *       400:
 *         description: Invalid input
 */
router.get('/settings', auth, isAdmin, adminController.getAllSettings);
router.post('/settings', auth, isAdmin, adminController.createSetting);
/**
 * @swagger
 * /admin/settings/{id}:
 *   get:
 *     tags: [Admin]
 *     summary: Get a settings object by ID
 *     description: Retrieve a settings object by its unique ID. Admin access only.
 *     operationId: adminGetSettings
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Settings ID
 *     responses:
 *       200:
 *         description: Settings object found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Settings'
 *       404:
 *         description: Settings object not found
 *   put:
 *     tags: [Admin]
 *     summary: Update a settings object
 *     description: Update a settings object by ID. Admin access only.
 *     operationId: adminUpdateSettings
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Settings ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Settings'
 *     responses:
 *       200:
 *         description: Settings object updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Settings'
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Settings object not found
 *   delete:
 *     tags: [Admin]
 *     summary: Delete a settings object
 *     description: Delete a settings object by its unique ID. Admin access only.
 *     operationId: adminDeleteSettings
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Settings ID
 *     responses:
 *       204:
 *         description: Settings object deleted
 *       404:
 *         description: Settings object not found
 */
router.get('/settings/:id', auth, isAdmin, adminController.getSetting);
router.put('/settings/:id', auth, isAdmin, adminController.updateSetting);
router.delete('/settings/:id', auth, isAdmin, adminController.deleteSetting);

// --- Bookmarks ---
/**
 * @swagger
 * /admin/bookmarks:
 *   get:
 *     tags: [Admin]
 *     summary: Get all bookmarks
 *     description: Retrieve a list of all bookmarks. Admin access only.
 *     operationId: adminGetAllBookmarks
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
 *   post:
 *     tags: [Admin]
 *     summary: Create a new bookmark
 *     description: Create a new bookmark. Admin access only.
 *     operationId: adminCreateBookmark
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Bookmark'
 *     responses:
 *       201:
 *         description: Bookmark created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Bookmark'
 *       400:
 *         description: Invalid input
 */
router.get('/bookmarks', auth, isAdmin, adminController.getAllBookmarks);
router.post('/bookmarks', auth, isAdmin, adminController.createBookmark);
/**
 * @swagger
 * /admin/bookmarks/{id}:
 *   get:
 *     tags: [Admin]
 *     summary: Get a bookmark by ID
 *     description: Retrieve a bookmark by its unique ID. Admin access only.
 *     operationId: adminGetBookmark
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
 *         description: Bookmark found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Bookmark'
 *       404:
 *         description: Bookmark not found
 *   put:
 *     tags: [Admin]
 *     summary: Update a bookmark
 *     description: Update bookmark details by ID. Admin access only.
 *     operationId: adminUpdateBookmark
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Bookmark ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Bookmark'
 *     responses:
 *       200:
 *         description: Bookmark updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Bookmark'
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Bookmark not found
 *   delete:
 *     tags: [Admin]
 *     summary: Delete a bookmark
 *     description: Delete a bookmark by its unique ID. Admin access only.
 *     operationId: adminDeleteBookmark
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
 *       204:
 *         description: Bookmark deleted
 *       404:
 *         description: Bookmark not found
 */
router.get('/bookmarks/:id', auth, isAdmin, adminController.getBookmark);
router.put('/bookmarks/:id', auth, isAdmin, adminController.updateBookmark);
router.delete('/bookmarks/:id', auth, isAdmin, adminController.deleteBookmark);


/**
 * @swagger
 * /admin/recent-activities:
 *   get:
 *     tags: [Admin]
 *     summary: Get recent system activities
 *     description: Retrieve a chronological list of all system activities including user, market, order, portfolio, settings and bookmark changes. Admin access only.
 *     operationId: adminGetRecentActivities
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of recent activities
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 activities:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       type:
 *                         type: string
 *                       description:
 *                         type: string
 *                       timestamp:
 *                         type: string
 *                         format: date-time
 *                       userId:
 *                         type: string
 *                       marketId:
 *                         type: string
 *                       orderId:
 *                         type: string
 *                       portfolioId:
 *                         type: string
 *                       settingId:
 *                         type: string
 *                       bookmarkId:
 *                         type: string
 *                       data:
 *                         type: object
 *       500:
 *         description: Server error
 */
router.get('/recent-activities', auth, isAdmin, adminController.getRecentActivities);



/**
 * @swagger
 * /admin/withdrawals:
 *   get:
 *     tags: [Admin]
 *     summary: Get all withdrawal requests
 *     description: Retrieve all withdrawal requests, optionally filtered by status. Admin access only.
 *     operationId: adminGetAllWithdrawals
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter withdrawals by status (e.g., pending, approved, rejected, completed, failed)
 *     responses:
 *       200:
 *         description: List of withdrawal requests
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 withdrawals:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Withdrawal'
 *       500:
 *         description: Server error
 */
router.get('/withdrawals', auth, isAdmin, adminController.getAllWithdrawals);

/**
 * @swagger
 * /admin/withdrawals/{id}:
 *   get:
 *     tags: [Admin]
 *     summary: Get a withdrawal request by ID
 *     description: Retrieve a single withdrawal request by its ID. Admin access only.
 *     operationId: adminGetWithdrawal
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The withdrawal request ID
 *     responses:
 *       200:
 *         description: Withdrawal request found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 withdrawal:
 *                   $ref: '#/components/schemas/Withdrawal'
 *       404:
 *         description: Withdrawal request not found
 *       500:
 *         description: Server error
 */
router.get('/withdrawals/:id', auth, isAdmin, adminController.getWithdrawal);

/**
 * @swagger
 * /admin/withdrawals/{id}:
 *   patch:
 *     tags: [Admin]
 *     summary: Update a withdrawal request
 *     description: Update the status, processedAt, or reason of a withdrawal request. Admin access only.
 *     operationId: adminUpdateWithdrawal
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The withdrawal request ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 description: New status (e.g., approved, rejected, completed, failed)
 *               processedAt:
 *                 type: string
 *                 format: date-time
 *                 description: Date/time the withdrawal was processed
 *               reason:
 *                 type: string
 *                 description: Reason for rejection or failure
 *     responses:
 *       200:
 *         description: Withdrawal request updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 withdrawal:
 *                   $ref: '#/components/schemas/Withdrawal'
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Withdrawal request not found
 *       500:
 *         description: Server error
 */
router.patch('/withdrawals/:id', auth, isAdmin, adminController.updateWithdrawal);



module.exports = router; 