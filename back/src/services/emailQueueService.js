import sql from 'mssql';
import { getDbPool } from '../db.js';
import { sendConfirmationEmailWithRetry } from '../routes/bookingConfirmationRoutes.js';
import { insertLedgerRecordWithRetry } from '../routes/bookingConfirmationRoutes.js';

class EmailQueueService {
    constructor() {
        this.isProcessing = false;
        this.processingInterval = null;
    }

    // Add email to queue for persistent processing
    async addEmailToQueue(bookingId, emailType, recipientEmail, bookingDetails) {
        const pool = await getDbPool();
        try {
            const result = await pool.request()
                .input('bookingId', sql.NVarChar(50), bookingId)
                .input('emailType', sql.NVarChar(20), emailType)
                .input('recipientEmail', sql.NVarChar(255), recipientEmail)
                .input('bookingDetails', sql.NVarChar(sql.MAX), JSON.stringify(bookingDetails))
                .execute('AddEmailToQueue');

            const queueId = result.recordset[0]?.QueueId;
            console.log(`📧 Email added to queue for booking ${bookingId}, Queue ID: ${queueId}`);
            return queueId;
        } catch (error) {
            console.error(`❌ Failed to add email to queue for booking ${bookingId}:`, error);
            throw error;
        }
    }

    // Get pending emails from queue
    async getPendingEmails(limit = 10) {
        const pool = await getDbPool();
        try {
            const result = await pool.request()
                .input('limit', sql.Int, limit)
                .execute('GetPendingEmails');

            return result.recordset;
        } catch (error) {
            console.error('❌ Failed to get pending emails:', error);
            return [];
        }
    }

    // Update email status in queue
    async updateEmailStatus(queueId, status, errorMessage = null) {
        const pool = await getDbPool();
        try {
            await pool.request()
                .input('queueId', sql.Int, queueId)
                .input('status', sql.NVarChar(20), status)
                .input('errorMessage', sql.NVarChar(sql.MAX), errorMessage)
                .execute('UpdateEmailStatus');

            console.log(`📧 Email queue ${queueId} updated to status: ${status}`);
            return true;
        } catch (error) {
            console.error(`❌ Failed to update email status for queue ${queueId}:`, error);
            return false;
        }
    }

    // Add ledger to queue for persistent processing
    async addLedgerToQueue(bookingId, transactionType, ledgerData) {
        const pool = await getDbPool();
        try {
            const result = await pool.request()
                .input('bookingId', sql.NVarChar(50), bookingId)
                .input('transactionType', sql.NVarChar(20), transactionType)
                .input('ledgerData', sql.NVarChar(sql.MAX), JSON.stringify(ledgerData))
                .execute('AddLedgerToQueue');

            const queueId = result.recordset[0]?.QueueId;
            console.log(`📊 Ledger added to queue for booking ${bookingId} (${transactionType}), Queue ID: ${queueId}`);
            return queueId;
        } catch (error) {
            console.error(`❌ Failed to add ledger to queue for booking ${bookingId}:`, error);
            throw error;
        }
    }

    // Get pending ledgers from queue
    async getPendingLedgers(limit = 10) {
        const pool = await getDbPool();
        try {
            const result = await pool.request()
                .input('limit', sql.Int, limit)
                .execute('GetPendingLedgers');

            return result.recordset;
        } catch (error) {
            console.error('❌ Failed to get pending ledgers:', error);
            return [];
        }
    }

    // Update ledger status in queue
    async updateLedgerStatus(queueId, status, errorMessage = null) {
        const pool = await getDbPool();
        try {
            await pool.request()
                .input('queueId', sql.Int, queueId)
                .input('status', sql.NVarChar(20), status)
                .input('errorMessage', sql.NVarChar(sql.MAX), errorMessage)
                .execute('UpdateLedgerStatus');

            console.log(`📊 Ledger queue ${queueId} updated to status: ${status}`);
            return true;
        } catch (error) {
            console.error(`❌ Failed to update ledger status for queue ${queueId}:`, error);
            return false;
        }
    }

    // Process a single email from queue
    async processEmailFromQueue(emailQueueItem) {
        const { id, booking_id, email_type, recipient_email, booking_details } = emailQueueItem;
        
        try {
            console.log(`📧 Processing email from queue ${id} for booking ${booking_id}`);
            
            // Mark as processing
            await this.updateEmailStatus(id, 'PROCESSING');
            
            // Parse booking details
            const bookingDetails = JSON.parse(booking_details);
            
            // Send email using existing function
            const emailStatus = await sendConfirmationEmailWithRetry(bookingDetails, booking_id);
            
            if (emailStatus.success) {
                await this.updateEmailStatus(id, 'SENT');
                console.log(`✅ Email sent successfully from queue ${id} for booking ${booking_id}`);
            } else {
                await this.updateEmailStatus(id, 'FAILED', emailStatus.error);
                console.log(`❌ Email failed from queue ${id} for booking ${booking_id}: ${emailStatus.error}`);
            }
            
            return emailStatus.success;
        } catch (error) {
            await this.updateEmailStatus(id, 'FAILED', error.message);
            console.error(`❌ Critical error processing email from queue ${id}:`, error);
            return false;
        }
    }

