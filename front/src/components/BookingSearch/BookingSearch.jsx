import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FaSearch, FaPlane, FaCalendarAlt, FaSpinner, FaExclamationCircle,
    FaArrowRight, FaTicketAlt, FaCheckCircle, FaTimesCircle, FaClock,
    FaHistory, FaTimes
} from 'react-icons/fa';
import api from '../../lib/api';
import styles from './BookingSearch.module.css';

const BookingSearch = () => {
    const navigate = useNavigate();

    // Search State
    const [searchType, setSearchType] = useState('bookingId'); // 'bookingId' or 'date'
    const [searchValue, setSearchValue] = useState('');
    const [isSearching, setIsSearching] = useState(false);

    // Booking Data State
    const [bookings, setBookings] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    // Tabs & Pagination State
    const [activeTab, setActiveTab] = useState('ALL');
    const [viewMode, setViewMode] = useState('recent'); // 'recent', 'all', or 'searchResult'
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);

    const [bookingCounts, setBookingCounts] = useState({
        ALL: 0, UPCOMING: 0, COMPLETED: 0, CANCELLED: 0
    });

    // --- 1. Initial Fetch for Counts on Mount ---
    useEffect(() => {
        api.get('/bookings/counts').then(res => {
            if (res.data.success) setBookingCounts(res.data.counts);
        }).catch(console.error);
    }, []);

    // --- 2. Trigger Fetch when ActiveTab or ViewMode Changes ---
    useEffect(() => {
        // If we are looking at specific search results (ID/Date), ignore tab changes
        if (viewMode === 'searchResult') return;

        // Reset page to 1 for new tab/mode
        setPage(1);
        
        // Fetch new data (passing true to reset the list)
        fetchBookings(1, viewMode, activeTab, true);
        
    }, [activeTab, viewMode]);

    // --- 3. Unified Fetch Function ---
    const fetchBookings = async (pageNum, mode, filterType, isReset = false) => {
        setIsLoading(true);
        setError('');
        try {
            const limit = mode === 'recent' ? 3 : 10;
            
            // Pass the filterType (ALL, CANCELLED, etc) to the backend
            const endpoint = `/bookings/my-bookings?page=${pageNum}&limit=${limit}&filter=${filterType}`;

            const response = await api.get(endpoint);

            if (response.data.success) {
                const newBookings = response.data.bookings.map(transformBookingData);
                
                if (isReset) {
                    // Replaces list (Tab switch or View All)
                    setBookings(newBookings);
                } else {
                    // Appends to list (Load More)
                    setBookings(prev => [...prev, ...newBookings]);
                }

                const totalPages = response.data.pagination?.totalPages || 1;
                setHasMore(pageNum < totalPages);
            } else {
                setError(response.data.message || 'Could not fetch bookings.');
            }
        } catch (err) {
            console.error('Error fetching bookings:', err);
            setError(err.response?.data?.message || 'Failed to load bookings.');
        } finally {
            setIsLoading(false);
        }
    };

    // --- Handlers ---

    const handleViewAll = () => {
        // Changing viewMode triggers the useEffect, which calls fetchBookings(1, 'all', activeTab, true)
        setViewMode('all');
    };

    const handleLoadMore = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        // Manual call for pagination (append mode)
        fetchBookings(nextPage, 'all', activeTab, false);
    };

    const handleClearSearch = () => {
        setSearchValue('');
        setViewMode('recent');
        // Setting viewMode back to 'recent' triggers useEffect to fetch default list
    };

    const handleTabClick = (tabKey) => {
        setActiveTab(tabKey);
        // If we were in search mode, exit it so the tab logic takes over
        if (viewMode === 'searchResult') {
            setViewMode('recent');
            setSearchValue('');
        }
    };

    // Data Transformer
    const transformBookingData = (b) => {
        const flight = b.flight || {};
        return {
            id: b.bookingId,
            quoteId: b.quoteId,
            status: b.status,
            bookingDate: b.bookingDate,
            travelDate: flight.depDate,
            flight: {
                airline: flight.airline,
                flightNo: flight.flightNo,
                fromCode: flight.departureAirportName,
                toCode: flight.arrivalAirportName,
                fromCity: flight.from,
                toCity: flight.to,
                depTime: flight.departureTime,
                duration: flight.duration,
                depDate: flight.depDate
            }
        };
    };

    // Search Logic
    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchValue.trim()) return;

        setIsSearching(true);
        setError('');

        try {
            if (searchType === 'bookingId') {
                const endpoint = `/bookings/booking/${searchValue.trim()}`;
                const response = await api.get(endpoint);

                if (response.data.success) {
                    const bookingId = response.data.booking?.bookingId || searchValue.trim();
                    navigate(`/booking-details/${bookingId}`);
                } else {
                    setError('Booking not found');
                }
            } else {
                const endpoint = `/bookings/search-by-date?date=${searchValue}`;
                const response = await api.get(endpoint);

                if (response.data.success) {
                    const searchResults = response.data.bookings.map(transformBookingData);
                    setBookings(searchResults);
                    setViewMode('searchResult');

                    if (searchResults.length === 0) {
                        setError('No bookings found for this date.');
                    }
                } else {
                    setError(response.data.message || 'Search failed');
                }
            }
        } catch (err) {
            if (searchType === 'bookingId' && err.response?.status === 404) {
                setError('Booking ID not found.');
            } else {
                setError(err.response?.data?.message || 'Search failed.');
            }
        } finally {
            setIsSearching(false);
        }
    };

    const handleInputClick = (e) => {
        if (searchType === 'date') {
            try {
                if (typeof e.target.showPicker === 'function') {
                    e.target.showPicker();
                }
            } catch (error) {
                console.log('Date picker error');
            }
        }
    };

    const getStatusIcon = (status) => status === 'CONFIRMED' ? <FaCheckCircle /> : status === 'CANCELLED' ? <FaTimesCircle /> : <FaClock />;
    const getStatusClass = (status) => status === 'CONFIRMED' ? styles.statusConfirmed : status === 'CANCELLED' ? styles.statusCancelled : styles.statusPending;

    const formatDateParts = (dateStr) => {
        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return { day: '--', month: '---', year: '----' };
            return {
                day: date.getDate(),
                month: date.toLocaleString('default', { month: 'short' }),
                year: date.getFullYear()
            };
        } catch { return { day: '--', month: '---', year: '----' }; }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.headerContent}>
                    <div className={styles.headerIcon}><FaPlane style={{ fontSize: '2rem' }} /></div>
                    <div><h1 className={styles.title}>My Bookings</h1><p className={styles.subtitle}>Manage and track all your flight reservations</p></div>
                </div>
            </div>

            {/* Search Card */}
            <div className={`${styles.searchCard} ${styles.fadeIn}`}>
                <div className={styles.searchHeader}>
                    <FaSearch className={styles.searchHeaderIcon} />
                    <h2 className={styles.searchTitle}>Find Your Booking</h2>
                </div>

                <form onSubmit={handleSearch} className={styles.searchForm}>
                    <div className={styles.searchTypeSelector}>
                        <label className={`${styles.radioLabel} ${searchType === 'bookingId' ? styles.radioLabelActive : ''}`}>
                            <input
                                type="radio"
                                value="bookingId"
                                checked={searchType === 'bookingId'}
                                onChange={(e) => { setSearchType(e.target.value); setSearchValue(''); setError(''); }}
                                className={styles.radioInput}
                            />
                            <FaTicketAlt style={{ fontSize: '0.9rem' }} />
                            <span>Booking ID</span>
                        </label>
                        <label className={`${styles.radioLabel} ${searchType === 'date' ? styles.radioLabelActive : ''}`}>
                            <input
                                type="radio"
                                value="date"
                                checked={searchType === 'date'}
                                onChange={(e) => { setSearchType(e.target.value); setSearchValue(''); setError(''); }}
                                className={styles.radioInput}
                            />
                            <FaCalendarAlt style={{ fontSize: '0.9rem' }} />
                            <span>Departure Date</span>
                        </label>
                    </div>

                    <div className={styles.inputGroup}>
                        <div className={styles.inputWrapper}>
                            {searchType === 'bookingId' ? <FaSearch className={styles.inputIcon} /> : <FaCalendarAlt className={styles.inputIcon} />}
                            <input
                                type={searchType === 'date' ? 'date' : 'text'}
                                value={searchValue}
                                onChange={(e) => setSearchValue(e.target.value)}
                                onClick={handleInputClick}
                                placeholder={searchType === 'bookingId' ? 'Enter your Booking ID' : 'Select Date'}
                                className={styles.searchInput}
                                style={{ cursor: searchType === 'date' ? 'pointer' : 'text' }}
                            />
                            {viewMode === 'searchResult' && (
                                <button type="button" onClick={handleClearSearch} className={styles.clearBtn} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#ef4444', marginRight: '10px' }}>
                                    <FaTimes />
                                </button>
                            )}
                        </div>
                        <button
                            type="submit"
                            className={`${styles.searchButton} ${(isSearching || !searchValue.trim()) ? styles.searchButtonDisabled : ''}`}
                            disabled={isSearching || !searchValue.trim()}
                        >
                            {isSearching ? <><FaSpinner className={styles.spinning} /><span>Searching...</span></> : <><FaSearch /><span>Search</span></>}
                        </button>
                    </div>
                </form>
            </div>

            {error && (
                <div className={`${styles.errorMessage} ${styles.fadeIn}`}>
                    <FaExclamationCircle /><span>{error}</span>
                </div>
            )}

            {/* Filter Tabs */}
            <div className={styles.tabsWrapper}>
                <div className={styles.tabsContainer}>
                    {[
                        { key: 'ALL', label: 'All Bookings', icon: <FaTicketAlt /> },
                        { key: 'UPCOMING', label: 'Upcoming', icon: <FaCalendarAlt /> },
                        { key: 'COMPLETED', label: 'Completed', icon: <FaCheckCircle /> },
                        { key: 'CANCELLED', label: 'Cancelled', icon: <FaTimesCircle /> }
                    ].map((tab) => (
                        <button
                            key={tab.key}
                            className={`${styles.tab} ${activeTab === tab.key ? styles.activeTab : ''}`}
                            onClick={() => handleTabClick(tab.key)}
                        >
                            <span className={styles.tabIcon}>{tab.icon}</span><span>{tab.label}</span>
                            <span className={styles.tabBadge}>{bookingCounts[tab.key] || 0}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Booking List */}
            <div className={styles.bookingsList}>
                {viewMode === 'searchResult' && !isLoading && bookings.length > 0 && (
                    <div style={{ marginBottom: '15px', color: '#64748b', fontSize: '0.9rem' }}>
                        Found {bookings.length} results for date: <strong>{searchValue}</strong>
                    </div>
                )}

                {isLoading && bookings.length === 0 ? (
                    <div className={styles.spinnerContainer}><FaSpinner className={`${styles.spinning} ${styles.spinner}`} /><p>Loading your bookings...</p></div>
                ) : bookings.length > 0 ? (
                    bookings.map((booking, index) => {
                        const { day, month, year } = formatDateParts(booking.travelDate);
                        return (
                            <div key={booking.id} className={`${styles.bookingCard} ${styles.slideIn}`} style={{ animationDelay: `${index * 0.1}s` }}>
                                <div className={`${styles.statusStrip} ${getStatusClass(booking.status)}`}></div>
                                <div className={styles.dateBox}>
                                    <div className={styles.dateDay}>{day}</div><div className={styles.dateMonth}>{month}</div><div className={styles.dateYear}>{year}</div>
                                </div>
                                <div className={styles.flightInfo}>
                                    <div className={styles.airlineRow}>
                                        <FaPlane className={styles.airlineIcon} />
                                        <span className={styles.airlineName}>{booking.flight.airline}</span>
                                        <span className={styles.flightNumber}>{booking.flight.flightNo}</span>
                                    </div>
                                    <div className={styles.routeRow}>
                                        <div className={styles.cityGroup}>
                                            <span className={styles.airportCode}>{booking.flight.fromCode}</span>
                                            <span className={styles.airportCity}>{booking.flight.fromCity}</span>
                                        </div>
                                        <div className={styles.routeMiddle}><div className={styles.routeLine} /><FaArrowRight className={styles.routeArrow} /></div>
                                        <div className={styles.cityGroup}>
                                            <span className={styles.airportCode}>{booking.flight.toCode}</span>
                                            <span className={styles.airportCity}>{booking.flight.toCity}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className={styles.cardRight}>
                                    <div className={styles.bookingMeta}>
                                        <span className={styles.bookingIdTag}>#{booking.id}</span>
                                        <div className={`${styles.statusBadge} ${getStatusClass(booking.status)}`}>
                                            {getStatusIcon(booking.status)}<span>{booking.status}</span>
                                        </div>
                                    </div>
                                    <button className={styles.viewBtn} onClick={() => navigate(`/booking-details/${booking.id}`)}>
                                        <span>View Details</span><FaArrowRight style={{ fontSize: '0.9rem' }} />
                                    </button>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className={`${styles.emptyState} ${styles.fadeIn}`}>
                        <FaTicketAlt className={styles.emptyIcon} />
                        <h3 className={styles.emptyTitle}>No {activeTab !== 'ALL' ? activeTab.toLowerCase() : ''} bookings found</h3>
                    </div>
                )}
            </div>

            {/* Load More Button Logic */}
            <div className={styles.loadMoreContainer}>
                {/* If we are in 'recent' mode (limit 3) and we have results, 
                   show "View Full History" to switch to 'all' mode.
                */}
                {viewMode === 'recent' && bookings.length >= 3 && (
                    <button className={styles.loadMoreButton} onClick={handleViewAll}>
                        <FaHistory /><span>View Full History</span>
                    </button>
                )}

                {/* If we are in 'all' mode and there are more pages, 
                   show "Load More" to append next page.
                */}
                {viewMode === 'all' && hasMore && !isLoading && (
                    <button className={styles.loadMoreButton} onClick={handleLoadMore}>
                        <span>Load More</span><FaArrowRight />
                    </button>
                )}
            </div>

            {isLoading && bookings.length > 0 && <div className={styles.inlineSpinner}><FaSpinner className={`${styles.spinning} ${styles.spinner}`} /></div>}
        </div>
    );
};

export default BookingSearch;