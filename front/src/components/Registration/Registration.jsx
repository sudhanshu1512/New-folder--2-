import React, { useState, useCallback, useRef, useEffect } from "react";
import { FaUser, FaBusinessTime, FaHome, FaCheckCircle, FaSpinner, FaTimes, FaCheck, FaExclamationTriangle, FaInfoCircle, FaTimesCircle } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import api from "../../lib/api";
import "./Registration.css";

// Enhanced Toast Component
const Toast = ({ message, type = 'success', onClose, duration = 5000, position = 'top-right' }) => {
    const [isVisible, setIsVisible] = useState(true);
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            handleClose();
        }, duration);

        return () => clearTimeout(timer);
    }, [duration]);

    const handleClose = () => {
        setIsExiting(true);
        setTimeout(() => {
            setIsVisible(false);
            onClose();
        }, 300);
    };

    const getToastConfig = () => {
        switch (type) {
            case 'success':
                return {
                    icon: <FaCheckCircle />,
                    className: 'toast-success',
                    title: 'Success!'
                };
            case 'error':
                return {
                    icon: <FaTimesCircle />,
                    className: 'toast-error',
                    title: 'Error!'
                };
            case 'warning':
                return {
                    icon: <FaExclamationTriangle />,
                    className: 'toast-warning',
                    title: 'Warning!'
                };
            case 'info':
                return {
                    icon: <FaInfoCircle />,
                    className: 'toast-info',
                    title: 'Info'
                };
            default:
                return {
                    icon: <FaInfoCircle />,
                    className: 'toast-info',
                    title: 'Notice'
                };
        }
    };

    if (!isVisible) return null;

    const config = getToastConfig();

    return (
        <>
            <div className={`toast-container ${position}`}>
                <div className={`toast ${config.className} ${isExiting ? 'toast-exit' : 'toast-enter'}`}>
                    <div className="toast-content">
                        <div className="toast-icon">
                            {config.icon}
                        </div>
                        <div className="toast-message">
                            <div className="toast-title">{config.title}</div>
                            <div className="toast-text">{message}</div>
                        </div>
                    </div>
                    <button
                        className="toast-close"
                        onClick={handleClose}
                        aria-label="Close notification"
                    >
                        <FaTimes />
                    </button>
                    <div className="toast-progress">
                        <div
                            className="toast-progress-bar"
                            style={{ animationDuration: `${duration}ms` }}
                        ></div>
                    </div>
                </div>
            </div>

            <style jsx>{`
        /* Toast Container Positioning */
        .toast-container {
          position: fixed;
          z-index: 9999;
          pointer-events: none;
        }

        .toast-container.top-right {
          top: 20px;
          right: 20px;
        }

        .toast-container.top-left {
          top: 20px;
          left: 20px;
        }

        .toast-container.bottom-right {
          bottom: 20px;
          right: 20px;
        }

        .toast-container.bottom-left {
          bottom: 20px;
          left: 20px;
        }

        .toast-container.top-center {
          top: 20px;
          left: 50%;
          transform: translateX(-50%);
        }

        .toast-container.bottom-center {
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
        }

        /* Toast Base Styles */
        .toast {
          min-width: 300px;
          max-width: 400px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
          overflow: hidden;
          position: relative;
          pointer-events: auto;
          margin-bottom: 10px;
          border-left: 4px solid;
        }

        /* Toast Animation */
        .toast-enter {
          animation: toastSlideIn 0.3s ease-out forwards;
        }

        .toast-exit {
          animation: toastSlideOut 0.3s ease-in forwards;
        }

        @keyframes toastSlideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes toastSlideOut {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(100%);
            opacity: 0;
          }
        }

        /* Toast Content */
        .toast-content {
          display: flex;
          align-items: flex-start;
          padding: 16px 20px;
          gap: 12px;
        }

        .toast-icon {
          font-size: 24px;
          margin-top: 2px;
          flex-shrink: 0;
        }

        .toast-message {
          flex: 1;
          min-width: 0;
        }

        .toast-title {
          font-weight: 600;
          font-size: 16px;
          margin-bottom: 4px;
          line-height: 1.2;
        }

        .toast-text {
          font-size: 14px;
          line-height: 1.4;
          opacity: 0.9;
          word-wrap: break-word;
        }

        /* Close Button */
        .toast-close {
          position: absolute;
          top: 8px;
          right: 8px;
          background: none;
          border: none;
          cursor: pointer;
          padding: 8px;
          border-radius: 50%;
          transition: all 0.2s ease;
          font-size: 12px;
          opacity: 0.6;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
        }

        .toast-close:hover {
          opacity: 1;
          background-color: rgba(0, 0, 0, 0.1);
          transform: scale(1.1);
        }

        /* Progress Bar */
        .toast-progress {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 4px;
          background-color: rgba(255, 255, 255, 0.3);
        }

        .toast-progress-bar {
          height: 100%;
          background-color: rgba(255, 255, 255, 0.8);
          animation: progressBar linear forwards;
          transform-origin: left;
        }

        @keyframes progressBar {
          from {
            transform: scaleX(1);
          }
          to {
            transform: scaleX(0);
          }
        }

        /* Toast Types */
        .toast-success {
          border-left-color: #10b981;
        }

        .toast-success .toast-icon {
          color: #10b981;
        }

        .toast-success .toast-title {
          color: #047857;
        }

        .toast-success .toast-progress-bar {
          background-color: #10b981;
        }

        .toast-error {
          border-left-color: #ef4444;
        }

        .toast-error .toast-icon {
          color: #ef4444;
        }

        .toast-error .toast-title {
          color: #dc2626;
        }

        .toast-error .toast-progress-bar {
          background-color: #ef4444;
        }

        .toast-warning {
          border-left-color: #f59e0b;
        }

        .toast-warning .toast-icon {
          color: #f59e0b;
        }

        .toast-warning .toast-title {
          color: #d97706;
        }

        .toast-warning .toast-progress-bar {
          background-color: #f59e0b;
        }

        .toast-info {
          border-left-color: #3b82f6;
        }

        .toast-info .toast-icon {
          color: #3b82f6;
        }

        .toast-info .toast-title {
          color: #2563eb;
        }

        .toast-info .toast-progress-bar {
          background-color: #3b82f6;
        }

        /* Mobile Responsive */
        @media (max-width: 480px) {
          .toast-container {
            left: 10px !important;
            right: 10px !important;
            transform: none !important;
          }
          
          .toast {
            min-width: auto;
            max-width: none;
            width: 100%;
          }
          
          @keyframes toastSlideIn {
            from {
              transform: translateY(-100%);
              opacity: 0;
            }
            to {
              transform: translateY(0);
              opacity: 1;
            }
          }
          
          @keyframes toastSlideOut {
            from {
              transform: translateY(0);
              opacity: 1;
            }
            to {
              transform: translateY(-100%);
              opacity: 0;
            }
          }
        }

        /* Hover Effects */
        .toast:hover {
          transform: translateY(-2px);
          box-shadow: 0 15px 30px rgba(0, 0, 0, 0.2);
          transition: all 0.2s ease;
        }

        .toast:hover .toast-progress-bar {
          animation-play-state: paused;
        }

        /* Dark Theme Support */
        @media (prefers-color-scheme: dark) {
          .toast {
            background: #1f2937;
            color: #f9fafb;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
          }
          
          .toast-close:hover {
            background-color: rgba(255, 255, 255, 0.1);
          }
        }
      `}</style>
        </>
    );
};