    // Process a single ledger from queue
    async processLedgerFromQueue(ledgerQueueItem) {
        const { id, booking_id, transaction_type, ledger_data } = ledgerQueueItem;
        
        try {
            console.log(`📊 Processing ledger from queue ${id} for booking ${booking_id} (${transaction_type})`);
            
            // Mark as processing
            await this.updateLedgerStatus(id, 'PROCESSING');
            
            // Parse ledger data
            const ledgerData = JSON.parse(ledger_data);
            
            // Get database pool
            const pool = await getDbPool();
            
            // Insert ledger record using simplified function
            const ledgerStatus = await insertLedgerRecordWithRetry(pool, ledgerData);
            
            if (ledgerStatus.success) {
                await this.updateLedgerStatus(id, 'COMPLETED');
                console.log(`✅ Ledger record inserted successfully from queue ${id} for booking ${booking_id}`);
            } else {
                await this.updateLedgerStatus(id, 'FAILED', ledgerStatus.error);
                console.log(`❌ Ledger record failed from queue ${id} for booking ${booking_id}: ${ledgerStatus.error}`);
            }
            
            return ledgerStatus.success;
        } catch (error) {
            await this.updateLedgerStatus(id, 'FAILED', error.message);
            console.error(`❌ Critical error processing ledger from queue ${id}:`, error);
            return false;
        }
    }

    // Process all pending ledgers
    async processPendingLedgers() {
        if (this.isProcessingLedgers) {
            console.log('📊 Ledger processing already in progress, skipping...');
            return;
        }

        this.isProcessingLedgers = true;
        try {
            const pendingLedgers = await this.getPendingLedgers(10);
            
            if (pendingLedgers.length === 0) {
                console.log('📊 No pending ledgers to process');
                return;
            }

            console.log(`📊 Processing ${pendingLedgers.length} pending ledgers...`);
            
            // Process ledgers in parallel (up to 3 at a time)
            const batchSize = 3;
            for (let i = 0; i < pendingLedgers.length; i += batchSize) {
                const batch = pendingLedgers.slice(i, i + batchSize);
                await Promise.all(batch.map(ledger => this.processLedgerFromQueue(ledger)));
            }
            
            console.log(`📊 Completed processing ${pendingLedgers.length} ledgers`);
        } catch (error) {
            console.error('❌ Error in batch ledger processing:', error);
        } finally {
            this.isProcessingLedgers = false;
        }
    }

    // Process all pending emails and ledgers
    async processPendingEmails() {
        if (this.isProcessing) {
            console.log('📧 Email processing already in progress, skipping...');
            return;
        }

        this.isProcessing = true;
        try {
            const pendingEmails = await this.getPendingEmails(10);
            
            if (pendingEmails.length === 0) {
                console.log('📧 No pending emails to process');
            } else {
                console.log(`📧 Processing ${pendingEmails.length} pending emails...`);
                
                // Process emails in parallel (up to 3 at a time)
                const batchSize = 3;
                for (let i = 0; i < pendingEmails.length; i += batchSize) {
                    const batch = pendingEmails.slice(i, i + batchSize);
                    await Promise.all(batch.map(email => this.processEmailFromQueue(email)));
                }
                
                console.log(`📧 Completed processing ${pendingEmails.length} emails`);
            }
            
            // Also process ledgers
            await this.processPendingLedgers();
            
        } catch (error) {
            console.error('❌ Error in batch email processing:', error);
        } finally {
            this.isProcessing = false;
        }
    }

    // Start automatic processing
    startAutoProcessing(intervalMinutes = 2) {
        if (this.processingInterval) {
            console.log('📧 Email processing already started');
            return;
        }

        console.log(`📧 Starting automatic email processing every ${intervalMinutes} minutes`);
        
        // Process immediately on start
        this.processPendingEmails();
        
        // Set up interval
        this.processingInterval = setInterval(() => {
            this.processPendingEmails();
        }, intervalMinutes * 60 * 1000);
    }

    // Stop automatic processing
    stopAutoProcessing() {
        if (this.processingInterval) {
            clearInterval(this.processingInterval);
            this.processingInterval = null;
            console.log('📧 Automatic email processing stopped');
        }
    }

    // Get queue statistics
    async getQueueStats() {
        const pool = await getDbPool();
        try {
            const result = await pool.request().query(`
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) as pending,
                    SUM(CASE WHEN status = 'PROCESSING' THEN 1 ELSE 0 END) as processing,
                    SUM(CASE WHEN status = 'SENT' THEN 1 ELSE 0 END) as sent,
                    SUM(CASE WHEN status = 'FAILED' THEN 1 ELSE 0 END) as failed
                FROM EmailQueue
                WHERE created_at >= DATEADD(day, -7, GETDATE())
            `);
            
            return result.recordset[0];
        } catch (error) {
            console.error('❌ Failed to get queue stats:', error);
            return null;
        }
    }
}

// Export singleton instance
export const emailQueueService = new EmailQueueService();
