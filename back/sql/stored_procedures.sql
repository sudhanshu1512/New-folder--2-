-- =============================================
-- Authentication Stored Procedures
-- =============================================

-- 1. Stored Procedure for Agent Registration
ALTER PROCEDURE sp_RegisterAgent
    -- Existing Parameters (keep all of them)
    @Title NVARCHAR(10) = '',
    @Fname NVARCHAR(50),
    @Mname NVARCHAR(50) = '',
    @Lname NVARCHAR(50),
    @Address NTEXT = '',
    @City NVARCHAR(50) = '',
    @State NVARCHAR(50) = '',
    @Country NVARCHAR(50) = '',
    @Zipcode NVARCHAR(20) = '',
    @Phone NVARCHAR(20) = '',
    @Mobile NVARCHAR(20),
    @Email NVARCHAR(100),
    @Alt_Email NVARCHAR(100) = '',
    @Agency_Name NVARCHAR(100) = '',
    @Website NVARCHAR(200) = '',
    @PanNo NVARCHAR(20) = '',
    @Status NVARCHAR(20) = 'PENDING',
    @Stax_no NVARCHAR(50) = '',
    @User_Id NVARCHAR(20),
    @PWD NVARCHAR(250),
    @Agent_Type NVARCHAR(20) = 'AGENT',
    @Agent_status NVARCHAR(20) = 'ACTIVE',
    @District NVARCHAR(50) = '',
    @StateCode NVARCHAR(10) = '',
    @GSTNO NVARCHAR(50) = '',
    @Branch NVARCHAR(50) = '',
    @WhatsAppNo NVARCHAR(20) = '',
    @Area NVARCHAR(50) = '',
    @ApiStatus BIT = 1,

    -- NEW: Add parameters for the file URLs from Cloudinary
    @PanFileUrl NVARCHAR(255) = '',
    @GstFileUrl NVARCHAR(255) = '',
    @AddressProofUrl NVARCHAR(255) = ''
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @Result TABLE (
        Success BIT,
        Message NVARCHAR(255),
        Counter INT,
        User_Id NVARCHAR(20)
    );
    
    BEGIN TRY
        -- Check if mobile number already exists (no change here)
        IF EXISTS (SELECT 1 FROM agent_register WHERE User_Id = @User_Id)
        BEGIN
            INSERT INTO @Result VALUES (0, 'Mobile number is already registered', NULL, NULL);
            SELECT * FROM @Result;
            RETURN;
        END
        
        -- Check if email already exists (no change here)
        IF EXISTS (SELECT 1 FROM agent_register WHERE Email = @Email)
        BEGIN
            INSERT INTO @Result VALUES (0, 'Email is already registered', NULL, NULL);
            SELECT * FROM @Result;
            RETURN;
        END
        
        -- MODIFIED: Insert new agent with the new URL fields
        INSERT INTO agent_register (
            -- Existing columns
            Title, Fname, Mname, Lname, Address, City, State, Country, zipcode,
            Phone, Mobile, Email, Alt_Email, Agency_Name, Website, PanNo, Status, Stax_no,
            User_Id, PWD, Agent_Type, Agent_status, District, StateCode, GSTNO, Branch, WhatsAppNo,
            Area, ApiStatus,
            
            -- NEW: Add the new columns to the insert list
            PanFileUrl,
            GstFileUrl,
            AddressProofUrl
        )
        VALUES (
            -- Existing values
            @Title, @Fname, @Mname, @Lname, @Address, @City, @State, @Country, @Zipcode,
            @Phone, @Mobile, @Email, @Alt_Email, @Agency_Name, @Website, @PanNo, @Status, @Stax_no,
            @User_Id, @PWD, @Agent_Type, @Agent_status, @District, @StateCode, @GSTNO, @Branch, @WhatsAppNo,
            @Area, @ApiStatus,

            -- NEW: Add the new parameters to the values list
            @PanFileUrl,
            @GstFileUrl,
            @AddressProofUrl
        );
        
        DECLARE @NewCounter INT = SCOPE_IDENTITY();
        
        INSERT INTO @Result VALUES (1, 'Agent registered successfully', @NewCounter, @User_Id);
        SELECT * FROM @Result;
        
    END TRY
    BEGIN CATCH
        INSERT INTO @Result VALUES (0, ERROR_MESSAGE(), NULL, NULL);
        SELECT * FROM @Result;
    END CATCH
