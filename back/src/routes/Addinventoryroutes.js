import express from 'express';
import sql from 'mssql';
import { getDbPool } from '../db.js'; // Assumed utility for MSSQL connection pooling
import { authenticateJWT } from '../middleware/auth.js';
import { customAlphabet } from 'nanoid';
import logger from '../utils/logger.js';

// Function to generate a unique random reference number in format REF + 8 alphanumeric characters
const generateReferenceNumber = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', 8);

// Function to get the next sequence number for FlightSearchResults
async function getNextSequenceNumber(pool) {
    try {
        const result = await pool.request().query(`
            SELECT ISNULL(MAX(SequenceNumber), 0) + 1 as nextSeq 
            FROM FlightSearchResults
        `);
        return result.recordset[0].nextSeq;
    } catch (error) {
        logger.error('Error getting next sequence number:', error);
        return 1; // Default to 1 if there's an error
    }
}


// Function to get airport details from the database
async function getAirportDetails(code) {
    const pool = await getDbPool();
    try {
        const request = pool.request();
        // Search for exact airport code match
        request.input('query', sql.NVarChar, `${code.toUpperCase()}`);

        const result = await request.execute('dbo.SearchAirports');

        if (result.recordset && result.recordset.length > 0) {
            const airport = result.recordset[0];
            return {
                city: airport.city,
                name: airport.name,
                code: `(${airport.code})`,
                orgDest: `${airport.city},(${airport.code})`
            };
        }

        // If no exact match found, return default values with the provided code
        return {
            city: code.toUpperCase(),
            name: null,
            code: `(${code.toUpperCase()})`,
            orgDest: `${code.toUpperCase()},(${code.toUpperCase()})`
        };
    } catch (error) {
        logger.error('Error fetching airport details:', error);
        // Return default values in case of error
        const upperCode = code.toUpperCase();
        return {
            city: upperCode,
            name: null,
            code: `(${upperCode})`,
            orgDest: `${upperCode},(${upperCode})`
        };
    }
}

const router = express.Router();

// --------------------------------------------------------------------------
async function getAgentDetails(pool, mobileNo) {
    const query = `
        SELECT 
            Agency_Name, 
            Fname + ' ' + ISNULL(Mname + ' ', '') + Lname as FullName,
            Email,
            Mobile,
            GSTNO,
            GST_Company_Name,
            GST_Company_Address
        FROM agent_register 
        WHERE User_Id = @userMobileNo
    `;

    const request = pool.request();
    request.input('userMobileNo', sql.VarChar(50), mobileNo);

    const result = await request.query(query);
    return result.recordset[0] || null;
}

// Middleware to log requests
router.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    next();
});

// Helper function to format date to DD/MM/YYYY
const formatDate = (dateString) => {
    if (!dateString) return null;
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
};

// Helper function to format date as '01 Jan 2025'
const formatDateToCustomFormat = (date) => {
    if (!date) return null;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
};


// Function to get airline code from the database
async function getAirlineCode(airlineName) {
    if (!airlineName) return '';

    const pool = await getDbPool();
    try {
        const request = pool.request();
        // Search for airline name (case-insensitive partial match)
        request.input('airlineName', sql.NVarChar, `%${airlineName.toUpperCase()}%`);

        const query = `
            SELECT TOP 1 AL_Code 
            FROM AirLineNames 
            WHERE UPPER(AL_Name) LIKE @airlineName
            ORDER BY LEN(AL_Name) ASC`; // Prefer shorter matches (more specific)

        const result = await request.query(query);

        if (result.recordset && result.recordset.length > 0) {
            return result.recordset[0].AL_Code || '';
        }

        // If no match found, try with a more flexible search
        const words = airlineName.toUpperCase().split(' ');
        if (words.length > 1) {
            const newRequest = pool.request();
            const likeConditions = words.map((word, i) =>
                `UPPER(AL_Name) LIKE @word${i}`
            ).join(' AND ');

            words.forEach((word, i) => {
                newRequest.input(`word${i}`, sql.NVarChar, `%${word}%`);
            });

            const flexibleQuery = `
                SELECT TOP 1 AL_Code 
                FROM AirLineNames 
                WHERE ${likeConditions}
                ORDER BY LEN(AL_Name) ASC`;

            const flexibleResult = await newRequest.query(flexibleQuery);
            if (flexibleResult.recordset && flexibleResult.recordset.length > 0) {
                return flexibleResult.recordset[0].AL_Code || '';
            }
        }

        return ''; // Return empty string if no match found
    } catch (error) {
        logger.error('Error fetching airline code:', error);
        return ''; // Return empty string in case of error
    }
}

