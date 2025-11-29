import fs from 'fs';
import path from 'path';

export const getTicketHTML = (bookingDetails) => {
    
    // --- 1. SERVER SIDE IMAGE LOGIC (Preserved) ---
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

    // --- 2. DESTRUCTURE DATA (Preserved Backend Names) ---
    const { 
        booking_id, 
        bookingRefNo = booking_id, 
        bookingStatus = 'CONFIRMED',
        bookingDateIST, // Assuming this is already a formatted string like "29 Nov 2025"
        airlinePNR = 'N/A',
        flight = {},
        passengers = [],
        contactDetails = {},
        fareRule = 'Non Refundable',
        fareBreakdown = {},
        // Agency Data
        companyName = "Travel Services Pvt Ltd",
        agentName = "Agent",
        agencyAddress = "123, Tech Plaza, New Delhi",
        agencyPhone = "N/A",
        agencyEmail = "N/A"
    } = bookingDetails;

    // Flight Details
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
        stops = 0,
        baggage = '', // Flight level baggage info
        arrairname= '',
        depairname= ''
    } = flight;

    // Fare Breakdown
    const {
        basePrice = 0,
        fuelSurcharge = 0,
        airlineTaxes = 0,
        sgst = 0,
        cgst = 0,
        totalAmount = 0
    } = fareBreakdown;

    // --- 3. HELPER FUNCTIONS ---
    const formatCurrency = (amount) => {
        return amount ? parseFloat(amount).toLocaleString('en-IN', {
            maximumFractionDigits: 2,
            minimumFractionDigits: 0
        }) : '0';
    };

        const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            return new Date(dateString).toLocaleDateString('en-IN', {
                weekday: 'short', 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric', 
                hour: '2-digit', 
                minute: '2-digit', 
                hour12: true, // Changed to 12h format (AM/PM) standard for tickets, or keep hour24: true // NOTE: Ensure your backend sends UTC, otherwise remove this to use Local time
            });
        } catch (e) {
            return dateString; // Fallback if parsing fails
        }
    };


    const travelDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    try {
        // 1. Split the "dd/mm/yyyy" string by the slash
        const parts = dateString.split('/');
        
        // 2. Extract day, month, and year
        // We ensure they are numbers for the constructor
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10);
        const year = parseInt(parts[2], 10);

        // 3. Create the Date object
        // Note: JavaScript counts months from 0 to 11 (Jan is 0, Dec is 11).
        // So we must do (month - 1).
        const dateObj = new Date(year, month - 1, day);

        return dateObj.toLocaleDateString('en-IN', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    } catch (e) {
        console.error(e);
        return dateString; // Fallback
    }
};


    // --- 4. PASSENGER ROWS (Merged Logic + Styling) ---
    const passengerRows = passengers.map(pax => `
        <tr>
            <td>
                <strong>${pax.title || ''} ${pax.firstName} ${pax.lastName}</strong><br>
                <small style="color:#666;">${pax.type || 'Adult'} | ${pax.gender || ''}</small>
            </td>
            <td>${fromCode} - ${toCode}</td>
            <td>${pax.ticketNo || 'Pending'}</td>
            <td>${pax.seat || 'Any'}</td>
            <td>${pax.meal || 'Standard'}</td>
            <td>${baggage || '15kg'} | ${pax.baggage?.cabin || '7kg'}</td>
        </tr>
    `).join('');

    // --- 5. THE TEMPLATE (Frontend Visuals + Backend Data) ---
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>E-Ticket-${booking_id}</title>
    <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background: #fff; margin: 0; padding: 20px; -webkit-print-color-adjust: exact; color: #333; }
        .container { width: 100%; max-width: 800px; margin: 0 auto; border: 1px solid #ddd; }
        
        /* Header */
        .header { display: flex; justify-content: space-between; padding: 20px 30px; border-bottom: 1px solid #eee; }
        .header-left { display: flex; flex-direction: column; justify-content: center; }
        .header-logo { max-height: 50px; margin-bottom: 5px; object-fit: contain; }
        .header-right { text-align: right; font-size: 13px; line-height: 1.6; color: #333; }
        .status-confirm { color: #28a745; font-weight: bold; text-transform: uppercase; }

        /* Titles */
        .section-title { background: #000; color: #fff; padding: 8px 30px; font-size: 14px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; }

        /* Flight Grid */
        .flight-info-header { padding: 20px 30px 0 30px; } 
        .airline-row { display: flex; align-items: center; margin-bottom: 5px; font-size: 14px; font-weight: bold; }
        .pnr-box { background: #e3f2fd; color: #0056b3; padding: 4px 10px; border-radius: 4px; font-size: 12px; margin-left: 15px; }

        .flight-grid { padding: 10px 30px 20px 30px; display: flex; justify-content: space-between; align-items: flex-start; }
        .flight-col { flex: 1; }
        .flight-col.center { flex: 0 0 140px; text-align: center; padding-top: 5px; } 
        .flight-col.right { text-align: right; }
        
        .city-code { font-size: 24px; font-weight: bold; color: #333; }
        .city-name { font-size: 18px; font-weight: bold; color: #333; }
        .flight-time { font-size: 18px; font-weight: bold; color: #000; }
        .terminal-info { font-size: 11px; color: #888; margin-top: 4px; }
        
        /* Visual Duration Line */
        .duration-line { position: relative; height: 1px; background: #ccc; margin: 15px 0; width: 100%; }
        .duration-line::after { content: '✈'; position: absolute; top: -11px; left: 50%; transform: translateX(-50%); color: #0056b3; background: #fff; padding: 0 5px; font-size: 14px; }
        .stops-text { font-size: 10px; color: #666; background: #fff; padding: 0 5px; position: absolute; top: -7px; right: 0; }
        
        .flight-footer { display: flex; padding: 10px 30px; background: #fafafa; font-size: 12px; border-top: 1px dashed #eee; }

        /* Tables */
        .table-wrapper { padding: 20px 30px; }
        .custom-table { width: 100%; border-collapse: collapse; font-size: 12px; }
        .custom-table th { background: #f8f9fa; color: #555; text-align: left; padding: 10px; font-weight: 600; border-bottom: 2px solid #ddd; }
        .custom-table td { padding: 12px 10px; border-bottom: 1px solid #eee; color: #333; vertical-align: middle; }
        
        /* Fare Specifics */
        .fare-container { display: flex; justify-content: flex-end; padding: 0 30px 20px; }
        .fare-table { width: 350px; border: 1px solid #eee; border-radius: 4px; overflow: hidden; }
        .fare-table td { padding: 8px 15px; border-bottom: 1px solid #eee; font-size: 12px; }
        .fare-table tr:last-child td { border-bottom: none; }

        /* Footer / Info */
        .info-list { padding: 15px 40px; font-size: 10px; color: #666; line-height: 1.6; }
        .info-list ul { margin: 0; padding-left: 15px; }
        .footer { background: #333; color: #fff; padding: 15px; text-align: center; font-size: 11px; }
        
        @media print {
            body { padding: 0; }
            .container { border: none; width: 100%; max-width: 100%; }
            .section-title { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
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

        <div class="header" style="background: #fafafa;">
            <div class="header-left">
                <div class="company-name" style="font-size: 18px; color: #000;">
                    ${airline}
                </div>
            </div>
            <div class="header-right">
                <div>Booking Date: <strong>${formatDate(bookingDateIST)}</strong></div>
                <div style="margin:4px 0;">Booking Ref: <strong>${bookingRefNo}</strong></div>
                <div>Status: <span class="status-confirm">${bookingStatus}</span></div>
            </div>
        </div>

        <div class="section-title">Flight Details</div>
        
        <div class="flight-info-header">
             <div class="airline-row">
                <img src="${airlineLogo}" alt="" style="height:20px; margin-right:10px; display:${airlineLogo ? 'block' : 'none'}">
                <span>${airline}</span> 
                <span style="font-weight:400; color:#666; margin-left:5px;">${flightNo}</span>
                <span class="pnr-box">PNR: ${airlinePNR}</span> 
            </div>
        </div>
        
        <div class="flight-grid">
            <div class="flight-col">
                <div class="city-code">${from} (${fromCode})</div>
                <div class="city-name">${depairname}</div>
                <div class="flight-time">${departureTime}</div>
                <div class="terminal-info">Trml: ${departureterminal || 'N/A'}</div>
                <div style="font-size:12px; margin-top:5px;">${travelDate(departureDate)}</div>
            </div>

            <div class="flight-col center">
                <div style="font-size:12px; margin-bottom:5px;">${duration}</div>
                <div class="duration-line">
                    <span class="stops-text">${stops == 0 ? 'Non-stop' : (stops + ' Stop(s)')}</span>
                </div>
                <div style="font-size:11px; margin-top:5px; color:#888;">${cabin}</div>
            </div>

            <div class="flight-col right">
                <div class="city-code">${to} (${toCode})</div>
                <div class="city-name">${arrairname}</div>
                <div class="flight-time">${arrivalTime}</div>
                <div class="terminal-info">Trml: ${arrivalterminal || 'N/A'}</div>
                <div style="font-size:12px; margin-top:5px;">${travelDate(arrivalDate)}</div>
            </div>
        </div>
        
        <div class="flight-footer">
            <div style="flex:1;"><strong>Contact Email:</strong> ${contactDetails.email || 'N/A'}</div>
            <div style="flex:1;"><strong>Mobile:</strong> ${contactDetails.phone || 'N/A'}</div>
            <div style="flex:1; text-align:right;"><strong>Fare Rule:</strong> ${fareRule}</div>
        </div>

        <div class="section-title" style="margin-top: 0;">Passenger & Ticket Information</div>
        <div class="table-wrapper">
            <table class="custom-table">
                <thead>
                    <tr>
                        <th style="width: 30%">Passenger</th>
                        <th>Sector</th>
                        <th>Ticket No</th>
                        <th>Seat</th>
                        <th>Meal</th>
                        <th>Baggage (Chk-in | Cabin)</th>
                    </tr>
                </thead>
                <tbody>
                    ${passengerRows}
                </tbody>
            </table>
        </div>

        <div class="section-title">Fare Details</div>
        <div style="padding-top:20px;">
            <div class="fare-container">
                <table class="fare-table" cellspacing="0">
                    <tr>
                        <td>Base Fare</td>
                        <td style="text-align:right;">₹${formatCurrency(basePrice)}</td>
                    </tr>
                    <tr>
                        <td>Fuel Surcharge</td>
                        <td style="text-align:right;">₹ 0</td>
                    </tr>
                    <tr>
                        <td>Airline Taxes and Fees</td>
                        <td style="text-align:right;">₹ 0</td>
                    </tr>
                    </tr>
                                        <tr>
                        <td>CGST</td>
                        <td style="text-align:right;">₹ 0</td>
                    </tr>
                                        <tr>
                        <td>SGST</td>
                        <td style="text-align:right;">₹ 0</td>
                    </tr>
                    
                    <tr style="border-top: 1px solid #ddd; font-weight:bold; background:#f9f9f9;">
                        <td>Total Amount</td>
                        <td style="text-align:right;">₹${formatCurrency(totalAmount)}</td>
                    </tr>
                </table>
            </div>
        </div>

        <div class="section-title">IMPORTANT INFORMATION</div>
        <div class="info-list">
            <ul>
                <li>You must web check-in on the airline website and obtain a boarding pass.</li>
                <li>Reach the terminal at least 2 hours prior to domestic departure and 4 hours prior to international departure.</li>
                <li>Date & Time is calculated based on the local time of the city/destination.</li>
                <li>Use the Airline PNR (${airlinePNR}) for all correspondence directly with the Airline.</li>
                <li>Your ability to travel is at the sole discretion of the airport authorities.</li>
            </ul>
        </div>

        <div class="footer">
            Copyright © ${new Date().getFullYear()} ${companyName}. All rights reserved.<br>
            Computer generated invoice.
        </div>
    </div>
</body>
</html>`;
};