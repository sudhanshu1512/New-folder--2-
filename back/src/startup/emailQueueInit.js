import { emailQueueService } from '../services/emailQueueService.js';
import fs from 'fs';
import path from 'path';

// Initialize email queue system on server startup
export async function initializeEmailQueue() {
    try {
        console.log('📧 Initializing Email Queue System...');
        
        // Run the SQL script to create tables and stored procedures
        const sqlScriptPath = path.join(process.cwd(), 'src', 'database', 'createEmailQueue.sql');
        
        if (fs.existsSync(sqlScriptPath)) {
            console.log('📧 Email queue SQL script found, ensuring database schema is up to date...');
            // Note: You would need to execute this SQL script manually or through a migration system
            console.log('📧 Please ensure the SQL script has been executed: ' + sqlScriptPath);
        } else {
            console.log('📧 Email queue SQL script not found, assuming schema exists');
        }
        
        // Start automatic email processing
        emailQueueService.startAutoProcessing(1); // Process every 2 minutes
        
        // Process any pending emails immediately on startup
        console.log('📧 Processing any pending emails from previous server session...');
        await emailQueueService.processPendingEmails();
        
        // Get and display queue statistics
        const stats = await emailQueueService.getQueueStats();
        if (stats) {
            console.log('📧 Email Queue Statistics (last 7 days):');
            console.log(`   Total: ${stats.total}, Pending: ${stats.pending}, Processing: ${stats.processing}, Sent: ${stats.sent}, Failed: ${stats.failed}`);
        }
        
        console.log('✅ Email Queue System initialized successfully');
        
    } catch (error) {
        console.error('❌ Failed to initialize Email Queue System:', error);
        // Don't throw error - allow server to start even if email queue fails
    }
}

// Graceful shutdown handler
export function shutdownEmailQueue() {
    console.log('📧 Shutting down Email Queue System...');
    emailQueueService.stopAutoProcessing();
    console.log('✅ Email Queue System shut down');
}
