import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import sql from 'mssql'; // Import sql object
import { getDbPool } from '../db.js';
import jwt from 'jsonwebtoken';
import { createResetToken, signAccessToken, JWT_SECRET } from '../utils/tokens.js';
import { sendResetEmail, sendWelcomeEmail } from '../utils/mailer.js';
import { authenticateJWT } from '../middleware/auth.js';
import logger from '../utils/logger.js';

const router = Router();

// limiter for authentication routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Helper to set cookie
function setAuthCookie(res, token) {
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000,
  });
}

// POST /api/auth/agent-register
router.post('/agent-register', authLimiter, async (req, res) => {
  try {
    const pool = await getDbPool();
    const {
      // Personal Details
      title,
      firstName,
      middleName,
      lastName,
      mobile,
      whatsapp,
      alternate,
      email,
      altEmail,
      password,
      // Business Details
      businessName,
      businessType,
      nature,
      businessAddress,
      panNumber,
      gstNumber,
      website,
      panFileUrl,
      gstFileUrl,
      addressProofUrl,
      // Address Details
      address1,
      address2,
      postalCode,
      city,
      country,
      state,
      district,
      stateCode,
      // Additional fields
      agentType,
      branch,
      area
    } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !mobile || !email || !password) {
      return res.status(400).json({ message: 'Missing required fields: firstName, lastName, mobile, email, password' });
    }

    // Storing password in plaintext (SECURITY RISK)
    const password_hash = password;
    logger.info('Password hash length:', password_hash.length);

    // Call stored procedure for agent registration
    const result = await pool.request()
      .input('Title', sql.NVarChar(10), title || '')
      .input('Fname', sql.NVarChar(50), firstName)
      .input('Mname', sql.NVarChar(50), middleName || '')
      .input('Lname', sql.NVarChar(50), lastName)
      .input('Address', sql.NText, address1 || '')
      .input('City', sql.NVarChar(50), city || '')
      .input('State', sql.NVarChar(50), state || '')
      .input('Country', sql.NVarChar(50), country || '')
      .input('Zipcode', sql.NVarChar(20), postalCode || '')
      .input('Phone', sql.NVarChar(20), alternate || '')
      .input('Mobile', sql.NVarChar(20), mobile)
      .input('Email', sql.NVarChar(100), email)
      .input('Alt_Email', sql.NVarChar(100), altEmail || '')
      .input('Agency_Name', sql.NVarChar(100), businessName || '')
      .input('Website', sql.NVarChar(200), website || '')
      .input('PanNo', sql.NVarChar(20), (panNumber || '').toUpperCase())
      .input('Status', sql.NVarChar(20), 'PENDING')
      .input('Stax_no', sql.NVarChar(50), gstNumber || '')
      .input('User_Id', sql.NVarChar(20), mobile)
      .input('PWD', sql.NVarChar(250), password_hash)
      .input('Agent_Type', sql.NVarChar(20), agentType || 'AGENT')
      .input('Agent_status', sql.NVarChar(20), 'ACTIVE')
      .input('District', sql.NVarChar(50), district || '')
      .input('StateCode', sql.NVarChar(10), stateCode || '')
      .input('GSTNO', sql.NVarChar(50), (gstNumber || '').toUpperCase())
      .input('Branch', sql.NVarChar(50), branch || '')
      .input('WhatsAppNo', sql.NVarChar(20), whatsapp || '')
      .input('Area', sql.NVarChar(50), area || '')
      .input('PanFileUrl', sql.NVarChar(255), panFileUrl || '')
      .input('AddressProofUrl', sql.NVarChar(255), addressProofUrl || '')
      .input('GstFileUrl', sql.NVarChar(255), gstFileUrl || '')
      .input('ApiStatus', sql.Bit, 1)
      .execute('sp_RegisterAgent');

    const spResult = result.recordset[0];

    if (!spResult.Success) {
      return res.status(409).json({ message: spResult.Message });
    }

    const newAgentId = spResult.Counter;

    // Generate JWT token
    const token = signAccessToken({
      id: newAgentId,
      userId: mobile,
      firstName,
      lastName,
      email
    });

    // Set HTTP-only cookie
    setAuthCookie(res, token);

    // Send welcome email asynchronously (don't wait for it to complete)
    // This ensures registration response is not delayed by email sending
    setImmediate(async () => {
      try {
        const pool = await getDbPool();
        const emailResult = await sendWelcomeEmail(email, {
          firstName,
          lastName,
          businessName,
          agentType: agentType || 'AGENT'
        });

        if (emailResult.success) {
          logger.info(`Welcome email sent successfully to ${email} for agent ${firstName} ${lastName}`);
        } else {
          logger.error(`Failed to send welcome email to ${email}:`, emailResult.error);
          // In production, you might want to add this to a retry queue
          // or log to a monitoring service like Sentry
        }
      } catch (error) {
        logger.error(`Unexpected error sending welcome email to ${email}:`, error);
        // In production, log this to your monitoring service
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Agent registered successfully',
      agent: {
        id: newAgentId,
        userId: mobile,
        firstName,
        lastName,
        email
      },
      token
    });
  } catch (e) {
    logger.error('Agent registration error:', e);
    return res.status(500).json({ message: 'An internal server error occurred during registration' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const pool = await getDbPool();
    const { Userid, password } = req.body;

    if (!Userid || !password) {
      return res.status(400).json({
        success: false,
        message: 'Mobile number and password are required'
      });
    }

    // Call stored procedure for agent login
    const result = await pool.request()
      .input('UserId', sql.VarChar(50), Userid)
      .input('Password', sql.NVarChar(250), password)
      .execute('sp_LoginAgent');

    const spResult = result.recordset[0];

    if (!spResult.Success) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const agent = spResult;

    // Verify password (plaintext comparison)
    const isPasswordValid = password === agent.PWD;
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if agent is active
    if (agent.Agent_status !== 'ACTIVE') {
      return res.status(403).json({
        success: false,
        message: 'Account is not active. Please contact support.'
      });
    }

    const token = signAccessToken({
      id: agent.User_Id,
      userId: agent.User_Id,
      email: agent.Email
    });
    setAuthCookie(res, token);

    return res.json({
      success: true,
      token,
      message: 'Login successful',
      user: {
        id: agent.User_Id,
        userId: agent.User_Id,
        name: `${agent.Fname} ${agent.Lname}`,
        email: agent.Email,
        mobile: agent.User_Id
      }
    });
  } catch (error) {
    logger.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred during login'
    });
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', authLimiter, async (req, res) => {
  try {
    const pool = await getDbPool();
    const { userId } = req.body;

    // 1. Call SP to check if user exists and get their details
    const userResult = await pool.request()
      .input('Input_User_Id', sql.VarChar(50), userId) // Match the SP parameter name
      .execute('sp_LookupUserForForgotPassword');

    const user = userResult.recordset[0];

    if (user) {
      // Generate the unique token in the application layer
      const resetToken = createResetToken(user.User_Id);

      // 2. Call SP to update user record with reset token. 
      //    The SP calculates the expiry time (GETDATE() + 10 min).
      await pool.request()
        .input('UserId', sql.VarChar(50), user.User_Id)
        .input('ResetToken', sql.VarChar(255), resetToken) // Pass token to SP
        .execute('sp_ForgotPasswordAgent'); // Execute the stored procedure

      // 3. Send reset email
      const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
      await sendResetEmail(user.Email, resetLink);
    }

    // Always return a generic success message to prevent email enumeration
    return res.json({
      success: true,
      message: 'If an account exists with this email, a password reset link has been sent.'
    });
  } catch (error) {
    logger.error('Forgot password error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while processing your request'
    });
  }
});

