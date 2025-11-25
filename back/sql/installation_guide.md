# Database Setup Guide for BookYourOwn Authentication System

## Prerequisites
- SQL Server Management Studio (SSMS) or Azure Data Studio
- Access to your SQL Server instance
- Database already created (or create one if needed)

## Step 1: Run the Stored Procedures Script

1. Open SQL Server Management Studio
2. Connect to your SQL Server instance
3. Select your database (or create a new one)
4. Open the `stored_procedures.sql` file
5. Execute the entire script

## Step 2: Verify Installation

Run these queries to verify the stored procedures were created:

```sql
-- Check if all stored procedures exist
SELECT name, type_desc, create_date, modify_date 
FROM sys.objects 
WHERE type = 'P' 
AND name LIKE 'sp_%'
ORDER BY name;

-- Check if reset token columns were added
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, CHARACTER_MAXIMUM_LENGTH
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'agent_register'
AND COLUMN_NAME IN ('reset_token', 'reset_token_expiry');
```

## Step 3: Test the Stored Procedures

### Test Agent Registration
```sql
EXEC sp_RegisterAgent 
    @Fname = 'John',
    @Lname = 'Doe',
    @Mobile = '9876543210',
    @Email = 'john.doe@example.com',
    @User_Id = '9876543210',
    @PWD = '$2a$10$hashedpasswordhere';
```

### Test Agent Login
```sql
EXEC sp_LoginAgent 
    @UserId = '9876543210',
    @Password = 'password123';
```

### Test Forgot Password
```sql
EXEC sp_ForgotPassword 
    @UserId = '9876543210',
    @ResetToken = 'sample_reset_token_here';
```

### Test Reset Password
```sql
EXEC sp_ResetPassword 
    @UserId = 1,
    @Token = 'sample_reset_token_here',
    @NewPassword = '$2a$10$newhashedpasswordhere';
```

### Test Get Agent Profile
```sql
EXEC sp_GetAgentProfile @AgentId = 1;
```

## Step 4: Backend Configuration

Make sure your backend `.env` file has the correct database connection settings:

```env
DB_SERVER=your_server_name
DB_DATABASE=your_database_name
DB_USER=your_username
DB_PASSWORD=your_password
DB_PORT=1433
DB_ENCRYPT=true
DB_TRUST_SERVER_CERTIFICATE=true
```

## Step 5: Test the API Endpoints

After running your backend server, test these endpoints:

### 1. Agent Registration
```bash
POST /api/auth/agent-register
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "mobile": "9876543210",
  "email": "john.doe@example.com",
  "password": "password123"
}
```

### 2. Agent Login
```bash
POST /api/auth/login
Content-Type: application/json

{
  "Userid": "9876543210",
  "password": "password123"
}
```

### 3. Forgot Password
```bash
POST /api/auth/forgot-password
Content-Type: application/json

{
  "userId": "9876543210"
}
```

### 4. Reset Password
```bash
POST /api/auth/reset-password/your_reset_token_here
Content-Type: application/json

{
  "password": "newpassword123"
}
```

### 5. Get Profile (requires authentication)
```bash
GET /api/auth/me
Authorization: Bearer your_jwt_token_here
```

## Troubleshooting

### Common Issues:

1. **"Invalid object name 'sp_RegisterAgent'"**
   - Make sure you executed the stored procedures script
   - Verify you're connected to the correct database

2. **"Column 'reset_token' doesn't exist"**
   - The ALTER TABLE statements in the script should have added these columns
   - Run them manually if needed:
   ```sql
   ALTER TABLE agent_register ADD reset_token NVARCHAR(500) NULL;
   ALTER TABLE agent_register ADD reset_token_expiry DATETIME NULL;
   ```

3. **Email sending issues**
   - Check your SMTP configuration in `.env`
   - For Gmail, use App Passwords instead of regular passwords

4. **JWT Token issues**
   - Make sure JWT_SECRET is set in your `.env` file
   - Verify token expiration settings

## Security Notes

1. **Password Hashing**: All passwords are hashed using bcrypt before storage
2. **Reset Tokens**: Tokens expire after 1 hour and are single-use
3. **Rate Limiting**: Authentication endpoints have rate limiting enabled
4. **SQL Injection**: Stored procedures use parameterized queries to prevent SQL injection
5. **JWT Security**: Tokens are stored in HTTP-only cookies for better security

## Performance Considerations

1. **Indexing**: Consider adding indexes on frequently queried columns:
   ```sql
   CREATE INDEX IX_agent_register_User_Id ON agent_register(User_Id);
   CREATE INDEX IX_agent_register_Email ON agent_register(Email);
   CREATE INDEX IX_agent_register_reset_token ON agent_register(reset_token);
   ```

2. **Connection Pooling**: The backend uses connection pooling for better performance

## Backup and Maintenance

1. **Regular Backups**: Set up automated backups for your database
2. **Log Monitoring**: Monitor application logs for authentication errors
3. **Token Cleanup**: Consider adding a cleanup job for expired reset tokens:
   ```sql
   -- Run this periodically to clean up expired tokens
   UPDATE agent_register 
   SET reset_token = NULL, reset_token_expiry = NULL 
   WHERE reset_token_expiry < GETDATE();
   ```
