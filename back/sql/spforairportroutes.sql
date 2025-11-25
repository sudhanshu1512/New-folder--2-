CREATE PROCEDURE dbo.GetUserBookings
    @userId INT,
    @offset INT,
    @limit INT
AS
BEGIN
    SET NOCOUNT ON;

    -- Result Set 1: Total count for pagination
    SELECT COUNT(*) AS total
    FROM bookings
    WHERE user_id = @userId;

    -- Result Set 2: Paginated list of bookings
    SELECT 
        booking_id AS bookingId,
        quote_id AS quoteId,
        -- Corrected: Convert NVARCHAR to DATETIME before formatting
       FORMAT(SWITCHOFFSET(TODATETIMEOFFSET(booking_date, '+00:00'), '+05:30'), 'MMM dd, yyyy hh:mm tt') AS booking_date,
        status,
        flight_no AS flightNo,
        airline,
        DepartureAirportName,
        ArrivalAirportName,
        departure_city AS 'from',
        arrival_city AS 'to',
        departure_time AS departureTime,
        -- Corrected: Convert NVARCHAR to DATETIME before formatting
        FORMAT(TRY_CONVERT(DATETIME, departure_date), 'MMM dd, yyyy') AS depDate,
        total_amount AS totalAmount,
        currency,
        (adult_count + child_count + infant_count) AS passengerCount
    FROM bookings 
    WHERE user_id = @userId
    ORDER BY booking_date DESC
    OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY;
END;

CREATE PROCEDURE dbo.GetRecentBookings
    @userId NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT TOP 3
        booking_id AS bookingId,
        quote_id AS quoteId,
        FORMAT(SWITCHOFFSET(TODATETIMEOFFSET(booking_date, '+00:00'), '+05:30'), 'MMM dd, yyyy hh:mm tt') AS booking_date,
        status,
        flight_no AS flightNo,
        airline,
        departure_city AS 'from',
        arrival_city AS 'to',
        departure_time AS departureTime,
        FORMAT(TRY_CONVERT(DATE, departure_date), 'MMM dd, yyyy') AS depDate,
        DepartureAirportName,
        ArrivalAirportName
    FROM bookings 
    WHERE user_id = @userId
    ORDER BY booking_date DESC;
END;

ALTER PROCEDURE dbo.GetUserBookingsWithPagination
    @userId NVARCHAR(50), -- ✅ Changed to NVARCHAR(50) to match table
    @offset INT,
    @limit INT
AS
BEGIN
    SET NOCOUNT ON;

    -- Result Set 1: Total count for pagination
    SELECT COUNT(*) AS total
    FROM bookings
    WHERE user_id = @userId;

    -- Result Set 2: Paginated list of bookings
    SELECT 
        booking_id, 
        quote_id, 
        FORMAT(SWITCHOFFSET(TODATETIMEOFFSET(booking_date, '+00:00'), '+05:30'), 'MMM dd, yyyy hh:mm tt') AS booking_date,
        status, 
        flight_no, 
        airline, 
        departure_city, 
        arrival_city, 
        departure_time, 
        FORMAT(TRY_CONVERT(DATE, departure_date), 'MMM dd, yyyy') AS departure_date,
        DepartureAirportName, 
        ArrivalAirportName,
        (adult_count + child_count + infant_count) AS passengerCount
    FROM bookings 
    WHERE user_id = @userId
    ORDER BY booking_date DESC
    OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY;
END;

