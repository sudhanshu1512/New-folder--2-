import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import styles from './BookingDetails.module.css';
import {
    FaPlane, FaUser, FaCalendarAlt, FaSpinner,
    FaExclamationCircle, FaArrowLeft, FaPhoneAlt, FaEnvelope,
    FaClock, FaSuitcase, FaCheckCircle
} from 'react-icons/fa';
import { toast } from 'react-hot-toast';

const BookingDetails = () => {
    const { bookingId } = useParams();
    const navigate = useNavigate();

    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isCancelling, setIsCancelling] = useState(false);

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

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-IN', {
            weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
        });
    };

    const formatTime = (timeString) => {
        if (!timeString) return '';
        // Assumes timeString is "HH:mm" or similar
        return timeString;
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
                            {/* Airline Info */}
                            <div className={styles.airlineBlock}>
                                <div className={styles.airlineLogoPlaceholder}>{booking.flight.airline.charAt(0)}</div>
                                <div>
                                    <div className={styles.airlineNameLarge}>{booking.flight.airline}</div>
                                    <div className={styles.flightNoLarge}>{booking.flight.flightNo}</div>
                                </div>
                            </div>

                            {/* Route Visual */}
                            <div className={styles.routeVisual}>
                                <div className={styles.cityNode}>
                                    <span className={styles.timeLarge}>{booking.flight.departureTime}</span>
                                    <span className={styles.cityCodeLarge}>{booking.flight.from} {booking.flight.departureairportname}</span>
                                    <span className={styles.cityCodeLarge}>{booking.flight.depairname}</span>
                                    <span className={styles.dateSmall}>{booking.flight.depDate}</span>
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
                                    <span className={styles.dateSmall}>{booking.flight.arrDate}</span>
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

                    {booking.status === 'CONFIRMED' && (
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
                    )}
                </div>
            </div>
        </div>
    );
};

export default BookingDetails;