//post inventory add new inventory api
router.post('/inventory', authenticateJWT, async (req, res) => {
    const pool = await getDbPool();

    try {
        const data = req.body;

        const requiredFields = ['from', 'to', 'airline', 'flightNo', 'departDate', 'arriveDate', 'departTime'];

        for (const field of requiredFields) {
            if (!data[field]) {
                return res.status(400).json({
                    success: false,
                    message: `Missing required field: ${field}. Please complete all steps in the form.`,
                    field: field
                });
            }
        }

        const userMobileNo = req.user.id ? String(req.user.id) : null;
        if (!userMobileNo) {
            return res.status(401).json({
                success: false,
                message: 'User mobile number is required'
            });
        }

        // Get agent details
        const agentDetails = await getAgentDetails(pool, userMobileNo);
        if (!agentDetails) {
            return res.status(404).json({
                success: false,
                message: 'Agent not found with the provided mobile number'
            });
        }

        const userId = String(req.user?.id || '').trim();
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User ID is required'
            });
        }

        const {
            tripType = 'oneway',
            from, to,
            departDate: originalDepartDate,
            arriveDate: originalArriveDate,
            departTime, arriveTime,
            airline, flightNo,
            departTerminal, arriveTerminal,
            classType, ArrivalNextday,
            bagsInfo, fareRule, fareCode,
            pnr, seat,
            infantFare, basicFare, yq, yr, ot, grossTotal,
            markup1, markup2, grandTotal
        } = data;

        const safeDepartDate = originalDepartDate.replace(/\//g, '-');
        const safeArriveDate = originalArriveDate.replace(/\//g, '-');

        const departDetails = await getAirportDetails(from);
        const arriveDetails = await getAirportDetails(to);

        const departDateTime = new Date(`${safeDepartDate}T${departTime}`);
        const arriveDateTime = new Date(`${safeArriveDate}T${arriveTime}`);

        const dbTripType = tripType === 'oneway' ? 'One Way' : 'Round Trip';

        // Get airline code from database and format it with parentheses
        let carrierCode = '';
        try {
            const code = await getAirlineCode(airline);
            // Add parentheses around the carrier code if it exists
            carrierCode = code ? `(${code})` : '';
        } catch (error) {
            logger.error('Error getting airline code:', error);
            // Continue with empty carrier code if there's an error
        }

        // Include the carrier code with parentheses in the inventory code
        const carrierPart = carrierCode ? `${carrierCode}-` : '';
        const inventoryCode = `${from.toUpperCase()}||${to.toUpperCase()}||${carrierPart}(${flightNo})||${originalDepartDate}||${originalArriveDate}||${userMobileNo}`;

        const insertQuery = `
            INSERT INTO FlightSearchResults (
                Triptype, OrgDestFrom, OrgDestTo, 
                DepartureLocation, DepartureCityName, DepAirportCode, DepartureAirportName, DepartureTerminal, 
                ArrivalLocation, ArrivalCityName, ArrAirportCode, ArrivalAirportName, ArrivalTerminal, 
                Departure_Date, DepartureTime, Arrival_Date, ArrivalTime, 
                MarketingCarrier, OperatingCarrier, FlightIdentification, ValiDatingCarrier, AirLineName, ElectronicTicketing, 
                ProductDetailQualifier, getVia, BagInfo, ProviderUserID, 
                AdtCabin, ChdCabin, InfCabin, AdtRbd, ChdRbd, InfRbd, 
                AdtFareType, AdtFarebasis, ChdfareType, ChdFarebasis, InfFareType, InfFarebasis, 
                InfFar, ChdFar, AdtFar, AdtBreakPoint, AdtAvlStatus, ChdBreakPoint, ChdAvlStatus, InfBreakPoint, InfAvlStatus, 
                fareBasis, FBPaxType, RBD, FareRule, FareDet, FlightNo, ClassType, 
                Basicfare, YQ, YR, WO, OT, GROSS_Total, Admin_Markup, Markup_Type, Markup, Grand_Total, 
                DepartureDate, ArrivalDate, Total_Seats, Used_Seat, Avl_Seat, valid_Till, 
                Status, Rt_AirLineName, Rt_FlightNo, Rt_Departure_Date, Rt_DepartureTime, Rt_Arrival_Date, Rt_ArrivalTime, 
                Rt_DepartureTerminal, Rt_ArrivalTerminal, Rt_RBD, Rt_fareBasis, Rt_ClassType, 
                FixedDepStatus, Connect, SequenceNumber, RefNo,
                DepartureCityNameRef, ArrivalCityNameRef, DepAirportCodeRef, ArrAirportCodeRef,
                Duration, Leg, CreatedByUserid, 
                InfFare, infBfare, InfTax, InfMgtFee, SupMarkup, MarkupWithGst, TempStatus, CreatedByName, 
                IsPrimary, ConnectFrom, ConnectTo, NextDayArrival, Inventorycode, RBD1
            )
            OUTPUT INSERTED.id 
            VALUES (
                @Triptype, @OrgDestFrom, @OrgDestTo, 
                @DepartureCityName, @DepartureCityName, @DepAirportCode, @DepartureAirportName, @DepartureTerminal, 
                @ArrivalCityName, @ArrivalCityName, @ArrAirportCode, @ArrivalAirportName, @ArrivalTerminal, 
                @Departure_Date, @DepartureTime, @Arrival_Date, @ArrivalTime, 
                @MarketingCarrier, @OperatingCarrier, @FlightIdentification, @ValiDatingCarrier, @AirLineName, @ElectronicTicketing, 
                @ProductDetailQualifier, @getVia, @BagInfo, @ProviderUserID, 
                @AdtCabin, @ChdCabin, @InfCabin, @AdtRbd, @ChdRbd, @InfRbd, 
                @AdtFareType, @AdtFarebasis, @ChdfareType, @ChdFarebasis, @InfFareType, @InfFarebasis, 
                @InfFar, @ChdFar, @AdtFar, @AdtBreakPoint, @AdtAvlStatus, @ChdBreakPoint, @ChdAvlStatus, @InfBreakPoint, @InfAvlStatus, 
                @fareBasis, @FBPaxType, @RBD, @FareRule, @FareDet, @FlightNo, @ClassType, 
                @Basicfare, @YQ, @YR, @WO, @OT, @GROSS_Total, @Admin_Markup, @Markup_Type, @Markup, @Grand_Total, 
                @DepartureDate, @ArrivalDate, @Total_Seats, @Used_Seat, @Avl_Seat, @valid_Till, 
                @Status, @Rt_AirLineName, @Rt_FlightNo, @Rt_Departure_Date, @Rt_DepartureTime, @Rt_Arrival_Date, @Rt_ArrivalTime, 
                @Rt_DepartureTerminal, @Rt_ArrivalTerminal, @Rt_RBD, @Rt_fareBasis, @Rt_ClassType, 
                @FixedDepStatus, @Connect, @SequenceNumber, @RefNo,
                @DepartureCityNameRef, @ArrivalCityNameRef, @DepAirportCodeRef, @ArrAirportCodeRef,
                @hideeventryhour, @Leg, @CreatedByUserid, 
                @InfFare, @infBfare, @InfTax, @InfMgtFee, @SupMarkup, @MarkupWithGst, @TempStatus, @CreatedByName, 
                @IsPrimary, @ConnectFrom, @ConnectTo, @NextDayArrival, @Inventorycode, @RBD1
            );
        `;

        const request = pool.request();
        const NULL_NVARCHAR = null;

        request.input('DepartureCityNameRef', sql.NVarChar(200), departDetails.city);
        request.input('ArrivalCityNameRef', sql.NVarChar(200), arriveDetails.city);
        request.input('DepAirportCodeRef', sql.NVarChar(200), departDetails.code);
        request.input('ArrAirportCodeRef', sql.NVarChar(200), arriveDetails.code);
        request.input('Triptype', sql.NVarChar(100), dbTripType);
        request.input('OrgDestFrom', sql.NVarChar(200), departDetails.orgDest);
        request.input('OrgDestTo', sql.NVarChar(200), arriveDetails.orgDest);
        request.input('DepartureCityName', sql.NVarChar(200), departDetails.city);
        request.input('DepAirportCode', sql.NVarChar(200), departDetails.code);
        request.input('DepartureAirportName', sql.NVarChar(200), departDetails.name);
        request.input('ArrivalCityName', sql.NVarChar(200), arriveDetails.city);
        request.input('ArrAirportCode', sql.NVarChar(200), arriveDetails.code);
        request.input('ArrivalAirportName', sql.NVarChar(200), arriveDetails.name);
        request.input('Departure_Date', sql.NVarChar(100), formatDate(originalDepartDate));
        request.input('Arrival_Date', sql.NVarChar(100), formatDate(originalArriveDate));
        request.input('CreatedByUserid', sql.VarChar(200), userId);
        request.input('CreatedByName', sql.VarChar(200), agentDetails.Agency_Name);
        request.input('fareRate', sql.Decimal(18, 2), parseFloat(data.fareRate) || 0);
        request.input('Inventorycode', sql.NVarChar(500), inventoryCode);
        request.input('DepartureTime', sql.NVarChar(200), departTime || NULL_NVARCHAR);
        request.input('ArrivalTime', sql.NVarChar(200), arriveTime || NULL_NVARCHAR);
        request.input('AirLineName', sql.NVarChar(200), airline);
        request.input('FlightNo', sql.NVarChar(100), flightNo);
        request.input('DepartureTerminal', sql.NVarChar(200), departTerminal || NULL_NVARCHAR);
        request.input('ArrivalTerminal', sql.NVarChar(200), arriveTerminal || NULL_NVARCHAR);
        request.input('ClassType', sql.NVarChar(100), classType || 'Economy');
        request.input('BagInfo', sql.NVarChar(200), bagsInfo + ` KG` || '15 KG');
        request.input('FareRule', sql.NVarChar(200), fareRule || 'N');
        request.input('fareBasis', sql.NVarChar(200), pnr || NULL_NVARCHAR);
        request.input('MarketingCarrier', sql.NVarChar(10), carrierCode || 'NA');
        request.input('NextDayArrival', sql.NVarChar(10), ArrivalNextday === 'yes' ? 'yes' : 'no');
        request.input('DepartureDate', sql.Date, departDateTime);
        request.input('ArrivalDate', sql.Date, arriveDateTime);
        request.input('Status', sql.Bit, true);
        request.input('FixedDepStatus', sql.Bit, true); // Enabled by default
        request.input('Connect', sql.Bit, false);
        request.input('IsPrimary', sql.Bit, true);
        request.input('TempStatus', sql.Bit, true);
        request.input('Basicfare', sql.Float, parseFloat(basicFare) || 0.0);
        request.input('YQ', sql.Float, parseFloat(yq) || 0.0);
        request.input('YR', sql.Float, parseFloat(yr) || 0.0);
        request.input('WO', sql.Float, 0.0); // WO is not in the form
        request.input('OT', sql.Float, parseFloat(ot) || 0.0);
        request.input('GROSS_Total', sql.Float, parseFloat(grossTotal) || 0.0);
        request.input('Admin_Markup', sql.Float, parseFloat(markup1) || 0.0);
        request.input('Markup', sql.Float, parseFloat(markup2) || 0.0);
        request.input('Grand_Total', sql.Float, parseFloat(grandTotal) || 0.0);
        request.input('InfFare', sql.Float, parseFloat(infantFare) || 0.0);
        request.input('infBfare', sql.Float, parseFloat(infantFare) || 0.0);
        request.input('InfMgtFee', sql.Float, 0.0); request.input('AdtFar', sql.Float, 0.0);
        request.input('ChdFar', sql.Float, 0.0); request.input('InfFar', sql.Float, 0.0);
        request.input('DepartureLocation', sql.NVarChar(200), NULL_NVARCHAR);
        request.input('ArrivalLocation', sql.NVarChar(200), NULL_NVARCHAR);
        request.input('OperatingCarrier', sql.NVarChar(200), carrierCode);
        request.input('FlightIdentification', sql.NVarChar(200), flightNo);
        request.input('ValiDatingCarrier', sql.NVarChar(200), carrierCode);
        request.input('ElectronicTicketing', sql.NVarChar(200), NULL_NVARCHAR);
        request.input('ProductDetailQualifier', sql.NVarChar(200), NULL_NVARCHAR);
        request.input('getVia', sql.NVarChar(200), NULL_NVARCHAR);
        request.input('ProviderUserID', sql.NVarChar(200), NULL_NVARCHAR);
        request.input('AdtCabin', sql.NVarChar(200), classType || 'Economy');
        request.input('ChdCabin', sql.NVarChar(200), classType || 'Economy');
        request.input('InfCabin', sql.NVarChar(200), classType || 'Economy');
        request.input('AdtRbd', sql.NVarChar(200), fareCode || NULL_NVARCHAR);
        request.input('ChdRbd', sql.NVarChar(200), fareCode || NULL_NVARCHAR);
        request.input('InfRbd', sql.NVarChar(200), fareCode || NULL_NVARCHAR);
        request.input('AdtFareType', sql.NVarChar(200), NULL_NVARCHAR);
        request.input('AdtFarebasis', sql.NVarChar(200), NULL_NVARCHAR);
        request.input('ChdfareType', sql.NVarChar(200), NULL_NVARCHAR);
        request.input('ChdFarebasis', sql.NVarChar(200), NULL_NVARCHAR);
        request.input('InfFareType', sql.NVarChar(200), NULL_NVARCHAR);
        request.input('InfFarebasis', sql.NVarChar(200), NULL_NVARCHAR);
        request.input('AdtBreakPoint', sql.NVarChar(200), NULL_NVARCHAR);
        request.input('AdtAvlStatus', sql.NVarChar(200), '0');
        request.input('ChdBreakPoint', sql.NVarChar(200), NULL_NVARCHAR);
        request.input('ChdAvlStatus', sql.NVarChar(200), '0');
        request.input('InfBreakPoint', sql.NVarChar(200), NULL_NVARCHAR);
        request.input('InfAvlStatus', sql.NVarChar(200), '0');
        request.input('FBPaxType', sql.NVarChar(200), NULL_NVARCHAR);
        request.input('RBD', sql.NVarChar(200), fareCode || NULL_NVARCHAR);
        request.input('FareDet', sql.NVarChar(200), NULL_NVARCHAR);
        request.input('Markup_Type', sql.NVarChar(100), 'Flat');
        request.input('Total_Seats', sql.VarChar(100), seat || '9');
        request.input('Used_Seat', sql.VarChar(100), '0');
        request.input('Avl_Seat', sql.NVarChar(100), seat || '9');
        request.input('valid_Till', sql.Date, new Date(2035, 11, 31));
        request.input('Rt_AirLineName', sql.NVarChar(100), NULL_NVARCHAR);
        request.input('Rt_FlightNo', sql.NVarChar(100), NULL_NVARCHAR);
        request.input('Rt_Departure_Date', sql.NVarChar(100), NULL_NVARCHAR);
        request.input('Rt_DepartureTime', sql.NVarChar(100), NULL_NVARCHAR);
        request.input('Rt_Arrival_Date', sql.NVarChar(100), NULL_NVARCHAR);
        request.input('Rt_ArrivalTime', sql.VarChar(100), NULL_NVARCHAR);
        request.input('Rt_DepartureTerminal', sql.NVarChar(100), NULL_NVARCHAR);
        request.input('Rt_ArrivalTerminal', sql.NVarChar(100), NULL_NVARCHAR);
        request.input('Rt_RBD', sql.NVarChar(100), NULL_NVARCHAR);
        request.input('Rt_fareBasis', sql.NVarChar(100), NULL_NVARCHAR);
        request.input('Rt_ClassType', sql.NVarChar(100), classType || 'Economy');
        request.input('hideeventryhour', sql.NVarChar(100), data.hideeventryhour || '0');
        request.input('Leg', sql.Int, NULL_NVARCHAR);
        request.input('SupMarkup', sql.VarChar(255), '0');
        request.input('MarkupWithGst', sql.VarChar(255), '0');
        request.input('RBD1', sql.NVarChar(50), NULL_NVARCHAR);
        request.input('ConnectFrom', sql.VarChar(500), NULL_NVARCHAR);
        request.input('ConnectTo', sql.VarChar(500), NULL_NVARCHAR);
        request.input('InfTax', sql.Float, 0); // Updated to match FLOAT type in database
        // Generate and add unique reference number (prefixed with REF)
        const refNo = `REF${generateReferenceNumber()}`;
        request.input('RefNo', sql.VarChar(50), refNo);
        // Get and set the next sequence number
        const nextSequence = await getNextSequenceNumber(pool);
        request.input('SequenceNumber', sql.Int, nextSequence);

        const result = await request.query(insertQuery);
        const newInventoryId = result.recordset[0].id;

        console.log(`Inventory created: ID ${newInventoryId} for flight ${flightNo}`);

        res.status(201).json({
            success: true,
            message: '🚀 Inventory created successfully!',
            inventoryId: newInventoryId,
            flight: {
                flightNo: flightNo,
                airline: airline,
                from: from,
                to: to
            }
        });

    } catch (error) {
        logger.error('Error creating inventory:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while saving the inventory.',
            error: error.message
        });
    }
});

