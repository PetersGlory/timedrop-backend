# Timedrop Backend

This backend powers the Timedrop platform—a financial prediction market and portfolio management app. It is built with **Node.js**, **Express**, and **Sequelize** (SQL database), and exposes a RESTful API for user management, market data, trading, predictions, and more.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Data Models](#data-models)
- [API Overview](#api-overview)
- [Endpoint Details](#endpoint-details)
  - [Authentication & User](#authentication--user)
  - [Wallet](#wallet)
  - [Markets](#markets)
  - [Orders & Trading](#orders--trading)
  - [Portfolio](#portfolio)
  - [Predictions (AI)](#predictions-ai)
  - [Settings](#settings)
  - [Bookmarks](#bookmarks)
- [Authentication](#authentication)
- [Error Handling](#error-handling)
- [Database Sync](#database-sync)
- [Running the Backend](#running-the-backend)
- [Extending the API](#extending-the-api)
- [API Documentation](#api-documentation)

---

## Tech Stack

- Node.js
- Express.js
- Sequelize ORM (MySQL/PostgreSQL)
- JWT for authentication
- bcryptjs for password hashing
- (Optional) Swagger for API docs

---

## Project Structure

```
backend/
  config/           # Database and environment config
  controllers/      # Business logic for each resource
  middleware/       # Auth and other Express middleware
  models/           # Sequelize models
  routes/           # Express route definitions
  utils/            # Utility functions
  app.js            # Express app entry point
  server.js         # Server startup
```

---

## Data Models

### User

- **Fields:** id (UUID), email, password (hashed), firstName, lastName, phone, gender, isVerified, role, country, jingallyId
- **Password Security:** Passwords are hashed with bcrypt before storage.
- **Instance Methods:** `validatePassword(password)` for login checks.

### Market

- **Fields:** id, category, question, image (url, hint), history (array of {date, volume}), startDate, endDate

### Order

- **Fields:** id, marketId, marketName, type ('BUY' | 'SELL'), price, quantity, status ('Open' | 'Filled' | 'Cancelled')

### Portfolio

- **Fields:** userId, holdings (array of marketId, quantity, etc.), openOrders, filledOrders

### Settings

- **Fields:** userId, notificationPreferences (object), other user preferences

### Bookmark

- **Fields:** userId, marketId

---

## API Overview

| Endpoint                        | Method | Description                                                      | Used By (Frontend Page)         |
|----------------------------------|--------|------------------------------------------------------------------|---------------------------------|
| `/api/auth/register`            | POST   | Register a new user                                              | `/account/page.tsx`             |
| `/api/auth/login`               | POST   | User login                                                       | `/account/page.tsx`             |
| `/api/auth/logout`              | POST   | User logout                                                      | `/account/page.tsx`             |
| `/api/users/profile`            | GET    | Get current user profile                                         | `/settings/page.tsx`, `/account/page.tsx` |
| `/api/users/profile`            | PUT    | Update user profile                                              | `/settings/page.tsx`            |
| `/api/users/change-password`    | PUT    | Change user password                                             | `/settings/page.tsx`            |
| `/api/wallet`                   | GET    | Get wallet balance                                               | `/account/page.tsx`             |
| `/api/wallet/deposit`           | POST   | Deposit funds                                                    | `/account/page.tsx`             |
| `/api/wallet/withdraw`          | POST   | Withdraw funds                                                   | `/account/page.tsx`             |
| `/api/markets`                  | GET    | List all markets/instruments                                     | `/`, `/markets/[id]/page.tsx`   |
| `/api/markets/:id`              | GET    | Get details for a specific market/instrument                     | `/markets/[id]/page.tsx`        |
| `/api/orders`                   | GET    | Get user’s open and filled orders                                | `/portfolio/page.tsx`           |
| `/api/orders`                   | POST   | Place a new order (trade)                                        | `/markets/[id]/page.tsx`        |
| `/api/orders/:id/cancel`        | POST   | Cancel an open order                                             | `/portfolio/page.tsx`           |
| `/api/portfolio`                | GET    | Get the user's portfolio                                         | `/portfolio/page.tsx`           |
| `/api/predict`                  | POST   | Submit a prediction request (AI)                                 | `/predict/page.tsx`             |
| `/api/settings`                 | GET    | Get user settings                                                | `/settings/page.tsx`            |
| `/api/settings`                 | POST   | Create/update user settings                                      | `/settings/page.tsx`            |
| `/api/settings/notifications`   | PATCH  | Update notification preferences                                  | `/settings/page.tsx`            |
| `/api/bookmarks`                | GET    | List user bookmarks                                              | `/portfolio/page.tsx`, `/settings/page.tsx` |
| `/api/bookmarks`                | POST   | Add a new bookmark                                               | `/portfolio/page.tsx`, `/settings/page.tsx` |
| `/api/bookmarks/:id`            | DELETE | Remove a bookmark                                                | `/portfolio/page.tsx`, `/settings/page.tsx` |

---

## Endpoint Details

### Authentication & User

#### `POST /api/auth/register`
- **Description:** Register a new user.
- **Body:** `{ "email": "string", "password": "string", "firstName": "string", "lastName": "string", ... }`
- **Response:** `{ "success": true, "user": { ... } }`

#### `POST /api/auth/login`
- **Description:** Log in a user.
- **Body:** `{ "email": "string", "password": "string" }`
- **Response:** `{ "success": true, "token": "JWT", "user": { ... } }`

#### `POST /api/auth/logout`
- **Description:** Log out the current user (client-side token removal).
- **Body:** None
- **Response:** `{ "success": true }`

#### `GET /api/users/profile`
- **Description:** Get the authenticated user's profile.
- **Headers:** `Authorization: Bearer <token>`
- **Response:** User object (excluding password).

#### `PUT /api/users/profile`
- **Description:** Update user profile fields.
- **Headers:** `Authorization: Bearer <token>`
- **Body:** `{ "firstName": "string", "lastName": "string", "phone": "string" }`
- **Response:** Updated user object.

#### `PUT /api/users/change-password`
- **Description:** Change user password.
- **Headers:** `Authorization: Bearer <token>`
- **Body:** `{ "currentPassword": "string", "newPassword": "string" }`
- **Response:** `{ "message": "Password updated successfully" }`

---

### Wallet

#### `GET /api/wallet`
- **Description:** Get the user's wallet balance.
- **Headers:** `Authorization: Bearer <token>`
- **Response:** `{ "balance": number }`

#### `POST /api/wallet/deposit`
- **Description:** Deposit funds into the wallet.
- **Headers:** `Authorization: Bearer <token>`
- **Body:** `{ "amount": number }`
- **Response:** `{ "success": true, "balance": number }`

#### `POST /api/wallet/withdraw`
- **Description:** Withdraw funds from the wallet.
- **Headers:** `Authorization: Bearer <token>`
- **Body:** `{ "amount": number }`
- **Response:** `{ "success": true, "balance": number }`

---

### Markets

#### `GET /api/markets`
- **Description:** List all available markets/instruments.
- **Response:** `{ "markets": [ ... ] }`

#### `GET /api/markets/:id`
- **Description:** Get details for a specific market/instrument.
- **Response:** `{ "market": { ... } }`

---

### Orders & Trading

#### `GET /api/orders`
- **Description:** Get the user's open and filled orders.
- **Headers:** `Authorization: Bearer <token>`
- **Response:** `{ "openOrders": [ ... ], "filledOrders": [ ... ] }`

#### `POST /api/orders`
- **Description:** Place a new order (trade) on a market.
- **Headers:** `Authorization: Bearer <token>`
- **Body:** `{ "marketId": "string", "type": "BUY" | "SELL", "quantity": number }`
- **Response:** `{ "success": true, "order": { ... } }`

#### `POST /api/orders/:id/cancel`
- **Description:** Cancel an open order.
- **Headers:** `Authorization: Bearer <token>`
- **Response:** `{ "success": true }`

---

### Portfolio

#### `GET /api/portfolio`
- **Description:** Get the user's portfolio, including holdings, open orders, and filled orders.
- **Headers:** `Authorization: Bearer <token>`
- **Response:** `{ "portfolio": { ... } }`

---

### Predictions (AI)

#### `POST /api/predict`
- **Description:** Submit a prediction for a financial instrument or market condition (AI-powered).
- **Headers:** `Authorization: Bearer <token>`
- **Body:** `{ "prompt": "string" }`
- **Response:** `{ "success": true, "prediction": "string" }`

---

### Settings

#### `GET /api/settings`
- **Description:** Get user settings.
- **Headers:** `Authorization: Bearer <token>`
- **Response:** `{ "settings": { ... } }`

#### `POST /api/settings`
- **Description:** Create or update user settings.
- **Headers:** `Authorization: Bearer <token>`
- **Body:** Settings fields.
- **Response:** `{ "success": true, "settings": { ... } }`

#### `PATCH /api/settings/notifications`
- **Description:** Update notification preferences.
- **Headers:** `Authorization: Bearer <token>`
- **Body:** Notification preferences object.
- **Response:** `{ "success": true, "settings": { ... } }`

---

### Bookmarks

#### `GET /api/bookmarks`
- **Description:** List all bookmarks for the user.
- **Headers:** `Authorization: Bearer <token>`
- **Response:** `{ "bookmarks": [ ... ] }`

#### `POST /api/bookmarks`
- **Description:** Add a new bookmark.
- **Headers:** `Authorization: Bearer <token>`
- **Body:** `{ "marketId": "string" }`
- **Response:** `{ "success": true, "bookmark": { ... } }`

#### `DELETE /api/bookmarks/:id`
- **Description:** Remove a bookmark.
- **Headers:** `Authorization: Bearer <token>`
- **Response:** `{ "success": true }`

---

## Authentication

- All protected endpoints require a JWT in the `Authorization: Bearer <token>` header.
- Use the `/api/auth/login` endpoint to obtain a token.

---

## Error Handling

- All errors return a JSON object:
  ```json
  { "success": false, "message": "Error message", "error": "Optional error details" }
  ```
- Validation errors return a 400 status and an array of field errors.

---

## Database Sync

- Models are synced using Sequelize.
- See `models/index.js` for the `syncDatabase` function.
- In development, tables are auto-altered; in production, use migrations.

---

## Running the Backend

1. **Install dependencies:**
   ```bash
   yarn install
   ```

2. **Configure environment variables:**  
   Copy `.env.example` to `.env` and fill in the required values (DB connection, JWT secret, etc.).

3. **Sync the database:**
   ```bash
   node models/index.js
   ```

4. **Start the server:**
   ```bash
   yarn start
   ```

---

## Extending the API

- Add new models in `models/`.
- Add business logic in `controllers/`.
- Define new routes in `routes/`.
- Register routes in `app.js`.
- Document new endpoints with Swagger comments for auto-generated API docs.

---

## API Documentation

- Swagger/OpenAPI docs are available (if enabled) at `/api-docs`.

---

## Mapping to Frontend Pages

| Frontend Page/Feature         | Backend Endpoint(s) Used                                                                 |
|------------------------------|------------------------------------------------------------------------------------------|
| `/` (Live Markets)           | `GET /api/markets`                                                                       |
| `/markets/[id]`              | `GET /api/markets/:id`, `POST /api/orders`                                              |
| `/portfolio`                 | `GET /api/portfolio`, `GET /api/orders`, `POST /api/orders/:id/cancel`                  |
| `/predict`                   | `POST /api/predict`                                                                      |
| `/account` (Wallet)          | `GET /api/wallet`, `POST /api/wallet/deposit`, `POST /api/wallet/withdraw`              |
| `/settings`                  | `GET /api/settings`, `POST /api/settings`, `PATCH /api/settings/notifications`          |
| Bookmarks (any page)         | `GET /api/bookmarks`, `POST /api/bookmarks`, `DELETE /api/bookmarks/:id`                |
| User Profile/Password        | `GET /api/users/profile`, `PUT /api/users/profile`, `PUT /api/users/change-password`    |

---

For more details, see the [Blueprint](../docs/blueprint.md) or the source code in the `backend/` directory. 