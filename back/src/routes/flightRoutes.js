import express from 'express';
import sql from 'mssql';
import { getDbPool } from '../db.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Endpoint 1: Get the list of famous/popular flight sectors
router.get('/sectors/famous', async (req, res) => {
    try {
        const pool = await getDbPool();

        // Call the stored procedure instead of executing a raw query
        const result = await pool.request().execute('GetFamousFlightSectors');

        // The rest of your logic remains the same as the stored procedure returns the formatted data
        const sectors = result.recordset.map(row => ({
            id: `${row.fromCode}-${row.toCode}`,
            from: row.fromCity,
            to: row.toCity,
            fromCode: row.fromCode,
            toCode: row.toCode,
            route: row.route,
            flightCount: row.flightCount
        }));

        res.json(sectors);
    } catch (error) {
        logger.error('Error fetching famous sectors:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching flight sectors',
            error: error.message
        });
    }
});

// // Endpoint 2: Get flights for a specific route from the database
// router.get('/flights', async (req, res) => {
//     const { fromCode, toCode } = req.query;

//     if (!fromCode || !toCode) {
//         return res.status(400).json({ message: 'fromCode and toCode query parameters are required' });
//     }

//     try {
//         const pool = await getDbPool();
//         const result = await pool.request()
//             .input('fromCode', sql.NVarChar, fromCode)
//             .input('toCode', sql.NVarChar, toCode)
//             .execute('GetFlightsForRoute'); // Call the stored procedure

//         // The stored procedure returns the data pre-formatted
//         const flights = result.recordset.map(flight => {
//             return {
//                 id: flight.id,
//                 airline: flight.airline,
//                 flightNo: flight.flightNo,
//                 logoUrl: flight.logoUrl,
//                 depTime: flight.depTime,
//                 departuredate: flight.DepartureDate,
//                 arrivaldate: flight.ArrivalDate,
//                 arrTime: flight.arrTime,
//                 duration: flight.duration, // This value is now from the SP
//                 price: flight.price,
//                 seats: flight.seats,
//                 departureairport: flight.DepartureAirportName,
//                 arrivalairport: flight.ArrivalAirportName,
//                 departureterminal: flight.DepartureTerminal,
//                 arrivalterminal: flight.ArrivalTerminal
//             };
//         });

//         res.status(200).json(flights);
//     } catch (error) {
//         logger.error('Error fetching flights:', error);
//         res.status(500).json({ message: 'Internal server error' });
//     }
// });

// departuredate - duration column is pending 

