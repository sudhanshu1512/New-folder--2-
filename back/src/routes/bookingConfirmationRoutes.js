import express from 'express';
import logger from '../utils/logger.js';
const router = express.Router();


// Log all requests to booking confirmation routes
router.use((req, res, next) => {
    logger.info(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    next();
});

import sql from 'mssql'; // Import sql object
import { getDbPool } from '../db.js';
import { generateTicketPDF, generateCanceledTicketPDF } from '../utils/pdfService.js';
import { formatInTimeZone } from 'date-fns-tz';
import { nanoid } from 'nanoid'; // Update the nanoid import to use ES modules syntax
import { sendBookingConfirmationEmail, sendCancellationConfirmationEmail } from '../utils/mailer.js';
import { authenticateJWT } from '../middleware/auth.js';
import { emailQueueService } from '../services/emailQueueService.js';

// Queue-based ledger processing function - persistent across server restarts
async function processLedgerAsync(ledgerData, bookingId, transactionType) {
    try {
        logger.info(`📊 Adding ${transactionType} ledger to queue for booking ${bookingId}`);

        // Add ledger to persistent queue
        const queueId = await emailQueueService.addLedgerToQueue(
            bookingId,
            transactionType,
            ledgerData
        );

        logger.info(`📊 Ledger queued successfully for booking ${bookingId}, Queue ID: ${queueId}`);

        // Trigger immediate processing (non-blocking)
        emailQueueService.processPendingEmails().catch(error => {
            logger.error('❌ Failed to trigger immediate ledger processing:', error);
        });

        return { success: true, queued: true, queueId };

    } catch (error) {
        logger.error(`❌ Failed to queue ledger for booking ${bookingId}:`, error);
        // Fallback to direct ledger insertion if queue fails
        try {
            const pool = await getDbPool();
            const result = await insertLedgerRecordWithRetry(pool, ledgerData);
            logger.info(`📊 Fallback: Ledger inserted directly for booking ${bookingId}`);
            return result;
        } catch (fallbackError) {
            logger.error(`❌ Both queue and fallback failed for booking ${bookingId}:`, fallbackError);
            return { success: false, error: fallbackError.message };
        }
    }
}

async function processEmailAsync(bookingDetails, bookingId) {
    try {
        logger.info(`📧 Adding confirmation email to queue for booking ${bookingId}`);

        // Add email to persistent queue
        const queueId = await emailQueueService.addEmailToQueue(
            bookingId,
            'CONFIRMATION',
            bookingDetails.contactDetails.email,
            bookingDetails
        );

        logger.info(`📧 Email queued successfully for booking ${bookingId}, Queue ID: ${queueId}`);

        // Trigger immediate processing (non-blocking)
        emailQueueService.processPendingEmails().catch(error => {
            logger.error('❌ Failed to trigger immediate email processing:', error);
        });

    } catch (error) {
        logger.error(`❌ Failed to queue email for booking ${bookingId}:`, error);
        // Fallback to direct email sending if queue fails
        try {
            await sendConfirmationEmailWithRetry(bookingDetails, bookingId);
            logger.info(`📧 Fallback: Email sent directly for booking ${bookingId}`);
        } catch (fallbackError) {
            logger.error(`❌ Both queue and fallback failed for booking ${bookingId}:`, fallbackError);
        }
    }
}

// Simple email sending function - queue handles retries
async function sendConfirmationEmailWithRetry(bookingDetails, bookingId) {
    try {
        logger.info(`📧 Sending confirmation email for booking ${bookingId}`);

        // Generate PDF
        const pdfBuffer = await generateTicketPDF(bookingDetails);

        // Send email
        await sendBookingConfirmationEmail(bookingDetails, pdfBuffer);

        logger.info(`✅ Confirmation email sent successfully for booking ${bookingId}`);

        return { success: true, attempts: 1, bookingId };

    } catch (error) {
        logger.error(`❌ Failed to send confirmation email for booking ${bookingId}:`, error.message);

        // Return failure - queue will handle retry logic
        return {
            success: false,
            attempts: 1,
            bookingId,
            error: error.message,
            timestamp: new Date().toISOString()
        };
    }
}

// Simple ledger insertion function - queue handles retries
async function insertLedgerRecordWithRetry(pool, ledgerData) {
    try {
        logger.info(`📊 Inserting ledger record for booking ${ledgerData.bookingId} (${ledgerData.transactionType})`);

        const ledgerRequest = pool.request();

        // Additional ledger fields
        ledgerRequest.input('AgentID', sql.NVarChar(30), ledgerData.agentId || null);
        ledgerRequest.input('AgencyName', sql.NVarChar(200), ledgerData.agencyName || null);
        ledgerRequest.input('InvoiceNo', sql.NVarChar(25), ledgerData.invoiceNo || null);
        ledgerRequest.input('PnrNo', sql.NVarChar(250), ledgerData.pnrNo || '0');
        ledgerRequest.input('TicketNo', sql.NVarChar(150), ledgerData.ticketNo || null);
        ledgerRequest.input('TicketingCarrier', sql.NVarChar(150), (ledgerData.ticketingCarrier || '').substring(0, 149));
        ledgerRequest.input('AccountID', sql.NVarChar(50), ledgerData.accountId || ledgerData.userId);
        ledgerRequest.input('ExecutiveID', sql.NVarChar(50), ledgerData.executiveId || null);
        ledgerRequest.input('IPAddress', sql.NVarChar(25), ledgerData.ipAddress || null);
        ledgerRequest.input('Debit', sql.Decimal(18, 2), ledgerData.debitAmount || 0);
        ledgerRequest.input('Credit', sql.Decimal(18, 2), ledgerData.creditAmount || 0);
        ledgerRequest.input('Aval_Balance', sql.Decimal(18, 2), ledgerData.availableBalance || 0);
        ledgerRequest.input('BookingType', sql.NVarChar(50), 'Flight');
        ledgerRequest.input('Remark', sql.NVarChar(sql.MAX), ledgerData.remark || null);
        ledgerRequest.input('PaxId', sql.Int, ledgerData.paxId || null);
        ledgerRequest.input('BillNoCorp', sql.VarChar(50), ledgerData.billNoCorp || null);
        ledgerRequest.input('ProjectID', sql.VarChar(50), ledgerData.projectId || null);
        ledgerRequest.input('BookedBy', sql.VarChar(50), ledgerData.bookedBy || ledgerData.userId);
        ledgerRequest.input('DISTRID', sql.VarChar(50), ledgerData.distrId || null);
        ledgerRequest.input('PaymentMode', sql.VarChar(50), ledgerData.paymentMethod);
        ledgerRequest.input('TDS', sql.Decimal(18, 2), ledgerData.tds || 0);
        ledgerRequest.input('DueAmount', sql.Money, ledgerData.dueAmount || 0);
        ledgerRequest.input('CreditLimit', sql.Money, ledgerData.creditLimit || 0);
        ledgerRequest.input('CreditLimitFlag', sql.Bit, ledgerData.creditLimitFlag || 0);
        ledgerRequest.input('TransType', sql.NVarChar(100), ledgerData.transType || 'BOOKING');

        const query = `
            INSERT INTO LedgerDetails (
                AgentID, AgencyName, InvoiceNo, PnrNo, TicketNo, TicketingCarrier, AccountID, ExecutiveID, IPAddress,
                Debit, Credit, Aval_Balance, CreatedDate, UpdatedDate, BookingType, Remark, PaxId, BillNoCorp, ProjectID, BookedBy, DISTRID,
                PaymentMode, TDS, DueAmount, CreditLimit, CreditLimitFlag, TransType
            ) VALUES (
                @AgentID, @AgencyName, @InvoiceNo, @PnrNo, @TicketNo, @TicketingCarrier, @AccountID, @ExecutiveID, @IPAddress,
                @Debit, @Credit, @Aval_Balance, getdate(), getdate(), @BookingType, @Remark, @PaxId, @BillNoCorp, @ProjectID, @BookedBy, @DISTRID,
                @PaymentMode, @TDS, @DueAmount, @CreditLimit, @CreditLimitFlag, @TransType
            )
        `;

        await ledgerRequest.query(query);
        logger.info(`✅ Ledger record inserted successfully for booking ${ledgerData.bookingId} (${ledgerData.transactionType})`);

        return { success: true, attempts: 1, bookingId: ledgerData.bookingId, transactionType: ledgerData.transactionType };

    } catch (error) {
        logger.error(`❌ Failed to insert ledger record for booking ${ledgerData.bookingId} (${ledgerData.transactionType}):`, error.message);

        // Return failure - queue will handle retry logic
        return {
            success: false,
            attempts: 1,
            bookingId: ledgerData.bookingId,
            transactionType: ledgerData.transactionType,
            error: error.message,
            timestamp: new Date().toISOString()
        };
    }
}

// POST /confirm-booking - Save complete booking details to database
router.post('/confirm-booking', authenticateJWT, async (req, res) => {
    const pool = await getDbPool();
    const transaction = new sql.Transaction(pool);

    try {
        const {
            quoteId,
            userId,
            passengers,
            contactDetails,
            flightDetails,
            priceBreakdown,
            paymentMethod
        } = req.body;

        // --- Validation (Keep your existing validation logic) ---
        if (!quoteId || !userId || !passengers || !contactDetails || !flightDetails) {
            return res.status(400).json({ success: false, message: 'Missing required booking data.' });
        }

        // --- 1. Fetch Agent Data (for Distributor ID and Limits) ---
        const agentResult = await pool.request()
            .input('userId', sql.NVarChar(50), userId)
            .query(`SELECT AgencyId, Agency_Name, Distr, Crd_Limit, TDS, DueAmount, Fname, Lname, Mobile, Email FROM agent_register WHERE User_Id = @userId`);

        const agentData = agentResult.recordset[0] || {};


        // Function to fetch agent data from agent_register table
        async function fetchAgentData(agentUserId) {
            try {
                const pool = await getDbPool();
                const result = await pool.request()
                    .input('userId', sql.NVarChar(50), agentUserId)
                    .query(`
                        SELECT 
                            AgencyId,
                            Agency_Name,
                            Fname,
                            Mname,
                            Lname,
                            Mobile,
                            Email,
                            Address,
                            City,
                            State,
                            Country,
                            zipcode,
                            PanNo,
                            GSTNO,
                            Agent_Type,
                            Crd_Limit,
                            AgentLimit,
                            DueAmount,
                            Phone,
                            IsSupplier
                        FROM agent_register 
                        WHERE User_Id = @userId
                    `);

                if (result.recordset.length > 0) {
                    return result.recordset[0];
                }
                return null;
            } catch (error) {
                logger.error('Error fetching agent data:', error);
                return null;
            }
        }

        // Fetch agent data for both booking user and provider
        const [bookingAgentData, providerAgentData] = await Promise.all([
            fetchAgentData(userId),
            fetchAgentData(flightDetails.provider)
        ]);



        const bookingDateIST = formatInTimeZone(new Date(), 'Asia/Kolkata', 'yyyy-MM-dd HH:mm:ss.SSS');

        // --- 2. Prepare Data for Header ---
        const bookingId = `BK-${nanoid(8).toUpperCase()}`; // OrderID
        const transactionId = `TXN${nanoid(12).toUpperCase()}`;

        // Default to 'O' (OneWay) if not specified
        const tripTypeChar = flightDetails.tripType === 'One Way' || flightDetails.tripType === 'O' ? 'O' : 'R';

        // Calculate Totals
        const adultCount = priceBreakdown?.adults?.count || 0;
        const childCount = priceBreakdown?.children?.count || 0;
        const infantCount = priceBreakdown?.infants?.count || 0;
        const totalAmount = priceBreakdown?.totalAmount || 0;
        const baseFare = priceBreakdown?.basePrice || 0; // TotalBookingCost roughly maps to Base + Tax usually, but mapping base here
        const markup = priceBreakdown?.otherCharges || 0;

        // Begin Transaction for Data Consistency
        await transaction.begin();

        // --- 3. Insert Flight Header (New SP: InsertFltHeader_V1) ---
        const headerRequest = new sql.Request(transaction);
        const totalPassengers = adultCount + childCount + infantCount;

        await headerRequest
            .input('OrderID', sql.VarChar(25), bookingId)
            .input('sector', sql.VarChar(20), flightDetails.sector) // Format: DEL-BOM
            .input('Status', sql.VarChar(20), 'CONFIRMED')
            .input('VC', sql.Char(2), flightDetails.vc || 'XX') // Validating Carrier from flightDetails
            .input('Duration', sql.VarChar(20), flightDetails.duration)
            .input('TripType', sql.Char(1), tripTypeChar) // O or R
            .input('Trip', sql.Char(1), flightDetails.trip)    // D or I
            .input('TourCode', sql.VarChar(50), '')       // Default empty
            .input('TotalBookingCost', sql.Float, totalAmount)
            .input('TotalAfterDis', sql.Float, totalAmount) // Discount logic if any
            .input('AdditionalMarkup', sql.Float, markup)
            .input('Adult', sql.Int, adultCount)
            .input('Child', sql.Int, childCount)
            .input('Infant', sql.Int, infantCount)
            .input('AgentId', sql.VarChar(50), userId)
            .input('DistrId', sql.VarChar(50), agentData.Distr || '') // Fetched from agent_register
            .input('PaymentType', sql.VarChar(10), paymentMethod) // Map to short codes
            .input('Ttl', sql.VarChar(10), passengers[0].title || 'Mr') // PgTitle (Primary Booker Title)
            .input('FName', sql.VarChar(50), passengers[0].firstName)   // PgFName (Primary Booker First Name)
            .input('LName', sql.VarChar(50), passengers[0].lastName)    // PgLName
            .input('Mobile', sql.VarChar(20), contactDetails.phone)
            .input('Mail', sql.VarChar(100), contactDetails.email)
            .input('ProjectID', sql.VarChar(50), null)
            .input('BookedBy', sql.VarChar(50), userId)
            .input('Provider', sql.VarChar(50), flightDetails.provider)
            .input('FlightId', sql.Int, flightDetails.id)
            .input('TotalPassengers', sql.Int, totalPassengers)
            .input('BillNoCorp', sql.VarChar(10), null)
            .input('IsMobile', sql.Bit, 0)
            .input('FareType', sql.VarChar(20), '') // SP sets 'OutBound' if I, else empty
            .input('ReferenceNo', sql.VarChar(30), quoteId)
            .input('OtherRemark', sql.VarChar(sql.MAX), '')
            .input('TicketId', sql.VarChar(50), flightDetails.ticketID)
            .input('SearchId', sql.VarChar(50), flightDetails.searchID)
            .input('PnrId', sql.VarChar(50), flightDetails.pnr)
            .execute('InsertFltHeader_V1');

        // --- 4. Insert Passengers (New SP: InsertFltPaxDetails) ---
        for (let i = 0; i < passengers.length; i++) {
            const p = passengers[i];
            const paxRequest = new sql.Request(transaction);

            // Determine Pax Type Code (ADT/CHD/INF)
            let paxTypeCode = 'ADT';
            if (p.type.toLowerCase().includes('child')) paxTypeCode = 'CHD';
            if (p.type.toLowerCase().includes('infant')) paxTypeCode = 'INF';

            // Find associated adult for infant (logic: assume first adult is guardian)
            let infantAssocName = '';
            if (paxTypeCode === 'INF') {
                const guardian = passengers.find(px => px.type.toLowerCase().includes('adult')) || passengers[0];
                infantAssocName = `${guardian.firstName} ${guardian.lastName}`;
            }

            await paxRequest
                .input('OrderID', sql.VarChar(25), bookingId)
                .input('Title', sql.VarChar(10), p.title)
                .input('FName', sql.VarChar(50), p.firstName)
                .input('MName', sql.VarChar(50), '') // Middle name default empty
                .input('LName', sql.VarChar(50), p.lastName)
                .input('PaxType', sql.VarChar(3), paxTypeCode)
                .input('DOB', sql.VarChar(20), new Date(p.dob).toISOString().split('T')[0]) // YYYY-MM-DD
                .input('FFNumber', sql.VarChar(20), p.frequentFlyerNo || '')
                .input('FFAirline', sql.Char(2), p.frequentFlyerAirline || '')
                .input('MealType', sql.VarChar(10), p.mealPreference || '')
                .input('SeatType', sql.VarChar(10), p.seatPreference || '')
                .input('IsPrimary', sql.Bit, i === 0 ? 1 : 0) // First pax is primary
                .input('InfAssociatePaxName', sql.VarChar(50), infantAssocName)
                .input('Gender', sql.VarChar(1), p.gender === 'Male' ? 'M' : (p.gender === 'Female' ? 'F' : 'O'))
                .input('PassportExpireDate', sql.VarChar(20), p.passportExpiry ? new Date(p.passportExpiry).toISOString().split('T')[0] : '')
                .input('PassportNo', sql.VarChar(20), p.passportNo || '')
                .input('IssueCountryCode', sql.VarChar(2), p.passportCountry || '')
                .input('NationalityCode', sql.VarChar(2), p.nationality || '')
                .execute('InsertFltPaxDetails');
        }

        // --- 5. Commit Transaction ---
        await transaction.commit();
        logger.info(`✅ DB Transaction Committed for Booking ${bookingId}`);


        // 1. DEBIT entry for the user who booked the flight
        const debitLedgerData = {
            bookingId: bookingId,
            transactionId: transactionId,
            userId: userId, // User who booked
            totalAmount: totalAmount,
            paymentMethod: paymentMethod || 'wallet',
            transactionType: 'DEBIT',
            agentId: bookingAgentData?.AgencyId || userId,
            agencyName: bookingAgentData?.Agency_Name || null,
            invoiceNo: `INV-${bookingId}`,
            pnrNo: flightDetails.pnr,
            ticketNo: flightDetails.ticketID,
            ticketingCarrier: (flightDetails.airline || '').substring(0, 149),
            accountId: bookingAgentData?.AgencyId || userId,
            executiveId: null,
            ipAddress: req.ip || null,
            debitAmount: totalAmount,
            creditAmount: 0,
            availableBalance: bookingAgentData?.Crd_Limit || 0,
            remark: `Flight booking from ${flightDetails.from} to ${flightDetails.to}`,
            paxId: null,
            billNoCorp: null,
            projectId: null,
            bookedBy: userId,
            distrId: bookingAgentData?.Distr || null,
            tds: bookingAgentData?.TDS || 0,
            dueAmount: bookingAgentData?.DueAmount || 0,
            creditLimit: bookingAgentData?.Crd_Limit || 0,
            creditLimitFlag: 0,
            transType: 'BOOKING'
        };

        // 2. CREDIT entry for the user who listed the flight (supplier/agent)
        const flightOwnerId = flightDetails.supplierId || flightDetails.agentId || userId;

        const creditLedgerData = {
            bookingId: bookingId,
            transactionId: transactionId + '-CREDIT',
            userId: flightDetails.provider, // User who listed the flight
            totalAmount: totalAmount,
            paymentMethod: paymentMethod || 'wallet',
            transactionType: 'CREDIT',
            agentId: providerAgentData?.AgencyId || flightDetails.provider,
            agencyName: providerAgentData?.Agency_Name || flightDetails.supplierName || null,
            invoiceNo: `INV-${bookingId}-CREDIT`,
            pnrNo: bookingId,
            ticketNo: null,
            ticketingCarrier: (flightDetails.airline || '').substring(0, 149),
            accountId: providerAgentData?.AgencyId || flightDetails.provider,
            executiveId: null,
            ipAddress: req.ip || null,
            debitAmount: 0,
            creditAmount: totalAmount,
            availableBalance: providerAgentData?.Crd_Limit || 0,
            remark: `Flight booking credit from ${flightDetails.from} to ${flightDetails.to}`,
            paxId: null,
            billNoCorp: null,
            projectId: null,
            bookedBy: userId,
            distrId: providerAgentData?.Distr || null,
            tds: providerAgentData?.TDS || 0,
            dueAmount: providerAgentData?.DueAmount || 0,
            creditLimit: providerAgentData?.Crd_Limit || 0,
            creditLimitFlag: 0,
            transType: 'BOOKING'
        };

        // Process ledgers asynchronously using queue
        const debitLedgerStatus = await processLedgerAsync(debitLedgerData, bookingId, 'DEBIT');
        const creditLedgerStatus = await processLedgerAsync(creditLedgerData, bookingId, 'CREDIT');

        // Check if either ledger insertion failed
        const ledgerFailed = !debitLedgerStatus.success || !creditLedgerStatus.success;
        if (ledgerFailed) {
            const failedEntries = [];
            if (!debitLedgerStatus.success) failedEntries.push(`DEBIT (attempt ${debitLedgerStatus.attempts})`);
            if (!creditLedgerStatus.success) failedEntries.push(`CREDIT (attempt ${creditLedgerStatus.attempts})`);
            logger.error(`CRITICAL: Ledger insertion failed for booking ${bookingId}. Failed entries: ${failedEntries.join(', ')}`);
        }


        // --- 7. Prepare Response Data ---
        const fullBookingDetails = {
            booking_id: bookingId,
            bookingRefNo: bookingId, // Using same as booking_id
            bookingStatus: 'CONFIRMED',
            bookingDateIST: bookingDateIST,
            airlinePNR: flightDetails.pnr || 'N/A',
            flight: {
                airline: flightDetails.airline,
                airlineLogo: flightDetails.airlineLogo || '',
                flightNo: flightDetails.flightNo,
                from: flightDetails.from,
                fromCode: flightDetails.fromCode,
                to: flightDetails.to,
                toCode: flightDetails.toCode,
                departureDate: flightDetails.departureDate,
                departureTime: flightDetails.departureDate,
                arrivalDate:flightDetails.arrivalDate,
                arrivalTime: flightDetails.arrivalDate,
                departureterminal: flightDetails.departureterminal || 'N/A',
                arrivalterminal: flightDetails.arrivalterminal || 'N/A',
                duration: flightDetails.duration,
                cabin: flightDetails.cabin || 'Economy',
                stops: flightDetails.stops || 0,
                baggage: flightDetails.baggage
            },
            passengers: passengers.map(passenger => ({
                title: passenger.title,
                firstName: passenger.firstName,
                lastName: passenger.lastName,
                type: passenger.type,
                ticketNo: flightDetails.ticketID || 'N/A',
                seat: passenger.seat || 'N/A',
            })),
            contactDetails: {
                email: contactDetails.email,
                phone: contactDetails.phone
            },
            fareRule: 'Non Refundable',
            fareBreakdown: {
                basePrice: priceBreakdown?.basePrice || 0,
                fuelSurcharge: priceBreakdown?.fuelSurcharge || 0,
                airlineTaxes: priceBreakdown?.taxes || 0,
                sgst: priceBreakdown?.sgst || 0,
                cgst: priceBreakdown?.cgst || 0,
                totalAmount: totalAmount
            },
            // Agency details from agent data
            companyName: bookingAgentData?.Agency_Name || 'Your Travel Company',
            agentName: `${bookingAgentData?.Fname || ''} ${bookingAgentData?.Lname || ''}`.trim(),
            agencyAddress: [
                bookingAgentData?.Address,
                bookingAgentData?.City,
                bookingAgentData?.State,
                bookingAgentData?.Country,
                bookingAgentData?.zipcode
            ].filter(Boolean).join(', '),
            agencyPhone: bookingAgentData?.Mobile || bookingAgentData?.Phone || 'N/A',
            agencyEmail: bookingAgentData?.Email || 'N/A'
        };

        // --- 8. Send Response & Trigger Email ---
        res.status(201).json({
            success: true,
            message: 'Booking confirmed successfully!',
            booking: {
                bookingId: bookingId,
                status: 'CONFIRMED',
                totalAmount: totalAmount
            }
        });

        // Process email asynchronously
        processEmailAsync(fullBookingDetails, bookingId).catch(error => {
            logger.error('Async email processing failed:', error);
        });

    } catch (error) {
        // Rollback transaction on error
        if (transaction.active) {
            await transaction.rollback();
            logger.info('❌ DB Transaction Rolled Back');
        }

        logger.error('Error confirming booking:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while confirming the booking',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// GET /booking/:bookingId - Retrieve booking details by booking ID
router.get('/booking/:bookingId', async (req, res) => {
    const pool = await getDbPool();
    try {
        const { bookingId } = req.params;

        // 1. Fetch both booking and passenger data with a single stored procedure call
        const result = await pool.request()
            .input('bookingId', sql.NVarChar(50), bookingId)
            .execute('GetBookingDetailsById');

        const bookingData = result.recordsets[0][0]; // First result set, first row
        const passengersData = result.recordsets[1];  // Second result set

        if (!bookingData) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found',
                bookingId
            });
        }

        // 2. Combine into a single response object
        const fullBooking = {
            bookingId: bookingData.booking_id,
            quoteId: bookingData.quote_id,
            userId: bookingData.user_id,
            bookingDate: bookingData.booking_date,
            status: bookingData.status,
            ticketno: bookingData.ticketno,
            pnr: bookingData.pnr,
            flight: {
                id: bookingData.flight_id,
                flightNo: bookingData.flight_no,
                airlinecode: bookingData.airlinecode,
                airline: bookingData.airline,
                from: bookingData.departurecity,
                to: bookingData.arrivalcity,
                departureTime: bookingData.departure_time,
                arrivalTime: bookingData.arrival_time,
                departureairportname: bookingData.departureairportname,
                arrivalairportname: bookingData.arrivalairportname,
                departureterminal: bookingData.departureterminal,
                arrivalterminal: bookingData.arrivalterminal,
                duration: bookingData.flight_duration,
                cabin: bookingData.cabin_class,
                depDate: bookingData.departure_date,
                arrDate: bookingData.arrival_date,
                depairname: bookingData.depairname,
                arrairname: bookingData.arrairname,
                baggage: bookingData.baggage,

            },
            passengers: passengersData.map(p => ({
                id: p.id,
                type: p.type,
                title: p.title,
                firstName: p.firstName,
                lastName: p.lastName,
                dateOfBirth: p.dateOfBirth,
                gender: p.gender,
                fullName: p.fullName
            })),
            contact: {
                email: bookingData.contact_email,
                phone: bookingData.contact_phone,
                depcountryCode: bookingData.depcountrycode,
                arrcountryCode: bookingData.arrcountrycode
            },
            pricing: {
                basePrice: bookingData.base_price,
                totalAmount: bookingData.total_amount,
                currency: bookingData.currency,
                farerule: bookingData.farerule,
                breakdown: {
                    adults: { count: bookingData.adult_count, total: bookingData.adult_total },
                    children: { count: bookingData.child_count, total: bookingData.child_total },
                    infants: { count: bookingData.infant_count, total: bookingData.infant_total },
                    taxes: bookingData.taxes,
                    otherCharges: bookingData.other_charges
                }
            },
            payment: {
                method: bookingData.payment_method,
                status: bookingData.payment_status,
                transactionId: bookingData.transaction_id,
                paidAmount: bookingData.paid_amount,
                paymentDate: bookingData.payment_date
            },
            cancellation: bookingData.cancelled_at ? {
                cancelledAt: bookingData.cancelled_at,
                reason: bookingData.cancellation_reason,
                refundStatus: bookingData.refund_status
            } : null
        };

        res.status(200).json({
            success: true,
            booking: fullBooking
        });

    } catch (error) {
        logger.error(`Error fetching booking ${req.params.bookingId}:`, error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while fetching the booking',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// GET /search-by-date - Search bookings by Departure Date
router.get('/search-by-date', authenticateJWT, async (req, res) => {
    const pool = await getDbPool();
    try {
        const userId = req.user.id;
        const { date } = req.query; // Expecting format YYYY-MM-DD

        if (!date) {
            return res.status(400).json({ success: false, message: 'Date is required' });
        }

        const result = await pool.request()
            .input('userId', sql.VarChar(50), userId)
            .input('searchDate', sql.Date, date) // SQL handles the date string parsing
            .execute('SearchBookingsByDate');

        // Reuse the exact same mapping logic so frontend component doesn't break
        const bookingsList = result.recordset.map(b => ({
            bookingId: b.booking_id,
            quoteId: b.quote_id,
            bookingDate: b.booking_date,
            status: b.status,
            flight: {
                flightNo: b.flight_no,
                airline: b.airline,
                from: b.departure_city,
                to: b.arrival_city,
                departureAirportName: b.DepartureAirportName,
                arrivalAirportName: b.ArrivalAirportName,
                departureTime: b.departure_time,
                depDate: b.departure_date
            },
            passengerCount: b.passengerCount
        }));

        res.status(200).json({
            success: true,
            bookings: bookingsList
        });

    } catch (error) {
        logger.error(`Error searching bookings by date for ${req.user.id}:`, error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while searching bookings.'
        });
    }
});

// GET /my-bookings - Handles both "Recent (limit 3)" and "All (Pagination)"
router.get('/my-bookings', authenticateJWT, async (req, res) => {
    const pool = await getDbPool();
    try {
        const userId = req.user.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        
        // NEW: Get filter from query, default to 'ALL'
        const filter = req.query.filter || 'ALL'; 

        const result = await pool.request()
            .input('UserId', sql.VarChar(50), userId)
            .input('offset', sql.Int, offset)
            .input('limit', sql.Int, limit)
            .input('filterType', sql.NVarChar(20), filter) // Pass to SP
            .execute('GetUserBookingsWithPagination');

        const total = result.recordsets[0][0].total;

        // Map SQL snake_case to Frontend camelCase
        const bookingsList = result.recordsets[1].map(b => ({
            bookingId: b.booking_id,       // Maps to frontend: booking.id
            quoteId: b.quote_id,
            bookingDate: b.booking_date,
            status: b.status,
            flight: {
                flightNo: b.flight_no,
                airline: b.airline,
                from: b.departure_city,    // Maps to frontend: flight.fromCity
                to: b.arrival_city,        // Maps to frontend: flight.toCity
                departureAirportName: b.DepartureAirportName,
                arrivalAirportName: b.ArrivalAirportName,
                departureTime: b.departure_time,
                depDate: b.departure_date
            },
            passengerCount: b.passengerCount
        }));

        res.status(200).json({
            success: true,
            bookings: bookingsList,
            pagination: {
                total,
                page,
                limit, // Return limit so frontend knows if it was a partial fetch
                totalPages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        logger.error(`Error fetching bookings for ${req.user.id}:`, error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while fetching bookings',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Add this new route in bookingConfirmationRoutes.js
router.get('/counts', authenticateJWT, async (req, res) => {
    try {
        const pool = await getDbPool();
        const userId = req.user.id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Authentication error: User ID not found in token.'
            });
        }

        // Get counts from the stored procedure
        const result = await pool.request()
            .input('UserId', sql.VarChar(50), userId)
            .execute('GetBookingCountsByStatus');

        if (result.recordset && result.recordset.length > 0) {
            const counts = {
                ALL: result.recordset[0].ALL || 0,
                UPCOMING: result.recordset[0].UPCOMING || 0,
                COMPLETED: result.recordset[0].COMPLETED || 0,
                CANCELLED: result.recordset[0].CANCELLED || 0
            };
            return res.json({ success: true, counts });
        }

        // If no results, return zeros
        res.json({
            success: true,
            counts: {
                ALL: 0,
                UPCOMING: 0,
                COMPLETED: 0,
                CANCELLED: 0
            }
        });

    } catch (error) {
        logger.error('Error fetching booking counts:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while fetching booking counts.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// PUT /booking/:bookingId/cancel - Cancel a booking
router.put('/booking/:bookingId/cancel', authenticateJWT, async (req, res) => {
    const pool = await getDbPool();

    try {
        const { bookingId } = req.params;
        const { reason } = req.body;
        const userId = req.user.id;

        // --- Execute the Stored Procedure for the entire cancellation transaction ---
        const cancellationReason = reason || 'User requested cancellation';
        const cancelledAt = new Date();

        const result = await pool.request()
            .input('bookingId', sql.NVarChar(50), bookingId)
            .input('userId', sql.NVarChar(50), String(userId)) // Ensure string type match
            .input('cancellationReason', sql.NVarChar(500), cancellationReason)
            .execute('CancelBooking');

        const spResult = result.recordset[0];

        if (spResult.success === 0) {
            // Handle errors thrown by the stored procedure (RAISERROR messages)
            if (spResult.message.includes('Booking not found')) {
                return res.status(404).json({ success: false, message: spResult.message });
            }
            if (spResult.message.includes('Unauthorized')) {
                return res.status(403).json({ success: false, message: spResult.message });
            }
            if (spResult.message.includes('already cancelled')) {
                return res.status(400).json({ success: false, message: spResult.message });
            }
            // For other database errors, return a generic 500
            throw new Error(spResult.message);
        }

        // // The remaining logic (fetching passengers for email, sending PDF) stays here
        // // as it requires subsequent database calls and external services.

        // // Fetch remaining booking data for the email template (two DB calls merged into one)
        // const bookingDataPromise = pool.request()
        //     .input('booking_id', sql.NVarChar(50), bookingId)
        //     .query('SELECT * FROM bookings WHERE booking_id = @booking_id');

        // const passengersResultPromise = pool.request()
        //     .input('booking_id', sql.NVarChar(50), bookingId)
        //     .query('SELECT * FROM booking_passengers WHERE booking_id = @booking_id ORDER BY passenger_sequence');

        // const [fullBookingResult, passengersResult] = await Promise.all([bookingDataPromise, passengersResultPromise]);
        // const bookingData = fullBookingResult.recordset[0];

        // Construct the full details object for the template
        // const fullCancellationDetails = {
        //     ...bookingData,
        //     passengers: passengersResult.recordset,
        //     cancellationDetails: {
        //         cancellationDate: cancelledAt.toISOString().split('T')[0],
        //         refundAmount: bookingData.total_amount,
        //     },
        // };

        // // Asynchronous email sending
        // (async () => {
        //     try {
        //         const pdfBuffer = await generateCanceledTicketPDF(fullCancellationDetails);
        //         await sendCancellationConfirmationEmail(fullCancellationDetails, pdfBuffer);
        //     } catch (emailError) {
        //         console.error(`Failed to send cancellation email for booking ${bookingId}:`, emailError);
        //     }
        // })();

        res.status(200).json({
            success: true,
            message: spResult.message,
            booking: {
                bookingId: spResult.bookingId,
                status: 'CANCELLED',
                cancellation: {
                    cancelledAt: spResult.cancelledAt,
                    reason: spResult.reason,
                    refundStatus: spResult.refundStatus
                }
            }
        });

    } catch (error) {
        // Rollback is handled inside the SP, so this is just the final error log/response
        console.error(`Error cancelling booking ${req.params.bookingId}:`, error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while confirming the booking',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Ensure 'pool' and 'sql' are imported/required at the top of your file

router.post('/booking/:bookingId/sendtkt', authenticateJWT, async (req, res) => {
    const { bookingId } = req.params;

    const pool = await getDbPool();

    try {
        // FIX 1: Removed the comma after @status
        const query = `
            UPDATE EmailQueue 
            SET status = @status,
            max_attempts = max_attempts + 1,
            next_attempt_at =  GETDATE()
            WHERE booking_id = @id
        `;

        // Ensure 'pool' is connected before this request
        const request = pool.request();

        request.input('status', sql.VarChar(50), 'PENDING');
        request.input('id', sql.VarChar(50), bookingId);

        const result = await request.query(query);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ success: false, message: 'Inventory record not found or ID incorrect.' });
        }

        // FIX 2: Added a success response (The original code didn't send anything back on success)
        return res.status(200).json({ success: true, message: 'Ticket send request queued successfully.' });

    } catch (error) {
        console.error(`Error sending ticket via email:`, error);
        res.status(500).json({ success: false, message: 'Failed to send ticket via email.' });
    }
});
    


export { sendConfirmationEmailWithRetry, insertLedgerRecordWithRetry };
export default router;
