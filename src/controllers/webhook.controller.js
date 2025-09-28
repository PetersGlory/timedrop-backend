const { Withdrawal, Wallet, Transaction, User } = require('../models');
const notificationService = require('../services/notification.service');
const { default: axios } = require('axios');

// Flutterwave configuration
const FLUTTERWAVE_SECRET_KEY = process.env.FLUTTERWAVE_SECRET_KEY;
const FLUTTERWAVE_BASE_URL = 'https://api.flutterwave.com/v3';

/**
 * Main webhook handler for Flutterwave events
 */
const handleWebhook = async (req, res) => {
  try {
    // For JWT-based webhooks, use the decoded payload from the token
    // For regular webhooks, use the request body
    const payload = req.webhookPayload || req.body;
    console.log('Flutterwave webhook received:', JSON.stringify(payload, null, 2));

    // Handle different event types
    switch (payload.type) {
      case 'transfer.completed':
        await handleTransferCompleted(payload);
        break;
      case 'transfer.failed':
        await handleTransferFailed(payload);
        break;
      case 'transfer.reversed':
        await handleTransferReversed(payload);
        break;
      case 'charge.completed':
        await handleChargeCompleted(payload);
        break;
      case 'charge.failed':
        await handleChargeFailed(payload);
        break;
      default:
        console.log('Unhandled webhook event type:', payload.type);
    }

    // Always respond with 200 to acknowledge receipt
    res.status(200).json({ status: 'success', message: 'Webhook processed' });

  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ status: 'error', message: 'Webhook processing failed' });
  }
};

/**
 * Handle successful transfer/withdrawal
 */
const handleTransferCompleted = async (payload) => {
  const { data } = payload;
  
  try {
    console.log(`Transfer completed: ${data.id}`);
    console.log(`Amount: ${data.amount} ${data.currency}`);
    console.log(`Status: ${data.status}`);
    console.log(`Reference: ${data.reference}`);
    
    // Find the withdrawal record by Flutterwave transfer ID
    const withdrawal = await Withdrawal.findOne({
      where: { flutterwaveTransferId: data.id }
    });

    if (!withdrawal) {
      console.log(`Withdrawal not found for transfer ID: ${data.id}`);
      return;
    }

    // Update withdrawal status
    await withdrawal.update({
      status: 'completed',
      processedAt: new Date()
    });

    // Update transaction status
    await Transaction.update(
      { status: 'completed' },
      { 
        where: { 
          reference: data.reference,
          type: 'withdrawal'
        }
      }
    );

    // Get user for notification
    const user = await User.findByPk(withdrawal.userId);
    if (user) {
      // Send notification
      await notificationService.sendEmailNotification(
        user.email,
        'Withdrawal Completed',
        `
          <h2>Withdrawal Completed Successfully</h2>
          <p>Your withdrawal of ${data.amount} ${data.currency} has been completed.</p>
          <p>Reference: ${data.reference}</p>
          <p>Transfer ID: ${data.id}</p>
          <p>Completed at: ${new Date().toLocaleString()}</p>
        `
      );
    }

    // Log the transaction
    await logTransaction(data, 'withdrawal_completed');
    
  } catch (error) {
    console.error('Error handling transfer completed:', error);
  }
};

/**
 * Handle failed transfer/withdrawal
 */
const handleTransferFailed = async (payload) => {
  const { data } = payload;
  
  try {
    console.log(`Transfer failed: ${data.id}`);
    console.log(`Reason: ${data.complete_message || 'Unknown reason'}`);
    
    // Find the withdrawal record
    const withdrawal = await Withdrawal.findOne({
      where: { flutterwaveTransferId: data.id }
    });

    if (!withdrawal) {
      console.log(`Withdrawal not found for transfer ID: ${data.id}`);
      return;
    }

    // Update withdrawal status
    await withdrawal.update({
      status: 'failed',
      reason: data.complete_message || 'Transfer failed'
    });

    // Update transaction status
    await Transaction.update(
      { status: 'failed' },
      { 
        where: { 
          reference: data.reference,
          type: 'withdrawal'
        }
      }
    );

    // Refund user balance
    await refundUserBalance(withdrawal.userId, withdrawal.amount);

    // Get user for notification
    const user = await User.findByPk(withdrawal.userId);
    if (user) {
      await notificationService.sendEmailNotification(
        user.email,
        'Withdrawal Failed',
        `
          <h2>Withdrawal Failed</h2>
          <p>Your withdrawal of ${data.amount} ${data.currency} has failed.</p>
          <p>Reason: ${data.complete_message || 'Unknown reason'}</p>
          <p>Reference: ${data.reference}</p>
          <p>The amount has been refunded to your wallet.</p>
        `
      );
    }

    // Log the transaction
    await logTransaction(data, 'withdrawal_failed');
    
  } catch (error) {
    console.error('Error handling transfer failed:', error);
  }
};

/**
 * Handle reversed transfer
 */
const handleTransferReversed = async (payload) => {
  const { data } = payload;
  
  try {
    console.log(`Transfer reversed: ${data.id}`);
    
    // Find the withdrawal record
    const withdrawal = await Withdrawal.findOne({
      where: { flutterwaveTransferId: data.id }
    });

    if (!withdrawal) {
      console.log(`Withdrawal not found for transfer ID: ${data.id}`);
      return;
    }

    // Update withdrawal status
    await withdrawal.update({
      status: 'reversed',
      reason: 'Transfer reversed by Flutterwave'
    });

    // Update transaction status
    await Transaction.update(
      { status: 'cancelled' },
      { 
        where: { 
          reference: data.reference,
          type: 'withdrawal'
        }
      }
    );

    // Refund user balance
    await refundUserBalance(withdrawal.userId, withdrawal.amount);

    // Get user for notification
    const user = await User.findByPk(withdrawal.userId);
    if (user) {
      await notificationService.sendEmailNotification(
        user.email,
        'Withdrawal Reversed',
        `
          <h2>Withdrawal Reversed</h2>
          <p>Your withdrawal of ${data.amount} ${data.currency} has been reversed.</p>
          <p>Reference: ${data.reference}</p>
          <p>The amount has been refunded to your wallet.</p>
        `
      );
    }

    // Log the transaction
    await logTransaction(data, 'withdrawal_reversed');
    
  } catch (error) {
    console.error('Error handling transfer reversed:', error);
  }
};

