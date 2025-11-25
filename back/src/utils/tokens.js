import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
export { JWT_SECRET };

const JWT_EXPIRES_IN = '1d';
const RESET_TOKEN_EXPIRES_IN = '30m';


// Sign JWT token
export function signAccessToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// Verify JWT token
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

// Create password reset token
export function createResetToken(userId) {
  return jwt.sign(
    { id: userId },
    JWT_SECRET + '-reset', // Different secret for reset tokens
    { expiresIn: RESET_TOKEN_EXPIRES_IN }
  );
}

// Hash password
export async function hash(password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

// Compare password
export async function comparePassword(password, hashedPassword) {
  return bcrypt.compare(password, hashedPassword);
}