Alter PROCEDURE dbo.CancelBooking
    @bookingId NVARCHAR(50),
    @userId NVARCHAR(50), -- Matching the NVARCHAR(50) schema from bookings table
    @cancellationReason NVARCHAR(500),
    @cancelledAt DATETIME2
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @currentStatus NVARCHAR(20);
    DECLARE @bookingUserId NVARCHAR(50); -- Matching the NVARCHAR(50) schema
    DECLARE @flightId INT;
    DECLARE @passengerCount INT;
    DECLARE @fareRule CHAR(1); -- Variable to hold the FareRule (R/N)
    DECLARE @newRefundStatus NVARCHAR(20); -- Variable to hold the calculated refund status

    BEGIN TRANSACTION;

    BEGIN TRY
        -- 1. Check booking existence and extract necessary data for validation/update
        SELECT
            @currentStatus = status,
            @bookingUserId = user_id,
            @flightId = flight_id,
            @passengerCount = (adult_count + child_count + infant_count),
            @fareRule = FareRule -- **NEW: Extract FareRule**
        FROM bookings
        WHERE booking_id = @bookingId;

        -- 2. Handle business logic validation (Returns specific errors if validation fails)
        IF @bookingUserId IS NULL
        BEGIN
            -- Booking not found
            RAISERROR('Booking not found.', 16, 1);
        END
        IF @bookingUserId <> @userId
        BEGIN
            -- Unauthorized
            RAISERROR('Unauthorized: You can only cancel your own bookings.', 16, 1);
        END
        IF @currentStatus = 'CANCELLED'
        BEGIN
            -- Already cancelled
            RAISERROR('Booking is already cancelled.', 16, 1);
        END

        -- **NEW: Determine Refund Status based on FareRule**
        IF UPPER(@fareRule) = 'R'
        BEGIN
            SET @newRefundStatus = 'PENDING';
        END
        ELSE IF UPPER(@fareRule) = 'N'
        BEGIN
            SET @newRefundStatus = 'NOT REFUNDABLE';
        END
        ELSE
        BEGIN
            -- Default or handle unexpected fare rule value
            SET @newRefundStatus = 'UNKNOWN';
        END


        -- 3. Update booking status to CANCELLED
        UPDATE bookings
        SET
            status = 'CANCELLED',
            cancelled_at = @cancelledAt,
            cancellation_reason = @cancellationReason,
            refund_status = @newRefundStatus, -- **MODIFIED: Use calculated status**
            updated_at = GETDATE()
        WHERE
            booking_id = @bookingId;

        -- 4. Update the seat counts in FlightSearchResults
        IF @passengerCount > 0 AND @flightId IS NOT NULL
        BEGIN
            UPDATE FlightSearchResults
            SET
                -- Decrement Used_Seat and Increment Avl_Seat safely
                Used_Seat = TRY_CAST(Used_Seat AS INT) - @passengerCount,
                Avl_Seat = TRY_CAST(Avl_Seat AS INT) + @passengerCount
            WHERE id = @flightId;
        END

        COMMIT TRANSACTION;

        -- Return success message and data required by API
        SELECT
            1 AS success,
            'Booking cancelled successfully' AS message,
            @bookingId AS bookingId,
            @cancelledAt AS cancelledAt,
            @cancellationReason AS reason,
            @newRefundStatus AS refundStatus; -- **MODIFIED: Return calculated status**

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;

        -- Return failure message and details
        SELECT 0 AS success, ERROR_MESSAGE() AS message;
    END CATCH
END;

neew

alter PROCEDURE dbo.GetQuoteDetails
    @flightId INT,
    @adults INT,
    @children INT,
    @infants INT,
    @departureDate NVARCHAR(50) -- This should match the format from the body
