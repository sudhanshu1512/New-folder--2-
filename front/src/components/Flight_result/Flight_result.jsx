import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import api from '../../lib/api';
import './Flight_result.css';

// Inlined SVG icons... (kept as is)
const FaArrowLeft = (props) => <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 448 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg" {...props}><path d="M9.4 233.4c-12.5 12.5-12.5 32.8 0 45.3l160 160c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L109.2 288 416 288c17.7 0 32-14.3 32-32s-14.3-32-32-32l-306.7 0L214.6 118.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-160 160z"></path></svg>;
const FaMagnifyingGlass = (props) => <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg" {...props}><path d="M416 208c0 45.9-14.9 88.3-40 122.7L502.6 457.4c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L330.7 376c-34.4 25.2-76.8 40-122.7 40C93.1 416 0 322.9 0 208S93.1 0 208 0S416 93.1 416 208zM208 352a144 144 0 1 0 0-288 144 144 0 1 0 0 288z"></path></svg>;
const FaPlane = (props) => <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 576 512" {...props}><path d="M482.3 192c34.2 0 93.7 29 93.7 64c0 36-59.5 64-93.7 64l-116.6 0L265.4 448H176l72.6-128H128.3c-34.2 0-93.7-29-93.7-64c0-36 59.5-64 93.7-64l119.7 0L241.4 64H336l-72.6 128l118.9 0z"></path></svg>;

