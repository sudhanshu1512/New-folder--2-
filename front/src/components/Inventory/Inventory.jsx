import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from "./Inventory.module.css";
import Layout from "../Layout/Layout"
import { FaPen, FaTrash } from 'react-icons/fa'
import { Link } from "react-router-dom"
import { toast } from 'react-hot-toast';
import { getInventory } from "../../services/inventoryService";
import {
  updateFare,
  addSeats,
  minusSeats,
  addMoreSeats,
  toggleStatus,
  deleteRecord,
  getFares,
  getInventoryDetails,
  fetchFareData,
} from "../../api";
import { createAirlineSuggestionHandler, fetchSupplierSuggestions } from "../../lib/api";
import Select from 'react-select';
import AsyncSelect from 'react-select/async';
import api from '../../lib/api';

const Inventory = () => {
  const [filters, setFilters] = useState({
    from: "",
    to: "",
    supplier: "",
    pnr: "",
    airline: "",
    flightNo: "",
    startDate: "",
    endDate: "",
  });

  // State to store filter options
  const [filterOptions, setFilterOptions] = useState({
    from: [],
    to: [],
    supplier: []
  });

  const [records, setRecords] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [isUpdateModalOpen, setUpdateModalOpen] = useState(false);
  const [isSeatModalOpen, setSeatModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [seatChange, setSeatChange] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // --- PAGINATION STATE ---
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  // ------------------------

  // Airport suggestion states
  const [fromAirports, setFromAirports] = useState([]);
  const [toAirports, setToAirports] = useState([]);
  const [allAirports, setAllAirports] = useState([]);
  const [airlineSuggestions, setAirlineSuggestions] = useState([]);
  const [showAirlineSuggestions, setShowAirlineSuggestions] = useState(false);
  const [isLoadingFrom, setIsLoadingFrom] = useState(false);
  const [isLoadingTo, setIsLoadingTo] = useState(false);
  const [isLoadingAirlines, setIsLoadingAirlines] = useState(false);
  const [supplierOptions, setSupplierOptions] = useState([]);
  const [selectedAirline, setSelectedAirline] = useState(null);
  const [airlineInputValue, setAirlineInputValue] = useState('');
  const [selectedToAirport, setSelectedToAirport] = useState(null);
  const [selectedFromAirport, setSelectedFromAirport] = useState(null);
  const [departureAirports, setDepartureAirports] = useState([]);
  const [arrivalAirports, setArrivalAirports] = useState([]);

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

  useEffect(() => {
    const loadSuppliers = async () => {
      try {
        const suppliers = await fetchSupplierSuggestions();
        setSupplierOptions(suppliers.map(s => s.name).filter(Boolean));
      } catch (error) {
        console.error('Failed to load suppliers:', error);
      }
    };
    loadSuppliers();
  }, []);


  // Fetch departure airports
  useEffect(() => {
    const fetchDepartureAirports = async () => {
      try {
        setIsLoadingFrom(true);
        const response = await api.get('/inventory/airportdep/suggest');
        setDepartureAirports(response.data || []);
      } catch (error) {
        console.error('Error fetching departure airports:', error);
      } finally {
        setIsLoadingFrom(false);
      }
    };
    fetchDepartureAirports();
  }, []);

  // Fetch arrival airports
  useEffect(() => {
    const fetchArrivalAirports = async () => {
      try {
        setIsLoadingTo(true);
        const response = await api.get('/inventory/airportarr/suggest');
        setArrivalAirports(response.data || []);
      } catch (error) {
        console.error('Error fetching arrival airports:', error);
      } finally {
        setIsLoadingTo(false);
      }
    };
    fetchArrivalAirports();
  }, []);

  // Create airline suggestion handler
  const { fetchAirlineSuggestions, clearAirlineSuggestions } = useMemo(
    () => createAirlineSuggestionHandler(
      setAirlineSuggestions,
      setIsLoadingAirlines,
      setShowAirlineSuggestions
    ),
    []
  );

  // Custom async options loader
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

  // Function to fetch airport suggestions
  const fetchAirportSuggestions = useCallback(async (query, type) => {
    if (!query || query.length < 2) {
      return [];
    }

    try {
      if (type === 'from') {
        setIsLoadingFrom(true);
      } else {
        setIsLoadingTo(true);
      }
      const response = await api.get(`/airports/search?q=${query}`);
      return response.data || [];
    } catch (error) {
      console.error('Error fetching airports:', error);
      return [];
    } finally {
      if (type === 'from') {
        setIsLoadingFrom(false);
      } else {
        setIsLoadingTo(false);
      }
    }
  }, []);


  // State for the Update Fare modal
  const [updateModalData, setUpdateModalData] = useState(null);
  const [updateFormData, setUpdateFormData] = useState({
    markup1: 0,
    markup2: 0,
    infantFare: 0
  });

  // State for Add Seat form
  const [addSeatData, setAddSeatData] = useState({
    seats: '',
    basicFare: '',
    yq: '',
    yr: '',
    ot: '',
    infantFare: '0',
    markup1: '0',
    markup2: '0',
  });

  // State for Minus Seat form
  const [minusSeatData, setMinusSeatData] = useState({
    selectedFare: '',
    seatsLeft: 0,
    seatsToMinus: '', // Start as empty string to allow clearing
  });

  // State for Add More Seats form
  const [addMoreSeatData, setAddMoreSeatData] = useState({
    selectedFare: '',
    avlSeats: 0,
    seatsToAdd: '', // Start as empty string to allow clearing
  });

  // Calculate gross total
  const grossTotal = useMemo(() => {
    return (
      Number(addSeatData.basicFare || 0) +
      Number(addSeatData.yq || 0) +
      Number(addSeatData.yr || 0) +
      Number(addSeatData.ot || 0)
    );
  }, [addSeatData]);

  // Calculate grand total
  const grandTotal = useMemo(() => {
    return (
      grossTotal +
      Number(addSeatData.markup1 || 0) +
      Number(addSeatData.markup2 || 0)
    );
  }, [grossTotal, addSeatData]);

  // Calculate duration between two times
  const calculateDuration = (departureTime, arrivalTime) => {
    if (!departureTime || !arrivalTime) return 'N/A';

    try {
      const [depHours, depMins] = departureTime.split(':').map(Number);
      const [arrHours, arrMins] = arrivalTime.split(':').map(Number);

      let totalMins = (arrHours * 60 + arrMins) - (depHours * 60 + depMins);

      // Handle overnight flights
      if (totalMins < 0) totalMins += 24 * 60;

      const hours = Math.floor(totalMins / 60);
      const minutes = totalMins % 60;

      return `${hours}h ${minutes}m`;
    } catch (error) {
      console.error('Error calculating duration:', error);
      return 'N/A';
    }
  };


  // Fetch flight details when modal opens
  const fetchFlightDetails = async (record) => {
    if (!record) return;

    try {
      // Set loading state
      setSelectedRecord(prev => ({
        ...prev,
        isLoading: true,
        error: null
      }));

      // Fetch fare data from the API
      const fareData = await fetchFareData(record.id);

      // Process the fare data
      let processedFareData = [];

      if (Array.isArray(fareData)) {
        processedFareData = fareData;
      } else if (fareData && typeof fareData === 'object') {
        processedFareData = [fareData];
      }

      if (!processedFareData.length) {
        throw new Error('No valid fare data found in response');
      }

      // Create the updated record with fare data
      const firstFare = processedFareData[0];

      const updatedRecord = {
        ...record,
        fareSlabs: processedFareData,
        isLoading: false,
        error: null,
        yq: firstFare.yq || 0,
        yr: firstFare.yr || 0,
        ot: firstFare.ot || 0,
        availableSeats: firstFare.availableSeats || record.availableSeats || 0,
        totalSeats: firstFare.totalSeats || record.totalSeats || 0
      };

      setSelectedRecord(updatedRecord);
      return updatedRecord;

    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to load flight details';

      setSelectedRecord(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
        fareSlabs: []
      }));

      throw error;
    }
  };

  // Handle opening the view modal
  const handleViewRecord = (record) => {
    // Create a clean record object with default values
    const cleanRecord = {
      ...record,
      isLoading: true,
      error: null,
      fareSlabs: [],
      // Ensure we have these fields initialized
      yq: 0,
      yr: 0,
      ot: 0,
      availableSeats: record.availableSeats || 0,
      totalSeats: record.totalSeats || 0
    };

    // Set the record and open the modal
    setSelectedRecord(cleanRecord);
    setViewModalOpen(true);

    // Use a small timeout to ensure the modal is open before fetching
    // and to allow React to complete the state update
    setTimeout(() => {
      fetchFlightDetails(record).catch(error => {
        console.error('Error in fetchFlightDetails:', error);
      });
    }, 100);
  };

  // Add useEffect to handle initial data fetch when modal opens
  useEffect(() => {
    if (viewModalOpen && selectedRecord?.id && !selectedRecord.fareSlabs?.length && !selectedRecord.isLoading && !selectedRecord.error) {
      fetchFlightDetails(selectedRecord).catch(() => { });
    }
  }, [viewModalOpen, selectedRecord]);

  const navigate = useNavigate();

  // Dynamically calculate Grand Total for the Update Fare modal
  const dynamicGrandTotal = useMemo(() => {
    if (!updateModalData) return 0;

    // Base gross total from the API
    const grossTotal = updateModalData.pricing?.grossTotal || 0;
    const markup1 = updateFormData.markup1 ?? updateModalData.pricing?.markups?.markup1 ?? 0;
    const markup2 = updateFormData.markup2 ?? updateModalData.pricing?.markups?.markup2 ?? 0;

    // Calculate the total
    return (grossTotal + Number(markup1) + Number(markup2)).toFixed(2);
  }, [updateModalData, updateFormData]);

  // Handle input changes for Add Seat form
  const handleAddSeatChange = (e) => {
    const { name, value } = e.target;
    setAddSeatData(prev => ({ ...prev, [name]: value }));
  };

  // Handle input changes for Add More Seats form
  const handleAddMoreSeatChange = (e) => {
    const { name, value } = e.target;

    // Logic for seatsToAdd field: allow empty string and only positive integers
    if (name === 'seatsToAdd') {
      // Allow empty string to clear the input
      if (value === '') {
        setAddMoreSeatData(prev => ({
          ...prev,
          [name]: value // Store as empty string
        }));
        return;
      }

      // Check if the value is a valid non-negative integer string
      if (/^\d+$/.test(value)) {
        setAddMoreSeatData(prev => ({
          ...prev,
          [name]: value // Store as string
        }));
      }
      return;
    }

    // Handle fare selection (original logic)
    if (name === 'selectedFare' && value) {
      const selectedFare = availableFares.find(f => f.id.toString() === value);
      if (selectedFare) {
        setAddMoreSeatData(prev => ({
          ...prev,
          selectedFare: value,
          avlSeats: selectedFare.availableSeats || 0
        }));
      }
    } else {
      setAddMoreSeatData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Handle input changes for Minus Seat form
  const handleMinusSeatChange = (e) => {
    const { name, value } = e.target;

    // Logic for seatsToMinus field: allow empty string and only positive integers
    if (name === 'seatsToMinus') {
      // Allow empty string to clear the input
      if (value === '') {
        setMinusSeatData(prev => ({
          ...prev,
          [name]: value // Store as empty string
        }));
        return;
      }

      // Check if the value is a valid non-negative integer string
      if (/^\d+$/.test(value)) {
        setMinusSeatData(prev => ({
          ...prev,
          [name]: value // Store as string
        }));
      }
      return;
    }

    // Handle fare selection (original logic)
    if (name === 'selectedFare' && value) {
      const selectedFare = availableFares.find(f => f.id.toString() === value);
      if (selectedFare) {
        setMinusSeatData(prev => ({
          ...prev,
          selectedFare: value,
          seatsLeft: selectedFare.availableSeats || 0
        }));
      }
    } else {
      setMinusSeatData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const [searchCounter, setSearchCounter] = useState(0);

  const fetchInventory = useCallback(async (customFilters = null) => {
    const currentFilters = customFilters || filters;
    try {
      const data = await getInventory(currentFilters);
      setRecords(data);
      setCurrentPage(1); // --- PAGINATION: RESET TO PAGE 1 ON NEW FETCH ---

      // Extract unique values for filters
      if (data && data.length > 0) {
        const uniqueFrom = [];
        const uniqueTo = [];
        const uniqueSuppliers = [];

        data.forEach(item => {
          // Check both possible property names for each field
          const from = item.from || item.DepAirportCode;
          const to = item.to || item.ArrAirportCode;
          const supplier = item.supplier || item.CreatedByName;

          if (from && !uniqueFrom.includes(from)) {
            uniqueFrom.push(from);
          }
          if (to && !uniqueTo.includes(to)) {
            uniqueTo.push(to);
          }
          if (supplier && !uniqueSuppliers.includes(supplier)) {
            uniqueSuppliers.push(supplier);
          }
        });

        // Filter options updated

        // Update filter options with unique values
        setFilterOptions(prev => ({
          from: [...new Set([...prev.from, ...uniqueFrom])].sort(),
          to: [...new Set([...prev.to, ...uniqueTo])].sort(),
          supplier: [...new Set([...prev.supplier, ...uniqueSuppliers])].sort()
        }));
      }
    } catch (error) {
      console.error('Failed to fetch inventory:', error);
      if (error.message.includes('Authentication required')) {
        window.location.href = '/login';
      }
    }
  }, [filters]);

  // Add filters to the dependency array

  const [availableFares, setAvailableFares] = useState([]);

  // Fetch fares when the modal opens
  useEffect(() => {
    if ((isSeatModalOpen || viewModalOpen) && selectedRecord) {
      const fetchFares = async () => {
        try {
          const response = await getFares(selectedRecord.id);
          // The API now returns an array of fares directly
          setAvailableFares(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
          console.error('Error fetching fares:', error);
          setAvailableFares([]);
        }
      };
      fetchFares();
    }
  }, [isSeatModalOpen, viewModalOpen, selectedRecord]);

  // Initial data fetch  
  useEffect(() => {
    fetchInventory();
  }, []);

  // Update the handleChange function to include airport search
  const handleChange = async (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));

    // Handle airline input specifically for suggestions
    if (name === 'airline') {
      if (value.length >= 2) {
        fetchAirlineSuggestions(value);
        setShowAirlineSuggestions(true);
      } else {
        setShowAirlineSuggestions(false);
        setAirlineSuggestions([]);
      }
      return; // Skip airport handling for airline input
    }

    // Fetch airport suggestions when typing in from/to fields
    if ((name === 'from' || name === 'to')) {
      if (value.length >= 2) {
        try {
          const airports = await fetchAirportSuggestions(value, name);
          if (name === 'from') {
            setFromAirports(airports);
          } else {
            setToAirports(airports);
          }
        } catch (error) {
          console.error('Error fetching airport suggestions:', error);
          // Clear suggestions on error
          if (name === 'from') {
            setFromAirports([]);
          } else {
            setToAirports([]);
          }
        }
      } else {
        // Clear suggestions if input is too short
        if (name === 'from') {
          setFromAirports([]);
        } else {
          setToAirports([]);
        }
      }
    }
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      const target = event.target;
      const isAirportInput = target.matches(`.${styles.airportInput}`);
      const isAirlineInput = target.matches(`.${styles.airlineInput}`);
      const isDropdown = target.closest(`.${styles.airportDropdown}, .${styles.airlineDropdown}`);

      if (isAirportInput || isAirlineInput || isDropdown) {
        return;
      }

      setFromAirports([]);
      setToAirports([]);
      setShowAirlineSuggestions(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSearch = () => {
    const hasActiveFilter = Object.values(filters).some(
      value => value !== undefined && value !== null && value !== ''
    );

    if (!hasActiveFilter) {
      toast.error('Please provide at least one filter criteria before searching');
      return;
    }

    // If we have at least one filter, proceed with the API call
    fetchInventory();
  };

  const handleReset = () => {
    setFilters({
      from: "",
      to: "",
      supplier: "",
      pnr: "",
      airline: "",
      flightNo: "",
      startDate: "",
      endDate: "",
    });
  };

  // --- NEW: Helper to open date picker on click ---
  const handleInputClick = (e) => {
    try {
      if (typeof e.target.showPicker === 'function') {
        e.target.showPicker();
      }
    } catch (error) {
      console.log('Picker could not be opened programmatically', error);
    }
  };

  const openModal = async (record, modalType) => {
    setSelectedRecord(record);
    if (modalType === 'view') {
      setViewModalOpen(true);
    }
    if (modalType === 'update') {
      setUpdateModalOpen(true);
      try {
        const response = await getInventoryDetails(record.id);
        if (response.data.success) {
          const details = response.data.data;

          // Calculate seats sold
          const totalSeats = details.inventory?.totalSeats || 0;
          const availableSeats = details.inventory?.availableSeats || 0;
          const seatSold = Math.max(0, totalSeats - availableSeats);

          // Update modal data with calculated seatSold
          const updatedDetails = {
            ...details,
            inventory: {
              ...details.inventory,
              seatSold: seatSold
            }
          };

          setUpdateModalData(updatedDetails);

          // Initialize form with fetched data
          setUpdateFormData({
            infantFare: details.pricing?.infantFare || 0,
            markup1: details.pricing?.markups?.markup1 || 0,
            markup2: details.pricing?.markups?.markup2 || 0,
          });
        }
      } catch (error) {
        console.error('Failed to fetch inventory details:', error);
        toast.error('Failed to load inventory details');
        setUpdateModalData(null);
      }
    }
    if (modalType === 'seat') {
      setSeatChange(0);
      setSeatModalOpen(true);
    }
  };

  const closeModal = () => {
    setSelectedRecord(null);
    setViewModalOpen(false);
    setUpdateModalOpen(false);
    setSeatModalOpen(false);
    setUpdateModalData(null); // Clear modal data on close
  };

  const handleEdit = (record) => {
    navigate(`/edit-inventory/${record.id}`);
  };

  const handleUpdateFare = async () => {
    if (!selectedRecord || !updateModalData) return;

    // Get current values from the form
    const currentFormData = {
      infantFare: updateFormData.infantFare ?? 0,
      markup1: updateFormData.markup1 ?? 0,
      markup2: updateFormData.markup2 ?? 0,
    };

    // Get original values from the API response
    const originalData = {
      infantFare: updateModalData.pricing?.infantFare ?? 0,
      markup1: updateModalData.pricing?.markups?.markup1 ?? 0,
      markup2: updateModalData.pricing?.markups?.markup2 ?? 0,
    };

    // Check if any field has actually changed
    const hasChanges = Object.keys(currentFormData).some(
      key => parseFloat(currentFormData[key]) !== parseFloat(originalData[key])
    );

    if (!hasChanges) {
      toast('No changes detected, No Update Needed', { icon: 'ℹ️' });
      return;
    }

    try {
      const payload = {
        ...updateFormData,
        grandTotal: dynamicGrandTotal,
        // Ensure we only send the fields that can be updated
        infantFare: currentFormData.infantFare,
        markup1: currentFormData.markup1,
        markup2: currentFormData.markup2
      };

      await updateFare(selectedRecord.id, payload);
      // Refresh the records to show the updated data
      fetchInventory();
      closeModal();
      toast.success('Fare updated successfully!');
    } catch (error) {
      console.error('Failed to update fare:', error);
      toast.error(error.response?.data?.message || 'Failed to update fare');
    }
  };

  // Handle Add Seats submission
  const handleAddSeats = async () => {
    if (!selectedRecord) return;

    // --- Validate and parse seats here ---
    const seatsValue = addSeatData.seats === '' ? 0 : parseInt(addSeatData.seats, 10);
    if (isNaN(seatsValue) || seatsValue <= 0) {
      toast.error('Please enter a valid number of seats.');
      return;
    }
    // ------------------------------------

    const payload = {
      seats: seatsValue,
      fares: {
        basicFare: addSeatData.basicFare,
        yq: addSeatData.yq,
        yr: addSeatData.yr,
        ot: addSeatData.ot,
        infantFare: addSeatData.infantFare,
        markup1: addSeatData.markup1,
        markup2: addSeatData.markup2,
      }
    };

    try {
      await addSeats(selectedRecord.id, payload);
      setSearchCounter(prev => prev + 1);
      closeModal();
    } catch (error) {
      console.error('Failed to add seats:', error);
    }
  };

  // Handle Minus Seats submission
  const handleMinusSeats = async () => {
    if (!selectedRecord || !minusSeatData.selectedFare || minusSeatData.seatsToMinus === '') {
      toast.error('Please fill all required fields');
      return;
    }

    const seatsToMinusValue = parseInt(minusSeatData.seatsToMinus, 10);

    if (isNaN(seatsToMinusValue) || seatsToMinusValue <= 0) {
      toast.error('Please enter a valid number of seats to minus.');
      return;
    }

    try {
      const response = await minusSeats(selectedRecord.id, {
        fareId: minusSeatData.selectedFare,
        seatsToMinus: seatsToMinusValue // Use the parsed, validated number
      });

      if (response.data.success) {
        toast.success('Seats removed successfully');
        // Reset form
        setMinusSeatData({
          selectedFare: '',
          seatsLeft: 0,
          seatsToMinus: ''
        });
        // Refresh the data
        setSearchCounter(prev => prev + 1);
        closeModal();
      } else {
        toast.error(response.data.message || 'Failed to remove seats');
      }
    } catch (error) {
      console.error('Failed to minus seats:', error);
      toast.error(error.response?.data?.message || 'Failed to remove seats. Please try again.');
    }
  };

  // Handle Add More Seats submission
  const handleAddMoreSeats = async () => {
    if (!selectedRecord || !addMoreSeatData.selectedFare || addMoreSeatData.seatsToAdd === '') {
      toast.error('Please fill all required fields');
      return;
    }

    const seatsToAddValue = parseInt(addMoreSeatData.seatsToAdd, 10);

    if (isNaN(seatsToAddValue) || seatsToAddValue <= 0) {
      toast.error('Please enter a valid number of seats to add.');
      return;
    }

    try {
      const response = await addMoreSeats(selectedRecord.id, {
        fareId: addMoreSeatData.selectedFare,
        seatsToAdd: seatsToAddValue // Use the parsed, validated number
      });

      if (response.data.success) {
        toast.success('Seats added successfully');
        // Reset form
        setAddMoreSeatData({
          selectedFare: '',
          avlSeats: 0,
          seatsToAdd: ''
        });
        // Refresh the data
        setSearchCounter(prev => prev + 1);
        closeModal();
      } else {
        toast.error(response.data.message || 'Failed to add seats');
      }
    } catch (error) {
      console.error('Failed to add seats:', error);
      toast.error(error.response?.data?.message || 'Failed to add seats. Please try again.');
    }
  };

  const handleToggleStatus = async (record) => {
    try {
      const newEnabled = !record.enabled;
      await toggleStatus(record.id, newEnabled);
      setRecords(records.map(rec => rec.id === record.id ? { ...rec, enabled: newEnabled } : rec));
    } catch (error) {
      console.error('Failed to toggle status:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this record?')) {
      try {
        await deleteRecord(id);
        setRecords(records.filter(rec => rec.id !== id));
      } catch (error) {
        console.error('Failed to delete record:', error);
      }
    }
  };

  // --- PAGINATION LOGIC START ---
  const indexOfLastRecord = currentPage * itemsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - itemsPerPage;
  const currentRecords = records.slice(indexOfFirstRecord, indexOfLastRecord);
  const totalPages = Math.ceil(records.length / itemsPerPage);

  const handlePageChange = (pageNumber) => {
    if (pageNumber > 0 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };
  // --- PAGINATION LOGIC END ---

  return (
    <Layout>
      <div className={styles.pnrContainer}>
        {/* Header */}
        <div className={styles.pnrHeader}>
          <h1>📋 PNR List</h1>
          <div className={styles.pnrHeaderButtons}>
            <Link to="/add-new-inventory">
              <button className={styles.btnPrimary}>+ Add New PNR</button>
            </Link>
            <button className={styles.btnSecondary}>
              Total Records ({records.length})
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className={styles.pnrFilters}>

          <div className={styles.filterGroup}>
            <label>From</label>
            <div className={styles.airportSelectContainer}>
              {isLoadingFrom ? (
                <div className={styles.loadingIndicator}>Loading airports...</div>
              ) : (
                <Select
                  styles={customSelectStyles}
                  isDisabled={isLoadingFrom}
                  isLoading={isLoadingFrom}
                  isClearable={true}
                  isSearchable={true}
                  name="from"
                  options={departureAirports.map(airport => ({
                    value: airport.name,
                    label: airport.name
                  }))}
                  value={selectedFromAirport}
                  onChange={(selectedOption) => {
                    setSelectedFromAirport(selectedOption);
                    const airportCode = selectedOption ? selectedOption.value.match(/\(([^)]+)\)/)?.[1] || selectedOption.value : '';
                    setFilters(prev => ({ ...prev, from: airportCode }));
                  }}
                  placeholder="Select From"
                  noOptionsMessage={() => "No departure airports found"}
                  loadingMessage={() => "Loading departure airports..."}
                />
              )}
            </div>
          </div>

          <div className={styles.filterGroup}>
            <label>To</label>
            <div className={styles.airportSelectContainer}>
              {isLoadingTo ? (
                <div className={styles.loadingIndicator}>Loading airports...</div>
              ) : (
                <Select
                  styles={customSelectStyles}
                  isDisabled={isLoadingTo}
                  isLoading={isLoadingTo}
                  isClearable={true}
                  isSearchable={true}
                  name="to"
                  options={arrivalAirports.map(airport => ({
                    value: airport.name,
                    label: airport.name
                  }))}
                  value={selectedToAirport}
                  onChange={(selectedOption) => {
                    setSelectedToAirport(selectedOption);
                    const airportCode = selectedOption ? selectedOption.value.match(/\(([^)]+)\)/)?.[1] || selectedOption.value : '';
                    setFilters(prev => ({ ...prev, to: airportCode }));
                  }}
                  placeholder="Select To"
                  noOptionsMessage={() => "No arrival airports found"}
                  loadingMessage={() => "Loading arrival airports..."}
                />
              )}
            </div>
          </div>

          <div className={styles.filterGroup}>
            <label>From Date</label>
            {/* --- UPDATED DATE INPUT --- */}
            <input
              type="date"
              name="startDate"
              value={filters.startDate || ''}
              onChange={handleChange}
              onClick={handleInputClick} // Added click handler
              style={{ cursor: 'pointer' }} // Added cursor style
            />
          </div>

          <div className={styles.filterGroup}>
            <label>To Date</label>
            {/* --- UPDATED DATE INPUT --- */}
            <input
              type="date"
              name="endDate"
              value={filters.endDate || ''}
              onChange={handleChange}
              onClick={handleInputClick} // Added click handler
              style={{ cursor: 'pointer' }} // Added cursor style
            />
          </div>

          <div className={styles.filterGroup}>
            <label>Supplier</label>
            <select
              name="supplier"
              value={filters.supplier || ''}
              onChange={handleChange}
            >
              <option value="">Select Supplier</option>
              {supplierOptions.map((sup, i) => (
                <option key={`sup-${i}`} value={sup}>
                  {sup || 'Unknown Supplier'}

                </option>
              ))}
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label>PNR</label>
            <input
              type="text"
              name="pnr"
              placeholder="Enter PNR"
              value={filters.pnr || ''}
              onChange={handleChange}
            />
          </div>

          <div className={styles.filterGroup}>
            <label>Airline</label>
            <div className={styles.airportSelectContainer}>
              <AsyncSelect
                styles={customSelectStyles}
                isClearable={true}
                isSearchable={true}
                name="airline"
                value={selectedAirline}
                onChange={(selectedOption) => {
                  setSelectedAirline(selectedOption);
                  const airlineCode = selectedOption ? selectedOption.value : '';
                  setFilters(prev => ({ ...prev, airline: airlineCode }));
                }}
                loadOptions={loadAirlineOptions}
                cacheOptions={false}
                defaultOptions={false}
                placeholder="Select Airline"
                noOptionsMessage={({ inputValue }) => {
                  if (inputValue.length < 2) return "Type at least 2 characters to search";
                  return "No airlines found";
                }}
                loadingMessage={() => "Loading airlines..."}
              />
            </div>
          </div>

          <div className={styles.filterGroup}>
            <label>Flight No</label>
            <input
              type="text"
              name="flightNo"
              placeholder="Enter Flight No"
              value={filters.flightNo || ''}
              onChange={handleChange}
            />
          </div>

          <div className={`${styles.filterGroup} ${styles.searchButtonContainer}`}>
            <button className={styles.btnSearch} onClick={handleSearch}>
              🔍 Search
            </button>
          </div>
        </div>

        {/* Table */}
        <div className={styles.pnrTableContainer}>
          <table className={styles.pnrTable}>
            <thead>
              <tr>
                <th>Action</th>
                <th>Supplier Name</th>
                <th>Status</th>
                <th>From</th>
                <th>To</th>
                <th>Dept - Arr Time</th>
                <th>Airline (Flight No)</th>
                <th>PNR</th>
                <th>Dep Date</th>
                <th>Seats Status</th>
                <th>View Fare</th>
                <th>Update Fare</th>
                <th>Add/Minus Seat</th>
              </tr>
            </thead>
            <tbody>
              {/* --- PAGINATION: Using currentRecords instead of records --- */}
              {currentRecords.length > 0 ? (
                currentRecords.map((rec, i) => (
                  <tr key={i}>
                    <td className={styles.actionCell}>
                      <FaPen className={styles.updateIcon} onClick={() => handleEdit(rec)} />
                      <FaTrash className={styles.deleteIcon} onClick={() => handleDelete(rec.id)} />
                    </td>
                    <td>{rec.supplier}</td>
                    <td>
                      <label className={styles.switch}>
                        <input type="checkbox" checked={rec.enabled} onChange={() => handleToggleStatus(rec)} />
                        <span className={styles.slider + ' ' + styles.round}></span>
                      </label>
                    </td>
                    <td>{rec.from}</td>
                    <td>{rec.to}</td>
                    <td>{rec.time}</td>
                    <td>
                      {rec.airline}
                    </td>
                    <td className={!rec.pnr ? styles.textRed : ''}>{rec.pnr || 'Not Available'}</td>
                    <td>{rec.depDate || (rec.DepartureDate ? new Date(rec.DepartureDate).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, ' ') : 'N/A')}</td>
                    <td className={rec.AvailableSeats === 0 ? styles.textRed : ''}>{rec.TotalSeats}  {`Out Of ${rec.AvailableSeats}`}</td>
                    <td className={`${styles.textBlue} ${styles.actionCell}`} onClick={() => openModal(rec, 'view')}>View</td>
                    <td
                      className={`${styles.actionCell} ${rec.AvailableSeats === 0 ? styles.textRed : styles.textGreen}`}
                      style={{ cursor: rec.AvailableSeats === 0 ? "not-allowed" : "pointer" }}
                      onClick={() => {
                        if (rec.AvailableSeats > 0) openModal(rec, 'update');
                      }}
                    >
                      {rec.AvailableSeats === 0 ? "Sold Out" : "Update"}
                    </td>

                    <td className={`${styles.textRed} ${styles.actionCell}`} onClick={() => openModal(rec, 'seat')}>+/-</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="13" className={styles.noRecords}>
                    No matching records found
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* --- PAGINATION CONTROLS --- */}
          {records.length > itemsPerPage && (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              marginTop: '20px',
              padding: '10px',
              gap: '15px'
            }}>
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                style={{
                  padding: '8px 16px',
                  backgroundColor: currentPage === 1 ? '#e2e8f0' : '#007bff',
                  color: currentPage === 1 ? '#64748b' : '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  transition: 'background-color 0.2s'
                }}
              >
                Previous
              </button>

              <span style={{ fontSize: '14px', fontWeight: '600', color: '#334155' }}>
                Page {currentPage} of {totalPages}
              </span>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                style={{
                  padding: '8px 16px',
                  backgroundColor: currentPage === totalPages ? '#e2e8f0' : '#007bff',
                  color: currentPage === totalPages ? '#64748b' : '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  transition: 'background-color 0.2s'
                }}
              >
                Next
              </button>
            </div>
          )}
        </div>

        {viewModalOpen && selectedRecord && (
          <div className={styles.modalOverlay}>
            <div className={styles.modal} style={{ maxWidth: '900px' }}>
              <div className={styles.modalHeader}>
                <h2>Flight Details - {selectedRecord.MarketingCarrier || selectedRecord.airline} {selectedRecord.FlightIdentification || selectedRecord.flightNo}</h2>
                <button className={styles.closeButton} onClick={closeModal} aria-label="Close">
                  <span>&times;</span>
                </button>
              </div>
              <div className={styles.modalContent}>
                <div className={styles.flightSummary}>
                  <div className={styles.summaryRow}>
                    <span className={styles.summaryLabel}>From:</span>
                    <span className={styles.summaryValue}>{selectedRecord.DepAirportCode || selectedRecord.from}</span>
                    <span className={styles.summaryLabel}>To:</span>
                    <span className={styles.summaryValue}>{selectedRecord.ArrAirportCode || selectedRecord.to}</span>
                    <span className={styles.summaryLabel}>Date:</span>
                    <span className={styles.summaryValue}>{selectedRecord.DepartureDate || selectedRecord.depDate}</span>
                  </div>
                  <div className={styles.summaryRow}>
                    <span className={styles.summaryLabel}>Departure:</span>
                    <span className={styles.summaryValue}>{selectedRecord.DepartureTime || 'N/A'}</span>
                    <span className={styles.summaryLabel}>Arrival:</span>
                    <span className={styles.summaryValue}>{selectedRecord.ArrivalTime || 'N/A'}</span>
                    <span className={styles.summaryLabel}>Duration:</span>
                    <span className={styles.summaryValue}>
                      {selectedRecord.duration ||
                        (selectedRecord.DepartureTime && selectedRecord.ArrivalTime
                          ? calculateDuration(selectedRecord.DepartureTime, selectedRecord.ArrivalTime)
                          : 'N/A')}
                    </span>
                  </div>
                </div>

                <div className={styles.fareTableContainer}>
                  <h3>Fare Details</h3>
                  <div className={styles.debugInfo} style={{ display: 'none' }}>
                    <pre>{JSON.stringify({
                      hasFareSlabs: !!selectedRecord.fareSlabs,
                      fareSlabsLength: selectedRecord.fareSlabs?.length,
                      isLoading: selectedRecord.isLoading,
                      error: selectedRecord.error,
                      recordId: selectedRecord.id
                    }, null, 2)}</pre>
                  </div>
                  <table className={styles.fareTable}>
                    <thead>
                      <tr>
                        <th>Flight id</th>
                        {/* <th>Base Fare</th>
                        <th>Tax (YQ+YR+OT)</th> */}
                        <th>Total Fare</th>
                        <th>Available</th>
                        <th>Sold</th>
                        <th>Total Seats</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedRecord.isLoading ? (
                        <tr>
                          <td colSpan="7" className={styles.loading}>
                            <div className={styles.loadingSpinner}></div>
                            Loading fare details...
                          </td>
                        </tr>
                      ) : selectedRecord.error ? (
                        <tr>
                          <td colSpan="7" className={styles.error}>
                            <div className={styles.errorIcon}>!</div>
                            {selectedRecord.error}
                            <button onClick={() => fetchFlightDetails(selectedRecord)} className={styles.retryButton}>
                              Retry
                            </button>
                          </td>
                        </tr>
                      ) : selectedRecord.fareSlabs?.length > 0 ? (
                        selectedRecord.fareSlabs.map((fare, index) => {
                          const yq = Number(fare.yq) || 0;
                          const yr = Number(fare.yr) || 0;
                          const ot = Number(fare.ot) || 0;
                          const totalTax = yq + yr + ot;
                          // Use only the base fare value without adding taxes
                          const baseFare = Number(fare.basicFare || fare.baseFare || 0);
                          const availableSeats = Number(fare.availableSeats || 0);
                          const totalSeats = Number(fare.totalSeats || 0);
                          const soldSeats = Number(fare.soldSeats || (totalSeats - availableSeats));
                          // Calculate total fare for display (if needed elsewhere)
                          const totalFare = fare.amount;

                          return (
                            <tr key={fare.id || `fare-${index}`}>
                              <td>{fare.id || `Fare ${index + 1}`}</td>
                              <td>₹{totalFare.toLocaleString('en-IN')}</td>
                              <td>{availableSeats.toLocaleString()}</td>
                              <td>{soldSeats.toLocaleString()}</td>
                              <td>{totalSeats.toLocaleString()}</td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan="7" className={styles.noData}>
                            <div>No fare data available</div>
                            {selectedRecord.id && (
                              <div style={{ marginTop: '10px' }}>
                                <div>Flight ID: {selectedRecord.id}</div>
                                <button
                                  onClick={() => fetchFlightDetails(selectedRecord)}
                                  className={styles.retryButton}
                                >
                                  Try Again
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className={styles.modalFooter}>
                <div className={styles.modalButtonGroup}>
                  <button
                    className={`${styles.button} ${styles.primaryButton}`}
                    onClick={closeModal}
                  >
                    Close
                  </button>

                </div>
              </div>
            </div>
          </div>
        )}

        {isUpdateModalOpen && selectedRecord && updateModalData && (
          <div className={styles.modalOverlay}>
            <div className={`${styles.modal} ${styles.updateFareModal}`}>
              <div className={styles.modalHeader}>
                <h2 className={styles.updateFareHeader}>
                  <span className={styles.backButton} onClick={closeModal}>&larr;</span>
                  UPDATE FARE
                </h2>
                <button className={styles.closeButton} onClick={closeModal} aria-label="Close">
                  <span>&times;</span>
                </button>
              </div>
              <div className={styles.modalContent}>
                <div className={styles.fareSection}>
                  <div className={styles.fareGridTop}>
                    {/* PNR No. */}
                    <div className={styles.formField}>
                      <label>PNR No.</label>
                      <input type="text" name="pnr" value={selectedRecord.pnr} disabled />
                    </div>
                    {/* Select Fare Slab */}
                    <div className={styles.formField}>
                      <label>Fare Slab</label>
                      <select
                        name="fareSlab"
                        className={styles.selectInput}
                        value={updateFormData.fareSlab || ''}
                        onChange={(e) => setUpdateFormData(prev => ({ ...prev, fareSlab: e.target.value }))}
                      >
                        <option value="">Select Fare Slab</option>
                        {updateModalData?.inventory?.fareSlabs?.map((slab, index) => (
                          <option key={index} value={slab.amount}>
                            ₹{slab.amount}
                          </option>
                        ))}
                      </select>
                    </div>
                    {/* Seat Left */}
                    <div className={styles.formField}>
                      <label>Seat Left</label>
                      <input type="text" name="seatLeft" value={updateModalData.inventory?.availableSeats || ''} disabled />
                    </div>
                    {/* Seat Sold */}
                    <div className={styles.formField}>
                      <label>Seat Sold</label>
                      <input
                        type="text"
                        name="seatSold"
                        value={updateModalData.inventory?.seatSold ?? '0'}
                        disabled
                        className={styles.disabledInput}
                      />
                    </div>
                  </div>

                  <div className={styles.fareGridExisting}>
                    {/* Existing Infant Fare */}
                    <div className={styles.formField}>
                      <label>Existing Infant Fare</label>
                      <input
                        type="text"
                        name="existingInfantFare"
                        value={updateModalData?.pricing?.infantFare ?? '0.00'}
                        disabled
                        className={styles.disabledInput}
                      />
                    </div>
                    {/* Existing Total Tax */}
                    <div className={styles.formField}>
                      <label>Existing Total Tax</label>
                      <input
                        type="text"
                        name="existingTotalTax"
                        value={[
                          updateModalData.pricing?.taxes?.yq || 0,
                          updateModalData.pricing?.taxes?.yr || 0,
                          updateModalData.pricing?.taxes?.ot || 0
                        ].reduce((a, b) => a + b, 0)}
                        disabled
                      />
                    </div>
                    {/* Existing Total Markup */}
                    <div className={styles.formField}>
                      <label>Existing Total Markup</label>
                      <input
                        type="text"
                        name="existingTotalMarkup"
                        value={[
                          updateModalData.pricing?.markups?.markup1 || 0,
                          updateModalData.pricing?.markups?.markup2 || 0
                        ].reduce((a, b) => a + b, 0)}
                        disabled
                      />
                    </div>
                  </div>
                </div>

                <hr className={styles.fareDivider} />

                {/* New Update Section */}
                <div className={styles.fareSection}>
                  <div className={styles.fareGridBottomHeader}>
                    <label className={styles.inputLabel}>Update Seat Count *</label>
                    <select name="updateSeatCount" className={styles.selectInput} defaultValue="">
                      <option value="">Select Seat</option>
                      {/* Add seat options */}
                    </select>
                  </div>
                  <div className={styles.fareGridBottom}>
                    {/* ROW 1: Fare Components */}
                    <div className={styles.formField}>
                      <label>Basic Fare</label>
                      <input type="number" name="basicFare" value={updateModalData.pricing?.basicFare || ''} disabled />
                    </div>
                    <div className={styles.formField}>
                      <label>YQ</label>
                      <input type="number" name="yq" value={updateModalData.pricing?.taxes?.yq || ''} disabled />
                    </div>
                    <div className={styles.formField}>
                      <label>YR</label>
                      <input type="number" name="yr" value={updateModalData.pricing?.taxes?.yr || ''} disabled />
                    </div>
                    <div className={styles.formField}>
                      <label>OT</label>
                      <input type="number" name="ot" value={updateModalData.pricing?.taxes?.ot || ''} disabled />
                    </div>
                    <div className={styles.formField}>
                      <label>Gross Total *</label>
                      <input type="number" value={updateModalData.pricing?.grossTotal || ''} disabled placeholder="0" />
                    </div>

                    {/* ROW 2: Other Components */}
                    <div className={styles.formField}>
                      <label>Infant Fare</label>
                      <input
                        type="number"
                        name="infantFare"
                        value={updateFormData.infantFare ?? ''}
                        onChange={(e) => setUpdateFormData(prev => ({
                          ...prev,
                          infantFare: parseFloat(e.target.value) || 0
                        }))}
                        className={styles.input}
                        step="0.01"
                        min="0"
                      />
                    </div>
                    <div className={styles.formField}>
                      <label>Markup 1</label>
                      <input
                        type="number"
                        name="markup1"
                        value={updateFormData.markup1 ?? ''}
                        onChange={(e) => setUpdateFormData(prev => ({
                          ...prev,
                          markup1: parseFloat(e.target.value) || 0
                        }))}
                        className={styles.input}
                        step="0.01"
                        min="0"
                      />
                    </div>
                    <div className={styles.formField}>
                      <label>Markup 2</label>
                      <input
                        type="number"
                        name="markup2"
                        value={updateFormData.markup2 ?? ''}
                        onChange={(e) => setUpdateFormData(prev => ({
                          ...prev,
                          markup2: parseFloat(e.target.value) || 0
                        }))}
                        className={styles.input}
                        step="0.01"
                        min="0"
                      />
                    </div>
                    {/* Empty cell to align Grand Total */}
                    <div className={styles.formField}></div>
                    <div className={styles.formField}>
                      <label>Grand Total</label>
                      <input type="number" value={dynamicGrandTotal} disabled />
                    </div>
                  </div>
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button
                  className={`${styles.button} ${styles.secondaryButton}`}
                  onClick={closeModal}
                >
                  Cancel
                </button>
                <button
                  className={`${styles.button} ${styles.primaryButton}`}
                  onClick={handleUpdateFare}
                >
                  Update
                </button>
              </div>
            </div>
          </div>
        )}

        {isSeatModalOpen && selectedRecord && (
          <div className={styles.modalOverlay}>
            <div className={styles.modal}>
              <div className={styles.modalHeader}>
                <h2>Seat Management for PNR: {selectedRecord.pnr}</h2>
                <button className={styles.closeButton} onClick={closeModal} aria-label="Close">
                  <span>&times;</span>
                </button>
              </div>
              <div className={styles.modalBody}>
                {/* Add Seat Section */}
                <div className={styles.modalSection}>
                  <div className={styles.modalSectionHeader}>
                    <span>Add Seat : [ Pnr - {selectedRecord.pnr} ]</span>
                  </div>
                  <div className={styles.formGrid}>
                    {/* ROW 1 */}
                    <div className={styles.formField}>
                      <label>Enter Seat</label>
                      <input type="number" name="seats" value={addSeatData.seats} onChange={handleAddSeatChange} placeholder="Add Seat" />
                    </div>
                    <div className={styles.formField}>
                      <label>PNR No.</label>
                      <input type="text" value={selectedRecord.pnr} disabled />
                    </div>

                    {/* PLACEHOLDERS to complete the 5-column grid in the first row */}
                    <div className={styles.formField}></div>
                    <div className={styles.formField}></div>
                    <div className={styles.formField}></div>

                    {/* ROW 2 */}
                    <div className={styles.formField}>
                      <label>Basic Fare</label>
                      <input type="number" name="basicFare" value={addSeatData.basicFare} onChange={handleAddSeatChange} placeholder="Basic Fare" />
                    </div>
                    <div className={styles.formField}>
                      <label>YQ</label>
                      <input type="number" name="yq" value={addSeatData.yq} onChange={handleAddSeatChange} placeholder="YQ" />
                    </div>
                    <div className={styles.formField}>
                      <label>YR</label>
                      <input type="number" name="yr" value={addSeatData.yr} onChange={handleAddSeatChange} placeholder="YR" />
                    </div>
                    <div className={styles.formField}>
                      <label>OT</label>
                      <input type="number" name="ot" value={addSeatData.ot} onChange={handleAddSeatChange} placeholder="OT" />
                    </div>
                    <div className={`${styles.formField} ${styles.grossTotalField}`}>
                      <label>Gross Total</label>
                      <input type="number" value={grossTotal} disabled placeholder="Gross Total" />
                    </div>

                    {/* ROW 3 */}
                    <div className={styles.formField}>
                      <label>Infant Fare</label>
                      <input type="number" name="infantFare" value={addSeatData.infantFare} onChange={handleAddSeatChange} />
                    </div>
                    <div className={styles.formField}>
                      <label>Markup 1</label>
                      <input type="number" name="markup1" value={addSeatData.markup1} onChange={handleAddSeatChange} />
                    </div>
                    <div className={styles.formField}>
                      <label>Markup 2</label>
                      <input type="number" name="markup2" value={addSeatData.markup2} onChange={handleAddSeatChange} />
                    </div>
                    <div className={styles.formField}>
                      <label>Grand Total</label>
                      <input type="number" value={grandTotal} disabled />
                    </div>
                    <div className={`${styles.formField} ${styles.alignRight}`}>
                      <button className={`${styles.actionBtn} ${styles.addSeatBtn}`} onClick={handleAddSeats}>Add Seat</button>
                    </div>
                  </div>
                </div>

                {/* Minus Seat Section */}
                <div className={styles.modalSection}>
                  <div className={styles.modalSectionHeader}>
                    <span>Minus Seat : [ Pnr - {selectedRecord.pnr} ]</span>
                  </div>
                  <div className={styles.formGridSmall}>
                    <div className={styles.formField}>
                      <label>Select Fare</label>
                      {/* Update your select element to show the fares */}
                      <select
                        name="selectedFare"
                        value={minusSeatData.selectedFare || ''}
                        onChange={handleMinusSeatChange}
                        className={styles.selectInput}
                      >
                        <option value="">Select Fare</option>
                        {Array.isArray(availableFares) && availableFares.length > 0 ? (
                          availableFares.map((fare) => (
                            <option key={fare.id} value={fare.id}>
                              {`RS ${fare.amount?.toFixed(2) || '0.00'}`}
                            </option>
                          ))
                        ) : (
                          <option value="" disabled>No fares available</option>
                        )}
                      </select>
                    </div>
                    <div className={styles.formField}>
                      <label>Seat Left</label>
                      <input type="number" name="seatsLeft" value={minusSeatData.seatsLeft} disabled />
                    </div>
                    <div className={styles.formField}>
                      <label>Minus Seat</label>
                      <input
                        type="number"
                        name="seatsToMinus"
                        value={minusSeatData.seatsToMinus}
                        onChange={handleMinusSeatChange}
                        placeholder="Enter seats to minus"
                      />
                    </div>
                    <div className={`${styles.formField} ${styles.alignRight}`}>
                      <button className={`${styles.actionBtn} ${styles.minusSeatBtn}`} onClick={handleMinusSeats}>Minus Seat</button>
                    </div>
                  </div>
                </div>

                {/* Add More Seat Section */}
                <div className={styles.modalSection}>
                  <div className={styles.modalSectionHeader}>
                    <span>ADD MORE SEAT IN EXISTING FARE : [ Pnr - {selectedRecord.pnr} ]</span>
                  </div>
                  <div className={styles.formGridSmall}>
                    <div className={styles.formField}>
                      <label>Select Fare</label>
                      <select
                        name="selectedFare"
                        value={addMoreSeatData.selectedFare || ''}
                        onChange={handleAddMoreSeatChange}
                        className={styles.selectInput}
                      >
                        <option value="">Select Fare</option>
                        {Array.isArray(availableFares) && availableFares.length > 0 ? (
                          availableFares.map((fare) => (
                            <option key={fare.id} value={fare.id}>
                              {`RS ${fare.amount?.toFixed(2) || '0.00'}`}
                            </option>
                          ))
                        ) : (
                          <option value="" disabled>No fares available</option>
                        )}
                      </select>
                    </div>
                    <div className={styles.formField}>
                      <label>Avl Seat</label>
                      <input
                        type="text"
                        name="avlSeats"
                        value={addMoreSeatData.avlSeats || 0}
                        disabled
                      />
                    </div>
                    <div className={styles.formField}>
                      <label>Add More Seat</label>
                      <input
                        type="number"
                        name="seatsToAdd"
                        value={addMoreSeatData.seatsToAdd}
                        onChange={handleAddMoreSeatChange}
                        placeholder="Enter seats to add"
                      />
                    </div>
                    <div className={`${styles.formField} ${styles.alignRight}`}>
                      <button className={`${styles.actionBtn} ${styles.addMoreBtn}`} onClick={handleAddMoreSeats}>Add More Seat</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </Layout>
  );
};

export default Inventory;