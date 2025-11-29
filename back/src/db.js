import './config.js'; // Load environment variables
import sql from 'mssql';

// Debug log to check environment variables
console.log('Database connection details:', {
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
});

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT) || 1433,
  options: {
    encrypt: false, // For development
    trustServerCertificate: true ,// For local development
    // The tunnel connection is slow. We need to tell the driver to wait longer.
    connectTimeout: 60000, // Wait 60 seconds before giving up (Default is 15s)
    requestTimeout: 60000, // Wait 60 seconds for a query to return
    cancelTimeout: 60000,
    enableArithAbort: true
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 50000
  }
};

let pool = null;

export const getDbPool = async () => {
  if (pool && pool.connected) {
    return pool;
  }

  try {
    console.log('Creating new database connection pool...');
    pool = new sql.ConnectionPool(config);

    // Handle connection errors
    pool.on('error', err => {
      console.error('Database Pool Error:', err);
      pool = null; // Reset pool on error
    });

    await pool.connect();
    console.log('✅ Successfully connected to the database');
    return pool;
  } catch (err) {
    console.error('❌ Error connecting to the database:', err);
    // Ensure the pool is properly closed on a failed connection attempt
    if (pool) {
      await pool.close();
    }
    pool = null;
    throw err; // Re-throw error to be handled by the caller
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  if (pool) {
    console.log('Closing database connection pool...');
    await pool.close();
  }
  process.exit(0);
});
