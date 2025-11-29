import express from 'express';
import sql from 'mssql';
import { getDbPool } from '../db.js';
import logger from '../utils/logger.js';
import { authenticateJWT } from '../middleware/auth.js';

const router = express.Router();

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
                orgDest: `${airport.city},(${airport.code})`,
                // --- NEW: Capture Country Info ---
                countrycode: airport.countrycode,
                country: airport.country
            };
        }

        // If no exact match found, return default values
        return {
            city: code.toUpperCase(),
            name: null,
            code: `(${code.toUpperCase()})`,
            orgDest: `${code.toUpperCase()},(${code.toUpperCase()})`,
            countrycode: 'IN', // Default to IN if unknown
            country: 'India'
        };
    } catch (error) {
        logger.error('Error fetching airport details:', error);
        const upperCode = code.toUpperCase();
        return {
            city: upperCode,
            name: null,
            code: `(${upperCode})`,
            orgDest: `${upperCode},(${upperCode})`,
            countrycode: 'IN',
            country: 'India'
        };
    }
}

// Function to get the next tracking ID
async function getNextTrackingId() {
    try {
        const pool = await getDbPool();
        const result = await pool.request()
            .query(`SELECT ISNULL(MAX(CAST(REPLACE(Track_id, 'TRK', '') AS INT)), 0) + 1 as nextId FROM SelectedFlightDetails_Gal`);

        const nextId = result.recordset[0].nextId;
        return `TRK${String(nextId).padStart(7, '0')}`;
    } catch (error) {
        logger.error('Error generating tracking ID:', error);
        return `TRK${Date.now().toString().slice(-7)}`;
    }
}

// Function to get the next sequential number for sno
async function getNextSno() {
    try {
        const pool = await getDbPool();
        const result = await pool.request()
            .query(`SELECT ISNULL(MAX(CAST(sno AS INT)), 0) + 1 as nextSno FROM SelectedFlightDetails_Gal`);

        return result.recordset[0].nextSno.toString();
    } catch (error) {
        logger.error('Error generating sequential number:', error);
        return Date.now().toString();
    }
}

// Function to get the next Search ID
async function getNextSearchId() {
    try {
        const pool = await getDbPool();
        const result = await pool.request()
            .query(`SELECT ISNULL(MAX(CAST(REPLACE(SearchId, 'SRCH', '') AS INT)), 0) + 1 as nextSearchId FROM SelectedFlightDetails_Gal`);

        const searchId = result.recordset[0].nextSearchId;
        return `SRCH${String(searchId).padStart(7, '0')}`;
    } catch (error) {
        logger.error('Error generating sequential number:', error);
        return Date.now().toString();
    }
}

// Function to get the next PNR ID
async function getNextPNRId() {
    try {
        const pool = await getDbPool();
        const result = await pool.request()
            .query(`SELECT ISNULL(MAX(CAST(SUBSTRING(PNRId, 4, LEN(PNRId)) AS INT)), 0) + 1 as nextPNRId FROM SelectedFlightDetails_Gal`);

        const pnrId = result.recordset[0].nextPNRId;
        return `PNR${String(pnrId).padStart(7, '0')}`;
    } catch (error) {
        logger.error('Error generating PNR number:', error);
        return `PNR${String(Date.now()).slice(-7)}`;
    }
}

// Function to get the next Ticket ID
async function getNextTicketId() {
    try {
        const pool = await getDbPool();
        const result = await pool.request()
            .query(`SELECT ISNULL(MAX(CAST(REPLACE(TicketId, 'TICK', '') AS INT)), 0) + 1 as nextTicketId FROM SelectedFlightDetails_Gal`);

        const ticketId = result.recordset[0].nextTicketId;
        return `TICK${String(ticketId).padStart(7, '0')}`;
    } catch (error) {
        logger.error('Error generating sequential number:', error);
        return Date.now().toString();
    }
}

