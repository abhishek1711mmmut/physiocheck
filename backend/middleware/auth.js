const jwt = require('jsonwebtoken');
const sendResponse = require('../utils/response');

module.exports = function(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendResponse(res, 401, false, null, 'No token provided', 'No token provided');
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id };
    next();
  } catch (err) {
    return sendResponse(res, 401, false, null, 'Invalid token', 'Invalid token');
  }
};