END;
GO
-- 2. Stored Procedure for Agent Login
CREATE PROCEDURE sp_LoginAgent
    @UserId NVARCHAR(20),
    @Password NVARCHAR(250)
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @Result TABLE (
        Success BIT,
        Message NVARCHAR(255),
        Counter INT,
        User_Id NVARCHAR(20),
        Fname NVARCHAR(50),
        Lname NVARCHAR(50),
        Email NVARCHAR(100),
        PWD NVARCHAR(250),
        Agent_status NVARCHAR(20)
    );
    
    BEGIN TRY
        -- Get agent details
        IF EXISTS (SELECT 1 FROM agent_register WHERE User_Id = @UserId)
        BEGIN
            INSERT INTO @Result
            SELECT 
                1 as Success,
                'Agent found' as Message,
                Counter,
                User_Id,
                Fname,
                Lname,
                Email,
                PWD,
                Agent_status
            FROM agent_register 
            WHERE User_Id = @UserId;
        END
        ELSE
        BEGIN
            INSERT INTO @Result VALUES (0, 'Agent not found', NULL, NULL, NULL, NULL, NULL, NULL, NULL);
        END
        
        SELECT * FROM @Result;
        
    END TRY
    BEGIN CATCH
        INSERT INTO @Result VALUES (0, ERROR_MESSAGE(), NULL, NULL, NULL, NULL, NULL, NULL, NULL);
        SELECT * FROM @Result;
    END CATCH
END;
GO

-- 5. Stored Procedure for Get Agent Profile
CREATE PROCEDURE sp_GetAgentProfile
    @AgentId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @Result TABLE (
        Success BIT,
        Message NVARCHAR(255),
        Counter INT,
        User_Id NVARCHAR(20),
        Fname NVARCHAR(50),
        Lname NVARCHAR(50),
        Email NVARCHAR(100),
        Agent_status NVARCHAR(20)
    );
    
    BEGIN TRY
        IF EXISTS (SELECT 1 FROM agent_register WHERE Counter = @AgentId)
        BEGIN
            INSERT INTO @Result
            SELECT 
                1 as Success,
                'Profile found' as Message,
                Counter,
                User_Id,
                Fname,
                Lname,
                Email,
                Agent_status
            FROM agent_register 
            WHERE Counter = @AgentId;
        END
        ELSE
        BEGIN
            INSERT INTO @Result VALUES (0, 'Agent not found', NULL, NULL, NULL, NULL, NULL, NULL);
        END
        
        SELECT * FROM @Result;
        
    END TRY
    BEGIN CATCH
        INSERT INTO @Result VALUES (0, ERROR_MESSAGE(), NULL, NULL, NULL, NULL, NULL, NULL);
        SELECT * FROM @Result;
    END CATCH
END;
GO

-- 6. Stored Procedure for Check Mobile Exists
CREATE PROCEDURE sp_CheckMobileExists
    @Mobile NVARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        CASE WHEN EXISTS (SELECT 1 FROM agent_register WHERE User_Id = @Mobile) 
             THEN 1 
             ELSE 0 
        END as Exists;
END;
GO

-- 7. Stored Procedure for Check Email Exists
CREATE PROCEDURE sp_CheckEmailExists
    @Email NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        CASE WHEN EXISTS (SELECT 1 FROM agent_register WHERE Email = @Email) 
             THEN 1 
             ELSE 0 
        END as Exists;
END;
GO

-- 8. Stored Procedure for Check PAN Number Exists
CREATE PROCEDURE sp_CheckPanExists
    @PanNo NVARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @Result TABLE (
        Exists BIT,
        Message NVARCHAR(255),
        AgentName NVARCHAR(101),
        AgentId INT
    );
    
    BEGIN TRY
        -- Check if PAN number exists and is not empty
        IF @PanNo IS NULL OR LTRIM(RTRIM(@PanNo)) = ''
        BEGIN
            INSERT INTO @Result VALUES (0, 'PAN number is required', NULL, NULL);
            SELECT * FROM @Result;
            RETURN;
        END
        
        -- Check if PAN number already exists
        IF EXISTS (SELECT 1 FROM agent_register WHERE PanNo = @PanNo AND PanNo IS NOT NULL AND PanNo != '')
        BEGIN
            DECLARE @AgentName NVARCHAR(101), @AgentId INT;
            
            SELECT 
                @AgentName = CONCAT(Fname, ' ', Lname),
                @AgentId = Counter
            FROM agent_register 
            WHERE PanNo = @PanNo;
            
            INSERT INTO @Result VALUES (1, 'PAN number already exists', @AgentName, @AgentId);
        END
        ELSE
        BEGIN
            INSERT INTO @Result VALUES (0, 'PAN number is available', NULL, NULL);
        END
        
        SELECT * FROM @Result;
        
    END TRY
    BEGIN CATCH
        INSERT INTO @Result VALUES (0, ERROR_MESSAGE(), NULL, NULL);
        SELECT * FROM @Result;
    END CATCH
END;
GO

-- 9. Add reset token columns if they don't exist
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('agent_register') AND name = 'reset_token')
BEGIN
    ALTER TABLE agent_register ADD reset_token NVARCHAR(500) NULL;