const uploadToCloudinary = async (file) => {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type.toLowerCase())) {
        throw new Error('Only JPG, JPEG, and PNG files are allowed');
    }

    // 2. Validate file size (5MB limit)
    const maxSizeInBytes = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSizeInBytes) {
        throw new Error('File size should not exceed 5MB');
    }

    //1 Get the signature from our own backend
    let signatureResponse;
    try {
        // Use your api instance or a standard fetch
        signatureResponse = await api.get('/cloudinary/sign-upload');
    } catch (error) {
        console.error("Failed to get upload signature:", error);
        throw new Error("Could not get permission to upload. Please try again.");
    }

    const { signature, timestamp, apiKey } = signatureResponse.data;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', apiKey);
    formData.append('timestamp', timestamp);
    formData.append('signature', signature);
    // Optional: specify a folder if you signed it on the backend
    // formData.append('folder', 'user_documents');

    const cloudName = 'deean6nsu'; // Replace with your Cloudinary cloud name
    const url = `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`;

    // 2. Upload the file directly to Cloudinary using the signature
    try {
        const response = await fetch(url, {
            method: 'POST',
            body: formData,
        });
        if (!response.ok) {
            throw new Error('Cloudinary upload failed');
        }
        const data = await response.json();
        return data.secure_url; // Return the secure URL
    } catch (error) {
        console.error("Error uploading to Cloudinary:", error);
        throw error; // Re-throw error to be caught by handleSubmit
    }
};