// POST /api/auth/reset-password/:token
router.post('/reset-password/:token', authLimiter, async (req, res) => {
  // NOTE: HASHING the password MUST happen here before calling the SP.
  // For this example, we'll assume a hashPassword function exists.
  // const hashedPassword = await hashPassword(req.body.password); // <-- Placeholder for actual hashing

  try {
    const pool = await getDbPool();
    const { token } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ success: false, message: 'Password is required' });
    }

    // --- JWT Verification (Kept in API layer for security) ---
    // JWT is used to ensure the token structure is correct before hitting the database.
    // The SP performs the actual database validity/expiry check.
    const decoded = jwt.verify(token, JWT_SECRET + '-reset');
    if (!decoded || !decoded.id) {
      return res.status(400).json({ success: false, message: 'Invalid or expired token' });
    }
    // --- End JWT Verification ---

    // 1. Call the stored procedure to validate token, check expiry, and update password atomically
    const result = await pool.request()
      .input('Reset_Token', sql.VarChar(255), token)
      .input('NewPassword', sql.NVarChar(250), password) // Pass the HASHED password
      .input('Current_Time', sql.DateTime, new Date())
      .output('Status_Code', sql.Int) // Define the output parameter
      .execute('sp_ResetAgentPassword');

    const statusCode = result.output.Status_Code;

    switch (statusCode) {
      case 1:
        // Success
        return res.json({
          success: true,
          message: 'Password has been reset successfully'
        });
      case 2:
        // Expired Token
        return res.status(400).json({
          success: false,
          message: 'Password reset token has expired. Please request a new one.'
        });
      case 3:
      default:
        // Invalid Token (or Update failed)
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired token'
        });
    }

  } catch (error) {
    logger.error('Reset password error:', error);
    if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
      return res.status(400).json({
        success: false,
        message: 'Password reset token is invalid or has expired'
      });
    }
    return res.status(500).json({
      success: false,
      message: 'An internal server error occurred'
    });
  }
});