// 1. GET /inventory - FETCH & FILTER LIST
// ====================================================================
router.get('/inventory', authenticateJWT, async (req, res) => {
    const pool = await getDbPool();

    try {
        const filters = req.query;

        // Sanitize filters
        const sanitizedFilters = {};
        for (const key in filters) {
            if (typeof filters[key] === 'string') {
                sanitizedFilters[key] = filters[key].replace(/[()]/g, '');
            } else {
                sanitizedFilters[key] = filters[key];
            }
        }

        // Get authenticated user ID
        const userId = String(req.user?.id || '').trim();
        if (!userId) {
            return res.status(401).json({ success: false, message: 'User ID not found in token.' });
        }

        // Base query
        let query = `
            SELECT 
                id,
                CONCAT(AirLineName, ' (', FlightIdentification, ')') AS airline,
                DepAirportCode AS [from],
                ArrAirportCode AS [to],
                DepAirportCode,
                ArrAirportCode,
                DepartureDate,
                DepartureTime,
                ArrivalTime,
                CASE WHEN ISNUMERIC(Total_Seats) = 1 THEN CAST(Total_Seats AS INT) ELSE 0 END AS TotalSeats,
                CASE WHEN ISNUMERIC(Avl_Seat) = 1 THEN CAST(Avl_Seat AS INT) ELSE 0 END AS AvailableSeats,
                fareBasis AS pnr,
                CreatedByName AS supplier,
                FixedDepStatus AS enabled
            FROM FlightSearchResults 
            WHERE CreatedByUserid = @userId
            AND (FixedDepStatus = 1 OR Status = 1)
        `;

        const request = pool.request();
        request.input('userId', sql.VarChar(50), userId);

        // Track if user applied any filter
        let filterApplied = false;

        // Apply filters
        if (sanitizedFilters.from) {
            filterApplied = true;
            const fromValue = sanitizedFilters.from.trim();
            query += ' AND (DepAirportCode = @from OR DepAirportCode = @fromWithParens)';
            request.input('from', sql.NVarChar(10), fromValue);
            request.input('fromWithParens', sql.NVarChar(10), `(${fromValue})`);
        }

        if (sanitizedFilters.to) {
            filterApplied = true;
            const toValue = sanitizedFilters.to.trim();
            query += ' AND (ArrAirportCode = @to OR ArrAirportCode = @toWithParens)';
            request.input('to', sql.NVarChar(10), toValue);
            request.input('toWithParens', sql.NVarChar(10), `(${toValue})`);
        }

        if (sanitizedFilters.supplier) {
            filterApplied = true;
            const supplierValue = sanitizedFilters.supplier.trim();
            query += ' AND CreatedByName = @supplierName';
            request.input('supplierName', sql.NVarChar(200), supplierValue);
        }

        if (sanitizedFilters.pnr) {
            filterApplied = true;
            query += ' AND fareBasis LIKE @pnr';
            request.input('pnr', sql.NVarChar(200), `%${sanitizedFilters.pnr}%`);
        }

        if (sanitizedFilters.airline) {
            filterApplied = true;
            query += ' AND AirLineName LIKE @airline';
            request.input('airline', sql.NVarChar(200), `%${sanitizedFilters.airline}%`);
        }

        if (sanitizedFilters.startDate) {
            filterApplied = true;
            query += ' AND DepartureDate >= @startDate';
            request.input('startDate', sql.Date, sanitizedFilters.startDate);
        }

        if (sanitizedFilters.endDate) {
            filterApplied = true;
            query += ' AND DepartureDate <= @endDate';
            request.input('endDate', sql.Date, sanitizedFilters.endDate);
        }


        // 
        // 
        // 
        // ✅ If no filters applied, limit to today's records (using range)
        if (!filterApplied) {
            const todayStartIST = new Date();
            todayStartIST.setHours(5, 30, 0, 0);

            const todayEndIST = new Date(todayStartIST);
            todayEndIST.setHours(28, 89, 89, 999);

            query += `
                AND (
                    (Createdate >= @todayStartIST AND Createdate < @todayEndIST)
                    OR
                    (updatedate >= @todayStartIST AND updatedate < @todayEndIST)
                )
            `;
            request.input('todayStartIST', sql.DateTime2, todayStartIST);
            request.input('todayEndIST', sql.DateTime2, todayEndIST);
        }

        // Order by latest
        query += ' ORDER BY DepartureDate DESC';

        const result = await request.query(query);

        const records = result.recordset.map(rec => ({
            ...rec,
            from: rec.from ? rec.from.replace(/[()]/g, '') : rec.from,
            to: rec.to ? rec.to.replace(/[()]/g, '') : rec.to,
            enabled: rec.enabled === true,
            time: `${rec.DepartureTime} - ${rec.ArrivalTime}`,
            seatStatus: rec.AvailableSeats > 0 ? "Available" : "Sold Out",
            depDate: rec.DepartureDate ? formatDateToCustomFormat(rec.DepartureDate) : null
        }));

        res.json({ success: true, records });

    } catch (error) {
        logger.error('Error fetching inventory:', error);
        res.status(500).json({ success: false, message: 'An error occurred while fetching inventory.', error: error.message });
    }
});