END;

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('agent_register') AND name = 'reset_token_expiry')
BEGIN
    ALTER TABLE agent_register ADD reset_token_expiry DATETIME NULL;
END;

PRINT 'All stored procedures created successfully!';

CREATE PROCEDURE dbo.UpdateUserPassword
    @UserId NVARCHAR(20),
    @NewPassword NVARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE agent_register 
    SET PWD = @NewPassword 
    WHERE User_Id = @UserId;

    SELECT @@ROWCOUNT AS rowsAffected;
END;

-- Now calculates the expiry time internally (GETDATE() + 10 minutes).
-- ===============================================
CREATE OR ALTER PROCEDURE sp_ForgotPasswordAgent
    @UserId NVARCHAR(50),      -- The User ID provided by the client
    @ResetToken NVARCHAR(255)  -- The unique token generated by the application
AS
BEGIN
    SET NOCOUNT ON;

    -- Local variable to hold the email (though not returned, it's used for flow)
    DECLARE @UserEmail NVARCHAR(100);

    -- Result table structure to return status and data to the application
    DECLARE @Result TABLE (
        Success BIT,
        Message NVARCHAR(255)
    );
    
    BEGIN TRY
        
        -- Check if user exists (We don't need to retrieve Email in the SP, 
        -- but we check existence before updating)
        IF EXISTS (SELECT 1 FROM agent_register WHERE User_Id = @UserId)
        BEGIN
            -- User found: Update the record with the new token and calculate expiry internally
            UPDATE agent_register 
            SET 
                reset_token = @ResetToken,
                -- Set reset_token_expiry to the current time plus 10 minutes
                reset_token_expiry = DATEADD(MINUTE, 10, GETDATE())
            WHERE User_Id = @UserId;

            -- Insert success result
            INSERT INTO @Result (Success, Message) 
            VALUES (1, 'User found and token updated with 10-minute expiry.');
        END
        ELSE
        BEGIN
            -- User not found: Insert failure result
            INSERT INTO @Result (Success, Message) 
            VALUES (0, 'User not found.'); 
        END

        -- Return the result set 
        SELECT * FROM @Result;

    END TRY
    BEGIN CATCH
        -- Handle internal database errors
        INSERT INTO @Result (Success, Message) 
        VALUES (0, ERROR_MESSAGE());
        SELECT * FROM @Result;
    END CATCH
END
GO

-- Stored Procedure: sp_LookupUserForForgotPassword
-- Description: Retrieves User_Id and Email for a given User_Id from agent_register.

CREATE PROCEDURE sp_LookupUserForForgotPassword
    @Input_User_Id VARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;

    -- Select the necessary fields.
    SELECT
        User_Id,
        Email
    FROM
        agent_register
    WHERE
        User_Id = @Input_User_Id;
END
GO

-- Stored Procedure: sp_ResetAgentPassword
-- Description: Validates the reset token and updates the user's password if the token is active.
-- Returns: @Status_Code (1: Success, 2: Expired Token, 3: Invalid Token)

Alter PROCEDURE sp_ResetAgentPassword
    @Reset_Token VARCHAR(255),
    @NewPassword NVARCHAR(250), -- Use NVARCHAR for password field (and hash it securely in the API layer before passing)
    @Current_Time DATETIME,
    @Status_Code INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET @Status_Code = 3; -- Default to Invalid Token

    DECLARE @User_Id_To_Update VARCHAR(50);

    -- 1. Check for valid AND unexpired token
    SELECT
        @User_Id_To_Update = User_Id
    FROM
        agent_register
    WHERE
        reset_token = @Reset_Token
        AND reset_token_expiry > @Current_Time;

    IF @User_Id_To_Update IS NOT NULL
    BEGIN
        -- Token is valid and active, proceed with update
        
        BEGIN TRANSACTION;
        
        UPDATE agent_register
        SET 
            PWD = @NewPassword,
            reset_token = NULL,
            reset_token_expiry = NULL,
            PasswordChangeDate = getDate()
        WHERE 
            User_Id = @User_Id_To_Update;

        IF @@ROWCOUNT = 1
        BEGIN
            COMMIT TRANSACTION;
            SET @Status_Code = 1; -- Success
        END
        ELSE
        BEGIN
            -- Should not happen under normal circumstances, but for safety
            ROLLBACK TRANSACTION;
            SET @Status_Code = 3; -- Invalid Token (or Update failed)
        END
    END
    ELSE
    BEGIN
        -- 2. Token not found or expired. Check specifically if it exists but is expired.
        
        IF EXISTS (SELECT 1 FROM agent_register WHERE reset_token = @Reset_Token)
        BEGIN
            SET @Status_Code = 2; -- Expired Token
        END
        ELSE
        BEGIN
            SET @Status_Code = 3; -- Invalid Token (Token not found)
        END
    END
END
GO