AS
BEGIN
    SET NOCOUNT ON;

    -- Validate passenger counts
    IF @adults IS NULL SET @adults = 0;
    IF @children IS NULL SET @children = 0;
    IF @infants IS NULL SET @infants = 0;

    -- Get flight details and calculate prices
    SELECT TOP 1
        -- Core IDs and Flight Info
        id,
        Triptype,
        OrgDestFrom,
        OrgDestTo,
        DepartureLocation,
        ArrivalLocation,
        REPLACE(REPLACE(DepAirportCode, '(', ''), ')', '') AS fromCode,
        REPLACE(REPLACE(ArrAirportCode, '(', ''), ')', '') AS toCode,
        REPLACE(REPLACE(AirLineName, '(', ''), ')', '') AS airline,
        REPLACE(REPLACE(MarketingCarrier, '(', ''), ')', '') AS marketingCarrier,
        OperatingCarrier,
        FlightIdentification,
        ValiDatingCarrier,
        AirLineName,
        FlightNo AS flightNo,
        DepartureCityName AS fromCity,
        ArrivalCityName AS toCity,
        DepartureTerminal,
        ArrivalTerminal,
        DepartureTime AS depTime,
        ArrivalTime AS arrTime,
        DepartureAirportName,
        ArrivalAirportName,
        Departure_Date, -- nvarchar date
        Arrival_Date,   -- nvarchar date
        DepartureDate,  -- date type
        ArrivalDate,    -- date type
        ClassType AS cabin,
        CONVERT(INT, Avl_Seat) AS seatsAvailable,
        SequenceNumber,
        Leg,
        RBD,
		fareBasis,
		CreatedByName,
		CreatedByUserid,
		BagInfo,

        -- Fare and Pricing Details
        Basicfare, -- Total Base Fare
        GROSS_Total, -- Total Gross Fare (before internal markup)
        Grand_Total, -- Final selling price (renamed from basePrice for clarity in API)
        YQ, YR, WO, OT, -- Tax Components
		Admin_Markup,Markup,
        AdtFar, ChdFar, InfFar, -- Total Fare Per Passenger Type (pre-markup)
        infBfare,InfFare, InfTax, -- Infant specific base and tax
        AdtFareType, ChdfareType, InfFareType,
        AdtFarebasis, ChdFarebasis, InfFarebasis,
        FBPaxType,Connect,FareRule,

        -- Cabin/RBD Details
        AdtCabin, ChdCabin, InfCabin,
        AdtRbd, ChdRbd, InfRbd,

        -- Calculated Total Amount for this quote
        (CAST(Grand_Total AS DECIMAL(10, 2)) * @adults) +
        (CAST(ROUND(Grand_Total * 0.75, 2) AS DECIMAL(10, 2)) * @children) +
        (1000.00 * @infants) AS totalAmount,

        -- Duration calculation
        CAST(DATEDIFF(MINUTE, 
            CAST(CONVERT(DATE, Departure_Date, 103) AS DATETIME) + CAST(DepartureTime AS DATETIME),
            CAST(CONVERT(DATE, Arrival_Date, 103) AS DATETIME) + CAST(ArrivalTime AS DATETIME)
        ) / 60 AS VARCHAR) + 'h ' +
        CAST(DATEDIFF(MINUTE, 
            CAST(CONVERT(DATE, Departure_Date, 103) AS DATETIME) + CAST(DepartureTime AS DATETIME),
            CAST(CONVERT(DATE, Arrival_Date, 103) AS DATETIME) + CAST(ArrivalTime AS DATETIME)
        ) % 60 AS VARCHAR) + 'm' AS flightduration
    
    FROM FlightSearchResults
    WHERE 
        id = @flightId
        AND Status = 1;
END;

ALTER PROCEDURE dbo.GetQuoteDetailsById
    @quoteId NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;

    -- Retrieve all necessary quote and flight details directly from SelectedFlightDetails_Gal
    -- using the Track_id which corresponds to the @quoteId.
    
    SELECT TOP 1
        -- Quote Core Data (repurposed from SelectedFlightDetails_Gal)
        sfg.Track_id AS quote_id,
        sfg.LineItemNumber AS flight_id,                             -- Using LineItemNumber as a placeholder for flight_id
        sfg.FlightStatus AS status,                                 -- Using FlightStatus as the quote status (e.g., 'Outbound')
        sfg.Adult AS adult_count,
        sfg.Child AS child_count,
        sfg.Infant AS infant_count,
        sfg.User_id AS user_id,
        sfg.CreatedDate AS created_at,
        sfg.CreatedDate AS updated_at,                              -- Using CreatedDate as a proxy for updated_at
        
        -- Calculated Price Data
        CAST(sfg.TotalBfare AS DECIMAL(18, 2)) AS quote_base_price,    -- Total Base Fare (All Pax)
        CAST(sfg.NetFare AS DECIMAL(18, 2)) AS quote_total_amount,     -- Net Fare (Grand Total)
        CAST(sfg.AdtBfare AS DECIMAL(18, 2)) AS adultBaseFare,         -- Base Price for ONE Adult
        CAST(sfg.ChdBfare AS DECIMAL(18, 2)) AS childFare,             -- Base Price for ONE Child
        CAST(sfg.InfBfare AS DECIMAL(18, 2)) AS infantFare,            -- Base Price for ONE Infant
        CAST(sfg.TotalTax AS DECIMAL(18, 2)) AS totalTaxes,            -- Total Tax (All Pax)
        
        -- Flight Details
        REPLACE(REPLACE(sfg.MarketingCarrier, '(', ''), ')', '') AS name, -- Carrier Code
        sfg.AirLineName AS airline,
        REPLACE(REPLACE(sfg.DepAirportCode, '(', ''), ')', '') AS fromCode,
        REPLACE(REPLACE(sfg.ArrAirportCode, '(', ''), ')', '') AS toCode,
        sfg.Flight AS No,                                              
        sfg.Baggage AS baggage,                                  -- Assuming AirlineRemark holds baggage info
        sfg.DepartureCityName AS fromCity,
        sfg.ArrivalCityName AS toCity,
        sfg.booking_status as bookingstatus,
        sfg.DepartureTerminal,
        sfg.ArrivalTerminal,
        
        -- Date & Time
        sfg.Departure_Date AS DepartureDate,                            -- Using VARCHAR date format (22/11/2025)
        sfg.Arrival_Date AS ArrivalDate,                              -- Using VARCHAR date format
        
        sfg.DepartureTime AS depTime,
        sfg.ArrivalTime AS arrTime,
        sfg.DepartureLocation AS departureairportname,
        sfg.ArrivalLocation AS arrivalairportname,
        sfg.AdtCabin AS cabin,                                         

        -- Duration and Expiry Time Remaining
        sfg.Tot_Dur AS duration, 
		sfg.ADTAdminMrk as adminMarkup,
		sfg.ADTAgentMrk as Markup,
		sfg.AdtFareType as farerule,

        -- CALCULATED: Time remaining in seconds (Node.js API will check for expiration based on 'expires_at')
        DATEDIFF(SECOND, GETDATE(), DATEADD(MINUTE, 10, sfg.CreatedDate)) AS timeRemaining
        
    FROM 
        SelectedFlightDetails_Gal AS sfg
    WHERE 
        sfg.Track_id = @quoteId;
