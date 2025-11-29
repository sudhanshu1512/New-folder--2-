import fs from 'fs';
import path from 'path';

export const getTicketHTML = (bookingDetails) => {
    // 1. LOGO LOGIC (Server-Side using fs)
    const logoPath = path.resolve(process.cwd(), 'public', 'logo-img.png');
    let logoUrl = '';
    
    try {
        if (fs.existsSync(logoPath)) {
            const logoBuffer = fs.readFileSync(logoPath);
            logoUrl = `data:image/png;base64,${logoBuffer.toString('base64')}`;
        }
    } catch (err) {
        console.error("Error loading logo:", err);
    }

    // 2. DESTRUCTURE DATA (Using your specific fields and defaults)
    const { 
        booking_id, 
        bookingRefNo = booking_id, 
        bookingStatus = 'CONFIRMED',
        bookingDateIST,
        airlinePNR = 'N/A',
        flight = {},
        passengers = [],
        contactDetails = {},
        fareRule = 'Non Refundable',
        fareBreakdown = {},
        // Agency Data (Dynamic)
        companyName = "Travel Services Pvt Ltd",
        agentName = "Agent",
        agencyAddress = "123, Tech Plaza, New Delhi",
        agencyPhone = "N/A",
        agencyEmail = "N/A"
    } = bookingDetails;

    // Destructure flight details
    const {
        airline = '',
        airlineLogo = '',
        flightNo = '',
        from = '',
        fromCode = '',
        to = '',
        toCode = '',
        departureDate = '',
        departureTime = '',
        arrivalDate = '',
        arrivalTime = '',
        departureterminal = '',
        arrivalterminal = '',
        duration = '',
        cabin = '',
        stops = '',
        baggage = ''
    } = flight;

    // Destructure fare breakdown
    const {
        basePrice = 0,
        fuelSurcharge = 0,
        airlineTaxes = 0,
        sgst = 0,
        cgst = 0,
        totalAmount = 0
    } = fareBreakdown;

    // Helper to format currency
    const formatCurrency = (amount) => {
        return amount ? parseFloat(amount).toLocaleString('en-IN') : '0';
    };

    // 3. GENERATE ROWS (Polished Styling)
    const passengerList = passengers.map((passenger, index) => `
        <tr class="${index % 2 === 0 ? 'row-even' : 'row-odd'}">
            <td style="padding: 12px;">
                <div style="font-weight: bold; color: #333;">${passenger.title} ${passenger.firstName} ${passenger.lastName}</div>
                <div style="font-size: 11px; color: #666; margin-top:2px;">${passenger.type || 'Adult'} | ${passenger.gender || ''}</div>
            </td>
            <td>${fromCode}-${toCode}</td>
            <td>${passenger.ticketNo || 'Pending'}</td>
            <td>${passenger.seat || 'Any'}</td>
            <td>${passenger.meal || 'Standard'}</td>
            <td>${baggage|| '15kg'} | ${passenger.baggage?.cabin || '7kg'}</td>
        </tr>
    `).join('');

    // 4. RETURN TEMPLATE (Polished CSS + Dynamic Variables)
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Flight E-Ticket - ${booking_id}</title>
    <style>
        @page { margin: 0; }
        body { font-family: 'Segoe UI', Helvetica, Arial, sans-serif; background: #eef1f5; margin: 0; padding: 40px; -webkit-print-color-adjust: exact; color: #333; }
        .container { width: 100%; max-width: 800px; margin: 0 auto; background: #fff; box-shadow: 0 4px 15px rgba(0,0,0,0.05); overflow: hidden; border-top: 6px solid #0056b3; }
        
        /* Header Section */
        .header { display: flex; justify-content: space-between; padding: 25px 40px; border-bottom: 1px solid #eee; }
        .header-left { display: flex; flex-direction: column; justify-content: center; }
        .header-logo { max-height: 50px; margin-bottom: 5px; }
        .company-name { font-size: 14px; color: #666; font-weight: 600; }
        
        .header-right { text-align: right; font-size: 13px; line-height: 1.6; color: #333; }
        .header-right strong { color: #000; }
        .status-confirm { color: #166534; background: #dcfce7; padding: 2px 8px; border-radius: 4px; font-weight: bold; text-transform: uppercase; font-size: 11px; }

        /* Section Titles */
        .section-title { background: #000000; color: #ffffff; padding: 8px 40px; font-size: 14px; font-weight: bold; border-top: 1px solid #eee; border-bottom: 1px solid #eee; margin-top: 0; text-transform: uppercase; }

        /* Flight Details Section */
        .flight-grid { padding: 25px 40px; display: flex; justify-content: space-between; align-items: flex-start; }
        .flight-col { flex: 1; }
        .flight-col.center { flex: 0 0 150px; text-align: center; }
        .flight-col.right { text-align: right; }
        
        .airline-row { display: flex; align-items: center; margin-bottom: 15px; font-size: 15px; font-weight: bold; }
        .airline-row img { height: 24px; margin-right: 10px; }
        .pnr-box { background: #eff6ff; color: #1e40af; padding: 4px 10px; border-radius: 4px; font-size: 12px; margin-left: 15px; border: 1px solid #dbeafe; }

        .city-code { font-size: 26px; font-weight: 800; color: #333; }
        .city-name { font-size: 12px; color: #666; margin-bottom: 5px; }
        .flight-time { font-size: 18px; font-weight: bold; color: #000; }
        .terminal-info { font-size: 11px; color: #e53e3e; margin-top: 4px; background: #fff5f5; padding: 2px 5px; border-radius: 3px; display: inline-block; font-weight: 600; }
        
        .duration-line { position: relative; height: 1px; background: #ccc; margin: 15px 0; width: 100%; border-top: 1px dashed #999; }
        .duration-line::after { content: '✈'; position: absolute; top: -13px; left: 50%; transform: translateX(-50%); color: #0056b3; background: #fff; padding: 0 5px; font-size: 16px; }
        .duration-text { font-size: 12px; font-weight: bold; color: #333; margin-bottom: 5px; display: block; }
        .stops-text { font-size: 11px; color: #666; background: #fff; padding: 0 5px; position: absolute; top: -20px; left: 50%; transform: translateX(-50%); }
        
        .flight-footer { display: flex; padding: 15px 40px; background: #fafafa; font-size: 12px; border-top: 1px dashed #eee; justify-content: space-between; }

        /* Tables */
        .table-wrapper { padding: 0; }
        .custom-table { width: 100%; border-collapse: collapse; font-size: 12px; }
        .custom-table th { background: #f8f9fa; color: #444; text-align: left; padding: 12px 40px 12px 15px; font-weight: 600; border-bottom: 2px solid #ddd; }
        .custom-table th:first-child { padding-left: 40px; }
        .custom-table td { padding: 10px 15px; border-bottom: 1px solid #eee; color: #333; vertical-align: middle; }
        .custom-table td:first-child { padding-left: 40px; }
        .row-even { background: #fff; }
        .row-odd { background: #fcfcfc; }

        /* Fare Specifics */
        .fare-container { display: flex; justify-content: flex-end; padding: 20px 40px; background: #fff; }
        .fare-table { width: 350px; border: 1px solid #eee; border-collapse: collapse; }
        .fare-table td { padding: 8px 15px; border-bottom: 1px solid #eee; font-size: 12px; }
        .fare-table tr:last-child td { font-weight: bold; font-size: 16px; background: #f9f9f9; border-bottom: none; color: #000; }

        /* Important Info */
        .info-list { padding: 20px 40px; font-size: 11px; color: #555; line-height: 1.6; background: #fff; }
        .info-list ul { padding-left: 20px; margin: 0; }
        .info-list li { margin-bottom: 6px; }

        .footer { background: #333; color: #fff; padding: 15px; text-align: center; font-size: 11px; }

        @media print {
            body { padding: 0; background: #fff; }
            .container { box-shadow: none; border: none; width: 100%; max-width: 100%; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="header-left">
                <img src="${logoUrl}" class="header-logo" alt="Logo" onerror="this.style.display='none'">
            </div>
            <div class="header-right">
                <div><strong>${agentName}</strong></div>
                <div style="margin:4px 0;"><strong>${companyName}</strong></div>
                <div>${agencyAddress}</div>
                <div>${agencyPhone}</div>
                <div>${agencyEmail}</div>
            </div>
        </div>

        <div class="header">
            <div class="header-left">
                ${airlineLogo ? `<img src="${airlineLogo}" class="header-logo" alt="${airline}">` : ''}
                <div class="company-name" style="font-size: 20px; color: #0056b3;">${airline}</div>
            </div>
            <div class="header-right">
                <div>Booking Date: <strong>${bookingDateIST}</strong></div>
                <div style="margin:4px 0;">Booking Ref No: <strong>${bookingRefNo}</strong></div>
                <div>Booking Status: <span class="status-confirm">${bookingStatus}</span></div>
            </div>
        </div>

        <div class="section-title">Flight Detail</div>
        <div>
            <div class="flight-grid">
                <div class="flight-col">
                    <div class="airline-row">
                        <span>${airline}</span> 
                        <span style="font-weight:400; color:#666; margin-left:5px;">${flightNo}</span>
                        <span class="pnr-box">Airline PNR: ${airlinePNR}</span>
                    </div>
                    <div class="city-code">${fromCode}</div>
                    <div class="city-name">${from}</div>
                    <div class="flight-time">${departureTime}</div>
                    <div class="terminal-info">Trml: ${departureterminal}</div>
                    <div style="font-size:12px; margin-top:5px;">${departureDate}</div>
                </div>

                <div class="flight-col center">
                    <span class="duration-text">${duration}</span>
                    <div class="duration-line">
                        <span class="stops-text">${stops > 0 ? stops + ' Stop(s)' : 'Non-Stop'}</span>
                    </div>
                    <div style="font-size:11px; margin-top:5px; color:#888;">${cabin}</div>
                </div>

                <div class="flight-col right">
                    <div class="city-code">${toCode}</div>
                    <div class="city-name">${to}</div>
                    <div class="flight-time">${arrivalTime}</div>
                    <div class="terminal-info">Trml: ${arrivalterminal}</div>
                    <div style="font-size:12px; margin-top:5px;">${arrivalDate}</div>
                </div>
            </div>
            <div class="flight-footer">
                <div><strong>Customer Email:</strong> ${contactDetails.email || 'N/A'}</div>
                <div style="margin-left: 20px;"><strong>Customer Mobile:</strong> ${contactDetails.phone || 'N/A'}</div>
                <div style="margin-left: auto;"><strong>Fare Rule:</strong> ${fareRule}</div>
            </div>
        </div>

        <div class="section-title">Passenger & Ticket Information</div>
        <div class="table-wrapper">
            <table class="custom-table">
                <thead>
                    <tr>
                        <th style="width: 30%">Passenger Information</th>
                        <th>Sector</th>
                        <th>Ticket No</th>
                        <th>Seat</th>
                        <th>Meal</th>
                        <th style="width: 25%">Baggage (Check-in | Cabin)</th>
                    </tr>
                </thead>
                <tbody>
                    ${passengerList}
                </tbody>
            </table>
        </div>

        <div class="section-title">Fare Details</div>
        <div>
            <div class="fare-container">
                <table class="fare-table" cellspacing="0">
                    <tr>
                        <td>Base Price</td>
                        <td style="text-align:right;">₹${formatCurrency(basePrice)}</td>
                    </tr>
                    <tr>
                        <td>Fuel Surcharge</td>
                        <td style="text-align:right;">₹${formatCurrency(fuelSurcharge)}</td>
                    </tr>
                    <tr>
                        <td>Airline Taxes and Fees</td>
                        <td style="text-align:right;">₹${formatCurrency(airlineTaxes)}</td>
                    </tr>
                    ${sgst > 0 ? `<tr><td>SGST</td><td style="text-align:right;">₹${formatCurrency(sgst)}</td></tr>` : ''}
                    ${cgst > 0 ? `<tr><td>CGST</td><td style="text-align:right;">₹${formatCurrency(cgst)}</td></tr>` : ''}
                    <tr style="border-top: 1px solid #ddd;">
                        <td><strong>Total Amount</strong></td>
                        <td style="text-align:right;"><strong>₹${formatCurrency(totalAmount)}</strong></td>
                    </tr>
                </table>
            </div>
        </div>

        <div class="section-title">IMPORTANT INFORMATION</div>
        <div class="info-list">
            <ul>
                <li>You must web check-in on the airline website and obtain a boarding pass.</li>
                <li>Reach the terminal at least 2 hours prior to the departure for domestic flight and 4 hours prior to the departure of international flight.</li>
                <li>Date & Time is calculated based on the local time of the city/destination.</li>
                <li>Use the Airline PNR for all Correspondence directly with the Airline.</li>
                <li>For rescheduling/cancellation within 4 hours of the departure time contact the airline directly.</li>
                <li>Please verify flight timings & terminal info with the airlines.</li>
            </ul>
        </div>

        <div class="footer">
            Copyright © ${new Date().getFullYear()} ${companyName}. All rights reserved.<br>
            This is a computer generated invoice and does not require a physical signature.
        </div>
    </div>
</body>
</html>`;
};