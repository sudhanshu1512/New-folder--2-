-- Create Email Queue table for persistent email processing
-- This ensures emails are not lost if server restarts

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='EmailQueue' AND xtype='U')
BEGIN
    CREATE TABLE EmailQueue (
        id INT IDENTITY(1,1) PRIMARY KEY,
        booking_id NVARCHAR(50) NOT NULL,
        email_type NVARCHAR(20) NOT NULL DEFAULT 'CONFIRMATION', -- CONFIRMATION, CANCELLATION
        recipient_email NVARCHAR(255) NOT NULL,
        booking_details NVARCHAR(MAX) NOT NULL, -- JSON string of booking details
        status NVARCHAR(20) NOT NULL DEFAULT 'PENDING', -- PENDING, PROCESSING, SENT, FAILED
        attempts INT NOT NULL DEFAULT 0,
        max_attempts INT NOT NULL DEFAULT 3,
        last_attempt_at DATETIME NULL,
        next_attempt_at DATETIME NOT NULL DEFAULT GETDATE(),
        sent_at DATETIME NULL,
        error_message NVARCHAR(MAX) NULL,
        created_at DATETIME NOT NULL DEFAULT GETDATE(),
        updated_at DATETIME NOT NULL DEFAULT GETDATE()
    );

    -- Create indexes for performance
    CREATE INDEX IX_EmailQueue_Status_NextAttempt ON EmailQueue(status, next_attempt_at);
    CREATE INDEX IX_EmailQueue_BookingId ON EmailQueue(booking_id);

    PRINT 'EmailQueue table created successfully';
END
ELSE
BEGIN
    PRINT 'EmailQueue table already exists';
END

-- Create Ledger Queue table for persistent ledger processing
-- This ensures ledger records are not lost if server restarts

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='LedgerQueue' AND xtype='U')
BEGIN
    CREATE TABLE LedgerQueue (
        id INT IDENTITY(1,1) PRIMARY KEY,
        booking_id NVARCHAR(50) NOT NULL,
        transaction_type NVARCHAR(20) NOT NULL, -- DEBIT, CREDIT
        ledger_data NVARCHAR(MAX) NOT NULL, -- JSON string of ledger data
        status NVARCHAR(20) NOT NULL DEFAULT 'PENDING', -- PENDING, PROCESSING, COMPLETED, FAILED
        attempts INT NOT NULL DEFAULT 0,
        max_attempts INT NOT NULL DEFAULT 3,
        last_attempt_at DATETIME NULL,
        next_attempt_at DATETIME NOT NULL DEFAULT GETDATE(),
        completed_at DATETIME NULL,
        error_message NVARCHAR(MAX) NULL,
        created_at DATETIME NOT NULL DEFAULT GETDATE(),
        updated_at DATETIME NOT NULL DEFAULT GETDATE()
    );

    -- Create indexes for performance
    CREATE INDEX IX_LedgerQueue_Status_NextAttempt ON LedgerQueue(status, next_attempt_at);
    CREATE INDEX IX_LedgerQueue_BookingId ON LedgerQueue(booking_id);

    PRINT 'LedgerQueue table created successfully';
END
ELSE
BEGIN
    PRINT 'LedgerQueue table already exists';
END

-- Create stored procedure to add email to queue
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='AddEmailToQueue' AND xtype='P')
BEGIN
    EXEC('
    CREATE PROCEDURE AddEmailToQueue
        @bookingId NVARCHAR(50),
        @emailType NVARCHAR(20),
        @recipientEmail NVARCHAR(255),
        @bookingDetails NVARCHAR(MAX)
    AS
    BEGIN
        INSERT INTO EmailQueue (
            booking_id,
            email_type,
            recipient_email,
            booking_details,
            next_attempt_at
        )
        VALUES (
            @bookingId,
            @emailType,
            @recipientEmail,
            @bookingDetails,
            GETDATE()
        );
        
        SELECT SCOPE_IDENTITY() AS QueueId;
    END
    ');
    
    PRINT 'AddEmailToQueue stored procedure created';
END

-- Create stored procedure to get pending emails
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='GetPendingEmails' AND xtype='P')
BEGIN
    EXEC('
    CREATE PROCEDURE GetPendingEmails
        @limit INT = 10
    AS
    BEGIN
        SELECT TOP (@limit)
            id,
            booking_id,
            email_type,
            recipient_email,
            booking_details,
            status,
            attempts,
            max_attempts,
            last_attempt_at,
            next_attempt_at,
            sent_at,
            error_message,
            created_at,
            updated_at
        FROM EmailQueue
        WHERE status = ''PENDING''
            AND next_attempt_at <= GETDATE()
            AND attempts < max_attempts
        ORDER BY created_at ASC;
    END
    ');
    
    PRINT 'GetPendingEmails stored procedure created';
END

-- Create stored procedure to update email status
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='UpdateEmailStatus' AND xtype='P')
BEGIN
    EXEC('
    CREATE PROCEDURE UpdateEmailStatus
        @queueId INT,
        @status NVARCHAR(20),
        @errorMessage NVARCHAR(MAX) = NULL
    AS
    BEGIN
        DECLARE @newAttempts INT = 0;
        DECLARE @nextAttempt DATETIME = NULL;
        
        IF @status = ''PROCESSING''
        BEGIN
            SET @newAttempts = (SELECT attempts + 1 FROM EmailQueue WHERE id = @queueId);
            SET @nextAttempt = DATEADD(SECOND, POWER(2, @newAttempts) * 2, GETDATE()); -- Exponential backoff
        END
        ELSE IF @status = ''SENT''
        BEGIN
            SET @nextAttempt = NULL;
        END
        ELSE IF @status = ''FAILED''
        BEGIN
            SET @nextAttempt = NULL;
        END
        
        UPDATE EmailQueue
        SET 
            status = @status,
            attempts = CASE WHEN @status = ''PROCESSING'' THEN attempts + 1 ELSE attempts END,
            last_attempt_at = CASE WHEN @status = ''PROCESSING'' THEN GETDATE() ELSE last_attempt_at END,
            next_attempt_at = @nextAttempt,
            sent_at = CASE WHEN @status = ''SENT'' THEN GETDATE() ELSE sent_at END,
            error_message = @errorMessage,
            updated_at = GETDATE()
        WHERE id = @queueId;
        
        SELECT 1 AS Success;
    END
    ');
    
    PRINT 'UpdateEmailStatus stored procedure created';
END

-- Create stored procedure to add ledger to queue
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='AddLedgerToQueue' AND xtype='P')
BEGIN
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
END

-- Create stored procedure to get pending ledgers
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='GetPendingLedgers' AND xtype='P')
BEGIN
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
END

-- Create stored procedure to update ledger status
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='UpdateLedgerStatus' AND xtype='P')
BEGIN
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
            SET @nextAttempt = NULL;
        END
        ELSE IF @status = ''FAILED''
        BEGIN
            SET @nextAttempt = NULL;
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
END