// Log all requests
router.use((req, res, next) => {
    logger.info(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    next();
});


// POST /quote (Generates and saves the quote to the database)
router.post('/quote', authenticateJWT, async (req, res) => {
    try {
        const { flightId, passengers, provider = 'GAL' } = req.body;
        const userId = req.user.id;

        if (!flightId) {
            return res.status(400).json({ success: false, message: 'Flight ID is required', field: 'flightId' });
        }
        if (!passengers || typeof passengers !== 'object') {
            return res.status(400).json({ success: false, message: 'Passengers information is required', field: 'passengers' });
        }

        const { adults = 0, children = 0, infants = 0 } = passengers;
        if (!adults && !children && !infants) {
            return res.status(400).json({ success: false, message: 'At least one passenger is required', field: 'passengers' });
        }
        if (adults < 1) {
            return res.status(400).json({ success: false, message: 'At least one adult is required', field: 'passengers.adults' });
        }

        // --- Execute Stored Procedure ---
        const dbPool = await getDbPool();
        const result = await dbPool.request()
            .input('flightId', sql.Int, flightId)
            .input('adults', sql.Int, adults)
            .input('children', sql.Int, children)
            .input('infants', sql.Int, infants)
            .input('departureDate', sql.NVarChar(50), req.body.departureDate)
            .execute('GetQuoteDetails');

        if (result.recordset.length === 0) {
            return res.status(404).json({ success: false, message: 'Flight not found or not available', flightId });
        }

        const flight = result.recordset[0];
        const totalPassengers = adults + children + infants;

        // Seat check
        const seatsRequested = adults + children;
        if (seatsRequested > flight.seatsAvailable) {
            return res.status(400).json({
                success: false,
                message: 'Not enough seats available',
                available: flight.seatsAvailable,
                requested: seatsRequested
            });
        }

        // --- 1. FETCH AIRPORT DETAILS TO GET COUNTRY CODES ---
        const fromAirportDetails = await getAirportDetails(flight.fromCode);
        const toAirportDetails = await getAirportDetails(flight.toCode);

        const fromCountryCode = fromAirportDetails.countrycode;
        const toCountryCode = toAirportDetails.countrycode;

        // --- 2. DETERMINE TRIP TYPE (I vs D) ---
        // Logic: If either From OR To is NOT 'IN' (India), it is International (I), else Domestic (D)
        // NOTE: Adjust 'IN' if your database uses a different code for India (e.g., 'IND')
        let tripScopeChar = 'D';
        if (fromCountryCode !== 'IN' || toCountryCode !== 'IN') {
            tripScopeChar = 'I';
        }

        // Calculations
        const adultCount = Number(adults);
        const childCount = Number(children);
        const infantCount = Number(infants);

        const basicFare = Number(flight.Basicfare) || 0;
        const infantBasicFare = Number(flight.infBfare) || 0;
        const yq = Number(flight.YQ) || 0;
        const yr = Number(flight.YR) || 0;
        const wo = Number(flight.WO) || 0;
        const ot = Number(flight.OT) || 0;
        const adminMarkup = Number(flight.Admin_Markup) || 0;
        const markup = Number(flight.Markup) || 0;

        const totalBaseFare = (basicFare * adultCount) + (basicFare * childCount * 0.75) + (infantBasicFare * infantCount);
        const AdltTax = yq + yr + wo + ot;
        const totalTax = AdltTax * totalPassengers;
        const totalFare = totalBaseFare + totalTax;
        const netFare = totalFare + adminMarkup + markup;

        // Generate IDs
        const trackid = await getNextTrackingId();
        const searchId = await getNextSearchId();
        const pnrId = await getNextPNRId();
        const ticketId = await getNextTicketId();

        const quote = {
            success: true,
            quoteId: trackid,
            timeRemaining: 600,
            flightDetails: {
                // ... existing details ...
            },
            priceBreakdown: {
                basePrice: totalBaseFare,
                totalTax: totalTax,
                totalAmount: netFare,
                currency: 'INR',
                adults: { count: adults, total: flight.AdtFar * adults },
                // ...
            },
            passengerInfo: { adults, children, infants }
        };

        const sector = '(' + flight.fromCode + ') - (' + flight.toCode + ')';

        // --- Insert into SelectedFlightDetails_Gal ---
        await dbPool.request()
            .input('OrgDestFrom', sql.NVarChar(255), flight.OrgDestFrom)
            .input('OrgDestTo', sql.NVarChar(255), flight.OrgDestTo)
            .input('DepartureLocation', sql.NVarChar(255), flight.DepartureLocation)
            // Use the City Names fetched from Airport Details if preferred, or stick to SP result
            .input('DepartureCityName', sql.NVarChar(255), flight.fromCity)
            .input('DepAirportCode', sql.NVarChar(255), '(' + flight.fromCode + ')')
            .input('DepartureTerminal', sql.NVarChar(255), flight.DepartureTerminal)
            .input('ArrivalLocation', sql.NVarChar(255), flight.ArrivalLocation)
            .input('ArrivalCityName', sql.NVarChar(255), flight.toCity)
            .input('ArrAirportCode', sql.NVarChar(255), '(' + flight.toCode + ')')
            .input('ArrivalTerminal', sql.NVarChar(255), flight.ArrivalTerminal)
            .input('DepartureDate_D', sql.Date, flight.DepartureDate)
            .input('Departure_Date_NV', sql.NVarChar(255), flight.Departure_Date)
            .input('DepartureTime', sql.NVarChar(255), flight.depTime)
            .input('ArrivalDate_D', sql.Date, flight.ArrivalDate)
            .input('Arrival_Date_NV', sql.NVarChar(255), flight.Arrival_Date)
            .input('ArrivalTime', sql.NVarChar(255), flight.arrTime)
            .input('Adult', sql.Int, adults)
            .input('Child', sql.Int, children)
            .input('Infant', sql.Int, infants)
            .input('TotPax', sql.Int, totalPassengers)
            .input('MarketingCarrier', sql.NVarChar(255), '(' + flight.marketingCarrier + ')')
            .input('OperatingCarrier', sql.NVarChar(255), flight.OperatingCarrier)
            .input('FlightIdentification', sql.NVarChar(255), flight.FlightIdentification)
            .input('ValiDatingCarrier', sql.NVarChar(255), flight.ValiDatingCarrier)
            .input('AirLineName', sql.NVarChar(255), flight.airline)
            .input('AvailableSeats', sql.NVarChar(255), String(flight.seatsAvailable))
            .input('AdtCabin', sql.NVarChar(255), flight.AdtCabin)
            .input('ChdCabin', sql.NVarChar(255), flight.ChdCabin)
            .input('InfCabin', sql.NVarChar(255), flight.InfCabin)
            .input('AdtRbd', sql.NVarChar(255), flight.AdtRbd || '0')
            .input('ChdRbd', sql.NVarChar(255), flight.ChdRbd || '0')
            .input('InfRbd', sql.NVarChar(255), flight.InfRbd || '0')
            .input('RBD', sql.NVarChar(255), flight.RBD || '0')
            .input('AdtFare', sql.NVarChar(255), String(flight.GROSS_Total))
            .input('AdtBfare', sql.NVarChar(255), String(flight.Basicfare))
            .input('AdtTax', sql.NVarChar(255), String(AdltTax))
            .input('ChdFare', sql.NVarChar(255), String(flight.ChdFar) || '0')
            .input('ChdBfare', sql.NVarChar(255), String(flight.Basicfare * 0.75) || '0')
            .input('ChdTax', sql.NVarChar(255), '0')
            .input('InfFare', sql.NVarChar(255), String(flight.InfFare) || '0')
            .input('InfBfare', sql.NVarChar(255), String(flight.infBfare) || '0')
            .input('InfTax', sql.NVarChar(255), String(flight.InfTax) || '0')
            .input('TotalBfare', sql.NVarChar(255), String(totalBaseFare))
            .input('TotFare', sql.NVarChar(255), String(totalFare))
            .input('TotalTax', sql.NVarChar(255), String(totalTax))
            .input('NetFare', sql.Decimal(18, 2), netFare)
            .input('STax', sql.VarChar(50), '0')
            .input('TFee', sql.VarChar(50), '0')
            .input('DisCount', sql.VarChar(50), '0')
            .input('Searchvalue', sql.NVarChar(255), (sector + '||' + flight.Departure_Date))
            .input('LineItemNumber', sql.NVarChar(50), String(flight.id))
            .input('Leg', sql.NVarChar(50), String(flight.Leg) || '0')
            .input('Flight', sql.NVarChar(50), flight.flightNo)
            .input('Provider', sql.VarChar(255), flight.CreatedByUserid)
            .input('Tot_Dur', sql.NVarChar(255), flight.flightduration)
            .input('TripType', sql.NVarChar(255), flight.Triptype)
            .input('EQ', sql.VarChar(255), '0')
            .input('Stops', sql.VarChar(255), flight.Connect ? '1 - Stops' : '0 - Stops')

            // --- 3. INSERT CALCULATED TRIP TYPE ('I' or 'D') ---
            .input('Trip', sql.VarChar(255), tripScopeChar)

            .input('Sector', sql.NVarChar(255), sector)
            .input('TripCnt', sql.VarChar(255), '0')
            .input('Currency', sql.NVarChar(255), 'INR')
            .input('ADTAdminMrk', sql.VarChar(255), String(adminMarkup || '0'))
            .input('ADTAgentMRk', sql.VarChar(255), String(markup || '0'))
            .input('CHDAdminMrk', sql.VarChar(255), '0')
            .input('CHDAgentMRk', sql.VarChar(255), '0')
            .input('InfAdminMrk', sql.VarChar(255), '0')
            .input('InfAgentMRk', sql.VarChar(255), '0')
            .input('IATAComm', sql.NVarChar(255), '0')
            .input('AdtFareType', sql.VarChar(255), flight.FareRule || '0')
            .input('AdtFarebasis', sql.VarChar(255), '0')
            .input('ChdFareType', sql.VarChar(255), flight.FareRule || '0')
            .input('ChdFarebasis', sql.VarChar(255), '0')
            .input('InfFareType', sql.VarChar(255), flight.FareRule || '0')
            .input('InfFarebasis', sql.VarChar(255), '0')
            .input('Farebasis', sql.VarChar(255), flight.fareBasis ? flight.fareBasis.toString() : '0')
            .input('FBPaxType', sql.VarChar(255), '0')
            .input('AdtFSur', sql.Decimal(18, 2), '0')
            .input('ChdFSur', sql.Decimal(18, 2), '0')
            .input('InfFSur', sql.Decimal(18, 2), '0')
            .input('TotalFuelSur', sql.Decimal(18, 2), '0')
            .input('sno', sql.NVarChar(50), await getNextSno())
            .input('depdatelcc', sql.VarChar(50), '0')
            .input('arrdatelcc', sql.VarChar(50), '0')
            .input('OriginalTF', sql.Decimal(18, 2), '0')
            .input('OriginalTT', sql.Decimal(18, 2), '0')
            .input('Track_id', sql.VarChar(50), trackid)
            .input('FlightStatus', sql.VarChar(150), 'Outbound')
            .input('Adt_Tax', sql.VarChar(255), 'YQ:' + flight.YQ + '#YR:' + flight.YR + '#WO:' + flight.WO + '#OT:' + flight.OT)
            .input('AdtOT', sql.VarChar(255), '#OT:' + flight.OT)
            .input('AdtSrvTax', sql.VarChar(255), '0')
            .input('Chd_Tax', sql.VarChar(255), 'YQ:0#YR:0#WO:0#OT:0')
            .input('ChdOT', sql.VarChar(255), '#OT:0')
            .input('ChdSrvTax', sql.VarChar(255), '0')
            .input('Inf_Tax', sql.VarChar(255), 'YQ:0#YR:0#WO:0#OT:0')
            .input('InfOT', sql.VarChar(255), '#OT:0')
            .input('InfSrvTax', sql.VarChar(255), '0')
            .input('SrvTax', sql.Decimal(18, 2), '0')
            .input('TF', sql.Decimal(18, 2), '0')
            .input('TC', sql.Decimal(18, 2), '0')
            .input('AdtTds', sql.Decimal(18, 2), '0')
            .input('ChdTds', sql.Decimal(18, 2), '0')
            .input('InfTds', sql.Decimal(18, 2), '0')
            .input('AdtComm', sql.Decimal(18, 2), '0')
            .input('ChdComm', sql.Decimal(18, 2), '0')
            .input('InfComm', sql.Decimal(18, 2), '0')
            .input('AdtCB', sql.Decimal(18, 2), '0')
            .input('ChdCB', sql.Decimal(18, 2), '0')
            .input('InfCB', sql.Decimal(18, 2), '0')
            .input('User_id', sql.NVarChar(50), userId)
            .input('AdtMgtFee', sql.Decimal(18, 2), '0')
            .input('ChdMgtFee', sql.Decimal(18, 2), '0')
            .input('InfMgtFee', sql.Decimal(18, 2), '0')
            .input('TotMgtFee', sql.Decimal(18, 2), '0')
            .input('IsCorp', sql.Bit, '0')
            .input('AdtComm1', sql.Decimal(18, 2), '0')
            .input('ChdComm1', sql.Decimal(18, 2), '0')
            .input('AdtSrvTax1', sql.VarChar(255), '0')
            .input('ChdSrvTax1', sql.VarChar(255), '0')
            .input('IsMobile', sql.Bit, 0)
            .input('RESULTTYPE', sql.VarChar(255), 'NRM')
            .input('OldTrackId', sql.VarChar(50), '0')
            .input('AirlineRemark', sql.VarChar(255), '1PC')
            .input('SearchId', sql.VarChar(100), searchId)
            .input('PNRId', sql.VarChar(100), flight.fareBasis)
            .input('TicketId', sql.VarChar(100), ticketId)
            .input('IsBagFare', sql.Bit, 0)
            .input('IsSMEFare', sql.Bit, 0)
            .input('STChdComm', sql.Decimal(18, 0), '0')
            .input('booking_status', sql.VarChar(50), 'ACTIVE')
            .input('Baggage', sql.VarChar(255), flight.BagInfo)

            .query(`
                INSERT INTO SelectedFlightDetails_Gal (
                    OrgDestFrom, OrgDestTo, DepartureLocation, DepartureCityName, DepAirportCode, DepartureTerminal, ArrivalLocation, ArrivalCityName, ArrAirportCode, ArrivalTerminal, 
                    DepartureDate, Departure_Date, DepartureTime, ArrivalDate, Arrival_Date, ArrivalTime, Adult, Child, Infant, TotPax, MarketingCarrier, OperatingCarrier, FlightIdentification, 
                    ValiDatingCarrier, AirLineName, AvailableSeats, AdtCabin, ChdCabin, InfCabin, AdtRbd, ChdRbd, InfRbd, RBD, AdtFare, AdtBfare, AdtTax, ChdFare, ChdBfare, ChdTax, InfFare, InfBfare, InfTax, TotalBfare, 
                    TotFare, TotalTax, NetFare, LineItemNumber, Leg, Flight, Provider, Tot_Dur, TripType, EQ, Stops, Sector, Currency, IATAComm, 
                    AdtFareType, AdtFarebasis, ChdFareType, ChdFarebasis, InfFareType, InfFarebasis, Farebasis, FBPaxType, AdtFSur, ChdFSur, InfFSur, TotalFuelSur, 
                    depdatelcc, arrdatelcc, OriginalTF, OriginalTT, FlightStatus, Adt_Tax, AdtOT, AdtSrvTax, Chd_Tax, ChdOT, ChdSrvTax, Inf_Tax, InfOT, InfSrvTax, SrvTax, TF, TC, 
                    AdtTds, ChdTds, InfTds, AdtComm, ChdComm, InfComm, AdtCB, ChdCB, InfCB, User_id, AdtMgtFee, ChdMgtFee, InfMgtFee, TotMgtFee, IsCorp, AdtComm1, ChdComm1, AdtSrvTax1, 
                    ChdSrvTax1, IsMobile, RESULTTYPE, AirlineRemark, IsBagFare, IsSMEFare, STChdComm, Searchvalue, STax, TFee, DisCount, CreatedDate,ADTAdminMrk,ADTAgentMrk,Track_id,PNRId,sno,Trip,TripCnt,booking_status,Baggage,expires_at,TicketId,SearchId
                )
                VALUES (
                    @OrgDestFrom, @OrgDestTo, @DepartureLocation, @DepartureCityName, @DepAirportCode, @DepartureTerminal, @ArrivalLocation, @ArrivalCityName, @ArrAirportCode, @ArrivalTerminal, 
                    @DepartureDate_D, @Departure_Date_NV, @DepartureTime, @ArrivalDate_D, @Arrival_Date_NV, @ArrivalTime, @Adult, @Child, @Infant, @TotPax, @MarketingCarrier, @OperatingCarrier, @FlightIdentification, 
                    @ValiDatingCarrier, @AirLineName, @AvailableSeats, @AdtCabin, @ChdCabin, @InfCabin, @AdtRbd, @ChdRbd, @InfRbd, @RBD, @AdtFare, @AdtBfare, @AdtTax, @ChdFare, @ChdBfare, @ChdTax, @InfFare, @InfBfare, @InfTax, @TotalBfare, 
                    @TotFare, @TotalTax, @NetFare, @LineItemNumber, @Leg, @Flight, @Provider, @Tot_Dur, @TripType, @EQ, @Stops, @Sector, @Currency, @IATAComm, 
                    @AdtFareType, @AdtFarebasis, @ChdFareType, @ChdFarebasis, @InfFareType, @InfFarebasis, @Farebasis, @FBPaxType, @AdtFSur, @ChdFSur, @InfFSur, @TotalFuelSur, 
                    @depdatelcc, @arrdatelcc, @OriginalTF, @OriginalTT, @FlightStatus, @Adt_Tax, @AdtOT, @AdtSrvTax, @Chd_Tax, @ChdOT, @ChdSrvTax, @Inf_Tax, @InfOT, @InfSrvTax, @SrvTax, @TF, @TC, 
                    @AdtTds, @ChdTds, @InfTds, @AdtComm, @ChdComm, @InfComm, @AdtCB, @ChdCB, @InfCB, @User_id, @AdtMgtFee, @ChdMgtFee, @InfMgtFee, @TotMgtFee, @IsCorp, @AdtComm1, @ChdComm1, @AdtSrvTax1, 
                    @ChdSrvTax1, @IsMobile, @RESULTTYPE, @AirlineRemark, @IsBagFare, @IsSMEFare, @STChdComm, @Searchvalue, @STax, @TFee, @DisCount, GETDATE(),@ADTAdminMrk,@ADTAgentMrk,@Track_id,@PNRId,@sno,@Trip,@TripCnt,@booking_status,@Baggage,DATEADD(minute, 10, GETDATE()),@TicketId,@SearchId
                );
            `);

        res.status(200).json(quote);
    } catch (error) {
        logger.error('Error processing booking quote:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while processing your request',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Quote ID comparison (Get Quote Details)
router.get('/quote/:quoteId', async (req, res) => {
    try {
        const { quoteId } = req.params;
        const pool = await getDbPool();

        // 1. Call the stored procedure
        const result = await pool.request()
            .input('quoteId', sql.NVarChar(50), quoteId)
            .execute('GetQuoteDetailsById');

        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Quote not found.',
            });
        }

        const quoteData = result.recordset[0];

        if (quoteData.bookingstatus !== 'ACTIVE') {
            return res.status(409).json({
                success: false,
                message: `This quote has already been ${quoteData.bookingstatus.toLowerCase()}.`
            });
        }

        // 4. Assemble the final response object
        const quoteResponse = {
            success: true,
            quoteId: quoteData.quote_id,
            expiresAt: quoteData.timeRemaining,
            timeRemaining: quoteData.timeRemaining,
            flightDetails: {
                id: quoteData.flight_id,
                baggage: quoteData.baggage,
                airline: quoteData.airline,
                from: quoteData.fromCity,
                fromCode: quoteData.fromCode,
                to: quoteData.toCity,
                toCode: quoteData.toCode,
                flightNo: `${quoteData.name} ${quoteData.No}`,
                departureTime: quoteData.depTime,
                arrivalTime: quoteData.arrTime,
                departureterminal: quoteData.DepartureTerminal,
                arrivalterminal: quoteData.ArrivalTerminal,
                duration: quoteData.duration,
                cabin: quoteData.cabin,
                departureDate: quoteData.DepartureDate,
                arrivalDate: quoteData.ArrivalDate,
                departureairportname: quoteData.departureairportname,
                arrivalairportname: quoteData.arrivalairportname,
                pnr: quoteData.pnrid,
                searchID: quoteData.searchID,
                ticketID: quoteData.ticketID,
                provider: quoteData.provider,
                vc: quoteData.name,
                trip: quoteData.trip,
                tripType: quoteData.tripType,
                stops: quoteData.stops,
                sector: quoteData.sector,
                depairname: quoteData.depairname,
                arrairname: quoteData.arrairname 
                
            },
            priceBreakdown: {
                basePrice: parseFloat(quoteData.quote_base_price),
                totalAmount: parseFloat(quoteData.quote_total_amount),
                currency: 'INR',
                adults: {
                    count: quoteData.adult_count,
                    total: quoteData.adult_count * parseFloat(quoteData.adultBaseFare)
                },
                children: {
                    count: quoteData.child_count,
                    total: quoteData.child_count * parseInt (quoteData.childFare)
                },
                infants: {
                    count: quoteData.infant_count,
                    total: quoteData.infant_count * quoteData.infantFare
                },
                taxes: quoteData.totalTaxes,
                otherCharges: parseInt(quoteData.Markup) + parseFloat(quoteData.adminMarkup),
                fareRule: quoteData.farerule
            },
            passengerInfo: {
                userId: quoteData.user_id,
                adults: quoteData.adult_count,
                children: quoteData.child_count,
                infants: quoteData.infant_count,
                total: quoteData.adult_count + quoteData.child_count + quoteData.infant_count
            },
            createdAt: quoteData.created_at,
        };

        res.status(200).json(quoteResponse);

    } catch (error) {
        logger.error('Error fetching booking quote:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while fetching the booking quote.',
        });
    }
});

// Export the router
export default router;