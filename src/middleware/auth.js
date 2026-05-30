const jwt = require('jsonwebtoken');
const { httpError } = require('./errorHandler');

function authenticate(req, _res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return next(httpError(401, 'Unauthorized'));
  }
  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.sub, email: payload.email };
    return next();
  } catch {
    return next(httpError(401, 'Unauthorized'));
  }
}

module.exports = { authenticate };
