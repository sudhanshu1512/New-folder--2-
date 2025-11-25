-- Bookings Table Schema
CREATE TABLE bookings (
    booking_id NVARCHAR(50) PRIMARY KEY,
    quote_id NVARCHAR(50) NOT NULL,
    user_id NVARCHAR(50) NOT NULL,
    booking_date DATETIME2 DEFAULT GETDATE(),
    status NVARCHAR(20) DEFAULT 'CONFIRMED', -- CONFIRMED, CANCELLED, PENDING
    
    -- Flight Information
    flight_id INT,
    flight_no NVARCHAR(20),
    airline NVARCHAR(100),
    departure_city NVARCHAR(100),
    arrival_city NVARCHAR(100),
    departure_time NVARCHAR(10),
    arrival_time NVARCHAR(10),
    flight_duration NVARCHAR(20),
    cabin_class NVARCHAR(50),
    departure_date NVARCHAR(20),
    arrival_date NVARCHAR(20),
    
    -- Contact Information
    contact_email NVARCHAR(255),
    contact_phone NVARCHAR(20),
    country_code NVARCHAR(10) DEFAULT '+91',
    
    -- Pricing Information
    base_price DECIMAL(10,2),
    total_amount DECIMAL(10,2),
    currency NVARCHAR(10) DEFAULT 'INR',
    adult_count INT DEFAULT 0,
    adult_total DECIMAL(10,2) DEFAULT 0,
    child_count INT DEFAULT 0,
    child_total DECIMAL(10,2) DEFAULT 0,
    infant_count INT DEFAULT 0,
    infant_total DECIMAL(10,2) DEFAULT 0,
    taxes DECIMAL(10,2) DEFAULT 0,
    other_charges DECIMAL(10,2) DEFAULT 0,
    
    -- Payment Information
    payment_method NVARCHAR(50),
    payment_status NVARCHAR(20) DEFAULT 'COMPLETED',
    transaction_id NVARCHAR(100),
    paid_amount DECIMAL(10,2),
    payment_date DATETIME2,
    
    -- Cancellation Information
    cancelled_at DATETIME2 NULL,
    cancellation_reason NVARCHAR(500) NULL,
    refund_status NVARCHAR(20) NULL,
    
    -- Metadata
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    source NVARCHAR(20) DEFAULT 'web',
    version NVARCHAR(10) DEFAULT '1.0',
    
    -- Indexes
    INDEX IX_bookings_user_id (user_id),
    INDEX IX_bookings_quote_id (quote_id),
    INDEX IX_bookings_booking_date (booking_date),
    INDEX IX_bookings_status (status)
);

-- Passengers Table (Separate table for normalized design)
CREATE TABLE booking_passengers (
    id INT IDENTITY(1,1) PRIMARY KEY,
    booking_id NVARCHAR(50) NOT NULL,
    passenger_sequence INT NOT NULL,
    passenger_type NVARCHAR(20), -- ADULT, CHILD, INFANT
    title NVARCHAR(10),
    first_name NVARCHAR(100),
    last_name NVARCHAR(100),
    full_name NVARCHAR(200),
    date_of_birth DATE,
    gender NVARCHAR(10),
    
    created_at DATETIME2 DEFAULT GETDATE(),
    
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE,
    INDEX IX_passengers_booking_id (booking_id)
);

-- Quotes Table (To track quote usage and expiration)
CREATE TABLE booking_quotes (
    quote_id NVARCHAR(50) PRIMARY KEY,
    flight_id INT NOT NULL,
    user_id NVARCHAR(50),
    
    -- Quote Details
    expires_at DATETIME2 NOT NULL,
    status NVARCHAR(20) DEFAULT 'ACTIVE', -- ACTIVE, EXPIRED, BOOKED, CANCELLED
    
    -- Passenger Counts
    adult_count INT DEFAULT 0,
    child_count INT DEFAULT 0,
    infant_count INT DEFAULT 0,
    
    -- Pricing
    base_price DECIMAL(10,2),
    total_amount DECIMAL(10,2),
    
    -- Booking Reference (when quote is used)
    booking_id NVARCHAR(50) NULL,
    booked_at DATETIME2 NULL,
    
    -- Metadata
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    
    INDEX IX_quotes_expires_at (expires_at),
    INDEX IX_quotes_status (status),
    INDEX IX_quotes_user_id (user_id)
);

-- Password Reset Tokens Table (To prevent token reuse)
CREATE TABLE password_reset_tokens (
    id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL,
    token NVARCHAR(500) NOT NULL UNIQUE,
    expires_at DATETIME2 NOT NULL,
    is_used BIT DEFAULT 0,
    used_at DATETIME2 NULL,
    created_at DATETIME2 DEFAULT GETDATE(),
    
    INDEX IX_reset_tokens_token (token),
    INDEX IX_reset_tokens_user_id (user_id),
    INDEX IX_reset_tokens_expires_at (expires_at)
);

-- Cleanup procedure for expired quotes
CREATE PROCEDURE sp_CleanupExpiredQuotes
AS
BEGIN
    UPDATE booking_quotes 
    SET status = 'EXPIRED', updated_at = GETDATE()
    WHERE expires_at < GETDATE() AND status = 'ACTIVE';
    
    SELECT @@ROWCOUNT as ExpiredQuotes;
END;

-- Cleanup procedure for expired reset tokens
CREATE PROCEDURE sp_CleanupExpiredResetTokens
AS
BEGIN
    DELETE FROM password_reset_tokens 
    WHERE expires_at < GETDATE() OR is_used = 1;
    
    SELECT @@ROWCOUNT as DeletedTokens;
END;


CREATE TYPE PassengerTableType AS TABLE (
    passenger_sequence INT NOT NULL,
    passenger_type NVARCHAR(20) NOT NULL,
    title NVARCHAR(10) NOT NULL,
    first_name NVARCHAR(100) NOT NULL,
    last_name NVARCHAR(100) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender NVARCHAR(10)
);