// ====================================================================
// 2. PUT /inventory/:id/fare - UPDATE FARE
// ====================================================================
router.put('/inventory/:id/fare', async (req, res) => {
    const pool = await getDbPool();
    const { id } = req.params;
    const { infantFare, markup1, markup2, grandTotal } = req.body;

    try {
        // You might want to add validation for the new fields here

        const query = `
            UPDATE FlightSearchResults 
            SET 
                InfFare = @infantFare,
                -- Assuming Markup1 and Markup2 correspond to Admin_Markup and Markup
                Admin_Markup = @markup1,
                Markup = @markup2,
                 updatedate = getdate() ,
                Grand_Total = @grandTotal
            WHERE id = @id
        `;

        const request = pool.request();
        request.input('id', sql.Int, id);
        request.input('infantFare', sql.Float, infantFare);
        request.input('markup1', sql.Float, markup1);
        request.input('markup2', sql.Float, markup2);
        request.input('grandTotal', sql.Float, grandTotal);

        const result = await request.query(query);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ success: false, message: 'Inventory record not found.' });
        }

        res.status(200).json({ success: true, message: `Fare details for ID ${id} updated successfully.` });

    } catch (error) {
        logger.error('Error updating fare details:', error);
        res.status(500).json({ success: false, message: 'An error occurred while updating fare details.', error: error.message });
    }
});