// POST /api/auth/refresh
router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({ success: false, message: 'Refresh token not provided' });
  }

  try {
    const pool = await getDbPool();
    const decoded = jwt.verify(refreshToken, JWT_SECRET);

    // Get user details using the updated stored procedure
    const result = await pool.request()
      .input('User_Id', sql.VarChar(50), decoded.userId) // Use userId from token
      .execute('sp_GetAgentProfile');

    const agent = result.recordset[0];

    if (!agent || !agent.Success) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    // Generate new access token with updated user info
    const newAccessToken = signAccessToken({
      id: agent.User_Id,
      userId: agent.User_Id,
      email: agent.Email
    });

    return res.json({
      success: true,
      token: newAccessToken,
      user: {
        id: agent.User_Id,
        userId: agent.User_Id,
        name: `${agent.Fname} ${agent.Lname}`,
        email: agent.Email,
        mobile: agent.User_Id,
        status: agent.Agent_status
      }
    });

  } catch (error) {
    logger.error('Refresh token error:', error.message);
    return res.status(403).json({ success: false, message: 'Invalid or expired refresh token.' });
  }
});

// POST /api/auth/logout
router.post('/logout', (_req, res) => {
  res.clearCookie('token', { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' });
  return res.json({ success: true, message: 'Logged out successfully' });
});

// GET /api/auth/me
router.get('/me', authenticateJWT, async (req, res) => {
  try {
    const pool = await getDbPool();
    // Call stored procedure for get agent profile
    const result = await pool.request()
      .input('User_id', sql.VarChar(50), req.user.id)
      .execute('sp_GetAgentProfile');

    const spResult = result.recordset[0];

    if (!spResult.Success) {
      return res.status(404).json({ success: false, message: spResult.Message });
    }

    const agent = spResult;
    return res.json({
      success: true,
      user: {
        id: agent.User_Id,
        userId: agent.User_Id,
        name: `${agent.Fname} ${agent.Lname}`,
        email: agent.Email,
        mobile: agent.User_Id,
        status: agent.Agent_status
      }
    });
  } catch (error) {
    logger.error('Error in /me endpoint:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Check PAN number availability
router.post('/check-pan', authLimiter, async (req, res) => {
  try {
    const pool = await getDbPool();
    const { panNumber } = req.body;

    // Validate input
    if (!panNumber || typeof panNumber !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'PAN number is required'
      });
    }

    // Basic PAN format validation (10 characters: 5 letters, 4 digits, 1 letter)
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (!panRegex.test(panNumber.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid PAN format. PAN should be 10 characters (e.g., ABCDE1234F)'
      });
    }

    // Call stored procedure to check PAN existence
    const result = await pool.request()
      .input('PanNo', sql.VarChar(20), panNumber.toUpperCase())
      .execute('sp_CheckPanExists');

    const panResult = result.recordset[0];

    // CORRECTION: Change 'Exists' to 'PanExists'
    if (panResult.PanExists) {
      return res.status(409).json({
        success: false,
        exists: true,
        message: `PAN number already registered`,
        agentName: panResult.AgentName,
        agentId: panResult.AgentId
      });
    } else {
      return res.status(200).json({
        success: true,
        exists: false,
        message: 'You may continue'
      });
    }

  } catch (error) {
    logger.error('PAN check error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while checking PAN number'
    });
  }
});

// Check Mobile number availability
router.post('/check-mobile', authLimiter, async (req, res) => {
  try {
    const pool = await getDbPool();
    const { mobile } = req.body;

    // Validate input
    if (!mobile || typeof mobile !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Mobile number is required'
      });
    }

    // Basic mobile format validation (10 digits)
    const mobileRegex = /^[0-9]{10}$/;
    if (!mobileRegex.test(mobile)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid mobile format. Mobile should be 10 digits'
      });
    }

    // Call stored procedure to check mobile existence
    const result = await pool.request()
      .input('Mobile', sql.VarChar(20), mobile)
      .execute('sp_CheckMobileExists');

    const mobileResult = result.recordset[0];

    if (mobileResult.MobileExists) {
      return res.status(409).json({
        success: false,
        exists: true,
        message: `Mobile number already registered`
      });
    } else {
      return res.status(200).json({
        success: true,
        exists: false,
        message: 'Mobile number is available'
      });
    }

  } catch (error) {
    logger.error('Mobile check error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while checking mobile number'
    });
  }
});

