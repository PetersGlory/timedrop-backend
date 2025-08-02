// Middleware to verify Flutterwave secret key
const FLUTTERWAVE_SECRET_KEY = process.env.FLUTTERWAVE_SECRET_KEY;

const verifyFlutterwaveKey = (req, res, next) => {
  if (!FLUTTERWAVE_SECRET_KEY) {
    return res.status(500).json({ error: 'Flutterwave secret key not configured' });
  }
  next();
};

module.exports = verifyFlutterwaveKey;