// Add this to your Addinventoryroutes.js
router.get('/inventory/:id/fares', async (req, res) => {
    const pool = await getDbPool();
    const { id } = req.params;

    try {
        const query = `
      SELECT 
        id,
        Grand_Total as amount,
        Basicfare as basicFare,
        yq,
        yr,
        ot,
        Admin_Markup as adminMarkup,
        Markup_Type as markupType,
        Avl_Seat as availableSeats,
        Total_Seats as totalSeats
      FROM FlightSearchResults 
      WHERE id = @id;
    `;

        const result = await pool.request()
            .input('id', sql.Int, id)
            .query(query);

        if (result.recordset.length === 0) {
            return res.status(404).json({ success: false, message: 'No fares found' });
        }

        // Return the fare data in an array format expected by the frontend
        const fareData = result.recordset.map(row => ({
            id: row.id,
            basicFare: parseFloat(row.basicFare) || 0,
            amount: parseFloat(row.amount) || 0,
            availableSeats: parseInt(row.availableSeats) || 0,
            totalSeats: parseInt(row.totalSeats) || 0,
            soldSeats: (parseInt(row.totalSeats) || 0) - (parseInt(row.availableSeats) || 0),
            fareType: `Fare ${row.id}`,
            yq: parseFloat(row.yq) || 0,
            yr: parseFloat(row.yr) || 0,
            ot: parseFloat(row.ot) || 0
        }));

        // Return the array directly as the frontend expects an array of fares
        res.json(fareData);

    } catch (error) {
        logger.error('Error fetching fares:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch fares',
            error: error.message
        });
    }
});

// ====================================================================
// NEW: GET /inventory/:id/details - FETCH ALL DETAILS FOR UPDATE MODAL
// ====================================================================
router.get('/inventory/:id/details', async (req, res) => {
    const pool = await getDbPool();
    const { id } = req.params;

    try {
        // This query assumes that 'id' refers to a unique flight record
        const query = `
      SELECT 
        id,
        DepAirportCode as [from],
        ArrAirportCode as [to],
        AirLineName as airline,
        FlightNo as flightNo,
        DepartureDate as departDate,
        DepartureTime as departTime,
        ArrivalDate as arriveDate,
        ArrivalTime as arriveTime,
        DepartureTerminal as departTerminal,
        ArrivalTerminal as arriveTerminal,
        fareBasis as pnr, -- Corrected column name
        Basicfare as basicFare,
        yq, yr, ot,
        InfFare as infantFare, -- Corrected column name
        Admin_Markup,
        Markup,
        Markup_Type as markupType,
        Total_Seats as totalSeats, -- Corrected column name
        Avl_Seat as availableSeats,
        Grand_Total as grandTotal
      FROM FlightSearchResults 
      WHERE id = @id;
    `;

        const result = await pool.request().input('id', sql.Int, id).query(query);

        if (result.recordset.length === 0) {
            return res.status(404).json({ success: false, message: 'No record found for this ID.' });
        }

        const record = result.recordset[0];

        // --- Calculate derived values ---
        const totalTax = (record.yq || 0) + (record.yr || 0) + (record.ot || 0);
        const seatSold = (record.totalSeats || 0) - (record.availableSeats || 0);
        const grossTotal = (record.basicFare || 0) + totalTax;
        const adminMarkup = (record.Admin_Markup || 5) + (record.Markup || 5);


        // For now, Markup1 and Markup2 are returned as 0. You may need to adjust your DB schema if they exist.
        const markup1 = 0;
        const markup2 = 0;
        const grandTotal = grossTotal + (record.Admin_Markup || 0) + (record.Markup || 0);

        // Structure the response object
        const responseData = {
            // Flight Information
            flightDetails: {
                id: record.id,
                from: record.from,
                to: record.to,
                airline: record.airline,
                flightNo: record.flightNo,
                departDate: record.departDate ? new Date(record.departDate).toISOString().split('T')[0] : null,
                departTime: record.departTime,
                arriveDate: record.arriveDate ? new Date(record.arriveDate).toISOString().split('T')[0] : null,
                arriveTime: record.arriveTime,
                departTerminal: record.departTerminal,
                arriveTerminal: record.arriveTerminal,
                pnr: record.pnr
            },
            // Pricing Information
            pricing: {
                basicFare: record.basicFare,
                taxes: {
                    yq: record.yq,
                    yr: record.yr,
                    ot: record.ot,
                    total: totalTax
                },
                infantFare: record.infantFare,
                markups: {
                    markup1: record.Admin_Markup,
                    markup2: record.Markup,
                    total: adminMarkup
                },
                grossTotal: grossTotal,
                grandTotal: grandTotal
            },
            // Inventory Information
            inventory: {
                totalSeats: record.totalSeats,
                availableSeats: record.availableSeats,
                seatSold: seatSold,
                fareSlabs: [{
                    id: record.id,
                    amount: record.basicFare,
                    availableSeats: record.availableSeats
                }]
            }
        };

        res.status(200).json({ success: true, data: responseData });

    } catch (error) {
        logger.error('Error fetching inventory details:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch inventory details.',
            error: error.message
        });
    }
});

