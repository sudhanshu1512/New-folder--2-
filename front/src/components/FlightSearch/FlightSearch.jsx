import React, { useState, useEffect, useRef } from 'react';
import { FaPlane, FaCalendarAlt, FaUsers, FaExchangeAlt, FaSpinner, FaMedal, FaShieldAlt, FaMoneyBillWave, FaHeadset, FaTimes, FaPlus, FaMinus } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import './FlightSearch.css';

const FlightSearch = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('One Way');
  const [isLoading, setIsLoading] = useState(false);

  // Form state
  const [departure, setDeparture] = useState('');
  const [arrival, setArrival] = useState('');
  const [departureDate, setDepartureDate] = useState(new Date().toISOString().split('T')[0]);
  const [arrivalDate, setArrivalDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchError, setSearchError] = useState('');

  // Suggestions state
  const [departureSuggestions, setDepartureSuggestions] = useState([]);
  const [arrivalSuggestions, setArrivalSuggestions] = useState([]);
  const [showDepartureSuggestions, setShowDepartureSuggestions] = useState(false);
  const [showArrivalSuggestions, setShowArrivalSuggestions] = useState(false);

  // Travelers modal state
  const [isTravelersModalOpen, setIsTravelersModalOpen] = useState(false);
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const [travelClass, setTravelClass] = useState('Economy');
  const travelersRef = useRef(null); // Ref for the modal


  // Background slider state
  const [currentSlide, setCurrentSlide] = useState(0);
  const sliderImages = [
    'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=1920&h=1080&fit=crop&crop=center',
    'https://images.unsplash.com/photo-1569154941061-e231b4725ef1?w=1920&h=1080&fit=crop&crop=center',
    'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1920&h=1080&fit=crop&crop=center',
  ];

  // Auto-slide functionality
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % sliderImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [sliderImages.length]);

  // Update arrival date if departure date changes to be after it
  useEffect(() => {
    if (departureDate > arrivalDate) {
      setArrivalDate(departureDate);
    }
  }, [departureDate, arrivalDate]);

  // Disable arrival date for one-way trips
  useEffect(() => {
    if (activeTab === 'One Way') {
      setArrivalDate(''); // Clear arrival date for one-way
    } else {
      setArrivalDate(departureDate); // Set to departure date for round-trip
    }
  }, [activeTab, departureDate]);

  // Close modals if clicked outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (travelersRef.current && !travelersRef.current.contains(event.target)) {
        setIsTravelersModalOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  const handleSearch = async (e) => {
    e.preventDefault();
    setSearchError('');

    if (!departure || !arrival) {
      setSearchError('Please select both departure and arrival locations.');
      return;
    }

    if (departure === arrival) {
      setSearchError('Departure and arrival locations cannot be the same.');
      return;
    }

    setIsLoading(true);
    try {
      // Format the date to dd-MM-yyyy for the API
      const [year, month, day] = departureDate.split('-');
      const formattedDate = `${day}-${month}-${year}`;

      const response = await api.get('/flightssearch', {
        params: {
          fromCode: departure,
          toCode: arrival,
          departureDate: formattedDate,
          travellers: adults + children + infants,
          flightClass: travelClass
        }
      });

      navigate(`/flights/${departure}/${arrival}`, {
        state: {
          flights: response.data,
          searchParams: {
            departureDate: formattedDate,
            travellers: adults + children + infants,
            flightClass: travelClass
          }
        }
      });
    } catch (error) {
      console.error('Error searching flights:', error);
      setSearchError(error.response?.data?.message || 'Failed to search for flights. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwap = () => {
    const temp = departure;
    setDeparture(arrival);
    setArrival(temp);
  };

  // --- Suggestion Handlers ---
  const handleInputChange = (value, type) => {
    const setter = type === 'departure' ? setDeparture : setArrival;
    const suggestionsSetter = type === 'departure' ? setDepartureSuggestions : setArrivalSuggestions;
    const showSetter = type === 'departure' ? setShowDepartureSuggestions : setShowArrivalSuggestions;

    setter(value);

    if (value.length > 1) {
      fetchSuggestions(value, type)
        .then(data => {
          suggestionsSetter(data);
          showSetter(true);
        })
        .catch(error => {
          console.error(`Error fetching ${type} suggestions:`, error);
        });
    } else {
      showSetter(false);
    }
  };

  const fetchSuggestions = async (value, type) => {
    const response = await api.get(`/airports/search?q=${value}`);
    return response.data;
  };

  const handleSuggestionClick = (airportCode, type) => {
    if (type === 'departure') {
      setDeparture(airportCode);
      setShowDepartureSuggestions(false);
    } else {
      setArrival(airportCode);
      setShowArrivalSuggestions(false);
    }
  };

  const totalTravelers = adults + children + infants;
  const travelersDisplay = `${totalTravelers} Traveler${totalTravelers > 1 ? 's' : ''} | ${travelClass}`;

  return (
    <div className="flight-search-container">
      <div className="background-slider">
        {sliderImages.map((image, index) => (
          <div
            key={index}
            className={`background-slide ${index === currentSlide ? 'active' : ''}`}
            style={{ backgroundImage: `url(${image})` }}
          />
        ))}
        <div className="background-overlay" />
      </div>

      <div className="header">
        <div className="header-content">
          <h1>Book Domestic and International Flights</h1>
        </div>
      </div>

      <div className="search-section">
        <div className="search-card">
          <div className="trip-tabs">
            <div className="trip-type">
              {['One Way', 'Round Trip'].map(tab => (
                <button
                  key={tab}
                  className={`trip-option ${activeTab === tab ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>
            <Link to="/series-flight" className="series-flights">Series Flights</Link>
          </div>

          <div className="search-form">
            <div className="input-fields-wrapper">
              {/* Departure Input */}
              <div className="input-field suggestion-wrapper">
                <label><FaPlane /> Departure</label>
                <input
                  type="text"
                  value={departure}
                  onChange={(e) => handleInputChange(e.target.value, 'departure')}
                  onFocus={() => {
                    if (departure.length > 1) {
                      setShowDepartureSuggestions(true);
                    }
                  }}
                  placeholder="Enter City or Airport"
                />
                {showDepartureSuggestions && departureSuggestions.length > 0 && (
                  <ul className="suggestions-list">
                    {departureSuggestions.map(airport => (
                      <li key={airport.code} onClick={() => handleSuggestionClick(airport.code, 'departure')}>
                        <strong>{airport.code}</strong> - {airport.city}
                        <span>{airport.name}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <button className="swap-button" onClick={handleSwap}>
                <FaExchangeAlt />
              </button>

              {/* Arrival Input */}
              <div className="input-field suggestion-wrapper">
                <label><FaPlane style={{ transform: 'rotate(90deg)' }} /> Arrival</label>
                <input
                  type="text"
                  value={arrival}
                  onChange={(e) => handleInputChange(e.target.value, 'arrival')}
                  onFocus={() => {
                    if (arrival.length > 1) {
                      setShowArrivalSuggestions(true);
                    }
                  }}
                  placeholder="Enter City or Airport"
                />
                {showArrivalSuggestions && arrivalSuggestions.length > 0 && (
                  <ul className="suggestions-list">
                    {arrivalSuggestions.map(airport => (
                      <li key={airport.code} onClick={() => handleSuggestionClick(airport.code, 'arrival')}>
                        <strong>{airport.code}</strong> - {airport.city}
                        <span>{airport.name}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Dates */}
              <div className="input-field">
                <label><FaCalendarAlt /> Departure Date</label>

                {/* --- UPDATED DEPARTURE DATE INPUT --- */}
                <input
                  type="date"
                  value={departureDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setDepartureDate(e.target.value)}
                  onClick={handleInputClick} // Added click handler
                  style={{ cursor: 'pointer' }} // Added cursor style
                />

              </div>

              <div className="input-field">
                <label><FaCalendarAlt /> Arrival Date</label>

                {/* --- UPDATED ARRIVAL DATE INPUT --- */}
                <input
                  type="date"
                  value={arrivalDate}
                  onChange={(e) => setArrivalDate(e.target.value)}
                  min={departureDate}
                  disabled={activeTab === 'One Way'}
                  onClick={handleInputClick} // Added click handler
                  style={{
                    background: activeTab === 'One Way' ? '#e9ecef' : 'white',
                    display: activeTab === 'One Way' ? 'none' : 'block',
                    cursor: activeTab === 'One Way' ? 'default' : 'pointer' // Conditional cursor
                  }}
                />

              </div>

              {/* Travelers & Class */}
              <div className="input-field travelers-input" ref={travelersRef}>
                <label><FaUsers /> Travelers & Class</label>
                <p onClick={() => setIsTravelersModalOpen(!isTravelersModalOpen)} style={{ cursor: 'pointer' }}>
                  {travelersDisplay}
                </p>
                {isTravelersModalOpen && (
                  <div className="travelers-modal">
                    {/* Counter for Adults */}
                    <div className="traveler-row">
                      <div>
                        <p>Adults</p>
                        <span>(12+ years)</span>
                      </div>
                      <div className="counter">
                        <button onClick={() => setAdults(Math.max(1, adults - 1))}><FaMinus /></button>
                        <span>{adults}</span>
                        <button onClick={() => setAdults(adults + 1)}><FaPlus /></button>
                      </div>
                    </div>
                    {/* Counter for Children */}
                    <div className="traveler-row">
                      <div>
                        <p>Children</p>
                        <span>(2-12 years)</span>
                      </div>
                      <div className="counter">
                        <button onClick={() => setChildren(Math.max(0, children - 1))}><FaMinus /></button>
                        <span>{children}</span>
                        <button onClick={() => setChildren(children + 1)}><FaPlus /></button>
                      </div>
                    </div>
                    {/* Counter for Infants */}
                    <div className="traveler-row">
                      <div>
                        <p>Infants</p>
                        <span>(0-2 years)</span>
                      </div>
                      <div className="counter">
                        <button onClick={() => setInfants(Math.max(0, infants - 1))}><FaMinus /></button>
                        <span>{infants}</span>
                        <button onClick={() => setInfants(infants + 1)}><FaPlus /></button>
                      </div>
                    </div>
                    <hr />
                    {/* Class Selection */}
                    <div className="class-selection">
                      {['Economy', 'Business', 'First'].map(c => (
                        <label key={c}>
                          <input type="radio" name="travelClass" value={c} checked={travelClass === c} onChange={() => setTravelClass(c)} />
                          {c} Class
                        </label>
                      ))}
                    </div>
                    <button className="apply-btn" onClick={() => setIsTravelersModalOpen(false)}>Apply</button>
                  </div>
                )}
              </div>
            </div>

            {searchError && <p className="search-error">{searchError}</p>}

            <button
              className="search-button"
              onClick={handleSearch}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <FaSpinner className="spinner" />
                  Searching...
                </>
              ) : (
                <>
                  <FaPlane className="mr-2" />
                  Search Flights
                </>
              )}
            </button>
          </div>

        </div>
      </div>


      {/* Why Choose Us Section */}
      <div className="features-section">
        <h2>Why Should you choose us</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon best-price">
              <FaMedal />
            </div>
            <h3>Best Price Guaranteed</h3>
            <p>We offer the best prices on flights with no hidden fees</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon safe-journey">
              <FaShieldAlt />
            </div>
            <h3>Safe Journey</h3>
            <p>Your safety is our priority with trusted airline partners</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon money-back">
              <FaMoneyBillWave />
            </div>
            <h3>Money Back Guarantee</h3>
            <p>100% money back guarantee if you're not satisfied</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon support">
              <FaHeadset />
            </div>
            <h3>24x7 Support</h3>
            <p>Round the clock customer support for all your needs</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlightSearch;