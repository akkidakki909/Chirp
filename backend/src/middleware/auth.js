import jwt from 'jsonwebtoken';

export function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ error: 'Missing token' });
  try {
    const payload = jwt.verify(header.slice(7), process.env.JWT_SECRET);
    req.userId = payload.sub;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// Attaches req.userId if a valid token is present, but doesn't block the request.
export function optionalAuth(req, _res, next) {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    try {
      req.userId = jwt.verify(header.slice(7), process.env.JWT_SECRET).sub;
    } catch { /* ignore */ }
  }
  next();
}
