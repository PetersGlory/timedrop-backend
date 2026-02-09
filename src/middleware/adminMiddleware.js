// Simple isAdmin middleware
function isAdmin(req, res, next) {
  if (
    req.user &&
    (req.user.role === 'admin' ||
      req.user.role === 'super_admin' ||
      req.user.role === 'manager')
  ) {
    return next();
  }
  return res.status(403).json({ message: 'Forbidden: Admins, Super Admins, or Managers only' });
}

module.exports = isAdmin;