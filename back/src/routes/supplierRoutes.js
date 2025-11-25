import express from 'express';
import sql from 'mssql';
import { getDbPool } from '../db.js'; // Assumed utility for MSSQL connection pooling
import { authenticateJWT } from '../middleware/auth.js';
import logger from '../utils/logger.js';

const router = express.Router();

// GET /api/suppliers - Get all suppliers
router.get('/suppliers',authenticateJWT, async (req, res) => {
    try {
        const pool = await getDbPool();
        
        const query = `
            SELECT 
                AgencyId as agencyId,
                Agency_Name as agencyName,
                Mobile as mobile,
                Email as email,
                State as state,
                City as city,
                CONCAT(Fname, ' ', ISNULL(Mname + ' ', ''), Lname) as headPerson,
                ISNULL(AgentLimit, 0) as agentLimit,
                ISNULL(Crd_Limit, 0) as crdLimit,
                IsSupplier as status,
                ISNULL(DueAmount, 0) as dueAmount,
                ISNULL(PanNo, '') as panNo,
                ISNULL(GSTNo, '') as gstNo,
                ISNULL(Agent_Type, '') as agentType,
                ISNULL(Address, '') as address
            FROM agent_register
            WHERE IsSupplier = 1 AND User_Id != @currentUserId   -- Only get suppliers except current user
            ORDER BY AgencyId
        `;
        
        const result = await pool.request()
            .input('currentUserId', req.user.id)
            .query(query);
        
        res.json({
            success: true,
            data: result.recordset
        });
        
    } catch (error) {
        logger.error('Error fetching suppliers:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch suppliers',
            error: error.message
        });
    }
});

//supplier suggestion search
router.get('/suppliers/search', authenticateJWT, async (req, res) => {
    try {
        const { fromDate, toDate, agencyName, mobile, email } = req.query;
        
        // --- Search Parameter Setup ---
        const conditions = [];
        const params = {};

        if (fromDate) {
            conditions.push('CONVERT(date, CreatedAt) >= @fromDate');
            params.fromDate = fromDate;
        }
        
        if (toDate) {
            conditions.push('CONVERT(date, CreatedAt) <= @toDate');
            params.toDate = toDate;
        }
        
        if (agencyName) {
            conditions.push('Agency_Name LIKE @agencyName');
            params.agencyName = `%${agencyName}%`;
        }
        
        if (mobile) {
            conditions.push('Mobile LIKE @mobile');
            params.Mobile = `%${mobile}%`;
        }
        
        if (email) {
            conditions.push('Email LIKE @email');
            params.email = `%${email}%`;
        }

        // --- Core Logic: Check if any search parameter was provided ---
        // If no search parameters were provided, return all records (excluding current user)
        // --- End of Core Logic ---

        const pool = await getDbPool();
        
        let query = `
            SELECT 
                AgencyId as agencyId,
                Agency_Name as agencyName,
                Mobile as mobile,
                Email as email,
                State as state,
                City as city,
                CONCAT(Fname, ' ', ISNULL(Mname + ' ', ''), Lname) as headPerson,
                ISNULL(AgentLimit, 0) as agentLimit,
                IsSupplier as status,
                ISNULL(Crd_Limit, 0) as crdLimit,
                ISNULL(DueAmount, 0) as dueAmount,
                ISNULL(PanNo, '') as panNo,
                ISNULL(GSTNo, '') as gstNo,
                ISNULL(Agent_Type, '') as agentType,
                ISNULL(Address, '') as address
            FROM agent_register
            WHERE IsSupplier = 1 AND User_Id != @currentUserId
        `;

        // Add current user ID to parameters
        params.currentUserId = req.user.id;

        // Append the collected search conditions using 'AND' if any exist
        if (conditions.length > 0) {
            query += ' AND ' + conditions.join(' AND ');
        }

        query += ' ORDER BY AgencyId';

        const request = pool.request();
        Object.entries(params).forEach(([key, value]) => {
            request.input(key, value);
        });

        const result = await request.query(query);
        
        res.json({
            success: true,
            data: result.recordset
        });
        
    } catch (error) {
        logger.error('Error searching suppliers:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to search suppliers',
            error: error.message
        });
    }
});

export default router;