END;

USE [FlightforAgent]
GO

/****** Object:  StoredProcedure [dbo].[ConfirmBookingTransaction]    Script Date: 18/11/2025 11:37:19 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
ALTER PROCEDURE [dbo].[ConfirmBookingTransaction]
    -- Booking and User Details
    @booking_id NVARCHAR(50),
    @quote_id NVARCHAR(50),
    @user_id NVARCHAR(50),
    @booking_date DATETIME2,
    @status NVARCHAR(20),
    -- Flight Details
    @flight_id INT,
    @flight_no NVARCHAR(20),
    @airline NVARCHAR(100),
    @departure_city NVARCHAR(100),
    @arrival_city NVARCHAR(100),
    @departure_time NVARCHAR(10),
    @arrival_time NVARCHAR(10),
    @flight_duration NVARCHAR(20),
    @cabin_class NVARCHAR(50),
    @departure_date NVARCHAR(20), 
    @arrival_date NVARCHAR(20), 
    @departure_terminal NVARCHAR(100),
    @arrival_terminal NVARCHAR(100),
    @departureairportname NVARCHAR(255),
    @arrivalairportname NVARCHAR(255),
    -- Contact Details
    @contact_email NVARCHAR(255),
    @contact_phone NVARCHAR(20),
    -- Price Details
    @base_price DECIMAL(10, 2),
    @total_amount DECIMAL(10, 2),
    @currency NVARCHAR(10),
    @adult_count INT,
    @adult_total DECIMAL(10, 2),
    @child_count INT,
    @child_total DECIMAL(10, 2),
    @infant_count INT,
    @infant_total DECIMAL(10, 2),
    @taxes DECIMAL(10, 2),
    @other_charges DECIMAL(10, 2),
    -- Payment Details
    @payment_method NVARCHAR(50),
    @transaction_id NVARCHAR(100),
    @paid_amount DECIMAL(10, 2),
    @payment_date DATETIME2,
	@farerule Char(1),
    -- Passenger Data (Table Type)
    @Passengers PassengerTableType READONLY
AS
BEGIN
    SET NOCOUNT ON;

    -- =================================================================
    -- 💡 DECLARATION SECTION 
    -- =================================================================
    DECLARE @Crd_Limit DECIMAL(10, 2);
    DECLARE @DueAmount DECIMAL(10, 2);
    DECLARE @CurrentBalance DECIMAL(10, 2);
    DECLARE @RequiredAmount DECIMAL(10, 2) = @total_amount;

    -- Initialize Transaction Status
    DECLARE @ErrorState INT = 0;
    DECLARE @ErrorMessage NVARCHAR(MAX);
    DECLARE @PassengerCount INT = 0;
    
    SELECT @PassengerCount =  @adult_count + @child_count;

    BEGIN TRANSACTION;

    BEGIN TRY

        -- =================================================================
        -- 💡 1. WALLET BALANCE CHECK & DEDUCTION (If applicable)
        -- This block performs the check AND the update (deduction)
        -- =================================================================
        IF @payment_method = 'wallet'
        BEGIN
            -- Retrieve AgentLimit and DueAmount from agent_register using user_id
            -- NOTE: Assuming User_Id in agent_register matches @user_id input
            SELECT TOP 1
                @Crd_Limit = ar.Crd_Limit,
                @DueAmount = ar.DueAmount
            FROM
                agent_register ar
            WHERE
                ar.User_Id = @user_id;

            -- Calculate Current Usable Balance (AgentLimit - DueAmount)
            SET @CurrentBalance = ISNULL(@Crd_Limit, 0) - @RequiredAmount;

            -- Check if the Current Usable Balance is sufficient
            IF @CurrentBalance < @RequiredAmount
            BEGIN
                -- Balance is insufficient -> RAISE ERROR
                SET @ErrorState = 1;
                SET @ErrorMessage = 'Insufficient wallet balance for this booking. Required amount: ' + CAST(@RequiredAmount AS NVARCHAR(20)) + ', Usable balance: ' + CAST(@CurrentBalance AS NVARCHAR(20)) + '.';
                
                -- Raise an error to trigger the CATCH block and ROLLBACK
                RAISERROR(@ErrorMessage, 16, 1);
                RETURN; 
            END
            ELSE
            BEGIN
                -- Balance is sufficient: Proceed to deduct the total amount 
                -- (by increasing DueAmount, which decreases usable balance)
                UPDATE agent_register
                SET 
                   Crd_Limit = ISNULL(Crd_Limit, 0) - @RequiredAmount 
                WHERE
                    User_Id = @user_id;
            END
        END
        -- =================================================================
        -- END WALLET BALANCE CHECK & DEDUCTION
        -- =================================================================

        -- 2. Insert into the main bookings table
        INSERT INTO bookings (
            booking_id, quote_id, user_id, booking_date, status, flight_id, flight_no, airline, 
            departure_city, arrival_city, departure_time, arrival_time, flight_duration, cabin_class, 
            departure_date, arrival_date, departureterminal, arrivalterminal, departureairportname, arrivalairportname, contact_email, contact_phone, base_price, total_amount, currency, 
            adult_count, adult_total, child_count, child_total, infant_count, infant_total, taxes, other_charges, 
            payment_method, transaction_id, paid_amount, payment_date,FareRule
        ) VALUES (
            @booking_id, @quote_id, @user_id, @booking_date, @status, @flight_id, @flight_no, @airline, 
            @departure_city, @arrival_city, @departure_time, @arrival_time, @flight_duration, @cabin_class, 
            @departure_date, @arrival_date, @departure_terminal, @arrival_terminal, @departureairportname, @arrivalairportname, @contact_email, @contact_phone, @base_price, @total_amount, @currency, 
            @adult_count, @adult_total, @child_count, @child_total, @infant_count, @infant_total, @taxes, @other_charges, 
            @payment_method, @transaction_id, @paid_amount, @payment_date,@farerule
        );

        -- 3. Insert all passengers into the booking_passengers table
        INSERT INTO booking_passengers (
            booking_id, passenger_sequence, passenger_type, title, first_name, last_name, full_name, date_of_birth, gender
        )
        SELECT
            @booking_id,
            passenger_sequence,
            passenger_type,
            title,
            first_name,
            last_name,
            CONCAT(title, ' ', first_name, ' ', last_name), 
            date_of_birth,
            gender
        FROM 
            @Passengers;

        -- 4. Mark the quote as BOOKED
        UPDATE SelectedFlightDetails_Gal
        SET 
            booking_status = 'BOOKED', 
            booking_id = @booking_id, 
            booked_at = @booking_date, 
            updated_at = GETDATE() 
        WHERE 
            Track_id = @quote_id;

        -- ❗ REMOVED DUPLICATE/UNCONDITIONAL AGENT_REGISTER UPDATE HERE ❗

        -- 5. Update the used and available seats
        IF @PassengerCount > 0 AND @flight_id IS NOT NULL
        BEGIN
            UPDATE FlightSearchResults
            SET 
                -- Seats update logic
                Used_Seat = TRY_CAST(Used_Seat AS INT) + @adult_count + @child_count,
                Avl_Seat = TRY_CAST(Avl_Seat AS INT) - @adult_count - @child_count
            WHERE 
                id = @flight_id 
                AND (TRY_CAST(Avl_Seat AS INT) >= @PassengerCount);

            -- Check if seat update failed
            IF @@ROWCOUNT = 0
            BEGIN
                SET @ErrorState = 1;
                SET @ErrorMessage = 'Failed to update seat count due to lack of availability.';
                RAISERROR(@ErrorMessage, 16, 1);
            END
        END

        COMMIT TRANSACTION;

        -- Return success status
        SELECT 1 AS success, @booking_id AS bookingId;

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;

        -- Return error details
        SELECT 0 AS success, ERROR_MESSAGE() AS errorMessage, ERROR_LINE() AS errorLine;
    END CATCH
END