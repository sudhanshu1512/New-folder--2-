import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import styles from './BookingDetails.module.css';
import {
    FaPlane, FaUser, FaCalendarAlt, FaSpinner, FaTicketAlt,
    FaExclamationCircle, FaArrowLeft, FaPhoneAlt, FaEnvelope,
    FaClock, FaSuitcase, FaCheckCircle, FaPaperPlane // <--- Added FaPaperPlane
} from 'react-icons/fa';
import { toast } from 'react-hot-toast';

// Import the HTML Generator we just created
import { generateTicketHTML } from './TicketPage';

const BookingDetails = () => {
    const { bookingId } = useParams();
    const navigate = useNavigate();
    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isCancelling, setIsCancelling] = useState(false);


    // ... existing state ...
    const [isSendingEmail, setIsSendingEmail] = useState(false); // <--- Add this state

    // ... existing handleDownloadTicket ...

    // --- NEW: Handle Send Ticket Email ---
    const handleSendTicket = async () => {
        if (!booking) return;
        setIsSendingEmail(true);
        const toastId = toast.loading('Sending ticket via email...');

        try {
            // Adjust the URL based on your backend route structure
            const response = await api.post(`/bookings/booking/${booking.bookingId}/sendtkt`);

            if (response.data.success) {
                toast.success('Ticket sent successfully!', { id: toastId });
            } else {
                toast.error(response.data.message || 'Failed to send ticket', { id: toastId });
            }
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || 'Error sending ticket', { id: toastId });
        } finally {
            setIsSendingEmail(false);
        }
    };

    // Fetch Booking Details
    useEffect(() => {
        const fetchBookingDetails = async () => {
            if (!bookingId) return;
            setLoading(true);
            try {
                const response = await api.get(`/bookings/booking/${bookingId}`);
                if (response.data.success) {
                    setBooking(response.data.booking);
                } else {
                    setError(response.data.message || 'Booking not found');
                }
            } catch (err) {
                setError(err.response?.data?.message || 'Error fetching details.');
            } finally {
                setLoading(false);
            }
        };
        fetchBookingDetails();
    }, [bookingId]);

    // Add this state
    const [isDownloading, setIsDownloading] = useState(false);

    // Handle ticket download with new tab and print button
    const handleDownloadTicket = () => {
        if (!booking) return;

        setIsDownloading(true);
        const toastId = toast.loading('Opening ticket...');

        try {
            const htmlContent = generateTicketHTML(booking);
            const newTab = window.open('', '_blank');

            if (newTab) {
                newTab.document.write(`
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <title>E-Ticket - ${booking.bookingId}</title>
                        <style>
                            body { 
                                font-family: Arial, sans-serif; 
                                padding: 20px;
                                max-width: 1200px;
                                margin: 0 auto;
                            }
                            .print-button {
                                display: block;
                                margin: 20px auto;
                                padding: 10px 20px;
                                background: #0f766e;
                                color: white;
                                border: none;
                                border-radius: 4px;
                                cursor: pointer;
                                font-size: 16px;
                                transition: background 0.2s;
                            }
                            .print-button:hover {
                                background: #0e6b64;
                            }
                            @media print {
                                .print-button { display: none; }
                                body { padding: 0; }
                            }
                        </style>
                    </head>
                    <body>
                        ${htmlContent}
                        <button class="print-button" onclick="window.print()">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px; vertical-align: middle;">
                                <polyline points="6 9 6 2 18 2 18 9"></polyline>
                                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                                <rect x="6" y="14" width="12" height="8"></rect>
                            </svg>
                            Print Ticket
                        </button>
                        <script>
                            // Optional: Uncomment to close after print
                            // window.onafterprint = function() {
                            //     window.close();
                            // };
                        </script>
                    </body>
                    </html>
                `);
                newTab.document.close();
                toast.dismiss(toastId);
            } else {
                toast.error('Pop-up blocked. Please allow pop-ups for this site.', { id: toastId });
            }
        } catch (err) {
            console.error('Error generating ticket:', err);
            toast.error('Failed to generate ticket', { id: toastId });
        } finally {
            setIsDownloading(false);
        }
    };

    // Handle Cancellation
    const handleCancelBooking = async () => {
        if (!window.confirm('Are you sure you want to cancel this booking? This action cannot be undone.')) return;

        const reason = window.prompt('Reason for cancellation (optional):');
        setIsCancelling(true);
        const toastId = toast.loading('Processing cancellation...');

        try {
            const response = await api.put(`/bookings/booking/${booking.bookingId}/cancel`, {
                reason: reason || 'Customer request'
            });

            if (response.data.success) {
                setBooking(response.data.booking);
                toast.success(response.data.message, { id: toastId });
            } else {
                toast.error(response.data.message || 'Cancellation failed', { id: toastId });
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Error cancelling booking', { id: toastId });
        } finally {
            setIsCancelling(false);
        }
    };

    // Helper: Format Date
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-IN', {
            weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour24: true,timeZone: 'UTC'
        });
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

    if (loading) return (
        <div className={styles.container}>
            <div className={styles.spinnerContainer}>
                <FaSpinner className={styles.spinner} />
                <p>Retrieving booking details...</p>
            </div>
        </div>
    );

    if (error) return (
        <div className={styles.container}>
            <div className={styles.errorMessage}>
                <FaExclamationCircle /> {error}
                <button onClick={() => navigate(-1)} className={styles.retryBtn}>Go Back</button>
            </div>
        </div>
    );

    if (!booking) return null;

    return (
        <div className={styles.container}>
            {/* Header Section */}
            <div className={styles.detailsHeader}>
                <button onClick={() => navigate('/booking-search')} className={styles.backLink}>
                    <FaArrowLeft /> Back to Bookings
                </button>
                <div className={styles.headerTitleRow}>
                    <div>
                        <h1 className={styles.title}>Booking Details</h1>
                        <p className={styles.subtitle}>Booking ID: {booking.bookingId}</p>
                    </div>
                    <div className={`${styles.statusBadgeLarge} ${styles[booking.status === 'CONFIRMED' ? 'statusConfirmed' : booking.status === 'CANCELLED' ? 'statusCancelled' : 'statusPending']}`}>
                        {booking.status}
                    </div>
                </div>
            </div>

            <div className={styles.detailsGrid}>
                {/* Left Column: Flight & Passengers */}
                <div className={styles.mainContent}>

                    {/* Flight Card */}
                    <div className={styles.detailsCard}>
                        <div className={styles.cardHeader}>
                            <h3><FaPlane className={styles.iconTeal} /> Flight Information</h3>
                            <span className={styles.cabinClass}>{booking.flight.cabin} Class</span>
                            <span className={styles.bookingDate}>{formatDate(booking.bookingDate)}</span>
                        </div>

                        <div className={styles.flightRouteContainer}>
                            <div className={styles.airlineBlock}>
                                <div className={styles.airlineLogoPlaceholder}>{booking.flight.airline.charAt(0)}</div>
                                <div>
                                    <div className={styles.airlineNameLarge}>{booking.flight.airline}</div>
                                    <div className={styles.flightNoLarge}>{booking.flight.airlinecode} - {booking.flight.flightNo}</div>
                                    <div className={styles.flightNoLarge}>{booking.pnr}</div>
                                </div>
                            </div>

                            <div className={styles.routeVisual}>
                                <div className={styles.cityNode}>
                                    <span className={styles.timeLarge}>{booking.flight.departureTime}</span>
                                    <span className={styles.cityCodeLarge}>{booking.flight.from} {booking.flight.departureairportname}</span>
                                    <span className={styles.cityCodeLarge}>{booking.flight.depairname}</span>
                                    <span className={styles.dateSmall}>{travelDate(booking.flight.depDate)}</span>
                                    <span className={styles.terminalInfo}>Term {booking.flight.departureterminal || '-'}</span>
                                </div>

                                <div className={styles.durationLine}>
                                    <span className={styles.durationBadge}><FaClock /> {booking.flight.duration}</span>
                                    <div className={styles.dottedLine}></div>
                                    <FaPlane className={styles.planeIconMiddle} />
                                </div>

                                <div className={styles.cityNode}>
                                    <span className={styles.timeLarge}>{booking.flight.arrivalTime}</span>
                                    <span className={styles.cityCodeLarge}>{booking.flight.to} {booking.flight.arrivalairportname}</span>
                                    <span className={styles.cityCodeLarge}>{booking.flight.arrairname}</span>
                                    <span className={styles.dateSmall}>{travelDate(booking.flight.arrDate)}</span>
                                    <span className={styles.terminalInfo}>Term {booking.flight.arrivalterminal || '-'}</span>
                                </div>
                            </div>

                            <div className={styles.airportNamesRow}>
                                <span>{booking.flight.departureairportname}</span>
                                <span>{booking.flight.arrivalairportname}</span>
                            </div>
                        </div>
                    </div>

                    {/* Passengers Card */}
                    <div className={styles.detailsCard}>
                        <div className={styles.cardHeader}>
                            <h3><FaUser className={styles.iconTeal} /> Travelers</h3>
                            <span className={styles.paxCount}>{booking.passengers.length} Person(s)</span>
                        </div>
                        <div className={styles.paxGrid}>
                            {booking.passengers.map((pax, idx) => (
                                <div key={idx} className={styles.paxCard}>
                                    <div className={styles.paxAvatar}>
                                        {pax.firstName.charAt(0)}{pax.lastName.charAt(0)}
                                    </div>
                                    <div className={styles.paxInfo}>
                                        <div className={styles.paxName}>{pax.title} {pax.firstName} {pax.lastName}</div>
                                        <div className={styles.paxType}>{pax.type} • {pax.gender}</div>
                                    </div>
                                    <div className={styles.paxExtras}>
                                        <span><FaSuitcase /> {booking.flight.baggage} </span>
                                        <span><FaSuitcase /> 7kg</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Contact Card */}
                    <div className={styles.detailsCard}>
                        <div className={styles.cardHeader}>
                            <h3>Contact Details</h3>
                        </div>
                        <div className={styles.contactRow}>
                            <div className={styles.contactItem}>
                                <FaEnvelope className={styles.iconGray} />
                                <div>
                                    <label>Email Address</label>
                                    <p>{booking.contact.email}</p>
                                </div>
                            </div>
                            <div className={styles.contactItem}>
                                <FaPhoneAlt className={styles.iconGray} />
                                <div>
                                    <label>Mobile Number</label>
                                    <p>{booking.contact.countryCode} {booking.contact.phone}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Pricing & Actions */}
                <div className={styles.sidebar}>
                    {/* DOWNLOAD TICKET BUTTON */}
                    {booking.status === 'CONFIRMED' && (
                        <div className={styles.buttonRow}>
                            {/* Download Button */}
                            <button
                                onClick={handleDownloadTicket}
                                disabled={isDownloading}
                                className={styles.halfBtn}
                            >
                                {isDownloading ? (
                                    <>
                                        <FaSpinner className={styles.spinner} />
                                        <span>Processing...</span>
                                    </>
                                ) : (
                                    <>
                                        <FaTicketAlt />
                                        <span>Download</span>
                                    </>
                                )}
                            </button>

                            {/* Send Email Button */}
                            <button
                                onClick={handleSendTicket}
                                disabled={isSendingEmail}
                                className={`${styles.halfBtn} ${styles.emailBtn}`}
                            >
                                {isSendingEmail ? (
                                    <>
                                        <FaSpinner className={styles.spinner} />
                                        <span>Sending...</span>
                                    </>
                                ) : (
                                    <>
                                        <FaPaperPlane />
                                        <span>Email Ticket</span>
                                    </>
                                )}
                            </button>
                        </div>
                    )}

                    <div className={styles.detailsCard}>
                        <div className={styles.cardHeader}>
                            <h3>Fare Summary</h3>
                        </div>
                        <div className={styles.priceList}>
                            <div className={styles.priceRow}>
                                <span>Base Fare</span>
                                <span>₹{booking.pricing.basePrice.toLocaleString()}</span>
                            </div>
                            <div className={styles.priceRow}>
                                <span>Taxes & Fees</span>
                                <span>₹{(booking.pricing.breakdown.taxes + booking.pricing.breakdown.otherCharges).toLocaleString()}</span>
                            </div>
                            <div className={styles.priceRow}>
                                <span>Fare Rule :</span>
                                <span>{booking.pricing.farerule}</span>
                            </div>
                            <div className={styles.divider}></div>
                            <div className={`${styles.priceRow} ${styles.totalPrice}`}>
                                <span>Total Amount</span>
                                <span>₹{booking.pricing.totalAmount.toLocaleString()}</span>
                            </div>
                            <div className={styles.paymentStatus}>
                                <FaCheckCircle /> Payment {booking.payment.status}
                            </div>
                        </div>
                    </div>

                    {/* {booking.status === 'CONFIRMED' && (
                        <div className={styles.actionCard}>
                            <button
                                className={styles.cancelBtnFull}
                                onClick={handleCancelBooking}
                                disabled={isCancelling}
                            >
                                {isCancelling ? <FaSpinner className={styles.spinnerSmall} /> : 'Cancel Booking'}
                            </button>
                            <p className={styles.cancelNote}>
                                <FaExclamationCircle /> Cancellation charges may apply as per airline policy.
                            </p>
                        </div>
                    )}

                    {booking.status === 'CANCELLED' && (
                        <div className={`${styles.detailsCard} ${styles.cancelledCard}`}>
                            <h4>Cancellation Details</h4>
                            <p><strong>Reason :</strong> {booking.cancellation.reason}</p>
                            <p><strong>Date:</strong> {formatDate(booking.cancellation.cancelledAt)}</p>
                        </div>
                    )} */}
                </div>
            </div>
        </div>
    );
};

export default BookingDetails;