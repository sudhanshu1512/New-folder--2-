import express from 'express';
// FIX 1: Use named import for getDbPool as indicated by your other API files.
import { getDbPool } from '../db.js'; 
import logger from '../utils/logger.js'; 

const router = express.Router();

// Utility function to handle database request
const executeQuery = async (sqlString, params = {}) => {
  let pool;
  try {
    pool = await getDbPool();
    let request = pool.request();

    // Add parameters to the request
    for (const [key, value] of Object.entries(params)) {
      request = request.input(key, value);
    }

    const result = await request.query(sqlString);
    return result;
  } catch (error) {
    // Re-throw the error for the route handler to catch and log
    throw error; 
  }
};

// Get all vendors
router.get('/', async (req, res) => {
  try {
    // FIX 2: SQL Server does not have a "TIMESTAMP WITH TIME ZONE" default, 
    // but the table definition should use DATETIME2. Sorting is still valid.
    const result = await executeQuery('SELECT * FROM vendors ORDER BY created_at DESC');
    res.json(result.recordset); // SQL Server results are in recordset
  } catch (error) {
    logger.error('Error fetching vendors:', error);
    res.status(500).json({ message: 'Internal Server Error fetching vendors' });
  }
});

// Create a new vendor
router.post('/', async (req, res) => {
  const {
    companyName, contactPerson, mobile, alternateMobile,
    email, address, city, state, pincode
  } = req.body;

  try {
    // FIX 3: Use SQL Server named parameters (@name) and GETDATE()
    const sql = `
      INSERT INTO vendors (
        company_name, contact_person, mobile, alternate_mobile,
        email, address, city, state, pincode, created_at, updated_at
      )
      VALUES (
        @companyName, @contactPerson, @mobile, @alternateMobile,
        @email, @address, @city, @state, @pincode, GETDATE(), GETDATE()
      );
      SELECT * FROM vendors WHERE id = SCOPE_IDENTITY(); -- Get the newly inserted record
    `;

    const params = {
      companyName, contactPerson, mobile, 
      alternateMobile: alternateMobile || null, // Handle nullable field
      email, address, city, state, pincode
    };

    const result = await executeQuery(sql, params);
    res.status(201).json(result.recordset[0]);
  } catch (error) {
    logger.error('Error creating vendor:', error);
    res.status(500).json({ message: 'Internal Server Error creating vendor' });
  }
});

// Update a vendor
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const {
    companyName, contactPerson, mobile, alternateMobile,
    email, address, city, state, pincode
  } = req.body;

  try {
    // FIX 4: Use SQL Server named parameters (@name) and GETDATE()
    const sql = `
      UPDATE vendors 
      SET company_name = @companyName,
          contact_person = @contactPerson,
          mobile = @mobile,
          alternate_mobile = @alternateMobile,
          email = @email,
          address = @address,
          city = @city,
          state = @state,
          pincode = @pincode,
          updated_at = GETDATE()
      WHERE id = @id;
      SELECT * FROM vendors WHERE id = @id; -- Select the updated record
    `;

    const params = {
      id: parseInt(id), // Ensure ID is parsed as an integer for comparison
      companyName, contactPerson, mobile, 
      alternateMobile: alternateMobile || null, // Handle nullable field
      email, address, city, state, pincode
    };

    const result = await executeQuery(sql, params);

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    res.json(result.recordset[0]);
  } catch (error) {
    logger.error('Error updating vendor:', error);
    res.status(500).json({ message: 'Internal Server Error updating vendor' });
  }
});

// FIX 5: Exporting the router as the default export (assuming this is how your server.js expects it)
export default router;