const FlightResults = () => {
    // We now get fromCode and toCode directly from the URL params
    const { fromCode, toCode } = useParams();

    const navigate = useNavigate();
    const location = useLocation();
    const [flights, setFlights] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // --- NEW: State for Booking Modal ---
    const [selectedFlight, setSelectedFlight] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [bookingId, setBookingId] = useState(null);
    const [passengers, setPassengers] = useState({ adults: 1, children: 0, infants: 0 });
    const [totalAmount, setTotalAmount] = useState(0);
    const [selectedDate, setSelectedDate] = useState(() => {
        const initialDate = location.state?.searchParams?.departureDate;
        if (initialDate && initialDate.includes('-')) {
            const [day, month, year] = initialDate.split('-');
            return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
        return '';
    });

    // --- NEW: Helper to open date picker on click ---
    const handleInputClick = (e) => {
        try {
            if (typeof e.target.showPicker === 'function') {
                e.target.showPicker();
            }
        } catch (error) {
            console.log('Date picker could not be opened programmatically');
        }
    };

    // --- API Fetching Logic ---
    // (fetchFlights function kept as is...)
    const fetchFlights = async (date = selectedDate) => {
        if (!fromCode || !toCode) return;

        setLoading(true);
        setError(null);
        try {
            const response = await api.get(`/flights`, {
                params: {
                    fromCode,
                    toCode,
                    date: date || new Date().toISOString().split('T')[0]
                }
            });

            const data = response.data;

            if (!data || data.length === 0) {
                throw new Error(`No flights found from ${fromCode} to ${toCode}`);
            }

            const flightsWithDates = data.map(flight => {
                const flightDate = new Date(date || new Date());
                flightDate.setDate(flightDate.getDate() + (flight.dateOffset || 0));
                return {
                    ...flight,
                    displayDate: flightDate.toLocaleDateString('en-US', {
                        weekday: 'short',
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                    })
                };
            });

            setFlights(flightsWithDates);
        } catch (error) {
            console.error("API call failed. Details:", error);
            if (error.response) {
                console.error('Error data:', error.response.data);
                console.error('Error status:', error.response.status);
                setError(`Error: ${error.response.status} - ${error.response.data?.message || 'Server error'}`);
            } else if (error.request) {
                console.error('No response received:', error.request);
                setError('The server is not responding. Please check if the backend is running.');
            } else {
                console.error('Error setting up request:', error.message);
                setError('An unexpected error occurred.');
            }
        } finally {
            setLoading(false);
        }
    };

    const [searchParams, setSearchParams] = useState(() => {
        const state = location.state || {};
        return {
            departureDate: state.searchParams?.departureDate || null,
            travellers: state.searchParams?.travellers || 1,
            flightClass: state.searchParams?.flightClass
        };
    });


    useEffect(() => {
        const fetchFlights = async () => {
            try {
                const response = await api.get('/flightssearch', {
                    params: {
                        fromCode,
                        toCode,
                        departureDate: searchParams?.departureDate || null,
                        travellers: searchParams?.travellers || 1,
                        flightClass: searchParams?.flightClass
                    }
                });
                setFlights(response.data);
            } catch (error) {
                console.error('Error fetching flights:', error);
                setError('Failed to load flight results');
            } finally {
                setLoading(false);
            }
        };

        fetchFlights();
    }, [fromCode, toCode, searchParams]);

    const handleGoBack = () => {
        navigate(-1);
    };

    // --- Handlers for Booking Modal ---
    const calculateTotalAmount = (passengerCounts, basePrice, infantBasicFare) => {
        const adults = parseInt(passengerCounts.adults) || 0;
        const children = parseInt(passengerCounts.children) || 0;
        const infants = parseInt(passengerCounts.infants) || 0;

        return (adults * basePrice) +
            (children * basePrice * 0.75) +
            (infants * infantBasicFare);
    };

    const handleBookNowClick = (flight) => {
        const flightCode = flight.flightNo;
        const basePrice = flight.price;
        const infantBasicFare = flight.infantBasicFare;
        const initialAmount = calculateTotalAmount({ adults: 1, children: 0, infants: 0 }, basePrice, infantBasicFare);
        setBookingId(flightCode);
        setSelectedFlight(flight);
        setPassengers({ adults: 1, children: 0, infants: 0 });
        setTotalAmount(initialAmount);
        setShowModal(true);
    };

    const handlePassengerChange = (e) => {
        const { name, value } = e.target;
        const newPassengers = {
            ...passengers,
            [name]: Math.max(0, parseInt(value) || 0)
        };

        setPassengers(newPassengers);

        if (selectedFlight) {
            const newTotal = calculateTotalAmount(newPassengers, selectedFlight.price, selectedFlight.infantBasicFare);
            setTotalAmount(newTotal);
        }
    };

    const handleDateSearch = async () => {
        if (!fromCode || !toCode || !selectedDate) return;

        setLoading(true);
        setError(null);
        try {
            const [year, month, day] = selectedDate.split('-');
            const formattedDate = `${day}-${month}-${year}`;

            const response = await api.get('/flightssearch', {
                params: {
                    fromCode,
                    toCode,
                    ...searchParams,
                    departureDate: formattedDate
                }
            });
            setFlights(response.data);
        } catch (error) {
            console.error('Error fetching flights by date:', error);
            setError('Failed to filter flights by date');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const fetchFlights = async () => {
            if (!fromCode || !toCode) return;

            setLoading(true);
            setError(null);
            try {
                const response = await api.get('/flightssearch', {
                    params: {
                        fromCode,
                        toCode,
                        ...searchParams,
                        ...(searchParams.departureDate ? {
                            departureDate: searchParams.departureDate
                        } : {})
                    }
                });
                setFlights(response.data);
            } catch (error) {
                console.error('Error fetching flights:', error);
                setError('Failed to load flight results');
            } finally {
                setLoading(false);
            }
        };

        fetchFlights();
    }, [fromCode, toCode, searchParams]);


    const handleConfirmBooking = async () => {
        if (passengers.adults < 1) {
            alert("At least one adult passenger is required.");
            return;
        }

        try {
            const response = await api.post('/quote', {
                flightId: selectedFlight.id,
                departureDate: selectedDate,
                passengers: {
                    adults: parseInt(passengers.adults) || 0,
                    children: parseInt(passengers.children) || 0,
                    infants: parseInt(passengers.infants) || 0
                }
            });

            if (!response.data.success) {
                throw new Error(response.data.message || 'Failed to create booking quote');
            }

            const quote = response.data;
            navigate(`/quote/${quote.quoteId}`);
            setShowModal(false);

        } catch (error) {
            console.error("Booking error:", error);
            let errorMessage = "An error occurred while processing your request.";

            if (error.response) {
                errorMessage = error.response.data?.message ||
                    error.response.data?.error ||
                    `Server responded with status ${error.response.status}`;
            } else if (error.request) {
                errorMessage = "No response from server. Please check your connection and try again.";
            } else {
                errorMessage = error.message || "Error setting up the request.";
            }
            alert(`Booking failed: ${errorMessage}`);
        }
    };

    if (loading) {
        return (
            <div className="loaderContainer">
                <div className="loader"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="resultsPage">
                <header className="resultsHeader">
                    <button className="backButton" onClick={handleGoBack} aria-label="Go back">
                        <FaArrowLeft />
                    </button>
                    <h2>Flight Search Results</h2>
                    <div className="placeholder"></div>
                </header>
                <main className="resultsContainer">
                    <div className="noFlights">
                        <FaMagnifyingGlass style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.7 }} />
                        <h3>No Flights Found</h3>
                        <p>{error.message || error}</p>
                        <button
                            onClick={handleGoBack}
                            className="searchAgainButton"
                            style={{ marginTop: '20px', padding: '10px 20px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                        >
                            Search Again
                        </button>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="resultsPage">

            <div className='timing'></div>

            {/* --- Results Header --- */}
            <header className="resultsHeader">
                <button className="backButton" onClick={handleGoBack} aria-label="Go back">
                    <FaArrowLeft />
                </button>
                <h2>Flights from {fromCode} to {toCode}</h2>
                <div className="placeholder"></div>
            </header>

            {/* --- Results Container --- */}
            <main className="resultsContainer">
                <div className="filterBar">
                    {/* --- UPDATED DATE INPUT HERE --- */}
                    <input
                        type="date"
                        className="dateInput"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        onClick={handleInputClick} // Added click handler
                        style={{ cursor: 'pointer' }} // Added cursor style
                    />
                    <button
                        className="filterButton"
                        onClick={handleDateSearch}
                    >
                        <FaMagnifyingGlass /> Search
                    </button>
                </div>

                {flights.length > 0 ? (
                    flights.map(flight => (
                        <div key={flight.id} className="flightCard">
                            <div className="airlineInfo">
                                <img src={flight.logoUrl} alt={`${flight.airline} logo`} />
                                <span>{flight.flightNo}</span>
                            </div>

                            <div className="flightDetails">
                                <div className="timeLocation">
                                    <strong>{flight.depTime}</strong>
                                    <span style={{ fontSize: '1rem', minWidth: '100px' }}>{flight.departuredate}</span>
                                    <span style={{ fontSize: '1rem' }}>{fromCode}</span>
                                </div>

                                <div className='line-2way'></div>

                                <div className="flightDuration">
                                    {flight.duration}
                                </div>

                                <div className='line-2way'></div>

                                <div className="timeLocation">
                                    <strong>{flight.arrTime}</strong>
                                    <span style={{ fontSize: '1rem', minWidth: '100px' }}>{flight.arrivaldate}</span>
                                    <span style={{ fontSize: '1rem' }}>{toCode}</span>
                                </div>
                            </div>

                            <div className="flightPrice">
                                <strong>₹{flight.price.toLocaleString()}<p style={{ fontSize: '14px', color: 'gray', margin: '5px 5px' }}> per adult</p></strong>

                                <span>{flight.seats} Seats Left</span>
                            </div>

                            <button className="bookButton" onClick={() => handleBookNowClick(flight)}>Book Now</button>
                        </div>
                    ))
                ) : (
                    <p className="noFlights">No scheduled flights found for this sector.</p>
                )}
            </main>

            {/* --- Booking Modal --- */}
            {showModal && (
                <div className="bookingModal-overlay" onClick={() => setShowModal(false)}>
                    <div className="bookingModal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="bookingModal-header">
                            <span className="bookingModal-routeCode">{fromCode}</span>
                            <div className="bookingModal-routeIcon">
                                <FaPlane />
                                <span className="bookingModal-routeDate">{selectedFlight.departuredate}</span>
                            </div>
                            <span className="bookingModal-routeCode">{toCode}</span>
                        </div>
                        <div className="bookingModal-passengerGrid">
                            <div className="bookingModal-formGroup"><label>Adult[12+]</label><input type="number" name="adults" value={passengers.adults} onChange={handlePassengerChange} /></div>
                            <div className="bookingModal-formGroup"><label>Child[2-11]</label><input type="number" name="children" value={passengers.children} onChange={handlePassengerChange} /></div>
                            <div className="bookingModal-formGroup"><label>Infant[0-2]</label><input type="number" name="infants" value={passengers.infants} onChange={handlePassengerChange} /></div>
                        </div>
                        <div className="bookingModal-footer">
                            <span className="bookingModal-id">{bookingId} {totalAmount}</span>
                            <button className="bookingModal-confirmButton" onClick={handleConfirmBooking}>CONFIRM</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FlightResults;