/**
 * Handle completed charges (for incoming payments)
 */
const handleChargeCompleted = async (payload) => {
  const { data } = payload;
  
  try {
    console.log(`Charge completed: ${data.id}`);
    
    // Verify the transaction with Flutterwave
    const verificationResponse = await verifyTransaction(data.id);
    
    if (verificationResponse.status === 'successful') {
      console.log(`Payment verified: ${data.id}`);
      
      // Find user by email or phone
      const user = await User.findOne({
        where: {
          $or: [
            { email: data.customer?.email },
            { phone: data.customer?.phone_number }
          ]
        }
      });

      if (!user) {
        console.log(`User not found for charge: ${data.id}`);
        return;
      }

      // Update user balance
      await updateUserBalance(user.id, data.amount);

      // Create transaction record
      await Transaction.create({
        userId: user.id,
        type: 'deposit',
        amount: data.amount,
        status: 'completed',
        description: 'Wallet deposit via Flutterwave',
        reference: data.tx_ref,
        metadata: {
          flutterwaveTransactionId: data.id,
          payment_method: data.payment_type,
          currency: data.currency,
          customer_email: data.customer?.email,
          customer_phone: data.customer?.phone_number
        }
      });

      // Send notification
      await notificationService.sendEmailNotification(
        user.email,
        'Payment Received',
        `
          <h2>Payment Received Successfully</h2>
          <p>Your payment of ${data.amount} ${data.currency} has been received.</p>
          <p>Reference: ${data.tx_ref}</p>
          <p>Transaction ID: ${data.id}</p>
          <p>Your wallet has been credited.</p>
        `
      );

      // Log the transaction
      await logTransaction(data, 'payment_completed');
    }
    
  } catch (error) {
    console.error('Error handling charge completed:', error);
  }
};

/**
 * Handle failed charges
 */
const handleChargeFailed = async (payload) => {
  const { data } = payload;
  
  try {
    console.log(`Charge failed: ${data.id}`);
    
    // Find user by email or phone
    const user = await User.findOne({
      where: {
        $or: [
          { email: data.customer?.email },
          { phone: data.customer?.phone_number }
        ]
      }
    });

    if (user) {
      await notificationService.sendEmailNotification(
        user.email,
        'Payment Failed',
        `
          <h2>Payment Failed</h2>
          <p>Your payment of ${data.amount} ${data.currency} has failed.</p>
          <p>Reference: ${data.tx_ref}</p>
          <p>Please try again or contact support if the issue persists.</p>
        `
      );
    }

    // Log the transaction
    await logTransaction(data, 'payment_failed');
    
  } catch (error) {
    console.error('Error handling charge failed:', error);
  }
};

/**
 * Refund user balance after failed/reversed withdrawal
 */
const refundUserBalance = async (userId, amount) => {
  try {
    const wallet = await Wallet.findOne({ where: { userId } });
    if (wallet) {
      const newBalance = parseFloat(wallet.balance) + parseFloat(amount);
      await wallet.update({ balance: newBalance });
      console.log(`Refunded ${amount} to user ${userId}. New balance: ${newBalance}`);
    }
  } catch (error) {
    console.error('Error refunding user balance:', error);
  }
};

/**
 * Update user balance after successful payment
 */
const updateUserBalance = async (userId, amount) => {
  try {
    const wallet = await Wallet.findOne({ where: { userId } });
    if (wallet) {
      const newBalance = parseFloat(wallet.balance) + parseFloat(amount);
      await wallet.update({ balance: newBalance });
      console.log(`Updated balance for user ${userId}: +${amount}. New balance: ${newBalance}`);
    } else {
      // Create wallet if it doesn't exist
      await Wallet.create({
        userId,
        balance: amount,
        currency: 'NGN'
      });
      console.log(`Created wallet for user ${userId} with balance: ${amount}`);
    }
  } catch (error) {
    console.error('Error updating user balance:', error);
  }
};

/**
 * Verify transaction with Flutterwave
 */
const verifyTransaction = async (transactionId) => {
  try {
    const response = await axios.get(
      `${FLUTTERWAVE_BASE_URL}/transactions/${transactionId}/verify`,
      {
        headers: {
          'Authorization': `Bearer ${FLUTTERWAVE_SECRET_KEY}`
        }
      }
    );
    return response.data.data;
  } catch (error) {
    console.error('Transaction verification failed:', error);
    throw error;
  }
};

/**
 * Log transaction for audit purposes
 */
const logTransaction = async (data, eventType) => {
  try {
    console.log(`Logging transaction: ${data.id} - ${eventType}`);
    
    // You can implement additional logging here, such as:
    // - Log to a separate audit table
    // - Send to external logging service
    // - Store in a log file
    
    // For now, we'll just log to console
    console.log(`Transaction Log:`, {
      transactionId: data.id,
      eventType: eventType,
      amount: data.amount,
      currency: data.currency,
      status: data.status,
      timestamp: new Date(),
      rawData: data
    });
  } catch (error) {
    console.error('Error logging transaction:', error);
  }
};

module.exports = {
  handleWebhook
};
