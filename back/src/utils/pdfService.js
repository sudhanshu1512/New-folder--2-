import puppeteer from 'puppeteer';
import { getTicketHTML } from './ticketTemplate.js';
import { getCanceledTicketHTML } from './canceledTicket.js';

export const generateTicketPDF = async (bookingDetails) => {
    const htmlContent = getTicketHTML(bookingDetails);
    let browser;
    try {
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox'] // Recommended for running in server environments
        });
        const page = await browser.newPage();
        await page.setContent(htmlContent, { waitUntil: 'domcontentloaded' });
        const pdfBuffer = await page.pdf({ 
            format: 'A4',
            printBackground: true,
            margin: {
                top: '20px',
                right: '20px',
                bottom: '20px',
                left: '20px'
            }
        });
        return pdfBuffer;
    } catch (error) {
        console.error('Error generating PDF:', error);
        throw new Error('Could not generate ticket PDF.');
    } finally {
        if (browser) {
            await browser.close();
        }
    }
};

export const generateCanceledTicketPDF = async (bookingDetails) => {
    const htmlContent = getCanceledTicketHTML(bookingDetails);
    let browser;
    try {
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        await page.setContent(htmlContent, { waitUntil: 'domcontentloaded' });
        const pdfBuffer = await page.pdf({ 
            format: 'A4',
            printBackground: true,
            margin: {
                top: '20px',
                right: '20px',
                bottom: '20px',
                left: '20px'
            }
        });
        return pdfBuffer;
    } catch (error) {
        console.error('Error generating canceled ticket PDF:', error);
        throw new Error('Could not generate canceled ticket PDF.');
    } finally {
        if (browser) {
            await browser.close();
        }
    }
};
