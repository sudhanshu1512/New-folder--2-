import express from 'express';
import sql from 'mssql';
import { getDbPool } from '../db.js'; 
import { authenticateJWT } from '../middleware/auth.js';
import logger from '../utils/logger.js';

const router = express.Router();

// GET /api/usersno - Get number of users and ledger balance 
router.get('/usersno', async (req, res) => {
    try {
        const pool = await getDbPool();
        
        const query = `
            SELECT 
                (SELECT COUNT(*) FROM agent_register WHERE IsSupplier = 1) as usersno,
                (SELECT COUNT(*) FROM FlightSearchResults) as total_flight_searches,
                (SELECT COUNT(*) FROM FlightSearchResults WHERE CAST(Createdate AS DATE) = CAST(GETDATE() AS DATE)) as today_flight_searches,
                (SELECT COUNT(*) FROM FltHeader) as total_bookings,
                (SELECT COUNT(*) FROM FltHeader WHERE CAST(booking_date AS DATE) = CAST(GETDATE() AS DATE)) as today_bookings,
                ar.Fname + ' ' + ar.Lname as fullname,
                ROW_NUMBER() OVER (ORDER BY ar.timestamp_create DESC, ar.User_Id DESC) as rn
            FROM agent_register ar
            WHERE ar.IsSupplier = 1
        `;
        
        const result = await pool.request().query(query);
        
        // Extract counts and newest suppliers from single result
        const userCount = result.recordset.length > 0 ? result.recordset[0].usersno : 0;
        const totalinventory = result.recordset.length > 0 ? result.recordset[0].total_flight_searches : 0;
        const todayinventory = result.recordset.length > 0 ? result.recordset[0].today_flight_searches : 0;
        const totalbookings = result.recordset.length > 0 ? result.recordset[0].total_bookings : 0;
        const todaybookings = result.recordset.length > 0 ? result.recordset[0].today_bookings : 0;
        const newestSuppliers = result.recordset
            .filter(row => row.rn <= 1)
            .map(row => ({ fullname: row.fullname }));
        
        res.json({
            success: true,
            data: [{ usersno: userCount }],
            flightSearchData: {
                total: totalinventory,
                today: todayinventory
            },
            bookingData: {
                total: totalbookings,
                today: todaybookings
            },
            newestSuppliers: newestSuppliers
        });
        
    } catch (error) {
        logger.error('Error fetching flight search data:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch flight search data',
            error: error.message
        });
    }
});



export default router;
