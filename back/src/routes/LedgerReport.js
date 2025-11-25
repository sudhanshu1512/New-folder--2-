import express from 'express';
import { getDbPool } from '../db.js'; 
import logger from '../utils/logger.js'; 

const router = express.Router();


// api/ledger
router.get('/', async (req, res) => {
  try {
    const { AgentID, fromDate, toDate } = req.query;
    
    // Build the query with filters
    let query = 'SELECT * FROM LedgerDetails WHERE 1=1';
    
    if (AgentID) {
      query += ' AND AgentID = @AgentID';
    }
    
    if (fromDate) {
      query += ' AND CONVERT(DATE, CreatedDate) >= CONVERT(DATE, @fromDate)';
    }
    
    if (toDate) {
      query += ' AND CONVERT(DATE, CreatedDate) <= CONVERT(DATE, @toDate)';
    }
    
    query += ' ORDER BY CreatedDate DESC';
    
    const pool = await getDbPool();
    const request = pool.request();
    
    if (AgentID) {
      request.input('AgentID', AgentID);
    }
    
    if (fromDate) {
      request.input('fromDate', fromDate);
    }
    
    if (toDate) {
      request.input('toDate', toDate);
    }
    
    const result = await request.query(query);
    res.json(result.recordset); // SQL Server results are in recordset
  } catch (error) {
    logger.error('Error fetching ledger data:', error);
    res.status(500).json({ message: 'Internal Server Error fetching ledger data' });
  }
});

export default router;