// ====================================================================
// 3. POST /inventory/:id/add-seats - Create new entry with updated seats and fare
router.post('/inventory/:id/add-seats', async (req, res) => {
    const pool = await getDbPool();
    const { id } = req.params;
    const { seats, fares } = req.body;

    if (typeof seats !== 'number' || seats <= 0) {
        return res.status(400).json({ success: false, message: 'Invalid seat count.' });
    }

    const transaction = new sql.Transaction(pool);

    try {
        await transaction.begin();

        // 1. First, get the existing flight details
        const getQuery = `
            SELECT * FROM FlightSearchResults 
            WHERE id = @id;
        `;

        const getRequest = new sql.Request(transaction);
        getRequest.input('id', sql.Int, id);
        const result = await getRequest.query(getQuery);

        if (result.recordset.length === 0) {
            await transaction.rollback();
            return res.status(404).json({ success: false, message: 'Flight not found.' });
        }

        const existingFlight = result.recordset[0];

        // 2. Calculate new totals
        const grossTotal = (parseFloat(fares.basicFare) || 0) + (parseFloat(fares.yq) || 0) +
            (parseFloat(fares.yr) || 0) + (parseFloat(fares.ot) || 0);
        const grandTotal = grossTotal + (parseFloat(fares.markup1) || 0) + (parseFloat(fares.markup2) || 0);

        // 3. Insert new record with updated values
        const insertQuery = `
            INSERT INTO FlightSearchResults (
                Triptype, OrgDestFrom, OrgDestTo, 
                DepartureLocation, DepartureCityName, DepAirportCode, DepartureAirportName, DepartureTerminal, 
                ArrivalLocation, ArrivalCityName, ArrAirportCode, ArrivalAirportName, ArrivalTerminal, 
                Departure_Date, DepartureTime, Arrival_Date, ArrivalTime, 
                MarketingCarrier, OperatingCarrier, FlightIdentification, ValiDatingCarrier, AirLineName, ElectronicTicketing, 
                ProductDetailQualifier, getVia, BagInfo, ProviderUserID, 
                AdtCabin, ChdCabin, InfCabin, AdtRbd, ChdRbd, InfRbd, 
                AdtFareType, AdtFarebasis, ChdfareType, ChdFarebasis, InfFareType, InfFarebasis, 
                InfFar, ChdFar, AdtFar, AdtBreakPoint, AdtAvlStatus, ChdBreakPoint, ChdAvlStatus, InfBreakPoint, InfAvlStatus, 
                fareBasis, FBPaxType, RBD, FareRule, FareDet, FlightNo, ClassType, 
                Basicfare, YQ, YR, WO, OT, GROSS_Total, Admin_Markup, Markup_Type, Markup, Grand_Total, 
                DepartureDate, ArrivalDate, Total_Seats, Used_Seat, Avl_Seat, valid_Till, 
                Status, Rt_AirLineName, Rt_FlightNo, Rt_Departure_Date, Rt_DepartureTime, Rt_Arrival_Date, Rt_ArrivalTime, 
                Rt_DepartureTerminal, Rt_ArrivalTerminal, Rt_RBD, Rt_fareBasis, Rt_ClassType, 
                FixedDepStatus, Connect, SequenceNumber, RefNo, 
                Duration, Leg, CreatedByUserid, 
                InfFare, infBfare, InfTax, InfMgtFee, SupMarkup, MarkupWithGst, TempStatus, CreatedByName, 
                IsPrimary, ConnectFrom, ConnectTo, NextDayArrival, Inventorycode, RBD1,
                updatedate
            )
            SELECT 
                Triptype, OrgDestFrom, OrgDestTo, 
                DepartureLocation, DepartureCityName, DepAirportCode, DepartureAirportName, DepartureTerminal, 
                ArrivalLocation, ArrivalCityName, ArrAirportCode, ArrivalAirportName, ArrivalTerminal, 
                Departure_Date, DepartureTime, Arrival_Date, ArrivalTime, 
                MarketingCarrier, OperatingCarrier, FlightIdentification, ValiDatingCarrier, AirLineName, ElectronicTicketing, 
                ProductDetailQualifier, getVia, BagInfo, ProviderUserID, 
                AdtCabin, ChdCabin, InfCabin, AdtRbd, ChdRbd, InfRbd, 
                AdtFareType, AdtFarebasis, ChdfareType, ChdFarebasis, InfFareType, InfFarebasis, 
                InfFar, ChdFar, AdtFar, AdtBreakPoint, AdtAvlStatus, ChdBreakPoint, ChdAvlStatus, InfBreakPoint, InfAvlStatus, 
                fareBasis, FBPaxType, RBD, FareRule, FareDet, FlightNo, ClassType, 
                @basicFare, @yq, @yr, WO, @ot, @grossTotal, @markup1, Markup_Type, @markup2, @grandTotal, 
                DepartureDate, ArrivalDate, @totalSeats, Used_Seat, @avlSeat, valid_Till, 
                Status, Rt_AirLineName, Rt_FlightNo, Rt_Departure_Date, Rt_DepartureTime, Rt_Arrival_Date, Rt_ArrivalTime, 
                Rt_DepartureTerminal, Rt_ArrivalTerminal, Rt_RBD, Rt_fareBasis, Rt_ClassType, 
                FixedDepStatus, Connect, SequenceNumber, RefNo, 
                Duration, Leg, CreatedByUserid, 
                @infantFare, infBfare, InfTax, InfMgtFee, SupMarkup, MarkupWithGst, TempStatus, CreatedByName, 
                IsPrimary, ConnectFrom, ConnectTo, NextDayArrival, Inventorycode, RBD1,
                GETDATE()
            FROM FlightSearchResults 
            WHERE id = @id;
            
            SELECT SCOPE_IDENTITY() as newId;
        `;

        const insertRequest = new sql.Request(transaction);

        // Set all the input parameters
        insertRequest.input('id', sql.Int, id);
        insertRequest.input('totalSeats', sql.NVarChar(100), seats.toString());
        insertRequest.input('avlSeat', sql.NVarChar(100), seats.toString());
        insertRequest.input('basicFare', sql.Float, parseFloat(fares.basicFare) || 0);
        insertRequest.input('yq', sql.Float, parseFloat(fares.yq) || 0);
        insertRequest.input('yr', sql.Float, parseFloat(fares.yr) || 0);
        insertRequest.input('ot', sql.Float, parseFloat(fares.ot) || 0);
        insertRequest.input('infantFare', sql.Float, parseFloat(fares.infantFare) || 0);
        insertRequest.input('markup1', sql.Float, parseFloat(fares.markup1) || 0);
        insertRequest.input('markup2', sql.Float, parseFloat(fares.markup2) || 0);
        insertRequest.input('grossTotal', sql.Float, grossTotal);
        insertRequest.input('grandTotal', sql.Float, grandTotal);

        const insertResult = await insertRequest.query(insertQuery);
        const newId = insertResult.recordset[0].newId;

        await transaction.commit();

        res.status(200).json({
            success: true,
            message: 'New flight entry created with updated seats and fare.',
            newId: newId
        });

    } catch (error) {
        logger.error('Error in add-seats:', error);
        res.status(500).json({ success: false, message: 'Failed to add seats.', error: error.message });
    }
});

