const crypto = require('crypto');

/**
 * Middleware to verify Flutterwave webhook signature
 * This middleware captures the raw body and verifies the webhook signature
 */
const verifyFlutterwaveWebhook = (req, res, next) => {
  try {
    // Get the signature from headers
    const flutterwaveSignature = req.headers['flutterwave-signature'];
    const secretHash = process.env.FLUTTERWAVE_SECRET_HASH;

    if (!flutterwaveSignature) {
      console.log('No Flutterwave signature provided');
      return res.status(401).json({ error: 'No signature provided' });
    }

    if (!secretHash) {
      console.log('Flutterwave secret hash not configured');
      return res.status(500).json({ error: 'Webhook secret not configured' });
    }

    // Verify the signature
    const hash = crypto
      .createHmac('sha256', secretHash)
      .update(req.rawBody)
      .digest('base64');

    if (hash !== flutterwaveSignature) {
      console.log('Invalid webhook signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    console.log('Webhook signature verified successfully');
    next();
  } catch (error) {
    console.error('Webhook verification error:', error);
    return res.status(500).json({ error: 'Webhook verification failed' });
  }
};

/**
 * Middleware to capture raw body for webhook signature verification
 * This must be used before the webhook verification middleware
 */
const captureRawBody = (req, res, next) => {
  if (req.originalUrl === '/api/webhooks/flutterwave') {
    let data = '';
    req.setEncoding('utf8');
    
    req.on('data', (chunk) => {
      data += chunk;
    });
    
    req.on('end', () => {
      req.rawBody = data;
      next();
    });
  } else {
    next();
  }
};

module.exports = {
  verifyFlutterwaveWebhook,
  captureRawBody
};
