import express from 'express';
import sql from 'mssql';
import { getDbPool } from '../db.js';
import { authenticateJWT } from '../middleware/auth.js';
import logger from '../utils/logger.js';

const router = express.Router();

// GET /api/flight-bookings - Fetch booking details via SP
router.get('/flight-bookings', async (req, res) => {
    try {
        const { orderId, agentId, fromDate, toDate } = req.query;
        
        const pool = await getDbPool();
        const request = pool.request();

        // Bind parameters for the Stored Procedure
        // The SP handles NULLs internally, so we only pass inputs if they exist
        if (orderId) request.input('OrderId', sql.VarChar(50), orderId);
        if (agentId) request.input('AgentId', sql.VarChar(50), agentId);
        
        // Ensure dates are valid before passing
        if (fromDate) request.input('FromDate', sql.DateTime, new Date(fromDate));
        if (toDate) request.input('ToDate', sql.DateTime, new Date(toDate));

        // Execute the Stored Procedure
        const result = await request.execute('sp_GetFlightBookingDetails');

        res.json({
            success: true,
            count: result.recordset.length,
            data: result.recordset
        });

    } catch (error) {
        logger.error('Error fetching flight bookings:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch flight bookings',
            error: error.message
        });
    }
});

export default router;