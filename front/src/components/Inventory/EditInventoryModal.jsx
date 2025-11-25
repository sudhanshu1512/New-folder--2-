import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styles from './EditInventoryModal.module.css';
import { updateInventoryDetails, getInventoryDetails } from '../../services/inventoryService';
import { toast } from 'react-hot-toast';
import Layout from '../Layout/Layout';

const EditInventoryModal = () => {
    const [formData, setFormData] = useState({});
    const [initialFormData, setInitialFormData] = useState({});
    const [validationErrors, setValidationErrors] = useState({});
    const { id } = useParams();
    const navigate = useNavigate();
    const modalRef = useRef(null);

    // ... useEffect to fetch data (unchanged for brevity)
    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const response = await getInventoryDetails(id);
                const { flightDetails, pricing, inventory } = response.data;

                const initialData = {
                    tripType: 'One Way', // Default value
                    from: flightDetails.from || '',
                    to: flightDetails.to || '',
                    airline: flightDetails.airline || '',
                    flightNo: flightDetails.flightNo || '',
                    departDate: flightDetails.departDate?.split('T')[0] || '', // Formatting date
                    departTime: flightDetails.departTime || '',
                    arriveDate: flightDetails.arriveDate?.split('T')[0] || '', // Formatting date
                    arriveTime: flightDetails.arriveTime || '',
                    departTerminal: flightDetails.departTerminal || '',
                    arriveTerminal: flightDetails.arriveTerminal || '',
                    pnr: flightDetails.pnr || '',
                    basicFare: pricing?.basicFare || '',
                    yq: pricing?.taxes?.yq || '',
                    yr: pricing?.taxes?.yr || '',
                    ot: pricing?.taxes?.ot || '',
                    infantFare: pricing?.infantFare || '',
                    markup1: pricing?.markups?.markup1 || '',
                    markup2: pricing?.markups?.markup2 || '',
                    totalSeats: inventory?.totalSeats || '',
                    availableSeats: inventory?.availableSeats || ''
                };

                setFormData(initialData);
                setInitialFormData(initialData);
            } catch (error) {
                toast.error('❌ Failed to fetch inventory details.');
                console.error('Fetch error:', error);
            }
        };
        // Handle click outside modal
        const handleClickOutside = (event) => {
            if (modalRef.current && !modalRef.current.contains(event.target)) {
                navigate('/inventory');
            }
        };

        // Add event listener when component mounts
        document.addEventListener('mousedown', handleClickOutside);

        // Fetch data
        fetchDetails();

        // Clean up event listener when component unmounts
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [id, navigate]);


    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        // Clear error for the field being changed
        if (validationErrors[name]) {
            setValidationErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    /**
     * Client-Side Validation Logic
     */
    const validateForm = () => {
        const errors = {};
        const requiredFields = [
            'flightNo', 'departDate', 'departTime', 'arriveDate', 'arriveTime',
            'basicFare', 'totalSeats', 'availableSeats'
        ];

        requiredFields.forEach(field => {
            if (!formData[field]) {
                errors[field] = 'This field is required.';
            }
        });

        // Specific validation for number fields
        const numberFields = ['basicFare', 'totalSeats', 'availableSeats'];
        numberFields.forEach(field => {
            if (formData[field] && isNaN(Number(formData[field]))) {
                errors[field] = 'Must be a valid number.';
            }
        });

        // Seat logic validation
        if (Number(formData.availableSeats) > Number(formData.totalSeats)) {
            errors.availableSeats = 'Available seats cannot exceed total seats.';
            errors.totalSeats = 'Available seats cannot exceed total seats.';
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // Function to check if any field has been modified
    const hasChanges = () => {
        const fieldsToCheck = [
            'flightNo', 'departDate', 'departTime', 'arriveDate', 'arriveTime',
            'departTerminal', 'arriveTerminal', 'pnr', 'basicFare', 'yq', 'yr',
            'ot', 'infantFare', 'markup1', 'markup2', 'totalSeats', 'availableSeats'
        ];

        return fieldsToCheck.some(field => {
            const currentValue = String(formData[field] || '');
            const initialValue = String(initialFormData[field] || '');
            return currentValue !== initialValue;
        });
    };

    const handleSave = async (e) => {
        e?.preventDefault(); // Prevent default form submission
        if (!validateForm()) {
            toast.warn('⚠️ Please correct the errors in the form before saving.');
            return;
        }

        // Check if any field has been modified
        if (!hasChanges()) {
            toast('No changes detected. No update needed.', { icon: 'ℹ️' });
            return;
        }

        try {
            // Structure data to match backend expectations
            const payload = {
                // Flight details
                airline: formData.airline,
                flightNo: formData.flightNo,
                departDate: formData.departDate,
                departTime: formData.departTime,
                arriveDate: formData.arriveDate,
                arriveTime: formData.arriveTime,
                departTerminal: formData.departTerminal || '',
                arriveTerminal: formData.arriveTerminal || '',
                pnr: formData.pnr || '',
                // Pricing details
                basicFare: parseFloat(formData.basicFare) || 0,
                yq: parseFloat(formData.yq) || 0,
                yr: parseFloat(formData.yr) || 0,
                ot: parseFloat(formData.ot) || 0,
                infantFare: parseFloat(formData.infantFare) || 0,
                // Markups
                markup1: parseFloat(formData.markup1) || 0,
                markup2: parseFloat(formData.markup2) || 0,
                // Inventory
                totalSeats: parseInt(formData.totalSeats) || 0,
                availableSeats: parseInt(formData.availableSeats) || 0
            };

            console.log('Sending payload:', payload); // For debugging

            const response = await updateInventoryDetails(id, payload);
            console.log('Update response:', response); // For debugging

            if (response && response.success) {
                toast.success('✅ Inventory updated successfully!');
                navigate('/inventory');
            } else {
                throw new Error(response?.message || 'Failed to update inventory');
            }
        } catch (error) {
            console.error('Error updating inventory:', error);
            toast.error(`❌ ${error.message || 'Failed to update inventory. Please try again.'}`);
        }
    };

    // --- NEW: Helper to open picker on click ---
    const handleInputClick = (e) => {
        try {
            if (typeof e.target.showPicker === 'function') {
                e.target.showPicker();
            }
        } catch (error) {
            console.log('Picker could not be opened programmatically', error);
        }
    };

    const renderFormGroup = (label, name, type = 'text', readOnly = false) => {
        // Check if this input should open a picker
        const isPickerInput = type === 'date' || type === 'time';

        return (
            <div className={styles.formGroup}>
                <label>{label}</label>
                <input
                    type={type}
                    name={name}
                    value={formData[name] || ''}
                    onChange={handleChange}
                    readOnly={readOnly}
                    // Apply error styling and message
                    className={validationErrors[name] ? styles.errorInput : ''}
                    // --- UPDATED: Add onClick and style for picker inputs ---
                    onClick={isPickerInput ? handleInputClick : undefined}
                    style={isPickerInput ? { cursor: 'pointer' } : undefined}
                />
                {validationErrors[name] && <span className={styles.errorMessage}>{validationErrors[name]}</span>}
            </div>
        );
    };


    const handleClose = (e) => {
        e.stopPropagation();
        navigate('/inventory');
    };

    return (
        <Layout>
            <div className={styles.modalOverlay}>
                <button onClick={handleClose} className={styles.closeButton}>&times;</button>
                <form onSubmit={handleSave} className={styles.modalContent} ref={modalRef}>
                    <div className={styles.modalHeader}>
                        <h2>Update Flight Inventory ✈️</h2>
                        <button type="button" onClick={() => navigate('/inventory')} className={styles.backButton}>Back To List</button>
                    </div>

                    {/* Sector Details */}
                    <div className={styles.formSection}>
                        <div className={styles.sectionHeader}><h3>Sector Details</h3></div>
                        <div className={styles.formGroup}>
                            <label>Trip Type</label>
                            <div className={styles.tripTypeGroup}>
                                <label>
                                    <input type="radio" name="tripType" value="One Way" checked={formData.tripType === 'One Way'} onChange={handleChange} />
                                    One Way
                                </label>
                                <label>
                                    <input type="radio" name="tripType" value="Round Trip" checked={formData.tripType === 'Round Trip'} onChange={handleChange} />
                                    Round Trip
                                </label>
                            </div>
                        </div>
                        <div className={styles.formGrid}>
                            {renderFormGroup('From', 'from', 'text', true)}
                            {renderFormGroup('To', 'to', 'text', true)}
                        </div>
                    </div>

                    {/* Flight and Time Details */}
                    <div className={styles.formSection}>
                        <div className={styles.sectionHeader}><h3>Flight & Time Details - {formData.tripType}</h3></div>
                        <div className={styles.formGrid}>
                            {renderFormGroup('Airlines Name', 'airline', 'text', true)}
                            {renderFormGroup('Flight No.', 'flightNo')}
                            {renderFormGroup('Dep Date', 'departDate', 'date')}
                            {renderFormGroup('Dep Time', 'departTime', 'time')}
                            {renderFormGroup('Arr Date', 'arriveDate', 'date')}
                            {renderFormGroup('Arr Time', 'arriveTime', 'time')}
                            {renderFormGroup('Departure Terminal', 'departTerminal')}
                            {renderFormGroup('Arrival Terminal', 'arriveTerminal')}
                            {renderFormGroup('PNR', 'pnr', 'text', true)}
                        </div>
                    </div>

                    {/* Pricing Details */}
                    <div className={styles.formSection}>
                        <div className={styles.sectionHeader}><h3>Pricing & Markups</h3></div>
                        <div className={styles.formGrid}>
                            {renderFormGroup('Basic Fare', 'basicFare', 'number')}
                            {renderFormGroup('YQ Tax', 'yq', 'number')}
                            {renderFormGroup('YR Tax', 'yr', 'number')}
                            {renderFormGroup('OT Tax', 'ot', 'number')}
                            {renderFormGroup('Infant Fare', 'infantFare', 'number')}
                            {renderFormGroup('Markup 1', 'markup1', 'number')}
                            {renderFormGroup('Markup 2', 'markup2', 'number')}
                        </div>
                    </div>

                    {/* Inventory Details */}
                    <div className={styles.formSection}>
                        <div className={styles.sectionHeader}><h3>Inventory Management</h3></div>
                        <div className={styles.formGrid}>
                            {renderFormGroup('Total Seats', 'totalSeats', 'number')}
                            {renderFormGroup('Available Seats', 'availableSeats', 'number')}
                        </div>
                    </div>

                    <div className={styles.formActions}>
                        <button type="submit" className={styles.saveButton}>💾 Save Inventory</button>
                    </div>
                </form>
            </div>
        </Layout>
    );
};

export default EditInventoryModal;