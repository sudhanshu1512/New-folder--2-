// src/utils/ticketGenerator.js

export const generateTicketHTML = (booking) => {
    // Helper to format currency
    const formatCurrency = (amount) => {
        return amount ? parseFloat(amount).toLocaleString('en-IN') : '0';
    };

    // Helper: Format Date
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-IN', {
            weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour24: true
        });
    };

    // --- MAPPING DATA ---
    const agentDetails = {
        name: "Travel Agency", // Replace with your App/Agency Name
        company: "Travel Services Pvt Ltd",
        address: "123, Tech Plaza, New Delhi",
        phone: "+91-9876543210",
        email: "support@travelagency.com"
    };

    // Construct Passenger Rows
    const passengerRows = booking.passengers.map(pax => `
        <tr>
            <td>
                <strong>${pax.title} ${pax.firstName} ${pax.lastName}</strong><br>
                <small>${pax.type} | ${pax.gender}</small>
            </td>
            <td>${booking.flight.departureairportname} - ${booking.flight.arrivalairportname}</td>
            <td>${booking.ticketno || 'Pending'}</td>
            <td>NA</td>
            <td>${pax.meal || 'NA'}</td>
            <td>${booking.flight.baggage} | 7 Kg</td>
        </tr>
    `).join('');

    // Calculate Taxes
    const taxes = booking.pricing.breakdown.taxes + booking.pricing.breakdown.otherCharges;

    // --- THE TEMPLATE ---
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>E-Ticket-${booking.bookingId}</title>
    <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background: #fff; margin: 0; padding: 20px; -webkit-print-color-adjust: exact; }
        .container { width: 100%; max-width: 800px; margin: 0 auto; border: 1px solid #ddd; }
        
        /* Header Section */
        .header { display: flex; justify-content: space-between; padding: 20px 30px; border-bottom: 1px solid #eee; }
        .header-left { display: flex; flex-direction: column; justify-content: center; }
        .header-logo { max-height: 50px; margin-bottom: 5px; }
        .company-name { font-size: 14px; color: #666; font-weight: 600; }
        .header-right { text-align: right; font-size: 13px; line-height: 1.6; color: #333; }
        .header-right strong { color: #000; }
        .status-confirm { color: #28a745; font-weight: bold; text-transform: uppercase; }

        /* Section Titles */
        .section-title { background: #000000; color: #ffffff; padding: 10px 30px; font-size: 15px; font-weight: bold; margin-top: 0; }

        /* Flight Details Section */
        /* MODIFIED: Changed align-items to flex-start so text aligns at the top */
        .flight-grid { padding: 10px 30px 20px 30px; display: flex; justify-content: space-between; align-items: flex-start; }
        .flight-col { flex: 1; }
        .flight-col.center { flex: 0 0 150px; text-align: center; padding-top: 5px; } /* Added slight padding to align duration with city codes */
        .flight-col.right { text-align: right; }
        
        /* MODIFIED: Adjusted padding to match the grid below it */
        .flight-info-header { padding: 20px 30px 0 30px; } 

        .airline-row { display: flex; align-items: center; margin-bottom: 5px; font-size: 14px; font-weight: bold; }
        .pnr-box { background: #e3f2fd; color: #0056b3; padding: 4px 10px; border-radius: 4px; font-size: 12px; margin-left: 15px; }

        .city-code { font-size: 24px; font-weight: bold; color: #333; }
        .city-name { font-size: 12px; color: #666; margin-bottom: 5px; }
        .flight-time { font-size: 18px; font-weight: bold; color: #000; }
        .terminal-info { font-size: 11px; color: #888; margin-top: 4px; }
        
        .duration-line { position: relative; height: 1px; background: #ccc; margin: 15px 0; width: 100%; }
        .duration-line::after { content: '✈'; position: absolute; top: -11px; left: 50%; color: #0056b3; background: #fff; padding: 0 5px; font-size: 14px; }
        .stops-text { font-size: 11px; color: #666; background: #fff; padding: 0 5px; position: absolute; top: -8px; right: 10%; }
        
        .flight-footer { display: flex; padding: 10px 30px; background: #fafafa; font-size: 12px; border-top: 1px dashed #eee; justify-content: space-between; }

        /* Tables */
        .table-wrapper { padding: 20px 30px; }
        .custom-table { width: 100%; border-collapse: collapse; font-size: 12px; }
        .custom-table th { background: #f1f1f1; color: #444; text-align: left; padding: 10px; font-weight: 600; border-bottom: 2px solid #ddd; }
        .custom-table td { padding: 12px 10px; border-bottom: 1px solid #eee; color: #333; vertical-align: middle; }
        
        /* Fare Specifics */
        .fare-container { display: flex; justify-content: flex-end; padding: 0 30px 20px; }
        .fare-table { width: 350px; border: 1px solid #eee; }
        .fare-table td { padding: 8px 15px; border-bottom: 1px solid #eee; font-size: 12px; }

        /* Important Info */
        .info-list { padding: 20px 40px; font-size: 11px; color: #555; line-height: 1.6; background: #fff; }
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
                <img src="https://placehold.co/200x50?text=Agency+Logo" class="header-logo" alt="Logo">
            </div>
            <div class="header-right">
                <div><strong>${agentDetails.name}</strong></div>
                <div style="margin:4px 0;"><strong>${agentDetails.company}</strong></div>
                <div>${agentDetails.address}</div>
                <div>${agentDetails.phone}</div>
                <div>${agentDetails.email}</div>
            </div>
        </div>

        <div class="header">
            <div class="header-left">
                <div class="company-name" style="font-size: 18px; color: #000;">${booking.flight.airline}</div>
            </div>
            <div class="header-right">
                <div>Booking Date: <strong>${formatDate(booking.bookingDate)}</strong></div>
                <div style="margin:4px 0;">Booking Ref: <strong>${booking.bookingId}</strong></div>
                <div>Status: <span class="status-confirm">${booking.status}</span></div>
            </div>
        </div>

        <div class="section-title">Flight Details</div>
        
        <div class="flight-info-header">
             <div class="airline-row">
                <span>${booking.flight.airline}</span> 
                <span style="font-weight:400; color:#666; margin-left:5px;">${booking.flight.airlinecode} - ${booking.flight.flightNo}</span>
                <span class="pnr-box">PNR: ${booking.pnr}</span> 
            </div>
        </div>
        <div>
            <div class="flight-grid">
                <div class="flight-col">
                    <div class="city-code">${booking.flight.departureairportname}</div>
                    <div class="city-name">${booking.flight.from}</div>
                    <div class="flight-time">${booking.flight.departureTime}</div>
                    <div class="terminal-info">Trml: ${booking.flight.departureterminal || 'N/A'}</div>
                    <div style="font-size:12px; margin-top:5px;">${formatDate(booking.flight.depDate)}</div>
                </div>

                <div class="flight-col center">
                    <div style="font-size:12px; margin-bottom:5px;">${booking.flight.duration}</div>
                    <div class="duration-line">
                        <span class="stops-text">${booking.flight.stops || 'Non - stop'}</span>
                    </div>
                    <div style="font-size:11px; margin-top:5px; color:#888;">${booking.flight.cabin}</div>
                </div>

                <div class="flight-col right">
                    <div class="city-code">${booking.flight.arrivalairportname}</div>
                    <div class="city-name">${booking.flight.to}</div>
                    <div class="flight-time">${booking.flight.arrivalTime}</div>
                    <div class="terminal-info">Trml: ${booking.flight.arrivalterminal || 'N/A'}</div>
                    <div style="font-size:12px; margin-top:5px;">${formatDate(booking.flight.arrDate)}</div>
                </div>
            </div>
            <div class="flight-footer">
                <div><strong>Contact Email:</strong> ${booking.contact.email}</div>
                <div style="margin-left: 20px;"><strong>Mobile:</strong> ${booking.contact.phone}</div>
                <div style="margin-left: auto;"><strong>Fare Rule :</strong> ${booking.pricing.farerule}</div>
            </div>
        </div>

        <div class="section-title">Passenger & Ticket Information</div>
        <div class="table-wrapper">
            <table class="custom-table">
                <thead>
                    <tr>
                        <th style="width: 25%">Passenger</th>
                        <th>Sector</th>
                        <th>Ticket No</th>
                        <th>Seat</th>
                        <th>Meal</th>
                        <th style="width: 25%">Baggage</th>
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
                        <td style="text-align:right;">₹${formatCurrency(booking.pricing.basePrice)}</td>
                    </tr>
                    <tr>
                        <td>Fuel Surcharge</td>
                        
                    </tr>
                    <tr>
                        <td>Airline Taxes and Fees</td>
                        <td style="text-align:right;">₹${formatCurrency(taxes)}</td>
                    </tr>
                    
                    <tr style="border-top: 1px solid #ddd; font-weight:bold; background:#f9f9f9;">
                        <td>Total Amount</td>
                        <td style="text-align:right;">₹${formatCurrency(booking.pricing.totalAmount)}</td>
                    </tr>
                </table>
            </div>
        </div>

        <div class="section-title">IMPORTANT INFORMATION</div>
        <div class="info-list">
            <ul>
                <li>You must web check-in on the airline website and obtain a boarding pass.</li>
                <li>You must download & register on the Aarogya Setu App and carry a valid ID.</li>
                <li>It is mandatory to wear a mask and carry other protective gear.</li>
                <li>Reach the terminal at least 2 hours prior to the departure for domestic flight and 4 hours prior to the departure of international flight.</li>
                <li>For departure terminal please check with the airline first.</li>
                <li>Date & Time is calculated based on the local time of the city/destination.</li>
                <li>Use the Airline PNR for all Correspondence directly with the Airline.</li>
                <li>For rescheduling/cancellation within 4 hours of the departure time contact the airline directly.</li>
                <li>Your ability to travel is at the sole discretion of the airport authorities and we shall not be held responsible.</li>
                <li>Please verify flight timings & terminal info with the airlines.</li>
            </ul>
        </div>

        <div class="footer">
            Copyright © ${new Date().getFullYear()} ${agentDetails.name}. All rights reserved.<br>
            Computer generated invoice.
        </div>
    </div>
</body>
</html>`;
};