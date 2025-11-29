import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast, Toaster } from 'react-hot-toast';
import {
    FaCheck, FaPlane, FaUser, FaBirthdayCake, FaPhoneAlt, FaEnvelope,
    FaUserFriends, FaWallet, FaArrowRight, FaExclamationCircle, FaSpinner,
    FaChevronDown, FaIdCard, FaPhone, FaCreditCard, FaUniversity, FaQrcode, FaRupeeSign
} from 'react-icons/fa';
import styles from './Booking_page.module.css';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

//=========== SUB-COMPONENTS =======================================

const fetchAgentBalance = async () => {
    try {
        const token = localStorage.getItem('token');
        const response = await api.get('/auth/balance', {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.data.success) {
            return response.data.balance;
        } else {
            console.error('Failed to fetch balance:', response.data.message);
            return 0;
        }
    } catch (error) {
        console.error('Error fetching balance:', error);
        return 0;
    }
};

const ProgressBar = ({ currentStep }) => {
    const steps = [
        { number: 1, title: 'Flight Itinerary', icon: <FaPlane /> },
        { number: 2, title: 'Passenger Details', icon: <FaUserFriends /> },
        { number: 3, title: 'Review', icon: <FaCheck /> },
        { number: 4, title: 'Payments', icon: <FaWallet /> }
    ];

    return (
        <div className={styles.progressBarContainer}>
            {steps.map((step, index) => (
                <React.Fragment key={step.number}>
                    <div className={`${styles.stepItem} ${currentStep >= step.number ? styles.active : ''}`}>
                        <div className={`${styles.stepCircle} ${currentStep > step.number ? styles.completed : ''}`}>
                            {currentStep > step.number ? <FaCheck /> : step.number}
                        </div>
                        <div className={styles.stepTitle}>{step.title.toUpperCase()}</div>
                    </div>
                    {index < steps.length - 1 && <div className={styles.connectorLine} />}
                </React.Fragment>
            ))}
        </div>
    );
};

const FareSummary = ({ fare }) => {
    const formatCurrency = (amount) => `₹ ${(amount || 0).toLocaleString('en-IN')}`;
    if (!fare) return null;

    return (
        <div className={`${styles.summaryContainer} ${styles.card}`}>
            <h3 className={styles.summaryHeader}>Fare Summary</h3>
            <div className={styles.passengerType}>Adult - {fare.adults?.count || 0}, Child - {fare.children?.count || 0}, Infant - {fare.infants?.count || 0}</div>

            <div className={styles.fareSection}>
                <h4>Outbound Fare</h4>
                {fare.adults?.count > 0 && (
                    <div className={styles.fareRow}><span>Adult Fare x {fare.adults.count}</span><span>{formatCurrency(fare.adults.total)}</span></div>
                )}
                {fare.children?.count > 0 && (
                    <div className={styles.fareRow}><span>Child Fare x {fare.children.count}</span><span>{formatCurrency(fare.children.total)}</span></div>
                )}
                {fare.infants?.count > 0 && (
                    <div className={styles.fareRow}><span>Infant Fare x {fare.infants.count}</span><span>{formatCurrency(fare.infants.total)}</span></div>
                )}
            </div>

            <div className={styles.fareSection}>
                <div className={styles.fareRow}><span>Taxes & Surcharges</span><span>{formatCurrency(fare.taxes)}</span></div>
                <div className={styles.fareRow}><span>Other Charges</span><span>{formatCurrency(fare.otherCharges)}</span></div>
                <div className={styles.fareRow}><span>Fare Rule</span><span>{fare.fareRule === 'R' ? 'Refundable' : fare.fareRule === 'N' ? 'Non-Refundable' : fare.fareRule}</span></div>
            </div>

            <div className={`${styles.fareRow} ${styles.grossTotal}`}><span>Gross Fare</span><span>{formatCurrency(fare.totalAmount)}</span></div>
        </div>
    );
};

const FlightItinerary = ({ flightDetails, onNext }) => {
    return (
        <div className={`${styles.flightCard} ${styles.animatedCard}`}>
            <div className={styles.flightHeader}>
                <div>
                    <h3 className={styles.routeTitle}>
                        {flightDetails.from}  <FaPlane /> {flightDetails.to}
                    </h3>
                    <p className={styles.flightDate}>{flightDetails.departureDate}</p>
                    <div className={styles.timelineRouteSection}>
                        <div className={styles.timelineTimes}>
                            <span>{flightDetails.departureTime}</span>
                            <span>{flightDetails.arrivalTime}</span>
                        </div>
                        <div className={styles.timelineGraphic}>
                            <div className={styles.timelineCircle}></div>
                            <div className={styles.timelineDashedLine}></div>
                            <div className={styles.timelineCircle}></div>
                        </div>
                        <div className={styles.timelineDetails}>
                            <div className={styles.timelineAirportInfo}>
                                <strong>{flightDetails.from}</strong>. {flightDetails.departureairportname}
                            </div>
                            <div className={styles.timelineDuration}>{flightDetails.duration}</div>
                            <div className={styles.timelineAirportInfo}>
                                <strong>{flightDetails.to}</strong>. {flightDetails.arrivalairportname}
                            </div>
                        </div>
                    </div>
                </div>
                <div className={styles.cabinClass}>{flightDetails.cabin}</div>
            </div>

            <div className={styles.airlineSection}>
                <div className={styles.airlineLogo}>{flightDetails.airline?.substring(0, 2).toUpperCase()}</div>
                <div className={styles.airlineInfo}>
                    <div className={styles.airlineName}>{flightDetails.airline}</div>
                    <div className={styles.flightNumber}>{flightDetails.flightNo}</div>
                </div>

            </div>

            <div className={styles.routeSection}>
                <div className={styles.airport}>
                    <div className={styles.time}>{flightDetails.departureTime}</div>
                    <div className={styles.code}>{flightDetails.from}</div>
                    <div className={styles.date}>{flightDetails.departureDate}</div>
                    <div className={styles.terminal}>Terminal No. {flightDetails.departureterminal}</div>
                </div>
                <div className={styles.duration}>
                    <span className={styles.durationText}>{flightDetails.duration}</span>
                    <div className={styles.line}><FaPlane className={styles.planeIcon} /></div>
                    <span className={styles.stops}>{flightDetails.stops}</span>
                </div>
                <div className={styles.airport}>
                    <div className={styles.time}>{flightDetails.arrivalTime}</div>
                    <div className={styles.code}>{flightDetails.to}</div>
                    <div className={styles.date}>{flightDetails.arrivalDate}</div>
                    <div className={styles.terminal}>Terminal No. {flightDetails.arrivalterminal}</div>
                </div>
            </div>

            <div className={styles.flightFooter}>
                <div className={styles.flightOptions}>
                    <span>Check in Baggage : {flightDetails.baggage} / Adult</span>
                </div>
                <button onClick={onNext} className={styles.addPassengerButton}>
                    Add Passengers <FaArrowRight />
                </button>
            </div>
        </div>
    );
};

const PassengerDetails = ({ passengers, setPassengers, contactDetails, setContactDetails, onNext, onBack, errors, setErrors, flightDetails, validateDateOfBirth }) => {
    const [expandedPassengers, setExpandedPassengers] = useState({});

    const handleInputClick = (e) => {
        try {
            if (typeof e.target.showPicker === 'function') {
                e.target.showPicker();
            }
        } catch (error) {
            console.log('Date picker could not be opened programmatically');
        }
    };

    const handlePassengerChange = (index, field, value) => {
        const updatedPassengers = [...passengers];
        updatedPassengers[index][field] = value;
        setPassengers(updatedPassengers);

        if (errors[`pax-${index}-${field}`]) {
            setErrors(prev => ({ ...prev, [`pax-${index}-${field}`]: null }));
        }

        if (field === 'dob' && value) {
            const dobError = validateDateOfBirth(value, updatedPassengers[index].type);
            setErrors(prev => ({ ...prev, [`pax-${index}-dob`]: dobError }));
        }
    };

    const handleContactChange = (field, value) => {
        setContactDetails(prev => ({ ...prev, [field]: value }));
        if (errors[`contact-${field}`]) {
            setErrors(prev => ({ ...prev, [`contact-${field}`]: null }));
        }
    };

    const togglePassengerExpansion = (index) => {
        setExpandedPassengers(prev => ({
            ...prev,
            [index]: !prev[index]
        }));
    };

    const getPassengerDisplayName = (passenger, index) => {
        if (passenger.firstName || passenger.lastName) {
            return `${passenger.title || 'Mr'} ${passenger.firstName || ''} ${passenger.lastName || ''}`.trim();
        }
        return `${passenger.title || 'Mr'} Passenger ${index + 1}`;
    };


    const getMaxDate = () => {
        const today = new Date();
        return today.toISOString().split('T')[0];
    };

    const getMinDate = (passengerType) => {
        const today = new Date();
        let yearsBack;

        switch (passengerType.toLowerCase()) {
            case 'adult':
                yearsBack = 100;
                break;
            case 'child':
                yearsBack = 14;
                break;
            case 'infant':
                yearsBack = 2;
                break;
            default:
                yearsBack = 100;
        }

        const minDate = new Date(today.getFullYear() - yearsBack, today.getMonth(), today.getDate());
        return minDate.toISOString().split('T')[0];
    };

    const isPassengerComplete = (passenger) => {
        const hasBasicInfo = passenger.firstName && passenger.firstName.trim() !== '' &&
            passenger.lastName && passenger.lastName.trim() !== '' &&
            passenger.dob && passenger.dob !== '';

        if (!hasBasicInfo) return false;

        const dobError = validateDateOfBirth(passenger.dob, passenger.type);
        return dobError === null;
    };

    const groupedPassengers = passengers.reduce((acc, passenger, index) => {
        const type = passenger.type.toUpperCase();
        if (!acc[type]) acc[type] = [];
        acc[type].push({ ...passenger, originalIndex: index });
        return acc;
    }, {});

    return (
        <>
            <div className={`${styles.flightCard} ${styles.animatedCard}`}>
                <div className={styles.flightHeader}>
                    <div>
                        <h3 className={styles.routeTitle}>
                            {flightDetails.from}  <FaPlane /> {flightDetails.to}
                        </h3>
                        <p className={styles.flightDate}>{flightDetails.departureDate}</p>
                        <div className={styles.timelineRouteSection}>
                            <div className={styles.timelineTimes}>
                                <span>{flightDetails.departureTime}</span>
                                <span>{flightDetails.arrivalTime}</span>
                            </div>
                            <div className={styles.timelineGraphic}>
                                <div className={styles.timelineCircle}></div>
                                <div className={styles.timelineDashedLine}></div>
                                <div className={styles.timelineCircle}></div>
                            </div>
                            <div className={styles.timelineDetails}>
                                <div className={styles.timelineAirportInfo}>
                                    <strong>{flightDetails.from}</strong>. {flightDetails.departureairportname}
                                </div>
                                <div className={styles.timelineDuration}>{flightDetails.duration}</div>
                                <div className={styles.timelineAirportInfo}>
                                    <strong>{flightDetails.to}</strong>. {flightDetails.arrivalairportname}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className={styles.cabinClass}>{flightDetails.cabin}</div>
                </div>

                <div className={styles.airlineSection}>
                    <div className={styles.airlineLogo}>{flightDetails.airline?.substring(0, 2).toUpperCase()}</div>
                    <div className={styles.airlineInfo}>
                        <div className={styles.airlineName}>{flightDetails.airline}</div>
                        <div className={styles.flightNumber}>{flightDetails.flightNo}</div>
                    </div>
                </div>

                <div className={styles.routeSection}>
                    <div className={styles.airport}>
                        <div className={styles.time}>{flightDetails.departureTime}</div>
                        <div className={styles.code}>{flightDetails.from}</div>
                        <div className={styles.date}>{flightDetails.departureDate}</div>
                        <div className={styles.terminal}>Terminal No. {flightDetails.departureterminal}</div>
                    </div>
                    <div className={styles.duration}>
                        <span className={styles.durationText}>{flightDetails.duration}</span>
                        <div className={styles.line}><FaPlane className={styles.planeIcon} /></div>
                        <span className={styles.stops}>{flightDetails.stops}</span>
                    </div>
                    <div className={styles.airport}>
                        <div className={styles.time}>{flightDetails.arrivalTime}</div>
                        <div className={styles.code}>{flightDetails.to}</div>
                        <div className={styles.date}>{flightDetails.arrivalDate}</div>
                        <div className={styles.terminal}>Terminal No. {flightDetails.arrivalterminal}</div>
                    </div>
                </div>

                <div className={styles.flightFooter}>
                    <div className={styles.flightOptions}>
                        <span>Check in Baggage : {flightDetails.baggage} / Adult</span>
                    </div>
                </div>
            </div>
            {/* Traveller Details */}
            <div className={`${styles.travellerSection} ${styles.animatedCard}`}>
                <div className={styles.travellerHeader}>
                    <h3 className={styles.travellerTitle}>Travellers Details</h3>
                    <div className={styles.govIdNote}>
                        <FaIdCard /> Name should be same as in Government ID proof
                    </div>
                </div>

                {Object.entries(groupedPassengers).map(([type, typePassengers]) => (
                    <div key={type} className={styles.passengerTypeSection}>
                        <h4 className={styles.passengerTypeHeader}>{type}</h4>
                        {typePassengers.map((passenger, typeIndex) => {
                            const originalIndex = passenger.originalIndex;
                            const isExpanded = expandedPassengers[originalIndex];
                            return (
                                <div key={originalIndex} className={styles.passengerCard}>
                                    <div
                                        className={styles.passengerCardHeader}
                                        onClick={() => togglePassengerExpansion(originalIndex)}
                                    >
                                        <div className={styles.passengerInfo}>
                                            <input
                                                type="checkbox"
                                                className={`${styles.passengerCheckbox} ${isPassengerComplete(passenger) ? styles.complete : styles.incomplete}`}
                                                checked={isPassengerComplete(passenger)}
                                                readOnly
                                            />
                                            <span className={styles.passengerName}>
                                                {getPassengerDisplayName(passenger, originalIndex)}
                                            </span>
                                        </div>
                                        <FaChevronDown className={`${styles.expandIcon} ${isExpanded ? styles.expanded : ''}`} />
                                    </div>

                                    {isExpanded && (
                                        <div className={styles.passengerForm}>
                                            <div className={styles.formRow}>
                                                <div className={styles.inputGroup}>
                                                    <label className={styles.inputLabel}>Title</label>
                                                    <select
                                                        value={passenger.title || 'Mr'}
                                                        onChange={e => handlePassengerChange(originalIndex, 'title', e.target.value)}
                                                        className={errors[`pax-${originalIndex}-title`] ? styles.inputError : ''}
                                                    >
                                                        <option value="">Select Title</option>
                                                        <option value="Mr">Mr</option>
                                                        <option value="Ms">Ms</option>
                                                        <option value="Mrs">Mrs</option>
                                                    </select>
                                                    {errors[`pax-${originalIndex}-title`] && <span className={styles.errorMessage}><FaExclamationCircle /> {errors[`pax-${originalIndex}-title`]}</span>}
                                                </div>
                                                <div className={styles.inputGroup}>
                                                    <label className={styles.inputLabel}>First Name & Middle name, if any</label>
                                                    <input
                                                        value={passenger.firstName}
                                                        onChange={e => handlePassengerChange(originalIndex, 'firstName', e.target.value)}
                                                        placeholder="First Name"
                                                        className={errors[`pax-${originalIndex}-firstName`] ? styles.inputError : ''}
                                                    />
                                                    {errors[`pax-${originalIndex}-firstName`] && <span className={styles.errorMessage}><FaExclamationCircle /> {errors[`pax-${originalIndex}-firstName`]}</span>}
                                                </div>
                                                <div className={styles.inputGroup}>
                                                    <label className={styles.inputLabel}>Last Name</label>
                                                    <input
                                                        value={passenger.lastName}
                                                        onChange={e => handlePassengerChange(originalIndex, 'lastName', e.target.value)}
                                                        placeholder="Last Name"
                                                        className={errors[`pax-${originalIndex}-lastName`] ? styles.inputError : ''}
                                                    />
                                                    {errors[`pax-${originalIndex}-lastName`] && <span className={styles.errorMessage}><FaExclamationCircle /> {errors[`pax-${originalIndex}-lastName`]}</span>}
                                                </div>
                                            </div>
                                            <div className={styles.formRow}>
                                                <div className={styles.inputGroup}>
                                                    <label className={styles.inputLabel}>Date of Birth</label>
                                                    <input
                                                        type="date"
                                                        value={passenger.dob}
                                                        onChange={e => handlePassengerChange(originalIndex, 'dob', e.target.value)}
                                                        className={errors[`pax-${originalIndex}-dob`] ? styles.inputError : ''}
                                                        max={getMaxDate()}
                                                        min={getMinDate(passenger.type)}
                                                        onClick={handleInputClick}
                                                        style={{ cursor: 'pointer' }}
                                                    />
                                                    {errors[`pax-${originalIndex}-dob`] && <span className={styles.errorMessage}><FaExclamationCircle /> {errors[`pax-${originalIndex}-dob`]}</span>}
                                                </div>
                                                <div className={styles.inputGroup}>
                                                    <label className={styles.inputLabel}>Gender</label>
                                                    <select
                                                        value={passenger.gender || 'Male'}
                                                        onChange={e => handlePassengerChange(originalIndex, 'gender', e.target.value)}
                                                        className={errors[`pax-${originalIndex}-gender`] ? styles.inputError : ''}
                                                    >
                                                        <option value="Male">Male</option>
                                                        <option value="Female">Female</option>
                                                        <option value="Other">Other</option>
                                                    </select>
                                                    {errors[`pax-${originalIndex}-gender`] && <span className={styles.errorMessage}><FaExclamationCircle /> {errors[`pax-${originalIndex}-gender`]}</span>}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>

            {/* Contact Details */}
            <div className={styles.contactSection}>
                <h3 className={styles.contactHeader}>Contact Details</h3>
                <p className={styles.contactSubtext}>Your ticket & flight details will be shared here</p>

                <div className={styles.contactFormRow}>
                    <div className={styles.contactInputGroup}>
                        <label className={styles.contactLabel}>Email Address</label>
                        <input
                            type="email"
                            value={contactDetails.email}
                            onChange={e => handleContactChange('email', e.target.value)}
                            placeholder="Enter your email address"
                            className={`${styles.contactInput} ${errors['contact-email'] ? styles.inputError : ''}`}
                        />
                        {errors['contact-email'] && <span className={styles.errorMessage}><FaExclamationCircle /> {errors['contact-email']}</span>}
                    </div>
                    <div className={styles.contactInputGroup}>
                        <label className={styles.contactLabel}>Phone Number</label>
                        <div className={styles.phoneInput}>
                            <span className={styles.phonePrefix}>+ 91</span>
                            <input
                                value={contactDetails.phone}
                                onChange={e => handleContactChange('phone', e.target.value)}
                                placeholder="Enter your phone number"
                                className={`${styles.contactInput} ${errors['contact-phone'] ? styles.inputError : ''}`}
                            />
                        </div>
                        {errors['contact-phone'] && <span className={styles.errorMessage}><FaExclamationCircle /> {errors['contact-phone']}</span>}
                    </div>
                </div>
            </div>

            <div className={styles.buttonGroup}>
                <button onClick={onBack} className={`${styles.actionButton} ${styles.backButton}`}>Back</button>
                <button onClick={onNext} className={styles.actionButton}>Continue</button>
            </div>
        </>
    );
};

const Review = ({ flightDetails, passengers, contactDetails, onNext, onBack }) => {
    return (
        <div className={`${styles.reviewCard} ${styles.animatedCard}`}>
            <h3 className={styles.reviewHeader}><FaCheck /> Review Your Booking</h3>

            <div className={styles.reviewSection}>
                <h4 className={styles.reviewSectionHeader}><FaPlane /> Flight Details</h4>
                <div className={styles.flightSummary}>
                    <div>
                        <div className={styles.flightRoute}>{flightDetails.airline}: {flightDetails.from} → {flightDetails.to}</div>
                        <div className={styles.flightDate}>Departure: {flightDetails.departureDate} at {flightDetails.departureTime}</div>
                        <div className={styles.flightDate}>from terminal :{flightDetails.departureterminal}</div>
                    </div>
                    <div className={styles.cabinClass}>{flightDetails.cabin}</div>
                </div>
            </div>

            <div className={styles.reviewSection}>
                <h4 className={styles.reviewSectionHeader}><FaUserFriends /> Passenger Details</h4>
                <ul className={styles.paxList}>
                    {passengers.map((p, i) => (
                        <li key={i} className={styles.paxItem}>
                            <div className={styles.paxInfo}>
                                <div className={styles.paxName}>
                                    <FaUser /> {p.title || 'Mr'} {p.firstName} {p.lastName}
                                </div>
                                <div className={styles.paxDetails}>
                                    <div className={styles.paxDob}>
                                        <FaBirthdayCake /> {p.dob || 'N/A'}
                                    </div>
                                    <div className={styles.paxType}>{p.type}</div>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>

            <div className={styles.reviewSection}>
                <h4 className={styles.reviewSectionHeader}><FaEnvelope /> Contact Details</h4>
                <div className={styles.contactInfo}>
                    <div className={styles.contactItem}>
                        <div>
                            <div className={styles.contactLabel}>Email Address</div>
                            <div className={styles.contactValue}>{contactDetails.email}</div>
                        </div>
                    </div>
                    <div className={styles.contactItem}>
                        <div>
                            <div className={styles.contactLabel}>Phone Number</div>
                            <div className={styles.contactValue}>+91 {contactDetails.phone}</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className={styles.buttonGroup}>
                <button onClick={onBack} className={`${styles.actionButton} ${styles.backButton}`}>Back</button>
                <button onClick={onNext} className={styles.actionButton}>Proceed to Payment</button>
            </div>
        </div>
    );
};

// ============ UPDATED PAYMENT COMPONENT ============
const Payment = ({ onConfirm, onBack, totalAmount, isSubmitting, setIsSubmitting }) => {
    const [selectedPayment, setSelectedPayment] = useState('wallet');
    const [balance, setBalance] = useState(0);
    const [isOtherPaymentDisabled] = useState(true);

    const isBalanceSufficient = balance >= (totalAmount || 0);
    const isWalletSelected = selectedPayment === 'wallet';
    const isConfirmDisabled = isWalletSelected && !isBalanceSufficient;

    const formatCurrency = (amount) => `₹${(amount || 0).toFixed(2)}`;

    useEffect(() => {
        const loadBalance = async () => {
            const currentBalance = await fetchAgentBalance();
            setBalance(currentBalance);
        };
        loadBalance();
    }, []);

    const handleConfirm = async () => {
        if (isWalletSelected && !isBalanceSufficient) {
            toast.error("Booking cannot proceed. Insufficient wallet balance. Please choose another payment method or add money to your wallet.");
            return;
        }
        if (isSubmitting) return;

        try {
            // Note: We don't need to manually set isSubmitting(true) here because
            // the button's onClick handler calls setIsSubmitting(true) before calling this onConfirm,
            // or the parent handles it.
            // But to be safe, if onConfirm is responsible:
            // await onConfirm(selectedPayment); 
            // The parent (BookingPage) handles the setIsSubmitting logic usually, 
            // but here we are passed the state.
            
            await onConfirm(selectedPayment);
            
        } catch (error) {
            console.error('Confirmation error:', error);
            setIsSubmitting(false);
            toast.error(error.message || 'Failed to process booking. Please try again.');
        }
    }

    return (
        <div className={`${styles.paymentCard} ${styles.animatedCard}`}>
            <h3 className={styles.paymentHeader}><FaWallet /> Payment Options</h3>

            <div className={styles.totalAmountDisplay}>
                Total Payable: <strong>{formatCurrency(totalAmount)}</strong>
            </div>

            <div className={styles.paymentMethods}>

                {/* Wallet Payment Option */}
                <div
                    className={`${styles.paymentOption} ${isWalletSelected ? styles.selected : ''} ${!isBalanceSufficient && styles.disabledOption}`}
                    onClick={() => setSelectedPayment('wallet')}
                >
                    <input
                        type="radio"
                        id="wallet"
                        name="payment"
                        value="wallet"
                        checked={isWalletSelected}
                        onChange={() => setSelectedPayment('wallet')}
                        className={styles.paymentRadio}
                        disabled={!isBalanceSufficient}
                    />
                    <div className={styles.paymentContent}>
                        <div className={styles.paymentTitle}>
                            <FaWallet className={styles.paymentIcon} /> Wallet Balance
                        </div>
                        <div className={styles.paymentDescription}>
                            Pay securely using your wallet balance.
                            <span className={styles.balanceAmount}>{formatCurrency(balance)}</span>
                        </div>

                        {isWalletSelected && (
                            <div className={`${styles.walletValidation} ${isBalanceSufficient ? styles.success : styles.error}`}>
                                {isBalanceSufficient ? (
                                    <>
                                        <FaCheck /> Sufficient balance available.
                                    </>
                                ) : (
                                    <>
                                        <FaExclamationCircle /> Insufficient balance. Please <a href="/add-money">Add Money</a> or use another method.
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* UPI/QR Code Option */}
                <div
                    className={`${styles.paymentOption} ${selectedPayment === 'upi' ? styles.selected : ''}`}
                    onClick={() => setSelectedPayment('upi')}
                >
                    <input
                        type="radio"
                        id="upi"
                        name="payment"
                        value="upi"
                        checked={selectedPayment === 'upi'}
                        onChange={() => setSelectedPayment('upi')}
                        className={styles.paymentRadio}
                        disabled={isOtherPaymentDisabled}
                    />
                    <div className={styles.paymentContent}>
                        <div className={styles.paymentTitle}>
                            <FaQrcode className={styles.paymentIcon} /> UPI / QR Code
                        </div>
                        <div className={styles.paymentDescription}>
                            Pay instantly using any UPI app (Google Pay, PhonePe, Paytm, etc.).
                        </div>
                    </div>
                </div>

                {/* Net Banking Option */}
                <div
                    className={`${styles.paymentOption} ${selectedPayment === 'netbanking' ? styles.selected : ''}`}
                    onClick={() => setSelectedPayment('netbanking')}
                >
                    <input
                        type="radio"
                        id="netbanking"
                        name="payment"
                        value="netbanking"
                        checked={selectedPayment === 'netbanking'}
                        onChange={() => setSelectedPayment('netbanking')}
                        className={styles.paymentRadio}
                        disabled={isOtherPaymentDisabled}
                    />
                    <div className={styles.paymentContent}>
                        <div className={styles.paymentTitle}>
                            <FaUniversity className={styles.paymentIcon} /> Net Banking
                        </div>
                        <div className={styles.paymentDescription}>
                            Pay using all major Indian banks.
                        </div>
                    </div>
                </div>

                {/* Debit/Credit Card Option */}
                <div
                    className={`${styles.paymentOption} ${selectedPayment === 'card' ? styles.selected : ''}`}
                    onClick={() => setSelectedPayment('card')}
                >
                    <input
                        type="radio"
                        id="card"
                        name="payment"
                        value="card"
                        checked={selectedPayment === 'card'}
                        onChange={() => !isOtherPaymentDisabled && setSelectedPayment('card')}
                        className={styles.paymentRadio}
                        disabled
                    />
                    <div className={styles.paymentContent}>
                        <div className={styles.paymentTitle}>
                            <FaCreditCard className={styles.paymentIcon} /> Credit/Debit Card
                        </div>
                        <div className={styles.paymentDescription}>
                            Visa, MasterCard, Amex, and Rupay.
                        </div>
                    </div>
                </div>

            </div>

            <div className={styles.buttonGroup}>
                <button
                    onClick={onBack}
                    className={`${styles.actionButton} ${styles.backButton}`}
                    disabled={isSubmitting}
                >
                    Back
                </button>
                <button
                    onClick={async (e) => {
                        e.preventDefault();

                        // 1. Validation Logic
                        if (isConfirmDisabled || !isWalletSelected) {
                            if (!isWalletSelected) {
                                toast.error("Please use wallet payment for now. Other payment methods are coming soon!", {
                                    position: "top-right",
                                    autoClose: 3000,
                                    hideProgressBar: false,
                                    closeOnClick: true,
                                    pauseOnHover: true,
                                    draggable: true
                                });
                            } else {
                                toast.error("Booking cannot proceed. Insufficient wallet balance. Please add money to your wallet.", {
                                    position: "top-right",
                                    autoClose: 3000,
                                    hideProgressBar: false,
                                    closeOnClick: true,
                                    pauseOnHover: true,
                                    draggable: true
                                });
                            }
                            return;
                        }

                        // 2. Submission Logic
                        try {
                            await handleConfirm();
                        } catch (error) {
                            console.error('Error during booking confirmation:', error);
                            toast.error("An error occurred while processing your booking. Please try again.", {
                                position: "top-right",
                                autoClose: 3000
                            });
                        }
                    }}
                    // 3. CSS Classes
                    className={`${styles.actionButton} ${(isConfirmDisabled || !isWalletSelected || isSubmitting) ? styles.disabledButton : ''}`}

                    // 4. Disable when submitting
                    disabled={isSubmitting}

                    // 5. Styles
                    style={{
                        cursor: (isConfirmDisabled || !isWalletSelected || isSubmitting) ? 'not-allowed' : 'pointer',
                        opacity: (isConfirmDisabled || !isWalletSelected || isSubmitting) ? 0.7 : 1,
                        position: 'relative'
                    }}
                >
                    {isSubmitting ? (
                        <>
                            <FaSpinner className={styles.spinner} />
                            <span style={{ marginLeft: '8px' }}>Processing...</span>
                        </>
                    ) : (
                        'Confirm & Book'
                    )}
                </button>
            </div>
        </div>
    );
};

//=========== MAIN BOOKING PAGE COMPONENT =======================================

const BookingPage = () => {
    const navigate = useNavigate();
    const { quoteId } = useParams();
    const { currentUser } = useAuth();
    const [currentStep, setCurrentStep] = useState(1);
    const [quoteData, setQuoteData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [passengers, setPassengers] = useState([]);
    const [contactDetails, setContactDetails] = useState({ phone: '', email: '' });
    const [errors, setErrors] = useState({});
    const [timeLeft, setTimeLeft] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // NEW STATE: For the redirect loader overlay
    const [isRedirecting, setIsRedirecting] = useState(false);

    useEffect(() => {
        const fetchQuoteData = async () => {
            try {
                const response = await api.get(`/quote/${quoteId}`);
                const data = response.data;

                if (data.success) {
                    setQuoteData(data);

                    if (data.timeRemaining && data.timeRemaining > 0) {
                        setTimeLeft(data.timeRemaining);
                    }

                    const { adults, children, infants } = data.priceBreakdown;
                    const initialPassengers = [
                        ...Array(adults?.count || 0).fill({ type: 'Adult', title: 'Mr', firstName: '', lastName: '', dob: '', gender: 'Male' }),
                        ...Array(children?.count || 0).fill({ type: 'Child', title: 'Master', firstName: '', lastName: '', dob: '', gender: 'Male' }),
                        ...Array(infants?.count || 0).fill({ type: 'Infant', title: 'Master', firstName: '', lastName: '', dob: '', gender: 'Male' })
                    ];
                    setPassengers(initialPassengers.map((p, i) => ({ ...p, id: i })));
                } else {
                    throw new Error(data.message || 'Failed to fetch quote data.');
                }
            } catch (e) {
                setError(e.message);
                console.error("Error fetching quote data:", e);
                toast.error(`Error loading quote: ${e.message}`);
            } finally {
                setLoading(false);
            }
        };

        if (quoteId) {
            fetchQuoteData();
        } else {
            setLoading(false);
            setError('No quote ID provided.');
            toast.error('No quote ID provided. Redirecting.');
            navigate('/');
        }
    }, [quoteId, navigate]);

    useEffect(() => {
        if (timeLeft <= 0) {
            if (timeLeft < 0) {
                toast.error("Your quote has expired. Please search again.");
                setError('Your session has expired. Please search again.');
            }
            return;
        }

        const intervalId = setInterval(() => {
            setTimeLeft(prevTime => prevTime - 1);
        }, 1000);

        return () => clearInterval(intervalId);
    }, [timeLeft]);

    const calculateAge = (dateOfBirth) => {
        if (!dateOfBirth) return 0;
        const today = new Date();
        const birthDate = new Date(dateOfBirth);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();

        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    };

    const validateDateOfBirth = (dob, passengerType) => {
        if (!dob) return 'Date of birth is required';

        const today = new Date();
        const birthDate = new Date(dob);

        if (birthDate > today) {
            return 'Date of birth cannot be in the future';
        }

        const age = calculateAge(dob);

        switch (passengerType.toLowerCase()) {
            case 'adult':
                if (age < 15) {
                    return 'Adult passengers must be at least 15 years old';
                }
                break;
            case 'child':
                if (age >= 4) {
                    return 'Child passengers must be under 4 years old';
                }
                if (age < 1) {
                    return 'Child passengers must be at least 1 year old';
                }
                break;
            case 'infant':
                if (age >= 1) {
                    return 'Infant passengers must be under 1 year old';
                }
                break;
            default:
                break;
        }

        return null;
    };

    const validateStep2 = () => {
        const newErrors = {};
        passengers.forEach((p, i) => {
            if (!p.firstName.trim()) newErrors[`pax-${i}-firstName`] = 'First name is required.';
            if (!p.lastName.trim()) newErrors[`pax-${i}-lastName`] = 'Last name is required.';

            const dobError = validateDateOfBirth(p.dob, p.type);
            if (dobError) {
                newErrors[`pax-${i}-dob`] = dobError;
            }
        });

        if (!contactDetails.phone.trim()) {
            newErrors['contact-phone'] = 'Phone number is required.';
        } else if (!/^\d{10}$/.test(contactDetails.phone.trim())) {
            newErrors['contact-phone'] = 'Please enter a valid 10-digit phone number.';
        }

        if (!contactDetails.email.trim()) {
            newErrors['contact-email'] = 'Email is required.';
        } else if (!/\S+@\S+\.\S+/.test(contactDetails.email.trim())) {
            newErrors['contact-email'] = 'Please enter a valid email address.';
        }

        setErrors(newErrors);

        if (Object.keys(newErrors).length > 0) {
            toast.error('Please fix the errors in Passenger and Contact Details.');
            return false;
        }

        return true;
    };

    const handleNext = () => {
        if (currentStep === 2) {
            if (!validateStep2()) return;
        }
        setCurrentStep(prev => prev < 4 ? prev + 1 : prev);
    };

    const handleBack = () => setCurrentStep(prev => prev > 1 ? prev - 1 : prev);

    // ============ UPDATED CONFIRM HANDLER ============
    const handleConfirmBooking = async (paymentMethod) => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        setError(null);

        try {
            const userId = currentUser?.id || localStorage.getItem('userId');

            const bookingPayload = {
                quoteId: quoteData.quoteId,
                userId: userId,
                passengers: passengers,
                contactDetails: contactDetails,
                flightDetails: quoteData.flightDetails,
                priceBreakdown: quoteData.priceBreakdown,
                paymentMethod: paymentMethod
            };

            console.log('Submitting booking:', bookingPayload);

            const response = await api.post('/bookings/confirm-booking', bookingPayload);

            if (response.data.success) {
                const booking = response.data.booking;
                const emailStatus = response.data.emailStatus;

                localStorage.setItem('latestBooking', JSON.stringify(booking));

                if (emailStatus?.processing) {
                    toast.success(`Booking Confirmed! Confirmation email is being sent to your email address.`);
                } else if (emailStatus?.sent) {
                    toast.success(`Booking Confirmed! Confirmation email sent successfully.`);
                } else {
                    toast.success(`Booking Confirmed, Redirecting you to ticket`);
                }

                // Show the redirect loader overlay
                setIsRedirecting(true);

                const bookingId = response.data.booking.bookingId;
                
                setTimeout(() => {
                    navigate('/booking-details/' + bookingId);
                }, 3000);

                return;

            } else {
                throw new Error(response.data.message || 'Booking confirmation failed');
            }

        } catch (error) {
            console.error('Booking Error:', {
                message: error.message,
                response: error.response?.data,
                stack: error.stack
            });

            let errorMessage = 'Failed to confirm booking. Please try again.';

            if (error.message === 'Network Error') {
                errorMessage = 'Unable to connect to the server. Please check your internet connection.';
            }
            else if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            }
            else if (error.message) {
                errorMessage = error.message;
            }

            setError(errorMessage);
            toast.error(`Booking Failed: ${errorMessage}`);
            setIsSubmitting(false);
        }
    };

    if (loading) return <div className={styles.centeredMessage}><FaSpinner className={styles.spinner} /> Loading booking details...</div>;
    if (error) return <div className={`${styles.centeredMessage} ${styles.errorMessage}`}>{error}</div>;
    if (!quoteData) return <div className={styles.centeredMessage}>No booking details found.</div>;
    if (timeLeft === 0) return <div className={styles.centeredMessage}>Your session has expired. Please search again.</div>;

    const renderStep = () => {
        switch (currentStep) {
            case 1: return <FlightItinerary flightDetails={quoteData.flightDetails} onNext={handleNext} />;
            case 2: return <PassengerDetails passengers={passengers} setPassengers={setPassengers} contactDetails={contactDetails} setContactDetails={setContactDetails} onNext={handleNext} onBack={handleBack} errors={errors} setErrors={setErrors} flightDetails={quoteData.flightDetails} validateDateOfBirth={validateDateOfBirth} />;
            case 3: return <Review flightDetails={quoteData.flightDetails} passengers={passengers} contactDetails={contactDetails} onNext={handleNext} onBack={handleBack} />;
            case 4: return <Payment
                onConfirm={handleConfirmBooking}
                onBack={handleBack}
                totalAmount={quoteData.priceBreakdown.totalAmount}
                isSubmitting={isSubmitting}
                setIsSubmitting={setIsSubmitting}
            />
            default: return <FlightItinerary flightDetails={quoteData.flightDetails} onNext={handleNext} />;
        }
    };

    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;

    return (
        <div className={styles.pageContainer}>
            <Toaster
                position="top-right"
                reverseOrder={false}
                toastOptions={{
                    className: styles.customToast,
                    duration: 3000,
                    error: {
                        style: {
                            border: '1px solid #e74c3c',
                        },
                    },
                    success: {
                        style: {
                            background: '#e8ffed',
                            color: '#27ae60',
                            border: '1px solid #27ae60',
                            fontWeight: 'bold',
                        },
                    },
                }}
            />
            <ProgressBar currentStep={currentStep} />
            <div className={styles.timerContainer}>
                Please don't press back. Complete process in: <strong>{minutes}:{seconds < 10 ? `0${seconds}` : seconds}</strong>
            </div>
            <div className={styles.mainContent}>
                <div className={styles.leftPanel}>{renderStep()}</div>
                <div className={styles.rightPanel}><FareSummary fare={quoteData.priceBreakdown} /></div>
            </div>

            {/* ============ REDIRECT LOADER OVERLAY ============ */}
            {isRedirecting && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundColor: '#ffffff',
                    zIndex: 9999,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    transition: 'opacity 0.3s ease-in-out'
                }}>
                    <FaPlane
                        style={{
                            fontSize: '40px',
                            color: '#2563eb',
                            marginBottom: '20px',
                            animation: 'bounce 2s infinite' // ensure you have a bounce keyframe or remove if not needed
                        }}
                    />
                    <FaSpinner
                        className={styles.spinner} // This reuses your rotation animation
                        style={{
                            fontSize: '50px',
                            color: '#2563eb',
                            marginBottom: '20px'
                        }}
                    />
                    <h2 style={{ color: '#1e293b', marginBottom: '10px' }}>Booking Confirmed!</h2>
                    <p style={{ color: '#64748b', fontSize: '16px' }}>Redirecting to your ticket details...</p>
                </div>
            )}

        </div>
    );
}

export default BookingPage;