// Check Email availability
router.post('/check-email', authLimiter, async (req, res) => {
  try {
    const pool = await getDbPool();
    const { email } = req.body;

    // Validate input
    if (!email || typeof email !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    // Call stored procedure to check email existence
    const result = await pool.request()
      .input('Email', sql.VarChar(100), email.toLowerCase())
      .execute('sp_CheckEmailExists');

    const emailResult = result.recordset[0];

    if (emailResult.EmailExists) {
      return res.status(409).json({
        success: false,
        exists: true,
        message: `Email already registered`
      });
    } else {
      return res.status(200).json({
        success: true,
        exists: false,
        message: 'Email is available'
      });
    }

  } catch (error) {
    logger.error('Email check error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while checking email'
    });
  }
});

// GET /api/auth/balance - Get agent's current balance which is agentlimit - due amount 
router.get('/balance', authenticateJWT, async (req, res) => {
  try {
    const pool = await getDbPool();
    const agentId = req.user.id; // From JWT token

    const result = await pool.request()
      .input('AgentId', sql.NVarChar(20), agentId)
      .query(`
            SELECT 
            Crd_Limit
            FROM agent_register 
            WHERE User_Id = @AgentId
            `);

    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Agent not found'
      });
    }



    const balance = result.recordset[0].Crd_Limit;

    return res.json({
      success: true,
      balance: parseFloat(balance) || 0
    });

  } catch (error) {
    logger.error('Error fetching agent balance:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching balance'
    });
  }
});

export default router;