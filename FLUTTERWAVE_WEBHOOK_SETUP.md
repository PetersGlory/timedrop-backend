# Flutterwave Webhook Implementation

This document provides a comprehensive guide for the Flutterwave webhook implementation in the TimeDrop backend.

## Overview

The webhook system handles real-time notifications from Flutterwave for various payment and transfer events. It ensures that your application stays synchronized with Flutterwave's payment processing status.

## Features

- **Signature Verification**: Secure webhook signature validation using HMAC-SHA256
- **Event Handling**: Support for multiple Flutterwave event types
- **Database Integration**: Automatic updates to withdrawals, transactions, and wallet balances
- **User Notifications**: Email notifications for payment status changes
- **Error Handling**: Comprehensive error handling and logging
- **Audit Trail**: Transaction logging for compliance and debugging

## Supported Events

### Transfer Events
- `transfer.completed` - Successful withdrawal/transfer
- `transfer.failed` - Failed withdrawal/transfer
- `transfer.reversed` - Reversed withdrawal/transfer

### Payment Events
- `charge.completed` - Successful payment/deposit
- `charge.failed` - Failed payment/deposit

## File Structure

```
src/
├── middleware/
│   └── flutterwaveWebhookValidation.js  # Webhook signature verification
├── controllers/
│   └── webhook.controller.js            # Webhook event handlers
├── routes/
│   └── webhook.routes.js                # Webhook routes
└── app.js                               # Updated with webhook routes
```

## Environment Variables

Add these to your `.env` file:

```env
# Flutterwave Configuration
FLUTTERWAVE_PUBLIC_KEY=your_public_key
FLUTTERWAVE_SECRET_KEY=your_secret_key
FLUTTERWAVE_SECRET_HASH=your_webhook_secret_hash

# Email Configuration (for notifications)
SMTP_HOST=your_smtp_host
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password
SMTP_FROM=noreply@yourdomain.com
```

## API Endpoints

### Webhook Endpoint
```
POST /api/webhooks/flutterwave
```

**Headers:**
- `Content-Type: application/json`
- `flutterwave-signature: <signature>`

**Body:** Flutterwave webhook payload

**Response:**
```json
{
  "status": "success",
  "message": "Webhook processed"
}
```

### Legacy Endpoint (Deprecated)
```
POST /api/wallet/webhook
```
Returns a 410 status with information about the new endpoint.

## Webhook Configuration in Flutterwave Dashboard

1. Log in to your Flutterwave dashboard
2. Go to Settings > Webhooks
3. Add a new webhook with the following details:
   - **URL**: `https://yourdomain.com/api/webhooks/flutterwave`
   - **Events**: Select the events you want to receive:
     - Transfer completed
     - Transfer failed
     - Transfer reversed
     - Charge completed
     - Charge failed
   - **Secret Hash**: Use the same value as `FLUTTERWAVE_SECRET_HASH` in your `.env`

## Event Handling Details

### Transfer Completed
- Updates withdrawal status to 'completed'
- Updates transaction status to 'completed'
- Sends success notification to user
- Logs the transaction

### Transfer Failed
- Updates withdrawal status to 'failed'
- Updates transaction status to 'failed'
- Refunds the amount to user's wallet
- Sends failure notification to user
- Logs the transaction

### Transfer Reversed
- Updates withdrawal status to 'reversed'
- Updates transaction status to 'cancelled'
- Refunds the amount to user's wallet
- Sends reversal notification to user
- Logs the transaction

### Charge Completed
- Verifies transaction with Flutterwave
- Updates user's wallet balance
- Creates transaction record
- Sends success notification to user
- Logs the transaction

### Charge Failed
- Sends failure notification to user
- Logs the transaction

## Security Features

### Signature Verification
The webhook uses HMAC-SHA256 signature verification to ensure requests are from Flutterwave:

```javascript
const hash = crypto
  .createHmac('sha256', secretHash)
  .update(rawBody)
  .digest('base64');
```

### Raw Body Capture
The middleware captures the raw request body before JSON parsing to ensure accurate signature verification.

## Database Models Used

### Withdrawal Model
- `flutterwaveTransferId`: Links to Flutterwave transfer ID
- `status`: Tracks withdrawal status
- `processedAt`: Timestamp of processing

### Transaction Model
- `type`: 'deposit' or 'withdrawal'
- `status`: Transaction status
- `metadata`: Additional Flutterwave data

### Wallet Model
- `balance`: User's current balance
- `currency`: Wallet currency (default: NGN)

## Error Handling

The webhook implementation includes comprehensive error handling:

- **Invalid Signature**: Returns 401 with error message
- **Missing Configuration**: Returns 500 for missing environment variables
- **Processing Errors**: Logs errors and returns 500
- **Database Errors**: Handles database connection and query errors

## Testing

### Local Testing
Use tools like ngrok to expose your local server:

```bash
# Install ngrok
npm install -g ngrok

# Start your server
npm run dev

# In another terminal, expose your local server
ngrok http 3000

# Use the ngrok URL in Flutterwave webhook configuration
```

### Webhook Testing
You can test webhooks using Flutterwave's test events or by creating test transactions.

## Monitoring and Logging

The webhook implementation includes extensive logging:

- Webhook receipt confirmation
- Signature verification status
- Event processing results
- Error details
- Transaction updates

Check your application logs for webhook activity and any issues.

## Troubleshooting

### Common Issues

1. **Invalid Signature Error**
   - Verify `FLUTTERWAVE_SECRET_HASH` matches Flutterwave dashboard
   - Ensure raw body is captured correctly

2. **Webhook Not Receiving Events**
   - Check Flutterwave webhook configuration
   - Verify endpoint URL is accessible
   - Check server logs for errors

3. **Database Update Failures**
   - Verify database connection
   - Check model relationships
   - Review transaction constraints

### Debug Mode
Enable detailed logging by setting:
```env
NODE_ENV=development
```

## Security Best Practices

1. **Always verify webhook signatures**
2. **Use HTTPS for webhook endpoints**
3. **Keep webhook secrets secure**
4. **Implement rate limiting if needed**
5. **Monitor webhook activity for anomalies**

## Support

For issues with this webhook implementation:

1. Check the application logs
2. Verify Flutterwave webhook configuration
3. Test with Flutterwave's webhook testing tools
4. Review the Flutterwave API documentation

## Changelog

- **v1.0.0**: Initial webhook implementation
  - Signature verification
  - Event handling for transfers and charges
  - Database integration
  - User notifications
  - Comprehensive error handling
