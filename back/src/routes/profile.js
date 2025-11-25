// Backend routes for user profile management
import { Router } from 'express';
import sql from 'mssql';
import { getDbPool } from '../db.js';
import { authenticateJWT } from '../middleware/auth.js';
import { validateProfileUpdate } from '../middleware/validators.js';
import logger from '../utils/logger.js';

const router = Router();

// GET /api/profile - Get user profile details
router.get('/', authenticateJWT, async (req, res) => {
  try {
      const pool = await getDbPool();
      const userId = req.user.userId; // From JWT token
      
      const result = await pool.request()
          .input('UserId', sql.NVarChar(20), userId)
          .execute('GetUserProfile'); // Call the stored procedure
      
      if (result.recordset.length === 0) {
          return res.status(404).json({ success: false, message: 'User not found' });
      }
      
      const user = result.recordset[0];
      
      // Format response data (no changes here, just use the data from the SP)
      const profileData = {
          personal: {
              title: user.Title || '',
              name: user.name || '', // This is now a single value from the SP
              firstName: user.firstName || '',
              middleName: user.middleName || '',
              lastName: user.lastName || '',
              email: user.Email || '',
              mobile: user.Mobile || '',
              phone: user.Phone || '',
              altEmail: user.Alt_Email || ''
          },
          company: {
              agencyName: user.Agency_Name || '',
              address: user.Address || '',
              city: user.City || '',
              district: user.District || '',
              pincode: user.pincode || '',
              state: user.State || '',
              country: user.Country || '',
              website: user.Website || '',
              panNo: user.PanNo || '',
              gstNo: user.GSTNO || '',
              stateCode: user.StateCode || '',
              branch: user.Branch || '',
              area: user.Area || ''
          },
          gst: {
              gstNo: user.GSTNO || '',
              companyAddress: user.Address || '',
              companyName: user.Agency_Name || '',
              city: user.City || '',
              state: user.State || '',
              pincode: user.pincode || '',
              phoneNo: user.Phone || '',
              email: user.Email || ''
          }
      };
      
      res.json({ success: true, data: profileData });
  } catch (error) {
      logger.error('Error fetching profile:', error);
      res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /api/profile - Update user profile (excluding mobile and company name)
router.put('/', authenticateJWT, validateProfileUpdate, async (req, res) => {
  try {
      const pool = await getDbPool();
      const userId = req.user.userId;
      const {
          title,
          firstName,
          middleName,
          lastName,
          email,
          phone,
          altEmail,
          address,
          city,
          district,
          pincode,
          state,
          country,
          website,
          panNo,
          gstNo,
          stateCode,
          branch,
          area
      } = req.body;

      // Validate required fields
      if (!firstName || !email) {
          return res.status(400).json({ 
              success: false, 
              message: 'First name and email are required' 
          });
      }

      // Check if email already exists for other users (API side logic)
      const emailCheck = await pool.request()
          .input('Email', sql.NVarChar(100), email)
          .input('UserId', sql.NVarChar(20), userId)
          .query('SELECT User_Id FROM agent_register WHERE Email = @Email AND User_Id != @UserId');

      if (emailCheck.recordset.length > 0) {
          return res.status(400).json({ 
              success: false, 
              message: 'Email is already registered with another account' 
          });
      }

      // Execute stored procedure to update profile
      const updateResult = await pool.request()
          .input('UserId', sql.NVarChar(20), userId)
          .input('Title', sql.NVarChar(10), title || '')
          .input('Fname', sql.NVarChar(50), firstName)
          .input('Mname', sql.NVarChar(50), middleName || '')
          .input('Lname', sql.NVarChar(50), lastName || '')
          .input('Email', sql.NVarChar(100), email)
          .input('Phone', sql.NVarChar(20), phone || '')
          .input('Alt_Email', sql.NVarChar(100), altEmail || '')
          .input('Address', sql.NVarChar(255), address || '')
          .input('City', sql.NVarChar(50), city || '')
          .input('District', sql.NVarChar(50), district || '')
          .input('Zipcode', sql.NVarChar(10), pincode || '')
          .input('State', sql.NVarChar(50), state || '')
          .input('Country', sql.NVarChar(50), country || '')
          .input('Website', sql.NVarChar(100), website || '')
          .input('PanNo', sql.NVarChar(20), panNo || '')
          .input('GSTNO', sql.NVarChar(20), gstNo || '')
          .input('StateCode', sql.NVarChar(10), stateCode || '')
          .input('Branch', sql.NVarChar(50), branch || '')
          .input('Area', sql.NVarChar(50), area || '')
          .execute('UpdateUserProfile');

      if (updateResult.rowsAffected[0] === 0) {
          return res.status(404).json({ success: false, message: 'User not found' });
      }

      res.json({ 
          success: true, 
          message: 'Profile updated successfully' 
      });

  } catch (error) {
      logger.error('Error updating profile:', error);
      res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /api/profile/password - Change password
router.put('/password', authenticateJWT, async (req, res) => {
  try {
      const pool = await getDbPool();
      const userId = req.user.userId;
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
          return res.status(400).json({ 
              success: false, 
              message: 'Current password and new password are required' 
          });
      }

      if (newPassword.length < 6) {
          return res.status(400).json({ 
              success: false, 
              message: 'New password must be at least 6 characters long' 
          });
      }

      // Get the current password from the database (in plaintext)
      const userResult = await pool.request()
          .input('UserId', sql.NVarChar(20), userId)
          .query('SELECT PWD FROM agent_register WHERE User_Id = @UserId');

      if (userResult.recordset.length === 0) {
          return res.status(404).json({ success: false, message: 'User not found' });
      }

      const currentStoredPassword = userResult.recordset[0].PWD;

      // Verify the current password by comparing plaintext strings
      const isCurrentPasswordValid = currentPassword === currentStoredPassword;
      if (!isCurrentPasswordValid) {
          return res.status(400).json({ 
              success: false, 
              message: 'Current password is incorrect' 
          });
      }

      // Update password with the new plaintext password
      const updateResult = await pool.request()
          .input('UserId', sql.NVarChar(20), userId)
          .input('NewPassword', sql.NVarChar(255), newPassword)
          .execute('UpdateUserPassword');

      if (updateResult.rowsAffected[0] === 0) {
          return res.status(404).json({ success: false, message: 'User not found' });
      }

      res.json({ 
          success: true, 
          message: 'Password updated successfully' 
      });

  } catch (error) {
      logger.error('Error updating password:', error);
      res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router;
