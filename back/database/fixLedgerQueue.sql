-- Fix Ledger Queue Stored Procedures
USE [FlightforAgent]
GO

-- Drop existing procedures if they exist
IF EXISTS (SELECT * FROM sysobjects WHERE name='AddLedgerToQueue' AND xtype='P')
BEGIN
    DROP PROCEDURE AddLedgerToQueue
    PRINT 'AddLedgerToQueue procedure dropped'
END

IF EXISTS (SELECT * FROM sysobjects WHERE name='GetPendingLedgers' AND xtype='P')
BEGIN
    DROP PROCEDURE GetPendingLedgers
    PRINT 'GetPendingLedgers procedure dropped'
END

IF EXISTS (SELECT * FROM sysobjects WHERE name='UpdateLedgerStatus' AND xtype='P')
BEGIN
    DROP PROCEDURE UpdateLedgerStatus
    PRINT 'UpdateLedgerStatus procedure dropped'
END
GO

-- Create stored procedure to add ledger to queue
EXEC('
CREATE PROCEDURE AddLedgerToQueue
    @bookingId NVARCHAR(50),
    @transactionType NVARCHAR(20),
    @ledgerData NVARCHAR(MAX)
AS
BEGIN
    INSERT INTO LedgerQueue (
        booking_id,
        transaction_type,
        ledger_data,
        next_attempt_at
    )
    VALUES (
        @bookingId,
        @transactionType,
        @ledgerData,
        GETDATE()
    );
    
    SELECT SCOPE_IDENTITY() AS QueueId;
END
');

PRINT 'AddLedgerToQueue stored procedure created';
GO

-- Create stored procedure to get pending ledgers
EXEC('
CREATE PROCEDURE GetPendingLedgers
    @limit INT = 10
AS
BEGIN
    SELECT TOP (@limit)
        id,
        booking_id,
        transaction_type,
        ledger_data,
        status,
        attempts,
        max_attempts,
        last_attempt_at,
        next_attempt_at,
        completed_at,
        error_message,
        created_at,
        updated_at
    FROM LedgerQueue
    WHERE status = ''PENDING''
        AND next_attempt_at <= GETDATE()
        AND attempts < max_attempts
    ORDER BY created_at ASC;
END
');

PRINT 'GetPendingLedgers stored procedure created';
GO

-- Create stored procedure to update ledger status
EXEC('
CREATE PROCEDURE UpdateLedgerStatus
    @queueId INT,
    @status NVARCHAR(20),
    @errorMessage NVARCHAR(MAX) = NULL
AS
BEGIN
    DECLARE @newAttempts INT = 0;
    DECLARE @nextAttempt DATETIME = NULL;
    
    IF @status = ''PROCESSING''
    BEGIN
        SET @newAttempts = (SELECT attempts + 1 FROM LedgerQueue WHERE id = @queueId);
        SET @nextAttempt = DATEADD(SECOND, POWER(2, @newAttempts) * 2, GETDATE()); -- Exponential backoff
    END
    ELSE IF @status = ''COMPLETED''
    BEGIN
        SET @nextAttempt = DATEADD(MINUTE, 1, GETDATE()); -- Set to current date + 1 minute
    END
    ELSE IF @status = ''FAILED''
    BEGIN
        SET @nextAttempt = DATEADD(MINUTE, 1, GETDATE()); -- Set to current date + 1 minute
    END
    
    UPDATE LedgerQueue
    SET 
        status = @status,
        attempts = CASE WHEN @status = ''PROCESSING'' THEN attempts + 1 ELSE attempts END,
        last_attempt_at = CASE WHEN @status = ''PROCESSING'' THEN GETDATE() ELSE last_attempt_at END,
        next_attempt_at = @nextAttempt,
        completed_at = CASE WHEN @status = ''COMPLETED'' THEN GETDATE() ELSE completed_at END,
        error_message = @errorMessage,
        updated_at = GETDATE()
    WHERE id = @queueId;
    
    SELECT 1 AS Success;
END
');

PRINT 'UpdateLedgerStatus stored procedure created';
GO

PRINT 'All Ledger Queue procedures have been recreated successfully';