export default function Registration() {
    const [step, setStep] = useState(1);
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [panValidation, setPanValidation] = useState({
        isChecking: false,
        isValid: null,
        message: '',
        exists: false
    });
    const [mobileValidation, setMobileValidation] = useState({
        isChecking: false,
        isValid: null,
        message: '',
        exists: false
    });
    const [emailValidation, setEmailValidation] = useState({
        isChecking: false,
        isValid: null,
        message: '',
        exists: false
    });
    const [toast, setToast] = useState({
        show: false,
        message: '',
        type: 'success',
        duration: 5000
    });
    const { agentRegister } = useAuth();
    const navigate = useNavigate();
    const panCheckTimeoutRef = useRef(null);
    const mobileCheckTimeoutRef = useRef(null);
    const emailCheckTimeoutRef = useRef(null);

    const showToast = (message, type = 'success', duration = 5000) => {
        setToast({
            show: true,
            message,
            type,
            duration
        });
    };

    const hideToast = () => {
        setToast({ show: false, message: '', type: 'success', duration: 5000 });
    };

    const [formData, setFormData] = useState({
        // Step 2: Personal Details
        title: '',
        firstName: '',
        middleName: '',
        lastName: '',
        mobile: '',
        whatsapp: '',
        alternate: '',
        email: '',
        altEmail: '',
        password: '',
        confirmPassword: '',
        // Step 3: Business Details
        businessName: '',
        businessType: '',
        nature: '',
        businessAddress: '',
        panNumber: '',
        gstNumber: '',
        website: '',
        panFile: null,
        gstFile: null,
        // Step 4: Address & Documents
        address1: '',
        address2: '',
        postalCode: '',
        city: '',
        country: '',
        state: '',
        district: '',
        stateCode: '',
        addressProof: null,
        // Additional fields
        agentType: 'AGENT',
        branch: '',
        area: ''
    });

    const fullname = (formData.title + ' ' + formData.firstName + ' ' + formData.lastName);

    const validateField = (name, value) => {
        let error = '';

        switch (name) {
            case 'firstName':
            case 'lastName':
                if (!value.trim()) error = 'This field is required';
                else if (!/^[A-Za-z\s]+$/.test(value)) error = 'Only letters and spaces are allowed';
                break;
            case 'mobile':
                if (!value) error = 'Mobile number is required';
                else if (!/^[0-9]{10}$/.test(value)) error = 'Please enter a valid 10-digit mobile number';
                break;
            case 'email':
                if (!value) error = 'Email is required';
                else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) error = 'Please enter a valid email address';
                break;
            case 'whatsapp':
            case 'alternate':
                if (value && !/^[0-9]{10}$/.test(value)) error = 'Please enter a valid 10-digit number';
                break;
            case 'businessName':
            case 'businessType':
            case 'nature':
            case 'businessAddress':
            case 'address1':
            case 'city':
            case 'country':
            case 'state':
                if (!value.trim()) error = 'This field is required';
                break;
            case 'panNumber':
                if (!value) error = 'PAN Number is required';
                else if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(value.toUpperCase())) error = 'Invalid PAN format (e.g., ABCDE1234F)';
                break;
            case 'postalCode':
                if (!value) error = 'Postal Code is required';
                else if (!/^[0-9]{6}$/.test(value)) error = 'Must be a 6-digit postal code';
                break;
            case 'password':
                if (!value) error = 'Password is required';
                else if (value.length < 6) error = 'Password must be at least 6 characters long';
                break;
            case 'confirmPassword':
                if (!value) error = 'Please confirm your password';
                else if (value !== formData.password) error = 'Passwords do not match';
                break;
            case 'panFile':
            case 'addressProof':
                if (!value) error = 'File upload is required';
                break;
            default:
                break;
        }
        return error;
    };

    // PAN validation function with API call
    const checkPanAvailability = useCallback(async (panNumber) => {
        if (!panNumber || panNumber.length !== 10) {
            setPanValidation({
                isChecking: false,
                isValid: null,
                message: '',
                exists: false
            });
            return;
        }

        // Basic format validation
        const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
        if (!panRegex.test(panNumber.toUpperCase())) {
            setPanValidation({
                isChecking: false,
                isValid: false,
                message: 'Invalid PAN format',
                exists: false
            });
            return;
        }

        setPanValidation(prev => ({ ...prev, isChecking: true }));

        try {
            const response = await api.post('/auth/check-pan', {
                panNumber: panNumber.toUpperCase()
            });

            const data = response.data;

            if (data.success) {
                setPanValidation({
                    isChecking: false,
                    isValid: true,
                    message: data.message,
                    exists: false
                });
                showToast('PAN number verified successfully', 'success', 3000);
            } else if (data.exists) {
                setPanValidation({
                    isChecking: false,
                    isValid: false,
                    message: data.message,
                    exists: true
                });
                setErrors(prev => ({
                    ...prev,
                    panNumber: data.message
                }));
                showToast(data.message, 'error', 6000);
            } else {
                setPanValidation({
                    isChecking: false,
                    isValid: false,
                    message: data.message,
                    exists: false
                });
                showToast(data.message, 'warning', 4000);
            }
        } catch (error) {
            console.error('Error checking PAN:', error);
            const errorMessage = error.response?.data?.message || 'Error checking PAN availability';
            setPanValidation({
                isChecking: false,
                isValid: false,
                message: errorMessage,
                exists: false
            });
            showToast(errorMessage, 'error', 5000);
        }
    }, []);

    // Mobile validation function with API call
    const checkMobileAvailability = useCallback(async (mobile) => {
        if (!mobile || mobile.length !== 10) {
            setMobileValidation({
                isChecking: false,
                isValid: null,
                message: '',
                exists: false
            });
            return;
        }

        const mobileRegex = /^[0-9]{10}$/;
        if (!mobileRegex.test(mobile)) {
            setMobileValidation({
                isChecking: false,
                isValid: false,
                message: 'Invalid mobile format',
                exists: false
            });
            return;
        }

        setMobileValidation(prev => ({ ...prev, isChecking: true }));

        try {
            const response = await api.post('/auth/check-mobile', {
                mobile: mobile
            });

            const data = response.data;

            if (data.success) {
                setMobileValidation({
                    isChecking: false,
                    isValid: true,
                    message: data.message,
                    exists: false
                });
                showToast('Mobile number available', 'success', 3000);
            } else if (data.exists) {
                setMobileValidation({
                    isChecking: false,
                    isValid: false,
                    message: data.message,
                    exists: true
                });
                setErrors(prev => ({
                    ...prev,
                    mobile: data.message
                }));
                showToast(data.message, 'error', 6000);
            } else {
                setMobileValidation({
                    isChecking: false,
                    isValid: false,
                    message: data.message,
                    exists: false
                });
                showToast(data.message, 'warning', 4000);
            }
        } catch (error) {
            console.error('Error checking mobile:', error);
            const errorMessage = error.response?.data?.message || 'Error checking mobile availability';
            setMobileValidation({
                isChecking: false,
                isValid: false,
                message: errorMessage,
                exists: false
            });
            showToast(errorMessage, 'error', 5000);
        }
    }, []);

    // Email validation function with API call
    const checkEmailAvailability = useCallback(async (email) => {
        if (!email) {
            setEmailValidation({
                isChecking: false,
                isValid: null,
                message: '',
                exists: false
            });
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setEmailValidation({
                isChecking: false,
                isValid: false,
                message: 'Invalid email format',
                exists: false
            });
            return;
        }

        setEmailValidation(prev => ({ ...prev, isChecking: true }));

        try {
            const response = await api.post('/auth/check-email', {
                email: email.toLowerCase()
            });

            const data = response.data;

            if (data.success) {
                setEmailValidation({
                    isChecking: false,
                    isValid: true,
                    message: data.message,
                    exists: false
                });
                showToast('Email address available', 'success', 3000);
            } else if (data.exists) {
                setEmailValidation({
                    isChecking: false,
                    isValid: false,
                    message: data.message,
                    exists: true
                });
                setErrors(prev => ({
                    ...prev,
                    email: data.message
                }));
                showToast(data.message, 'error', 6000);
            } else {
                setEmailValidation({
                    isChecking: false,
                    isValid: false,
                    message: data.message,
                    exists: false
                });
                showToast(data.message, 'warning', 4000);
            }
        } catch (error) {
            console.error('Error checking email:', error);
            const errorMessage = error.response?.data?.message || 'Error checking email availability';
            setEmailValidation({
                isChecking: false,
                isValid: false,
                message: errorMessage,
                exists: false
            });
            showToast(errorMessage, 'error', 5000);
        }
    }, []);

    // Debounced validation functions
    const debouncedPanCheck = useCallback((panNumber) => {
        if (panCheckTimeoutRef.current) {
            clearTimeout(panCheckTimeoutRef.current);
        }
        panCheckTimeoutRef.current = setTimeout(() => {
            checkPanAvailability(panNumber);
        }, 800);
    }, [checkPanAvailability]);

    const debouncedMobileCheck = useCallback((mobile) => {
        if (mobileCheckTimeoutRef.current) {
            clearTimeout(mobileCheckTimeoutRef.current);
        }
        mobileCheckTimeoutRef.current = setTimeout(() => {
            checkMobileAvailability(mobile);
        }, 800);
    }, [checkMobileAvailability]);

    const debouncedEmailCheck = useCallback((email) => {
        if (emailCheckTimeoutRef.current) {
            clearTimeout(emailCheckTimeoutRef.current);
        }
        emailCheckTimeoutRef.current = setTimeout(() => {
            checkEmailAvailability(email);
        }, 800);
    }, [checkEmailAvailability]);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (panCheckTimeoutRef.current) {
                clearTimeout(panCheckTimeoutRef.current);
            }
            if (mobileCheckTimeoutRef.current) {
                clearTimeout(mobileCheckTimeoutRef.current);
            }
            if (emailCheckTimeoutRef.current) {
                clearTimeout(emailCheckTimeoutRef.current);
            }
        };
    }, []);

    const validateStep = (currentStep) => {
        const newErrors = {};
        let isValid = true;
        let fieldsToValidate = [];

        if (currentStep === 2) {
            fieldsToValidate = ['firstName', 'lastName', 'mobile', 'email', 'password', 'confirmPassword'];
        } else if (currentStep === 3) {
            fieldsToValidate = ['businessName', 'businessType', 'nature', 'businessAddress', 'panNumber', 'panFile'];
        } else if (currentStep === 4) {
            fieldsToValidate = ['address1', 'postalCode', 'city', 'country', 'state', 'addressProof'];
        }

        fieldsToValidate.forEach(field => {
            const error = validateField(field, formData[field]);
            if (error) {
                newErrors[field] = error;
                isValid = false;
            }
        });

        // Additional checks for step 2
        if (currentStep === 2) {
            if (formData.mobile) {
                if (mobileValidation.isChecking) {
                    newErrors.mobile = 'Checking mobile availability...';
                    isValid = false;
                } else if (mobileValidation.exists) {
                    newErrors.mobile = mobileValidation.message;
                    isValid = false;
                } else if (mobileValidation.isValid === false && !mobileValidation.exists) {
                    newErrors.mobile = mobileValidation.message;
                    isValid = false;
                }
            }

            if (formData.email) {
                if (emailValidation.isChecking) {
                    newErrors.email = 'Checking email availability...';
                    isValid = false;
                } else if (emailValidation.exists) {
                    newErrors.email = emailValidation.message;
                    isValid = false;
                } else if (emailValidation.isValid === false && !emailValidation.exists) {
                    newErrors.email = emailValidation.message;
                    isValid = false;
                }
            }
        }

        // Additional check for PAN number in step 3
        if (currentStep === 3 && formData.panNumber) {
            if (panValidation.isChecking) {
                newErrors.panNumber = 'Checking PAN availability...';
                isValid = false;
            } else if (panValidation.exists) {
                newErrors.panNumber = panValidation.message;
                isValid = false;
            } else if (panValidation.isValid === false && !panValidation.exists) {
                newErrors.panNumber = panValidation.message;
                isValid = false;
            }
        }

        setErrors(newErrors);
        return isValid;
    };

    const handleChange = (e) => {
        const { name, value, type, files } = e.target;
        const newValue = type === "file" ? files[0] : value;

        setFormData(prev => ({
            ...prev,
            [name]: newValue
        }));

        // Special handling for PAN number
        if (name === 'panNumber' && type !== "file") {
            setPanValidation({
                isChecking: false,
                isValid: null,
                message: '',
                exists: false
            });

            setErrors(prev => ({
                ...prev,
                panNumber: undefined
            }));

            if (newValue && newValue.length >= 10) {
                debouncedPanCheck(newValue);
            }
        }

        // Special handling for Mobile number
        if (name === 'mobile' && type !== "file") {
            setMobileValidation({
                isChecking: false,
                isValid: null,
                message: '',
                exists: false
            });

            setErrors(prev => ({
                ...prev,
                mobile: undefined
            }));

            if (newValue && newValue.length === 10) {
                debouncedMobileCheck(newValue);
            }
        }

        // Special handling for Email
        if (name === 'email' && type !== "file") {
            setEmailValidation({
                isChecking: false,
                isValid: null,
                message: '',
                exists: false
            });

            setErrors(prev => ({
                ...prev,
                email: undefined
            }));

            if (newValue && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newValue)) {
                debouncedEmailCheck(newValue);
            }
        }

        if (errors[name] || type !== "file") {
            const error = validateField(name, newValue);
            setErrors(prev => ({
                ...prev,
                [name]: error || undefined
            }));
        }
    };

    const handleFileBlur = (e) => {
        const { name, files } = e.target;
        const error = validateField(name, files[0]);
        setErrors(prev => ({
            ...prev,
            [name]: error || undefined
        }));
    };

    const handleNext = () => {
        if (validateStep(step)) {
            setStep(step + 1);
            showToast(`Step ${step} completed successfully`, 'info', 2000);
        } else {
            showToast('Please fix the errors before proceeding', 'warning', 4000);
        }
    };

    const handlePrevious = () => {
        setStep(step - 1);
    };

    const handleSubmit = async () => {
        if (validateStep(2) && validateStep(3) && validateStep(4)) {
            setIsSubmitting(true);
            showToast('Submitting your registration...', 'info', 3000);

            try {
                // Create an array of upload promises
                const uploadPromises = [];

                if (formData.panFile) {
                    uploadPromises.push(uploadToCloudinary(formData.panFile));
                } else {
                    uploadPromises.push(Promise.resolve('')); // Add placeholder for indexing
                }

                if (formData.gstFile) {
                    uploadPromises.push(uploadToCloudinary(formData.gstFile));
                } else {
                    uploadPromises.push(Promise.resolve(''));
                }

                if (formData.addressProof) {
                    uploadPromises.push(uploadToCloudinary(formData.addressProof));
                } else {
                    uploadPromises.push(Promise.resolve(''));
                }

                // Run all uploads at the same time for speed
                const [panFileUrl, gstFileUrl, addressProofUrl] = await Promise.all(uploadPromises);

                showToast('Documents uploaded. Submitting registration...', 'info', 5000);

                const registrationData = {
                    title: formData.title,
                    firstName: formData.firstName,
                    middleName: formData.middleName,
                    lastName: formData.lastName,
                    mobile: formData.mobile,
                    whatsapp: formData.whatsapp,
                    alternate: formData.alternate,
                    email: formData.email,
                    altEmail: formData.altEmail,
                    password: formData.password,
                    businessName: formData.businessName,
                    businessType: formData.businessType,
                    nature: formData.nature,
                    businessAddress: formData.businessAddress,
                    panNumber: formData.panNumber,
                    gstNumber: formData.gstNumber,
                    website: formData.website,
                    address1: formData.address1,
                    address2: formData.address2,
                    postalCode: formData.postalCode,
                    city: formData.city,
                    country: formData.country,
                    state: formData.state,
                    district: formData.district,
                    stateCode: formData.stateCode,
                    agentType: formData.agentType,
                    branch: formData.branch,
                    area: formData.area,
                    panFileUrl,
                    gstFileUrl,
                    addressProofUrl,
                };
                // IMPORTANT: Remove the raw file objects before sending to the backend
                delete registrationData.panFile;
                delete registrationData.gstFile;

                const result = await agentRegister(registrationData);

                if (result.success) {
                    showToast('Registration successful! Welcome to our platform.', 'success', 4000);
                    setTimeout(() => {
                        navigate('/flight-search');
                    }, 4500);
                } else {
                    showToast(`Registration failed: ${result.error}`, 'error', 6000);
                }
            } catch (error) {
                console.error('Registration error:', error);
                const errorMessage = error.response?.data?.message || 'An unexpected error occurred. Please try again.';
                showToast(errorMessage, 'error', 6000);
            } finally {
                setIsSubmitting(false);
            }
        } else {
            console.log("Validation failed. Please check all steps.");
            showToast('Please complete all required fields correctly', 'error', 5000);
            setStep(2);
        }
    };

    const renderStepContent = () => {
        switch (step) {
            case 1:
                return (
                    <>
                        <h2>✨ Perks of Partnering with Us</h2>
                        <div className="wizard-card-body">
                            <ul className="perks-list">
                                <li>🚀 Low Commission Fees</li>
                                <li>🤝 Dedicated Account Manager</li>
                                <li>⚡ Instant Payment Settlements</li>
                                <li>🛠️ Premium Business Tools</li>
                                <li>📈 Growth & Marketing Support</li>
                                <li>🌐 Global Network Access</li>
                            </ul>
                        </div>
                        <div className="wizard-nav">
                            <button onClick={handleNext}>Get Started</button>
                        </div>
                    </>
                );
            case 2:
                return (
                    <>
                        <h2>👤 Personal Details</h2>
                        <div className="wizard-card-body">
                            <div className="form-grid">
                                <div>
                                    <label htmlFor="firstName" className="required-field">First Name</label>
                                    <input type="text" id="firstName" name="firstName" placeholder="First Name" value={formData.firstName} onChange={handleChange} className={errors.firstName ? 'error' : ''} />
                                    {errors.firstName && <span className="error-message">{errors.firstName}</span>}
                                </div>
                                <div>
                                    <label htmlFor="lastName" className="required-field">Last Name</label>
                                    <input type="text" id="lastName" name="lastName" placeholder="Last Name" value={formData.lastName} onChange={handleChange} className={errors.lastName ? 'error' : ''} />
                                    {errors.lastName && <span className="error-message">{errors.lastName}</span>}
                                </div>
                                <div>
                                    <label htmlFor="mobile" className="required-field">Mobile Number</label>
                                    <div className="input-with-validation">
                                        <input
                                            type="tel"
                                            id="mobile"
                                            name="mobile"
                                            placeholder="Mobile Number"
                                            value={formData.mobile}
                                            onChange={handleChange}
                                            className={`${errors.mobile ? 'error' : ''} ${mobileValidation.isValid === true ? 'success' : ''}`}
                                            maxLength="10"
                                        />
                                        <div className="validation-icon">
                                            {mobileValidation.isChecking && (
                                                <FaSpinner className="spinner checking-icon" />
                                            )}
                                            {mobileValidation.isValid === true && !mobileValidation.isChecking && (
                                                <FaCheck className="success-icon" />
                                            )}
                                            {mobileValidation.isValid === false && !mobileValidation.isChecking && mobileValidation.exists && (
                                                <FaTimes className="error-icon" />
                                            )}
                                        </div>
                                    </div>
                                    {errors.mobile && <span className="error-message">{errors.mobile}</span>}
                                    {!errors.mobile && mobileValidation.message && mobileValidation.isValid === true && (
                                        <span className="success-message">{mobileValidation.message}</span>
                                    )}
                                </div>
                                <div>
                                    <label htmlFor="whatsapp">Whatsapp Number</label>
                                    <input type="tel" id="whatsapp" name="whatsapp" placeholder="Whatsapp Number" value={formData.whatsapp} onChange={handleChange} className={errors.whatsapp ? 'error' : ''} />
                                    {errors.whatsapp && <span className="error-message">{errors.whatsapp}</span>}
                                </div>
                                <div>
                                    <label htmlFor="alternate">Alternate Number</label>
                                    <input type="tel" id="alternate" name="alternate" placeholder="Alternate Number" value={formData.alternate} onChange={handleChange} className={errors.alternate ? 'error' : ''} />
                                    {errors.alternate && <span className="error-message">{errors.alternate}</span>}
                                </div>
                                <div>
                                    <label htmlFor="email" className="required-field">Email Address</label>
                                    <div className="input-with-validation">
                                        <input
                                            type="email"
                                            id="email"
                                            name="email"
                                            placeholder="Email Address"
                                            value={formData.email}
                                            onChange={handleChange}
                                            className={`${errors.email ? 'error' : ''} ${emailValidation.isValid === true ? 'success' : ''}`}
                                        />
                                        <div className="validation-icon">
                                            {emailValidation.isChecking && (
                                                <FaSpinner className="spinner checking-icon" />
                                            )}
                                            {emailValidation.isValid === true && !emailValidation.isChecking && (
                                                <FaCheck className="success-icon" />
                                            )}
                                            {emailValidation.isValid === false && !emailValidation.isChecking && emailValidation.exists && (
                                                <FaTimes className="error-icon" />
                                            )}
                                        </div>
                                    </div>
                                    {errors.email && <span className="error-message">{errors.email}</span>}
                                    {!errors.email && emailValidation.message && emailValidation.isValid === true && (
                                        <span className="success-message">{emailValidation.message}</span>
                                    )}
                                </div>
                                <div>
                                    <label htmlFor="password" className="required-field">Password</label>
                                    <input type="password" id="password" name="password" placeholder="Password" value={formData.password} onChange={handleChange} className={errors.password ? 'error' : ''} />
                                    {errors.password && <span className="error-message">{errors.password}</span>}
                                </div>
                                <div>
                                    <label htmlFor="confirmPassword" className="required-field">Confirm Password</label>
                                    <input type="password" id="confirmPassword" name="confirmPassword" placeholder="Confirm Password" value={formData.confirmPassword} onChange={handleChange} className={errors.confirmPassword ? 'error' : ''} />
                                    {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
                                </div>
                            </div>
                        </div>
                        <div className="wizard-nav">
                            <button onClick={handlePrevious}>Back</button>
                            <button onClick={handleNext}>Next</button>
                        </div>
                    </>
                );
            case 3:
                return (
                    <>
                        <h2>🏢 Business Details</h2>
                        <div className="wizard-card-body">
                            <div className="form-grid">
                                <div>
                                    <label htmlFor="businessName" className="required-field">Business/Agency Name</label>
                                    <input type="text" id="businessName" name="businessName" placeholder="Business/Agency Name" value={formData.businessName} onChange={handleChange} className={errors.businessName ? 'error' : ''} />
                                    {errors.businessName && <span className="error-message">{errors.businessName}</span>}
                                </div>
                                <div>
                                    <label htmlFor="businessType" className="required-field">Business Type</label>
                                    <input type="text" id="businessType" name="businessType" placeholder="e.g., Proprietorship, Partnership" value={formData.businessType} onChange={handleChange} className={errors.businessType ? 'error' : ''} />
                                    {errors.businessType && <span className="error-message">{errors.businessType}</span>}
                                </div>
                                <div>
                                    <label htmlFor="nature" className="required-field">Nature of Business</label>
                                    <input type="text" id="nature" name="nature" placeholder="e.g., Travel Agency, Tour Operator" value={formData.nature} onChange={handleChange} className={errors.nature ? 'error' : ''} />
                                    {errors.nature && <span className="error-message">{errors.nature}</span>}
                                </div>
                                <div>
                                    <label htmlFor="businessAddress" className="required-field">Business Address</label>
                                    <input type="text" id="businessAddress" name="businessAddress" placeholder="Business Address" value={formData.businessAddress} onChange={handleChange} className={errors.businessAddress ? 'error' : ''} />
                                    {errors.businessAddress && <span className="error-message">{errors.businessAddress}</span>}
                                </div>
                                <div>
                                    <label htmlFor="panNumber" className="required-field">PAN Number</label>
                                    <div className="input-with-validation">
                                        <input
                                            type="text"
                                            id="panNumber"
                                            name="panNumber"
                                            placeholder="PAN Number (e.g., ABCDE1234F)"
                                            value={formData.panNumber}
                                            onChange={handleChange}
                                            className={`${errors.panNumber ? 'error' : ''} ${panValidation.isValid === true ? 'success' : ''}`}
                                            maxLength="10"
                                            style={{ textTransform: 'uppercase' }}
                                        />
                                        <div className="validation-icon">
                                            {panValidation.isChecking && (
                                                <FaSpinner className="spinner checking-icon" />
                                            )}
                                            {panValidation.isValid === true && !panValidation.isChecking && (
                                                <FaCheck className="success-icon" />
                                            )}
                                            {panValidation.isValid === false && !panValidation.isChecking && panValidation.exists && (
                                                <FaTimes className="error-icon" />
                                            )}
                                        </div>
                                    </div>
                                    {errors.panNumber && <span className="error-message">{errors.panNumber}</span>}
                                    {!errors.panNumber && panValidation.message && panValidation.isValid === true && (
                                        <span className="success-message">{panValidation.message}</span>
                                    )}
                                </div>
                                <div>
                                    <label htmlFor="gstNumber">GST Number (Optional)</label>
                                    <input type="text" id="gstNumber" name="gstNumber" placeholder="GST Number" value={formData.gstNumber} onChange={handleChange} />
                                </div>
                                <div className="file-input-group">
                                    <label htmlFor="panFile" className="required-field">PAN File</label>
                                    <input type="file" id="panFile" accept=".jpg,.jpeg,.png" name="panFile" onChange={handleChange} onBlur={handleFileBlur} className={errors.panFile ? 'error' : ''} />
                                    {errors.panFile && <span className="error-message">{errors.panFile}</span>}
                                </div>
                                <div className="file-input-group">
                                    <label htmlFor="gstFile">GST File (Optional)</label>
                                    <input type="file" id="gstFile" accept=".jpg,.jpeg,.png" name="gstFile" onChange={handleChange} />
                                </div>
                            </div>
                        </div>
                        <div className="wizard-nav">
                            <button onClick={handlePrevious}>Back</button>
                            <button onClick={handleNext}>Next</button>
                        </div>
                    </>
                );
            case 4:
                return (
                    <>
                        <h2>📑 Address & Documents</h2>
                        <div className="wizard-card-body">
                            <div className="form-grid">
                                <div>
                                    <label htmlFor="address1" className="required-field">Address Line 1</label>
                                    <input type="text" id="address1" name="address1" placeholder="Address Line 1" value={formData.address1} onChange={handleChange} className={errors.address1 ? 'error' : ''} />
                                    {errors.address1 && <span className="error-message">{errors.address1}</span>}
                                </div>
                                <div>
                                    <label htmlFor="address2">Address Line 2 (Optional)</label>
                                    <input type="text" id="address2" name="address2" placeholder="Address Line 2" value={formData.address2} onChange={handleChange} />
                                </div>
                                <div>
                                    <label htmlFor="postalCode" className="required-field">Postal Code</label>
                                    <input type="text" id="postalCode" name="postalCode" placeholder="Postal Code" value={formData.postalCode} onChange={handleChange} className={errors.postalCode ? 'error' : ''} />
                                    {errors.postalCode && <span className="error-message">{errors.postalCode}</span>}
                                </div>
                                <div>
                                    <label htmlFor="city" className="required-field">City</label>
                                    <input type="text" id="city" name="city" placeholder="City" value={formData.city} onChange={handleChange} className={errors.city ? 'error' : ''} />
                                    {errors.city && <span className="error-message">{errors.city}</span>}
                                </div>
                                <div>
                                    <label htmlFor="state" className="required-field">State</label>
                                    <input type="text" id="state" name="state" placeholder="State" value={formData.state} onChange={handleChange} className={errors.state ? 'error' : ''} />
                                    {errors.state && <span className="error-message">{errors.state}</span>}
                                </div>
                                <div>
                                    <label htmlFor="country" className="required-field">Country</label>
                                    <input type="text" id="country" name="country" placeholder="Country" value={formData.country} onChange={handleChange} className={errors.country ? 'error' : ''} />
                                    {errors.country && <span className="error-message">{errors.country}</span>}
                                </div>
                                <div className="file-input-group">
                                    <label htmlFor="addressProof" className="required-field">Address Proof</label>
                                    <input type="file" id="addressProof" accept=".jpg,.jpeg,.png" name="addressProof" onChange={handleChange} onBlur={handleFileBlur} className={errors.addressProof ? 'error' : ''} />
                                    {errors.addressProof && <span className="error-message">{errors.addressProof}</span>}
                                </div>
                            </div>
                        </div>
                        <div className="wizard-nav">
                            <button onClick={handlePrevious}>Back</button>
                            <button onClick={handleNext}>Next</button>
                        </div>
                    </>
                );
            case 5:
                return (
                    <>
                        <h2>✅ Review & Submit</h2>
                        <div className="wizard-card-body">
                            <div className="review-container">
                                <div className="review-section">
                                    <h3>Personal Information</h3>
                                    <div className="review-grid">
                                        <div className="review-item">
                                            <span className="review-label">Full Name:</span>
                                            <span className="review-value">{fullname}</span>
                                        </div>
                                        <div className="review-item">
                                            <span className="review-label">Email:</span>
                                            <span className="review-value">{formData.email}</span>
                                        </div>
                                        <div className="review-item">
                                            <span className="review-label">Phone:</span>
                                            <span className="review-value">{formData.mobile}</span>
                                        </div>
                                        <div className="review-item">
                                            <span className="review-label">Whatsapp:</span>
                                            <span className="review-value">{formData.whatsapp}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="review-section">
                                    <h3>Business Information</h3>
                                    <div className="review-grid">
                                        <div className="review-item">
                                            <span className="review-label">Business Name:</span>
                                            <span className="review-value">{formData.businessName}</span>
                                        </div>
                                        <div className="review-item">
                                            <span className="review-label">Business Type:</span>
                                            <span className="review-value">{formData.businessType}</span>
                                        </div>
                                        <div className="review-item">
                                            <span className="review-label">PAN Number:</span>
                                            <span className="review-value">{formData.panNumber}</span>
                                        </div>
                                        <div className="review-item">
                                            <span className="review-label">GSTIN (if available):</span>
                                            <span className="review-value">{formData.gstin || 'Not provided'}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="review-section">
                                    <h3>Address Information</h3>
                                    <div className="review-grid">
                                        <div className="review-item">
                                            <span className="review-label">Address Line 1:</span>
                                            <span className="review-value">{formData.address1}</span>
                                        </div>
                                        {formData.address2 && (
                                            <div className="review-item">
                                                <span className="review-label">Address Line 2:</span>
                                                <span className="review-value">{formData.address2}</span>
                                            </div>
                                        )}
                                        <div className="review-item">
                                            <span className="review-label">City:</span>
                                            <span className="review-value">{formData.city}</span>
                                        </div>
                                        <div className="review-item">
                                            <span className="review-label">State:</span>
                                            <span className="review-value">{formData.state}</span>
                                        </div>
                                        <div className="review-item">
                                            <span className="review-label">Pincode:</span>
                                            <span className="review-value">{formData.postalCode}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="review-section">
                                    <h3>Account Information</h3>
                                        <div className="review-item">
                                            <span className="review-value">A Welcome Mail will be Shared to your Mail ID , and your Username and Password will be shared to your Mail ID </span>
                                        </div>
                                </div>
                            </div>
                        </div>
                        <div className="wizard-nav">
                            <button
                                className="secondary"
                                onClick={handlePrevious}
                                disabled={isSubmitting}
                            >
                                Back
                            </button>
                            <button
                                className="primary"
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <>
                                        <span className="spinner"></span>
                                        Submitting...
                                    </>
                                ) : (
                                    'Submit Application'
                                )}
                            </button>
                        </div>
                    </>
                );
            default:
                return null;
        }
    };

    const cardVariants = {
        hidden: { opacity: 0, y: 50 },
        visible: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -50 },
    };

    return (
        <div className="registration-page">
            <div className="page-header">
                <h1>Travel Agent Registration</h1>
                <p>Join our network of experts and unlock exclusive benefits.</p>
            </div>

            <div className="wizard-card">
                <div className="wizard-steps">
                    <span className={step >= 1 ? "active" : ""}><FaCheckCircle /> Perks</span>
                    <span className={step >= 2 ? "active" : ""}><FaUser /> Personal</span>
                    <span className={step >= 3 ? "active" : ""}><FaBusinessTime /> Business</span>
                    <span className={step >= 4 ? "active" : ""}><FaHome /> Documents</span>
                    <span className={step >= 5 ? "active" : ""}><FaCheckCircle /> Review</span>
                </div>

                <div className="wizard-content">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={step}
                            variants={cardVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            transition={{ duration: 0.3 }}
                            className="step-container"
                        >
                            {renderStepContent()}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>

            {toast.show && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    duration={toast.duration}
                    position="top-right"
                    onClose={hideToast}
                />
            )}

            <style jsx>{`
                /* Validation Icons */
                .input-with-validation {
                    position: relative;
                }

                .validation-icon {
                    position: absolute;
                    right: 10px;
                    top: 50%;
                    transform: translateY(-50%);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .checking-icon {
                    color: #6b7280;
                    animation: spin 1s linear infinite;
                }

                .success-icon {
                    color: #10b981;
                }

                .error-icon {
                    color: #ef4444;
                }

                .success-message {
                    color: #10b981;
                    font-size: 12px;
                    margin-top: 4px;
                    display: block;
                }

                .error-message {
                    color: #ef4444;
                    font-size: 12px;
                    margin-top: 4px;
                    display: block;
                }

                @keyframes spin {
                    from {
                        transform: rotate(0deg);
                    }
                    to {
                        transform: rotate(360deg);
                    }
                }

                /* Input States */
                input.success {
                    border-color: #10b981;
                    box-shadow: 0 0 0 1px rgba(16, 185, 129, 0.1);
                }

                input.error {
                    border-color: #ef4444;
                    box-shadow: 0 0 0 1px rgba(239, 68, 68, 0.1);
                }
            `}</style>
        </div>
    );
}