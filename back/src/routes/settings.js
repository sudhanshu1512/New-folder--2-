// Backend routes for settings (logo, etc.)
import { Router } from 'express';
import sql from 'mssql';
import { getDbPool } from '../db.js';
import logger from '../utils/logger.js';

const router = Router();

// GET /api/logo - Get logo URL
router.get('/logo', async (req, res) => {
  try {
    const pool = await getDbPool();
    const result = await pool.request()
      .query('SELECT TOP 1 url FROM LogoUrl');
    
    if (result.recordset.length > 0) {
      return res.json({ success: true, url: result.recordset[0].url });
    }
    return res.status(404).json({ success: false, message: 'No logo found' });
  } catch (error) {
    logger.error('Error fetching logo:', { error: error.message, stack: error.stack });
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router;