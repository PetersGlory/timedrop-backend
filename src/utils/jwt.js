const jwt = require('jsonwebtoken');

const generateToken = (user, expiresIn = '15m') => {
    return jwt.sign(
    {
      id: user.id,
      type: 'access'
    },
    process.env.JWT_SECRET,
    {
      expiresIn: expiresIn
    }
  );
};

module.exports = { generateToken };