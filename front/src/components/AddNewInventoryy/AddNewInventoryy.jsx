import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from 'react-hot-toast';
import api from "../../lib/api";
import Select from 'react-select';
import AsyncSelect from 'react-select/async';
import {
  FaArrowLeft, FaPlus, FaPlaneDeparture, FaPlaneArrival, FaCalendarAlt,
  FaClock, FaHashtag, FaBuilding, FaSpinner, FaArrowRight, FaMoneyBillWave,
  FaSuitcase, FaUserTie, FaRegClock
} from "react-icons/fa";
import Layout from "../Layout/Layout";
import Styles from "./AddNewInventoryy.module.css";
import { createInventory } from "../../services/inventoryService"

// FormInput accepts ...rest, so onClick passed to it will work on the input element
const FormInput = ({ icon, type, name, placeholder, value = '', onChange, error, ...rest }) => (
  <div className={Styles.inputGroup}>
    {icon && <span className={Styles.inputIcon}>{icon}</span>}
    <input
      type={type}
      name={name}
      placeholder={placeholder}
      value={value || ''}
      onChange={onChange}
      className={`${Styles.formInput} ${error ? Styles.inputError : ''}`}
      {...rest}
    />
    <label htmlFor={name}>{placeholder}</label>
    {error && <span className={Styles.errorMessage}>{error}</span>}
  </div>
);