// 4. POST /inventory/:id/minus-seats - Remove seats from an existing fare
router.post('/inventory/:id/minus-seats', async (req, res) => {
    const pool = await getDbPool();
    const { id } = req.params;
    const { seatsToMinus } = req.body;

    if (typeof seatsToMinus !== 'number' || seatsToMinus <= 0) {
        return res.status(400).json({ success: false, message: 'Invalid number of seats to remove.' });
    }

    try {
        const query = `
            UPDATE FlightSearchResults 
            SET 
                -- Decrement both Available Seats and Total Seats
                 updatedate = getdate() ,
                Avl_Seat = CAST(CAST(Avl_Seat AS INT) - @seatsToMinus AS NVARCHAR(100)),
                Total_Seats = CAST(CAST(Total_Seats AS INT) - @seatsToMinus AS NVARCHAR(100))
            WHERE id = @id AND CAST(Avl_Seat AS INT) >= @seatsToMinus;
        `;

        const request = pool.request();
        request.input('id', sql.Int, id);
        request.input('seatsToMinus', sql.Int, seatsToMinus);

        const result = await request.query(query);
        if (result.rowsAffected[0] === 0) {
            return res.status(400).json({ success: false, message: 'Not enough available seats or record not found.' });
        }
        res.status(200).json({ success: true, message: 'Seats removed successfully.' });

    } catch (error) {
        logger.error('Error in minus-seats:', error);
        res.status(500).json({ success: false, message: 'Failed to remove seats.', error: error.message });
    }
});

// 5. POST /inventory/:id/add-more-seats - Add more seats to an existing fare
router.post('/inventory/:id/add-more-seats', async (req, res) => {
    const pool = await getDbPool();
    const { id } = req.params;
    const { fareId, seatsToAdd } = req.body;

    console.log('Add more seats request:', { id, fareId, seatsToAdd });

    if (typeof seatsToAdd !== 'number' || seatsToAdd <= 0) {
        return res.status(400).json({
            success: false,
            message: 'Invalid number of seats to add.'
        });
    }

    try {
        // Update both Avl_Seat and Total_Seats in a single query
        const updateQuery = `
            UPDATE FlightSearchResults 
            SET 
                updatedate = getdate(), 
                Avl_Seat = CAST(CAST(Avl_Seat AS INT) + @seatsToAdd AS NVARCHAR(100)),
                Total_Seats = CAST(CAST(Total_Seats AS INT) + @seatsToAdd AS NVARCHAR(100))
            OUTPUT inserted.Avl_Seat -- Output the new available seat count
            WHERE id = @id;
        `;

        const request = pool.request();
        request.input('id', sql.Int, id);
        request.input('seatsToAdd', sql.Int, seatsToAdd);

        const result = await request.query(updateQuery);

        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Record not found.'
            });
        }

        // Use the output value for the response
        const newAvlSeatCount = parseInt(result.recordset[0].Avl_Seat, 10);

        res.status(200).json({
            success: true,
            message: `${seatsToAdd} seats added successfully.`,
            seatsLeft: newAvlSeatCount
        });

    } catch (error) {
        logger.error('Error in add-more-seats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add more seats.',
            error: error.message
        });
    }
});

// ====================================================================
// 6. PUT /inventory/:id/toggle-status - ENABLE/DISABLE
// ====================================================================
router.put('/inventory/:id/toggle-status', async (req, res) => {
    const pool = await getDbPool();
    const { id } = req.params;
    const { enabled } = req.body; // Expects a boolean true/false

    if (typeof enabled !== 'boolean') {
        return res.status(400).json({ success: false, message: 'Invalid status value. Must be true or false.' });
    }

    try {
        const query = `
            UPDATE FlightSearchResults 
            SET FixedDepStatus = @status,
            updatedate = getdate() 
            WHERE id = @id
        `;

        const request = pool.request();
        // SQL Bit (1/0)
        request.input('status', sql.Bit, enabled);
        request.input('id', sql.Int, id);

        const result = await request.query(query);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ success: false, message: 'Inventory record not found.' });
        }

        const newStatus = enabled ? 'Enabled' : 'Disabled';
        res.status(200).json({ success: true, message: `Inventory ID ${id} status set to ${newStatus}.` });

    } catch (error) {
        logger.error('Error toggling status:', error);
        res.status(500).json({ success: false, message: 'An error occurred while toggling the status.', error: error.message });
    }
});

// ====================================================================
// 7. DELETE /inventory/:id - DELETE RECORD
// ====================================================================
router.delete('/inventory/:id', async (req, res) => {
    const pool = await getDbPool();
    const { id } = req.params;

    try {
        const query = `
            UPDATE FlightSearchResults 
            SET 
                FixedDepStatus = '0',
                Status = '0',
                updatedate = GETDATE()
            WHERE id = @id
        `;

        const request = pool.request();
        request.input('id', sql.Int, id);

        const result = await request.query(query);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ success: false, message: 'Inventory record not found or already deactivated.' });
        }

        res.status(200).json({ 
            success: true, 
            message: `Inventory ID ${id} has been deactivated successfully.`,
            data: {
                id: id,
                status: '0',
                fixedDepStatus: '0',
                updatedAt: new Date().toISOString()
            }
        });

    } catch (error) {
        logger.error('Error deactivating record:', error);
        res.status(500).json({ 
            success: false, 
            message: 'An error occurred while deactivating the record.', 
            error: error.message 
        });
    }
});

