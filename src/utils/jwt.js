const jwt = require('jsonwebtoken');

const generateToken = (user, expiresIn = '7d') => {
    return jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn
    });
};

module.exports = { generateToken };