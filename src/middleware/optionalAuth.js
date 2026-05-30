const jwt = require('jsonwebtoken');

function optionalAuthenticate(req, _res, next) {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    try {
      const payload = jwt.verify(header.slice(7), process.env.JWT_SECRET);
      req.user = { id: payload.sub, email: payload.email };
    } catch {
      /* ignore invalid token */
    }
  }
  next();
}

module.exports = { optionalAuthenticate };
