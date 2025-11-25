import express from 'express';
import sql from 'mssql';
import { getDbPool } from '../db.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Middleware to log requests
router.use((req, res, next) => {
  logger.info(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// GET /api/airports/search?q=<query>
router.get('/search', async (req, res) => {
  const { q } = req.query;

  if (!q) {
    return res.status(400).json({ message: 'Search query (q) is required.' });
  }

  // Add validation for minimum query length
  if (q.length < 2) {
    return res.status(400).json({ message: 'Search query must be at least 2 characters long.' });
  }

  try {
    const pool = await getDbPool();
    const request = pool.request();
    
    // Add the input parameter for the stored procedure
    request.input('query', sql.NVarChar, `%${q}%`);

    // Execute the stored procedure
    const result = await request.execute('dbo.SearchAirports');

    res.json(result.recordset);
  } catch (error) {
    logger.error('Error searching for airports:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;