// Endpoint 2: Get flights for a specific route from the database with advanced filters
router.get('/flightssearch', async (req, res) => {
    // ... (parameter destructuring and validation are unchanged)
    const {
        fromCode,
        toCode,
        departureDate,
        tripType = 'oneway',
        flightClass = '',
        travellers = 1
    } = req.query;

    // Validate required parameters
    if (!fromCode || !toCode) {
        return res.status(400).json({
            message: 'fromCode and toCode query parameters are required'
        });
    }

    try {
        const pool = await getDbPool();

        // 1. Construct the SQL Query
        // 1. Construct the base SQL Query using TRY_CONVERT for safety
        let sqlQuery = `
            SELECT
                id,
                REPLACE(REPLACE(AirLineName, '(', ''), ')', '') AS airline,
                REPLACE(REPLACE(MarketingCarrier, '(', ''), ')', '') AS name,
                FlightNo AS No,
                'https://www.gstatic.com/flights/airline_logos/70px/AI.png' AS logoUrl,
                FORMAT(TRY_CONVERT(DATE, Departure_Date, 103), 'dd-MM-yyyy') AS DepartureDate,
                DepartureTime AS depTime,
                FORMAT(TRY_CONVERT(DATE, Arrival_Date, 103), 'dd-MM-yyyy') AS ArrivalDate,
                ArrivalTime AS arrTime,
                DepartureTerminal,
                ArrivalTerminal,
                DepartureAirportName,
                ArrivalAirportName,
                InfBfare,
                REPLACE(REPLACE(DepAirportCode, '(', ''), ')', '') AS DepAirportCode,
                REPLACE(REPLACE(ArrAirportCode, '(', ''), ')', '') AS ArrAirportCode,
                CAST(CAST(Grand_Total AS DECIMAL(10,2)) * @travellers AS DECIMAL(10,2)) AS price,
                Avl_Seat AS seats,
                CAST(DATEDIFF(MINUTE, 
                    CAST(TRY_CONVERT(DATE, Departure_Date, 103) AS DATETIME) + CAST(DepartureTime AS DATETIME),
                    CAST(TRY_CONVERT(DATE, Arrival_Date, 103) AS DATETIME) + CAST(ArrivalTime AS DATETIME)
                ) / 60 AS VARCHAR) + 'h ' +
                CAST(DATEDIFF(MINUTE, 
                    CAST(TRY_CONVERT(DATE, Departure_Date, 103) AS DATETIME) + CAST(DepartureTime AS DATETIME),
                    CAST(TRY_CONVERT(DATE, Arrival_Date, 103) AS DATETIME) + CAST(ArrivalTime AS DATETIME)
                ) % 60 AS VARCHAR) + 'm' AS duration,
                CONCAT(REPLACE(REPLACE(MarketingCarrier, '(', ''), ')', ''), ' ', FlightNo) AS flightNo
            FROM FlightSearchResults
            WHERE 
                REPLACE(REPLACE(DepAirportCode, '(', ''), ')', '') = @fromCode
                AND REPLACE(REPLACE(ArrAirportCode, '(', ''), ')', '') = @toCode
                AND Avl_Seat >= @travellers
                AND (FixedDepStatus = 1 OR FixedDepStatus IS NULL)
                AND (CAST(TRY_CONVERT(DATE, Departure_Date, 103) AS DATETIME) + CAST(DepartureTime AS DATETIME) > GETDATE())
        `;

        // 2. Dynamically add filters
        if (departureDate) {
            sqlQuery += ` AND TRY_CONVERT(DATE, Departure_Date, 103) = TRY_CONVERT(DATE, @departureDate, 103)`;
        }
        if (flightClass) {
            sqlQuery += ` AND ClassType = @flightClass`;
        }

        // 3. Add the ORDER BY clause
        sqlQuery += ` ORDER BY TRY_CONVERT(DATE, Departure_Date, 103) ASC, DepartureTime;`;

        // 4. Define the SQL parameters and execute the query
        const request = pool.request()
            .input('fromCode', sql.NVarChar, fromCode)
            .input('toCode', sql.NVarChar, toCode)
            .input('travellers', sql.Int, travellers);

        if (departureDate) {
            request.input('departureDate', sql.NVarChar, departureDate);
        }
        if (flightClass) {
            request.input('flightClass', sql.NVarChar, flightClass);
        }

        const result = await request.query(sqlQuery);



        const formatDate = (dateStr) => {
            if (!dateStr) return '';
            // Parse dd-MM-yyyy format
            const [day, month, year] = dateStr.split('-').map(Number);
            const date = new Date(year, month - 1, day); // month is 0-indexed in JS Date

            return date.toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            }).replace(/ /g, ' ');
        };

        const flights = result.recordset.map(flight => {
            return {
                id: flight.id,
                airline: flight.airline,
                flightNo: flight.flightNo,
                logoUrl: flight.logoUrl,
                depTime: flight.depTime,
                departuredate: formatDate(flight.DepartureDate),
                arrivaldate: formatDate(flight.ArrivalDate),
                arrTime: flight.arrTime,
                duration: flight.duration,
                price: flight.price,
                seats: flight.seats,
                departureairport: flight.DepartureAirportName,
                arrivalairport: flight.ArrivalAirportName,
                departureterminal: flight.DepartureTerminal,
                arrivalterminal: flight.ArrivalTerminal,
                infantBasicFare: flight.InfBfare,
                
            };
        });

        res.status(200).json(flights);
    } catch (error) {
        logger.error('Error fetching flights:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

export default router;

