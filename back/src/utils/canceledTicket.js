import fs from 'fs';
import path from 'path';

export const getCanceledTicketHTML = (bookingDetails) => {
    // Resolve the path to the image
    const logoPath = path.resolve(process.cwd(), 'public', 'logo-img.png');
    let logoUrl = '';
    if (fs.existsSync(logoPath)) {
        const logoBuffer = fs.readFileSync(logoPath);
        logoUrl = `data:image/png;base64,${logoBuffer.toString('base64')}`;
    }
    const { booking_id, flight, passengers, totalAmount, contactDetails, cancellationDetails, companyName = "Your Company" } = bookingDetails;

    const passengerList = passengers.map(p => `
        <tr>
            <td>${p.title} ${p.firstName} ${p.lastName}</td>
            <td>${flight.from}-${flight.to}</td>
            <td>${p.ticketNo || 'N/A'}</td>
            <td>None</td>
            <td>None</td>
            <td>None</td>
        </tr>
    `).join('');

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Canceled Flight Ticket</title>
    <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; background: #f4f6fa; margin: 0; }
        .container { width: 900px; margin: 30px auto; background: #fff; border-radius: 12px; box-shadow: 0 8px 32px rgba(0,0,0,0.12); overflow: hidden; position: relative; }
        .cancel-overlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; z-index: 10; pointer-events: none; }
        .cancel-text { font-size: 80px; font-weight: bold; color: rgba(255, 0, 0, 0.2); transform: rotate(-30deg); text-transform: uppercase; border: 5px solid rgba(255, 0, 0, 0.2); padding: 20px 40px; border-radius: 10px; }
        .header-split { display: flex; justify-content: space-between; align-items: stretch; background: #002060; color: #fff; }
        .header-left { flex: 1.2; display: flex; align-items: center; padding: 24px 32px; }
        .header-logo { height: 60px; margin-right: 24px; background: #fff; border-radius: 8px; padding: 8px; }
        .company-info { font-size: 20px; font-weight: bold; }
        .header-right { flex: 1; background: #133b7c; display: flex; flex-direction: column; justify-content: center; align-items: flex-end; padding: 24px 32px; }
        .pnr-label { font-size: 14px; color: #ffcc00; font-weight: bold; }
        .pnr-value { font-size: 22px; font-weight: bold; margin-top: 4px; }
        .booking-date { font-size: 12px; margin-top: 16px; color: #eee; }
        .section-bar { background: #133b7c; color: #fff; font-weight: bold; padding: 10px 24px; font-size: 16px; letter-spacing: 1px; }
        .info-section { padding: 24px; }
        .info-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
        .info-table th, .info-table td { border: 1px solid #e0e0e0; padding: 10px 8px; text-align: left; }
        .info-table th { background: #f4f6fa; }
        .footer { background: #002060; color: #fff; text-align: center; padding: 18px; font-size: 13px; }
        .qr { text-align: right; }
        @media (max-width: 1000px) {
            .container { width: 98vw; }
            .header-split, .info-section { flex-direction: column; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="cancel-overlay">
            <span class="cancel-text">Canceled</span>
        </div>
        <div class="header-split">
            <div class="header-left">
                <img src="${logoUrl}" class="header-logo" alt="Logo" onerror="this.style.display='none'">
                <div class="company-info">${companyName}</div>
            </div>
            <div class="header-right">
                <div class="pnr-label">Booking ID / PNR</div>
                <div class="pnr-value">${booking_id}</div>
                <div class="booking-date">${flight.departureDate} ${flight.departureTime}</div>
            </div>
        </div>
        <div class="section-bar">Flight & Passenger Information</div>
        <div class="info-section">
            <table class="info-table">
                <tr>
                    <th>From</th><td>${flight.from} - ${flight.departureAirportName}</td>
                    <th>To</th><td>${flight.to} - ${flight.arrivalAirportName}</td>
                </tr>
                <tr>
                    <th>Flight</th><td>${flight.airline} (${flight.flightNumber})</td>
                    <th>Duration</th><td>${flight.duration}</td>
                </tr>
                <tr>
                    <th>Departure</th><td>${flight.departureDate} ${flight.departureTime}</td>
                    <th>Arrival</th><td>${flight.arrivalDate} ${flight.arrivalTime}</td>
                </tr>
                <tr>
                    <th>Departure Terminal</th><td>${flight.departureTerminal || 'N/A'}</td>
                    <th>Arrival Terminal</th><td>${flight.arrivalTerminal|| 'N/A'}</td>
                </tr>
            </table>
            <table class="info-table">
                <tr>
                    <th>Passenger</th><th>Sector</th><th>Ticket No</th><th>Seat</th><th>Meal</th><th>Extra</th>
                </tr>
                ${passengerList}
            </table>
            <div class="qr">
                <img src="https://api.qrserver.com/v1/create-qr-code/?data=${booking_id}&size=120x120" alt="QR Code">
            </div>
        </div>
        <div class="section-bar">Fare & Cancellation Details</div>
        <div class="info-section">
            <table class="info-table">
                <tr>
                    <th>Original Fare</th>
                    <td>₹${totalAmount.toLocaleString()}</td>
                    <th>Email</th>
                    <td>${contactDetails.email}</td>
                </tr>
                <tr>
                    <th>Cancellation Date</th>
                    <td>${cancellationDetails.cancellationDate || 'N/A'}</td>
                    <th>Phone</th>
                    <td>${contactDetails.phone}</td>
                </tr>
                <tr>
                    <th>Refund Amount</th>
                    <td>₹${cancellationDetails.refundAmount.toLocaleString()}</td>
                    <th>Status</th>
                    <td style="color: red; font-weight: bold;">CANCELED</td>
                </tr>
            </table>
        </div>
        <div class="footer">
            This booking has been successfully canceled. A refund of ₹${cancellationDetails.refundAmount.toLocaleString()} has been processed.<br>
            For any queries, please contact our support team.
        </div>
    </div>
</body>
</html>
    `;
};