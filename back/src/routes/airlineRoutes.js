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

// GET /api/airlines/suggest?q=<query>
router.get('/suggest', async (req, res) => {
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
    
    // Search for airlines by name or code
    const query = `
      SELECT TOP 10 
        AL_Code as code,
        AL_Name as name
      FROM AirLineNames 
      WHERE UPPER(AL_Name) LIKE @query OR UPPER(AL_Code) LIKE @query
      ORDER BY 
        CASE 
          WHEN UPPER(AL_Code) = UPPER(@exactQuery) THEN 0
          WHEN UPPER(AL_Name) = UPPER(@exactQuery) THEN 1
          WHEN UPPER(AL_Code) LIKE @startsWithQuery THEN 2
          WHEN UPPER(AL_Name) LIKE @startsWithQuery THEN 3
          ELSE 4
        END,
        LEN(AL_Code) ASC,
        LEN(AL_Name) ASC`;

    const searchQuery = `%${q.toUpperCase()}%`;
    request.input('query', sql.NVarChar, searchQuery);
    request.input('exactQuery', sql.NVarChar, q);
    request.input('startsWithQuery', sql.NVarChar, `${q.toUpperCase()}%`);

    const result = await request.query(query);
    
    // Format the response to match the expected frontend format
    const airlines = result.recordset.map(airline => ({
      code: airline.code,
      name: airline.name,
      display: `${airline.name} (${airline.code})`
    }));

    res.json(airlines);
  } catch (error) {
    logger.error('Error searching for airlines:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