const AddNewInventory = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // Initialize formData with all keys used in the form
  const [fromSuggestions, setFromSuggestions] = useState([]);
  const [toSuggestions, setToSuggestions] = useState([]);
  const [airlineSuggestions, setAirlineSuggestions] = useState([]);
  const [showFromSuggestions, setShowFromSuggestions] = useState(false);
  const [showToSuggestions, setShowToSuggestions] = useState(false);
  const [showAirlineSuggestions, setShowAirlineSuggestions] = useState(false);
  const [isLoadingAirlines, setIsLoadingAirlines] = useState(false);
  const [selectedFromAirport, setSelectedFromAirport] = useState(null);
  const [selectedToAirport, setSelectedToAirport] = useState(null);
  const [selectedAirline, setSelectedAirline] = useState(null);
  const formRef = useRef(null);

  // Definitive styles for react-select component to match other inputs
  const customSelectStyles = {
    control: (provided) => ({
      ...provided,
      height: '40px',
      minHeight: '40px',
      border: '1px solid #e2e8f0',
      borderRadius: '6px',
      boxShadow: 'none',
      '&:hover': {
        borderColor: '#ced4da',
      },
    }),
    valueContainer: (provided) => ({
      ...provided,
      height: '40px',
      padding: '0 0.8rem',
      margin: '0',
    }),
    input: (provided) => ({
      ...provided,
      margin: '0',
      padding: '0',
    }),
    indicatorsContainer: (provided) => ({
      ...provided,
      height: '40px',
    }),
  };

  // Custom async airport options loader
  const loadAirportOptions = async (inputValue) => {
    if (inputValue.length < 2) {
      return [];
    }

    try {
      const response = await api.get(`/airports/search?q=${inputValue}`);
      return response.data.map(airport => ({
        value: airport.AirportCode || airport.airportCode || airport.code || '',
        label: `${airport.AirportCode || airport.airportCode || airport.code || ''} - ${airport.CityName || airport.cityName || airport.city || ''} (${airport.AirportName || airport.airportName || airport.name || ''})`
      }));
    } catch (error) {
      console.error('Error loading airports:', error);
      return [];
    }
  };

  // Custom async airline options loader
  const loadAirlineOptions = async (inputValue) => {
    if (inputValue.length < 2) {
      return [];
    }

    try {
      const response = await api.get(`/airlines/suggest?q=${inputValue}`);
      return response.data.map(airline => ({
        value: airline.name,
        label: `${airline.name} (${airline.code})`
      }));
    } catch (error) {
      console.error('Error loading airlines:', error);
      return [];
    }
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (formRef.current && !formRef.current.contains(event.target)) {
        setShowFromSuggestions(false);
        setShowAirlineSuggestions(false);
        setShowToSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const [airportData, setAirportData] = useState({
    from: null,
    to: null
  });

  const [formData, setFormData] = useState({
    // Initialize all fields with empty strings to prevent undefined values
    tripType: 'oneway',
    departDate: '',
    arriveDate: '',
    airline: '',
    flightNo: '',
    from: '',
    to: '',
    departTime: '',
    arriveTime: '',
    classType: '',
    hideeventryhour: '',
    bagsInfo: '',
    fareRule: '',
    fareCode: '',
    fareRate: '',
    // Step 4 fields
    pnr: '',
    seat: '',
    infantFare: '0',
    basicFare: '0',
    yq: '0',
    yr: '0',
    ot: '0',
    grossTotal: '0',
    markup1: '0',
    markup2: '0',
    grandTotal: '0'
  });


  const fetchSuggestions = async (query, type) => {
    if (query.length < 2) {
      return [];
    }
    try {
      const response = await api.get(`/airports/search?q=${query}`);
      // Handle both array and object responses
      return Array.isArray(response.data)
        ? response.data
        : (response.data?.data || []);
    } catch (error) {
      return [];
    }
  };

  // Fetch airline suggestions
  const fetchAirlineSuggestions = async (query) => {
    if (query.length < 2) {
      setAirlineSuggestions([]);
      return;
    }

    setIsLoadingAirlines(true);
    try {
      const response = await api.get(`/airlines/suggest?q=${encodeURIComponent(query)}`);
      setAirlineSuggestions(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching airline suggestions:', error);
      setAirlineSuggestions([]);
    } finally {
      setIsLoadingAirlines(false);
    }
  };

  // Calculate totals whenever fare components change
  useEffect(() => {
    const basic = parseFloat(formData.basicFare) || 0;
    const yq = parseFloat(formData.yq) || 0;
    const yr = parseFloat(formData.yr) || 0;
    const ot = parseFloat(formData.ot) || 0;
    const markup1 = parseFloat(formData.markup1) || 0;
    const markup2 = parseFloat(formData.markup2) || 0;

    const gross = basic + yq + yr + ot;
    const grand = gross + markup1 + markup2;

    setFormData(prev => ({
      ...prev,
      grossTotal: gross.toString(),
      grandTotal: grand.toString()
    }));
  }, [formData.basicFare, formData.yq, formData.yr, formData.ot, formData.markup1, formData.markup2]);

  const handleInputChange = async (e, type) => {
    const { name, value = '' } = e.target;
    setFormData(prev => ({ ...prev, [name]: value || '' }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }

    if (type === 'airline') {
      // Debounce the airline search
      const timer = setTimeout(() => {
        fetchAirlineSuggestions(value);
        setShowAirlineSuggestions(value.length > 1);
      }, 300);
      return () => clearTimeout(timer);
    }

    if (value.length > 1) {
      const suggestions = await fetchSuggestions(value, type);
      if (type === 'from') {
        setFromSuggestions(suggestions);
        setShowFromSuggestions(true);
      } else {
        setToSuggestions(suggestions);
        setShowToSuggestions(true);
      }
    } else {
      if (type === 'from') {
        setShowFromSuggestions(false);
      } else {
        setShowToSuggestions(false);
      }
    }
  };

  const handleSuggestionClick = (type, airport) => {
    setFormData(prev => ({ ...prev, [type]: airport.AirportCode || airport.airportCode || airport.code || '' }));
    setAirportData(prev => ({
      ...prev,
      [type]: {
        code: airport.AirportCode || airport.airportCode || airport.code || '',
        city: airport.CityName || airport.cityName || airport.city || '',
        name: airport.AirportName || airport.airportName || airport.name || '',
        country: airport.CountryName || airport.country || '',
        // Add any other airport properties you need
        ...airport
      }
    }));

    if (type === 'from') {
      setShowFromSuggestions(false);
    } else {
      setShowToSuggestions(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Skip if it's from or to input as they're handled by handleInputChange
    if (name === 'from' || name === 'to') return;

    setFormData((prev) => {
      const newFormData = {
        ...prev,
        [name === 'class-type' ? 'classType' : name]: value
      };

      // Calculate totals
      if (['basicFare', 'yq', 'yr', 'ot', 'markup1', 'markup2'].includes(name)) {
        const basicFare = parseFloat(newFormData.basicFare) || 0;
        const yq = parseFloat(newFormData.yq) || 0;
        const yr = parseFloat(newFormData.yr) || 0;
        const ot = parseFloat(newFormData.ot) || 0;
        const markup1 = parseFloat(newFormData.markup1) || 0;
        const markup2 = parseFloat(newFormData.markup2) || 0;

        const grossTotal = basicFare + yq + yr + ot;
        newFormData.grossTotal = grossTotal.toString();
        newFormData.grandTotal = (grossTotal + markup1 + markup2).toString();
      }

      return newFormData;
    });

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // --- NEW: Helper to open date/time picker on click ---
  const handlePickerOpen = (e) => {
    try {
      if (typeof e.target.showPicker === 'function') {
        e.target.showPicker();
      }
    } catch (error) {
      console.log('Picker could not be opened programmatically', error);
    }
  };

  const validateStep = () => {
    const newErrors = {};
    const errorMessages = []; // Array to collect error messages

    if (step === 1) {
      if (!formData.from) {
        newErrors.from = "Departure city is required.";
        errorMessages.push("Departure city is required.");
      }
      if (!formData.to) {
        newErrors.to = "Arrival city is required.";
        errorMessages.push("Arrival city is required.");
      }
      // Check for same departure and arrival
      if (formData.from && formData.to && formData.from === formData.to) {
        newErrors.to = "Arrival city cannot be the same as departure city.";
        errorMessages.push("Arrival city cannot be the same as departure city.");
      }
    }

    if (step === 2) {
      if (!formData.airline) {
        newErrors.airline = "Airline is required.";
        errorMessages.push("Airline is required.");
      }
      if (!formData.flightNo) {
        newErrors.flightNo = "Flight number is required.";
        errorMessages.push("Flight number is required.");
      }
      if (!formData.departTime) {
        newErrors.departTime = "Departure time is required.";
        errorMessages.push("Departure time is required.");
      }
      if (!formData.arriveTime) {
        newErrors.arriveTime = "Arrival time is required.";
        errorMessages.push("Arrival time is required.");
      }
      if (!formData.departTerminal) {
        newErrors.departTerminal = "Departure terminal is required.";
        errorMessages.push("Departure terminal is required.");
      }
      if (!formData.arriveTerminal) {
        newErrors.arriveTerminal = "Arrival terminal is required.";
        errorMessages.push("Arrival terminal is required.");
      }
      if (!formData.departDate) {
        newErrors.departDate = "Departure date is required.";
        errorMessages.push("Departure date is required.");
      }
      if (!formData.arriveDate) {
        newErrors.arriveDate = "Arrival date is required.";
        errorMessages.push("Arrival date is required.");
      }

      // Validation: If departure and arrival times are same, dates must be different
      if (formData.departTime && formData.arriveTime &&
        formData.departTime === formData.arriveTime &&
        formData.departDate && formData.arriveDate &&
        formData.departDate === formData.arriveDate) {
        newErrors.arriveDate = "Arrival date must be different from departure date when times are the same.";
        errorMessages.push("Arrival date must be different from departure date when times are the same.");
      }

      // Validation: If departure and arrival dates are same, times must be different
      if (formData.departDate && formData.arriveDate &&
        formData.departDate === formData.arriveDate &&
        formData.departTime && formData.arriveTime &&
        formData.departTime === formData.arriveTime) {
        newErrors.arriveTime = "Arrival time must be different from departure time when dates are the same.";
        errorMessages.push("Arrival time must be different from departure time when dates are the same.");
      }
    }

    if (step === 3) {
      if (!formData.bagsInfo) {
        newErrors.bagsInfo = "Bags info is required.";
        errorMessages.push("Bags info is required.");
      }
      if (!formData.fareRule) {
        newErrors.fareRule = "Fare rule is required.";
        errorMessages.push("Fare rule is required.");
      }
      if (!formData.pnr) {
        newErrors.pnr = "PNR is required.";
        errorMessages.push("PNR is required.");
      }
    }

    if (step === 4) {
      if (!formData.seat) {
        newErrors.seat = "Seat is required.";
        errorMessages.push("Seat is required.");
      }
      if (!formData.basicFare) {
        newErrors.basicFare = "Basic fare is required.";
        errorMessages.push("Basic fare is required.");
      }
    }

    // Show all validation errors in a single toast
    if (errorMessages.length > 0) {
      toast.error(
        <div>
          <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>Please fix the following errors:</div>
          <ul style={{ margin: 0, paddingLeft: '20px' }}>
            {errorMessages.map((msg, index) => (
              <li key={index}>{msg}</li>
            ))}
          </ul>
        </div>,
        {
          duration: 3000,
          position: 'top-right',
        }
      );
    }

    return newErrors;
  };

  const handleNext = () => {
    const stepErrors = validateStep();

    // Add validation for same from/to airports
    if (step === 1 && formData.from && formData.to && formData.from === formData.to) {
      setErrors({
        ...stepErrors,
        to: 'Departure and arrival airports cannot be the same'
      });
      return;
    }

    if (Object.keys(stepErrors).length === 0) {
      setErrors({});
      setStep((prev) => prev + 1);
    } else {
      setErrors(stepErrors);
    }
  };

  const handlePrev = () => setStep((prev) => prev - 1);

  // Update the handleSubmit function
  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateStep();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      // Scroll to the first error
      const firstErrorField = Object.keys(validationErrors)[0];
      const element = document.getElementsByName(firstErrorField)[0];
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    if (step < 4) {
      setStep(step + 1);
      return;
    }

    // If it's the final step (step 4), submit the form
    let toastId; // Move the toastId declaration here
    try {
      setIsSubmitting(true);

      // Show loading toast
      toastId = toast.loading('Saving inventory...');

      // Rest of your existing code remains the same...
      const formDataToSend = {
        ...formData,
        basicFare: parseFloat(formData.basicFare) || 0,
        yq: parseFloat(formData.yq) || 0,
        yr: parseFloat(formData.yr) || 0,
        ot: parseFloat(formData.ot) || 0,
        infantFare: parseFloat(formData.infantFare) || 0,
        markup1: parseFloat(formData.markup1) || 0,
        markup2: parseFloat(formData.markup2) || 0,
        grossTotal: parseFloat(formData.grossTotal) || 0,
        grandTotal: parseFloat(formData.grandTotal) || 0,
        fromAirport: airportData.from,
        toAirport: airportData.to
      };

      // Submit the form data
      const response = await api.post('/inventory', formDataToSend);

      if (response.data.success) {
        // Show success message
        toast.success('Inventory added successfully!', {
          id: toastId,
          duration: 2000,
        });

        // Reset form and redirect after a short delay
        setTimeout(() => {
          navigate('/inventory', {
            state: { refresh: true }
          });
        }, 1500);
      } else {
        // Show error message from API
        toast.error(response.data.message || 'Failed to add inventory. Please try again.', {
          id: toastId,
          duration: 4000,
        });
      }
    } catch (error) {
      console.error('Error submitting form:', error);

      // Handle different types of errors
      let errorMessage = 'An error occurred while saving the inventory.';
      let fieldError = null;

      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        errorMessage = error.response.data?.message || errorMessage;

        // Handle validation errors
        if (error.response.status === 400 && error.response.data?.field) {
          fieldError = error.response.data.field;
          setErrors(prev => ({
            ...prev,
            [fieldError]: error.response.data.message || `Invalid ${fieldError}`
          }));
        }
      } else if (error.request) {
        // The request was made but no response was received
        errorMessage = 'No response from server. Please check your connection.';
      }

      // Show error toast
      toast.error(errorMessage, {
        id: toastId, // Now toastId is accessible here
        duration: 5000,
      });

      // Scroll to the field with error if available
      if (fieldError) {
        const element = document.getElementsByName(fieldError)[0];
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <>
            <h4><FaPlaneDeparture /> Sector </h4>
            <div className={Styles.radioGroup}>
              {/* Radio buttons for tripType */}
            </div>
            <div className={Styles.formGrid} ref={formRef}>
              <div className={Styles.suggestionWrapper}>
                <AsyncSelect
                  styles={customSelectStyles}
                  isClearable={true}
                  isSearchable={true}
                  name="from"
                  value={selectedFromAirport}
                  onChange={(selectedOption) => {
                    setSelectedFromAirport(selectedOption);
                    const airportCode = selectedOption ? selectedOption.value : '';
                    setFormData(prev => ({ ...prev, from: airportCode }));
                  }}
                  loadOptions={loadAirportOptions}
                  cacheOptions={false}
                  defaultOptions={false}
                  placeholder="From (e.g., DEL)"
                  noOptionsMessage={({ inputValue }) => {
                    if (inputValue.length < 2) return "Type at least 2 characters to search";
                    return "No airports found";
                  }}
                  loadingMessage={() => "Loading airports..."}
                />
              </div>
              <div className={Styles.suggestionWrapper}>
                <AsyncSelect
                  styles={customSelectStyles}
                  isClearable={true}
                  isSearchable={true}
                  name="to"
                  value={selectedToAirport}
                  onChange={(selectedOption) => {
                    setSelectedToAirport(selectedOption);
                    const airportCode = selectedOption ? selectedOption.value : '';
                    setFormData(prev => ({ ...prev, to: airportCode }));
                  }}
                  loadOptions={loadAirportOptions}
                  cacheOptions={false}
                  defaultOptions={false}
                  placeholder="To (e.g., BOM)"
                  noOptionsMessage={({ inputValue }) => {
                    if (inputValue.length < 2) return "Type at least 2 characters to search";
                    return "No airports found";
                  }}
                  loadingMessage={() => "Loading airports..."}
                />
              </div>
            </div>
          </>
        );
      case 2:
        return (
          <>
            <h4><FaHashtag /> Flight & Terminals</h4>
            <div className={Styles.formGrid}>
              <div className={Styles.suggestionWrapper} style={{ position: 'relative' }}>
                <AsyncSelect
                  styles={customSelectStyles}
                  isClearable={true}
                  isSearchable={true}
                  name="airline"
                  value={selectedAirline}
                  onChange={(selectedOption) => {
                    setSelectedAirline(selectedOption);
                    const airlineName = selectedOption ? selectedOption.value : '';
                    setFormData(prev => ({ ...prev, airline: airlineName }));
                  }}
                  loadOptions={loadAirlineOptions}
                  cacheOptions={false}
                  defaultOptions={false}
                  placeholder="Airline (e.g., Indigo)"
                  noOptionsMessage={({ inputValue }) => {
                    if (inputValue.length < 2) return "Type at least 2 characters to search";
                    return "No airlines found";
                  }}
                  loadingMessage={() => "Loading airlines..."}
                />
                {errors.airline && <span className={Styles.errorText}>{errors.airline}</span>}
              </div>
              <FormInput icon={<FaHashtag />} type="text" name="flightNo" placeholder="Flight No. (e.g., 6E-202)" value={formData.flightNo} onChange={handleChange} />

              {/* UPDATED: Added onClick and cursor pointer for Times */}
              <FormInput
                icon={<FaClock />}
                type="time"
                name="departTime"
                placeholder="Departure Time"
                value={formData.departTime}
                onChange={handleChange}
                onClick={handlePickerOpen}
                style={{ cursor: 'pointer' }}
              />
              <FormInput
                icon={<FaClock />}
                type="time"
                name="arriveTime"
                placeholder="Arrival Time"
                value={formData.arriveTime}
                onChange={handleChange}
                onClick={handlePickerOpen}
                style={{ cursor: 'pointer' }}
              />

              {/* UPDATED: Added onClick and cursor pointer for Dates */}
              <FormInput
                icon={<FaCalendarAlt />}
                type="date"
                name="departDate"
                placeholder="Departure Date"
                value={formData.departDate}
                onChange={handleChange}
                min={new Date().toISOString().split('T')[0]}
                onClick={handlePickerOpen}
                style={{ cursor: 'pointer' }}
              />
              <FormInput
                icon={<FaCalendarAlt />}
                type="date"
                name="arriveDate"
                placeholder="Arrival Date"
                value={formData.arriveDate}
                onChange={handleChange}
                min={formData.departDate || new Date().toISOString().split('T')[0]}
                onClick={handlePickerOpen}
                style={{ cursor: 'pointer' }}
              />

              <FormInput icon={<FaBuilding />} type="text" name="departTerminal" placeholder="Depart Terminal" value={formData.departTerminal} onChange={handleChange} />
              <FormInput icon={<FaBuilding />} type="text" name="arriveTerminal" placeholder="Arrive Terminal" value={formData.arriveTerminal} onChange={handleChange} />

              <select name="classType" value={formData.classType} onChange={handleChange} className={errors.classType ? Styles.inputError : "" + Styles.select}>
                <option value="">Class Type</option>
                <option value="Economy">Economy</option>
                <option value="Business">Business</option>
              </select>

              <select name="ArrivalNextday" value={formData.ArrivalNextday} onChange={handleChange} className={errors.ArrivalNextday ? Styles.inputError : "" + Styles.select}>
                <option value="">Arrival Nextday</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>
          </>
        );
      case 3:
        return (
          <>
            <h4><FaMoneyBillWave /> Fare Details</h4>
            <div className={Styles.formGrid}>
              <FormInput icon={<FaSuitcase />} type="text" name="bagsInfo" placeholder="Bags Info (e.g., 15Kg)" value={formData.bagsInfo} onChange={handleChange} />
              <FormInput icon={<FaHashtag />} type="text" name="pnr" placeholder="PNR" value={formData.pnr} onChange={handleChange} />
              <FormInput icon={<FaRegClock />} type="text" name="hideeventryhour" placeholder="Hide Eventry Hour" value={formData.hideeventryhour} onChange={handleChange} />
              <div className={Styles.inputGroup}>
                <span className={Styles.inputIcon}><FaUserTie /></span>
                <select name="fareRule" value={formData.fareRule} onChange={handleChange} >
                  <option value="">Fare Rule</option>
                  <option value="R">Refundable</option>
                  <option value="N">Non Refundable</option>
                </select>
              </div>
            </div>
          </>
        );
      case 4:
        return (
          <>
            <h4><FaMoneyBillWave /> Pricing Details</h4>
            <div className={Styles.formGrid}>
              <FormInput icon={<FaHashtag />} type="number" name="seat" placeholder="Seat" value={formData.seat} onChange={handleChange} />
              <FormInput icon={<FaMoneyBillWave />} type="number" name="infantFare" placeholder="Infant Fare" value={formData.infantFare} onChange={handleChange} />
              <FormInput icon={<FaMoneyBillWave />} type="number" name="basicFare" placeholder="Basic Fare" value={formData.basicFare} onChange={handleChange} />
              <FormInput icon={<FaMoneyBillWave />} type="number" name="yq" placeholder="YQ" value={formData.yq} onChange={handleChange} />
              <FormInput icon={<FaMoneyBillWave />} type="number" name="yr" placeholder="YR" value={formData.yr} onChange={handleChange} />
              <FormInput icon={<FaMoneyBillWave />} type="number" name="ot" placeholder="OT" value={formData.ot} onChange={handleChange} />
              <FormInput icon={<FaMoneyBillWave />} type="number" name="grossTotal" placeholder="Gross Total" value={formData.grossTotal} onChange={handleChange} readOnly />
              <FormInput icon={<FaMoneyBillWave />} type="number" name="markup1" placeholder="Markup 1" value={formData.markup1} onChange={handleChange} />
              <FormInput icon={<FaMoneyBillWave />} type="number" name="markup2" placeholder="Markup 2" value={formData.markup2} onChange={handleChange} />
              <FormInput icon={<FaMoneyBillWave />} type="number" name="grandTotal" placeholder="Grand Total" value={formData.grandTotal} onChange={handleChange} readOnly />
            </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <Layout>
      <div className={Styles.container}>
        <div className={Styles.header}>
          <Link to="/inventory" className={Styles.btnBack}>
            <FaArrowLeft /> Back To List
          </Link>
          <h2><FaPlus /> Add New Inventory</h2>
        </div>
        <div className={Styles.formCard}>
          <div className={Styles.progressBar} data-step={step}>
            <div className={`${Styles.progressStep} ${step >= 1 ? Styles.active : ''} ${step > 1 ? 'completed' : ''}`}>Sector</div>
            <div className={`${Styles.progressStep} ${step >= 2 ? Styles.active : ''} ${step > 2 ? 'completed' : ''}`}>Flight</div>
            <div className={`${Styles.progressStep} ${step >= 3 ? Styles.active : ''} ${step > 3 ? 'completed' : ''}`}>Fare</div>
            <div className={`${Styles.progressStep} ${step >= 4 ? Styles.active : ''}`}>Pricing</div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className={Styles.stepContent}>
              {step === 1 && (
                <div className={Styles.radioGroup}>
                  <label><input type="radio" name="tripType" value="one way" checked={formData.tripType === "oneway"} onChange={handleChange} /> One Way</label>
                  <label><input type="radio" name="tripType" value="round" checked={formData.tripType === "round"} onChange={handleChange} /> Round Trip</label>
                </div>
              )}
              {renderStepContent()}
            </div>
            <div className={Styles.navButtons}>
              {step > 1 && (<button type="button" className={Styles.btnPrev} onClick={handlePrev}>Previous</button>)}
              {step < 4 && (<button type="button" className={Styles.btnNext} onClick={handleNext}>Next <FaArrowRight /></button>)}
              {step === 4 && (
                <button type="submit" className={Styles.btnSubmit} disabled={isSubmitting}>
                  {isSubmitting ? <><FaSpinner className={Styles.spinner} /> Saving...</> : 'Save Inventory'}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default AddNewInventory;