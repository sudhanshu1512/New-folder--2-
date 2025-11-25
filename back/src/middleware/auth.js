import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../utils/tokens.js';

// In auth.js middleware
export const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  console.log('Auth middleware - Token received:', token ? 'Token exists' : 'No token');

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'No token provided' 
    });
  }

  try {
    console.log('Verifying token with secret:', JWT_SECRET ? 'Secret exists' : 'No secret');
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('Token verified successfully, user ID:', decoded.id);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Token verification failed:', error.message);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Token expired' 
      });
    }
    
    return res.status(403).json({ 
      success: false, 
      message: 'Invalid token' 
    });
  }
};

export default {
  authenticateJWT
};