// ====================================================================
// 8. PUT /inventory/:id/details - UPDATE an inventory's details
// ====================================================================
router.put('/inventory/:id/details', async (req, res) => {
    const pool = await getDbPool();
    const { id } = req.params;
    const data = req.body;

    try {
        const {
            flightNo,
            departDate, departTime,
            arriveDate, arriveTime,
            departTerminal, arriveTerminal,
            basicFare,
            yq,
            yr,
            ot,
            infantFare,
            markup1,
            markup2,
            totalSeats,
            availableSeats
        } = data;

        // Basic validation
        if (!flightNo || !departDate || !departTime || !arriveDate || !arriveTime || !departTerminal || !arriveTerminal || !basicFare || !yq || !yr || !ot || !infantFare || !markup1 || !markup2 || !totalSeats || !availableSeats) {
            return res.status(400).json({ success: false, message: 'Missing required fields.' });
        }

        // Calculate gross total (sum of all fare components)
        const grossTotal = (parseFloat(basicFare) || 0) +
            (parseFloat(yq) || 0) +
            (parseFloat(yr) || 0) +
            (parseFloat(ot) || 0);

        // Calculate grand total (gross total + markups)
        const grandTotal = grossTotal +
            (parseFloat(markup1) || 0) +
            (parseFloat(markup2) || 0);

        // Convert dates from YYYY-MM-DD to DD-MM-YYYY format for database
        const formatDepartureDate = (dateString) => {
            if (!dateString) return '';
            const [year, month, day] = dateString.split('-');
            return `${day}/${month}/${year}`;
        };

        const formattedDepartDate = formatDepartureDate(departDate);
        const formattedArriveDate = formatDepartureDate(arriveDate);

        const query = `
            UPDATE FlightSearchResults
            SET 
                FlightNo = @flightNo,
                Departure_Date = @departDate,
                DepartureDate = @departDate2,
                DepartureTime = @departTime,
                Arrival_Date = @arriveDate,
                ArrivalDate = @arriveDate2,
                ArrivalTime = @arriveTime,
                DepartureTerminal = @departTerminal,
                ArrivalTerminal = @arriveTerminal,
                BasicFare = @basicFare,
                YQ = @yq,
                YR = @yr,
                OT = @ot,
                InfFare = @infantFare,
                infBfare=@infantFare,
                Admin_Markup = @markup1,
                Markup = @markup2,
                Total_Seats = @totalSeats,
                Avl_Seat = @availableSeats,
                GROSS_Total = @grossTotal,
                Grand_Total = @grandTotal,
                updatedate = getdate()          
            WHERE id = @id;
        `;

        const request = pool.request();
        request.input('id', sql.Int, id);
        // String parameters
        request.input('flightNo', sql.NVarChar(50), flightNo || '');
        request.input('departDate', sql.NVarChar(50), formattedDepartDate);
        request.input('departTime', sql.NVarChar(50), departTime || '');
        request.input('departDate2', sql.NVarChar(50), departDate || '');
        request.input('arriveDate2', sql.NVarChar(50), arriveDate || '');
        request.input('arriveDate', sql.NVarChar(50), formattedArriveDate);
        request.input('arriveTime', sql.NVarChar(50), arriveTime || '');
        request.input('departTerminal', sql.NVarChar(50), departTerminal || '');
        request.input('arriveTerminal', sql.NVarChar(50), arriveTerminal || '');

        // Numeric parameters
        request.input('basicFare', sql.Decimal(18, 2), parseFloat(basicFare) || 0);
        request.input('yq', sql.Decimal(18, 2), parseFloat(yq) || 0);
        request.input('yr', sql.Decimal(18, 2), parseFloat(yr) || 0);
        request.input('ot', sql.Decimal(18, 2), parseFloat(ot) || 0);
        request.input('infantFare', sql.Decimal(18, 2), parseFloat(infantFare) || 0);
        request.input('markup1', sql.Decimal(18, 2), parseFloat(markup1) || 0);
        request.input('markup2', sql.Decimal(18, 2), parseFloat(markup2) || 0);
        request.input('grossTotal', sql.Float, grossTotal);
        request.input('grandTotal', sql.Float, grandTotal);
        // **FIX HERE: Using NVarChar(100) to match database usage for seat columns**
        request.input('totalSeats', sql.NVarChar(100), String(parseInt(totalSeats) || 0));
        request.input('availableSeats', sql.NVarChar(100), String(parseInt(availableSeats) || 0));

        await request.query(query);

        res.status(200).json({ success: true, message: 'Inventory updated successfully.' });

    } catch (error) {
        logger.error('Error updating inventory details:', error);
        res.status(500).json({ success: false, message: 'An error occurred.', error: error.message });
    }
});

// GET /api/inventory/supplier/suggest?q=<query>
router.get('/inventory/supplier/suggest', authenticateJWT, async (req, res) => {
    try {
        const pool = await getDbPool();
        const request = pool.request();
        const userId = req.user.id;

        // Modified query to use SELECT DISTINCT for unique names
        const query = `
            SELECT DISTINCT
               Agency_Name
            FROM    
                agent_register
            WHERE 
                Agency_Name IS NOT NULL
                AND Agency_Name <> ''
                AND IsSupplier = '1'
            ORDER BY 
                Agency_Name;
        `;

        request.input('userId', sql.NVarChar(50), userId);

        const result = await request.query(query);

        // Format the response
        const names = result.recordset.map(record => ({
            name: record.Agency_Name
        }));

        res.json(names);
    } catch (error) {
        logger.error('Error fetching CreatedByName:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// GET /api/inventory/supplier/suggest?q=<query>
router.get('/inventory/airportdep/suggest', async (req, res) => {
    try {
        const pool = await getDbPool();
        const request = pool.request();

        // Modified query to use SELECT DISTINCT for unique names
        const query = `
            SELECT DISTINCT
                DepAirportCodeRef as code ,
                DepartureCityNameRef as name
            FROM 
                FlightSearchResults
                where FixedDepStatus = '1'
        `;

        const result = await request.query(query);

        // Format the response as airportcode(cityname)
        const combined = result.recordset
            .filter(record => record.code && record.name) // Filter out null values
            .map(record => ({
                name: record.code + ' ' + record.name
            }));

        res.json(combined);
    } catch (error) {
        logger.error('Error fetching CreatedByName:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// GET /api/inventory/supplier/suggest?q=<query>
router.get('/inventory/airportarr/suggest', async (req, res) => {
    try {
        const pool = await getDbPool();
        const request = pool.request();

        // Modified query to use SELECT DISTINCT for unique names
        const query = `
            SELECT DISTINCT
                ArrAirportCodeRef as code,
                ArrivalCityNameRef as name
            FROM 
                FlightSearchResults
                 where FixedDepStatus = '1'
        `;

        const result = await request.query(query);

        // Format the response as airportcode(cityname)
        const combined = result.recordset
            .filter(record => record.code && record.name) // Filter out null values
            .map(record => ({
                name: record.code + ' ' + record.name
            }));

        res.json(combined);
    } catch (error) {
        logger.error('Error fetching CreatedByName:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

export default router;