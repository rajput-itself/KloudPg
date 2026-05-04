import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'pg-booking-secret-key-2026-india';
const JWT_EXPIRY = '7d';

export function hashPassword(password) {
  return bcrypt.hashSync(password, 10);
}

export function comparePassword(password, hash) {
  return bcrypt.compareSync(password, hash);
}

export function createToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRY }
  );
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

export function getUserFromRequest(request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    // Also check cookies
    const cookieHeader = request.headers.get('cookie');
    if (cookieHeader) {
      const tokenCookie = cookieHeader.split(';').find(c => c.trim().startsWith('token='));
      if (tokenCookie) {
        const token = tokenCookie.split('=')[1]?.trim();
        return verifyToken(token);
      }
    }
    return null;
  }
  const token = authHeader.substring(7);
  return verifyToken(token);
}
