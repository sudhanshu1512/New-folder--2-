import React, { useState } from 'react';
import {
    FaPaperPlane,
    FaPhoneAlt,
    FaEnvelope,
    FaMapMarkerAlt,
    FaClock,
    FaCommentDots,
    FaUser,
    FaBriefcase,
    FaCheckCircle,
    FaSpinner
} from 'react-icons/fa';
import './Querypage.css';
import { api } from '../../lib/api';


const QueryPage = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        userType: 'agent', // Default to agent
        queryType: 'new_booking',
        pnr: '',
        message: ''
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Then update your handleSubmit function
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const response = await api.post('/query', formData);

            if (response.data && response.data.success) {
                setIsSuccess(true);

                // Reset form after 3 seconds
                setTimeout(() => {
                    setIsSuccess(false);
                    setFormData({
                        name: '',
                        email: '',
                        phone: '',
                        userType: 'agent',
                        queryType: 'new_booking',
                        pnr: '',
                        message: ''
                    });
                }, 3000);
            } else {
                throw new Error(response.data?.message || 'Failed to submit query');
            }
        } catch (error) {
            console.error('Error submitting query:', error);
            // Show a more specific error message
            const errorMessage = error.response?.data?.message ||
                error.message ||
                'Failed to submit query. Please try again.';
            alert(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="query-page-container">
            {/* --- HEADER SECTION --- */}
            <header className="query-header">
                <div className="query-header-content">
                    <h1>How can we help?</h1>
                    <p>
                        Whether you are an agent needing PNR assistance or a traveler with a booking query,
                        our dedicated support desk is here 24/7.
                    </p>
                </div>
            </header>

            {/* --- MAIN CONTENT GRID --- */}
            <div className="query-content-wrapper">
                <div className="query-grid">

                    {/* LEFT COLUMN: Contact Info */}
                    <div className="query-sidebar">
                        {/* Info Card */}
                        <div className="contact-info-card">
                            <h3>Contact Details</h3>

                            <div className="contact-list">
                                <div className="contact-item">
                                    <div className="icon-box blue">
                                        <FaPhoneAlt />
                                    </div>
                                    <div>
                                        <p className="label">Support Hotline</p>
                                        <p className="value">+91 98765 43210</p>
                                        <p className="sub-text">Mon-Sun, 24 Hours</p>
                                    </div>
                                </div>

                                <div className="contact-item">
                                    <div className="icon-box amber">
                                        <FaEnvelope />
                                    </div>
                                    <div>
                                        <p className="label">Email Support</p>
                                        <p className="value">helpdesk@fixedfly.com</p>
                                        <p className="sub-text">Response time: ~2 hours</p>
                                    </div>
                                </div>

                                <div className="contact-item">
                                    <div className="icon-box slate">
                                        <FaMapMarkerAlt />
                                    </div>
                                    <div>
                                        <p className="label">Head Office</p>
                                        <p className="value address">
                                            1204, Sky Tower, <br />
                                            Aerocity, New Delhi - 110037
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* FAQ Teaser */}
                        <div className="faq-teaser-card">
                            <h3>
                                <FaClock className="clock-icon" /> Quick Resolution?
                            </h3>
                            <p>
                                Most cancellation and amendment requests are processed faster via the agent dashboard.
                            </p>
                            <button className="dashboard-btn">
                                Login to Dashboard
                            </button>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Form */}
                    <div className="query-form-section">
                        <div className="form-card">
                            <div className="form-header">
                                <h2>Submit a Ticket</h2>
                                <span className="status-badge">
                                    <span className="pulse-dot"></span> Systems Operational
                                </span>
                            </div>

                            {isSuccess ? (
                                <div className="success-message">
                                    <div className="success-icon-wrapper">
                                        <FaCheckCircle />
                                    </div>
                                    <h3>Ticket Created!</h3>
                                    <p>We have received your query. Our team will contact you shortly.</p>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="query-form">

                                    {/* Row 1: Identity */}
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>I am a...</label>
                                            <div className="toggle-group">
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, userType: 'agent' })}
                                                    className={`toggle-btn ${formData.userType === 'agent' ? 'active agent' : ''}`}
                                                >
                                                    <FaBriefcase /> Agent
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, userType: 'traveler' })}
                                                    className={`toggle-btn ${formData.userType === 'traveler' ? 'active traveler' : ''}`}
                                                >
                                                    <FaUser /> Traveler
                                                </button>
                                            </div>
                                        </div>

                                        <div className="form-group">
                                            <label>Query Type</label>
                                            <div className="select-wrapper">
                                                <select
                                                    name="queryType"
                                                    value={formData.queryType}
                                                    onChange={handleChange}
                                                >
                                                    <option value="new_booking">New Booking Inquiry</option>
                                                    <option value="cancellation">Cancellation Request</option>
                                                    <option value="reschedule">Rescheduling / Amendment</option>
                                                    <option value="refund">Refund Status</option>
                                                    <option value="other">Other / Technical Issue</option>
                                                </select>
                                                <FaCommentDots className="select-icon" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Row 2: Personal Info */}
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Full Name</label>
                                            <input
                                                type="text"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleChange}
                                                placeholder="John Doe"
                                                required
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Email Address</label>
                                            <input
                                                type="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleChange}
                                                placeholder="john@example.com"
                                                required
                                            />
                                        </div>
                                    </div>

                                    {/* Row 3: Specifics */}
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Phone Number</label>
                                            <input
                                                type="tel"
                                                name="phone"
                                                value={formData.phone}
                                                onChange={handleChange}
                                                placeholder="+91 98765..."
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>PNR Number (Optional)</label>
                                            <input
                                                type="text"
                                                name="pnr"
                                                value={formData.pnr}
                                                onChange={handleChange}
                                                placeholder="Ex: ABC123"
                                                className="uppercase-input"
                                            />
                                        </div>
                                    </div>

                                    {/* Row 4: Message */}
                                    <div className="form-group full-width">
                                        <label>Message Details</label>
                                        <textarea
                                            name="message"
                                            value={formData.message}
                                            onChange={handleChange}
                                            rows="4"
                                            placeholder="Please describe your issue or requirement..."
                                            required
                                        ></textarea>
                                    </div>

                                    {/* Submit Button */}
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className={`submit-btn ${formData.userType === 'agent' ? 'agent-theme' : 'traveler-theme'}`}
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <FaSpinner className="spinner" />
                                                Processing...
                                            </>
                                        ) : (
                                            <>
                                                Submit Query <FaPaperPlane />
                                            </>
                                        )}
                                    </button>

                                </form>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default QueryPage;