import React from 'react';
import { FaGavel, FaPlane, FaUserCheck, FaCreditCard, FaBan, FaSyncAlt } from 'react-icons/fa';
import './termscondition.css';

const Termsconditions = () => {
    return (
            <div className="terms-container">
                {/* --- HERO SECTION --- */}
                <header className="terms-header">
                    <div className="header-content">
                        <h1>Terms & Conditions</h1>
                        <p>Please read these terms carefully before using our services.</p>
                    </div>
                </header>

                {/* --- MAIN CONTENT --- */}
                <div className="content-wrapper">
                    <div className="terms-card">
                        <div className="last-updated">
                            Last Updated: November 21, 2025
                        </div>

                        <section className="section">
                            <div className="section-title">
                                <FaGavel className="icon" />
                                <h2>1. Agreement to Terms</h2>
                            </div>
                            <p>
                                These Terms and Conditions constitute a legally binding agreement made between you, whether personally or on behalf of an entity (“you”) and <strong>BookByOwn</strong> (“we,” “us” or “our”), concerning your access to and use of the <a href="/">bookbyown.com</a> website as well as any other media form, media channel, mobile website or mobile application related, linked, or otherwise connected thereto (collectively, the “Site”).
                            </p>
                            <p>
                                By accessing the Site, you confirm that you have read, understood, and agreed to be bound by all of these Terms and Conditions. If you do not agree with all of these terms, then you are expressly prohibited from using the Site and you must discontinue use immediately.
                            </p>
                        </section>

                        <div className="divider"></div>

                        <section className="section">
                            <div className="section-title">
                                <FaUserCheck className="icon" />
                                <h2>2. User Responsibilities</h2>
                            </div>
                            <ul className="terms-list">
                                <li>You must be at least 18 years of age to register and use this Site.</li>
                                <li>You agree to provide accurate, current, and complete information during the registration and booking process.</li>
                                <li>You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.</li>
                                <li>You agree not to use the Site for any illegal or unauthorized purpose.</li>
                            </ul>
                        </section>

                        <div className="divider"></div>

                        <section className="section">
                            <div className="section-title">
                                <FaPlane className="icon" />
                                <h2>3. Booking & Flight Services</h2>
                            </div>
                            <p>
                                <strong>Flight Availability:</strong> All bookings are subject to availability at the time of booking. We do not guarantee the availability of any specific flight until the booking is confirmed.
                            </p>
                            <p>
                                <strong>Pricing:</strong> Prices are subject to change without notice until the booking is confirmed and payment is received. The price shown at the time of booking includes all applicable taxes and fees unless stated otherwise.
                            </p>
                            <p>
                                <strong>Travel Documents:</strong> It is your sole responsibility to ensure that you have all necessary travel documents, including passports and visas, required for your journey.
                            </p>
                        </section>

                        <div className="divider"></div>

                        <section className="section">
                            <div className="section-title">
                                <FaCreditCard className="icon" />
                                <h2>4. Payment & Refunds</h2>
                            </div>
                            <p>
                                <strong>Payment:</strong> Full payment is required at the time of booking unless a specific deposit arrangement has been agreed upon for group bookings. We accept major credit/debit cards and net banking.
                            </p>
                            <p>
                                <strong>Refunds:</strong> Refunds are processed according to the airline's fare rules and our cancellation policy. Service fees charged by BookByOwn are non-refundable. Refunds will be credited to the original method of payment within 7-14 business days after approval.
                            </p>
                        </section>

                        <div className="divider"></div>

                        <section className="section">
                            <div className="section-title">
                                <FaSyncAlt className="icon" />
                                <h2>5. Cancellation & Changes</h2>
                            </div>
                            <p>
                                <strong>Cancellations by You:</strong> You may cancel your booking through our portal or by contacting customer support. Cancellation charges will apply as per the airline's policy plus our service fee.
                            </p>
                            <p>
                                <strong>Changes by Airline:</strong> Airlines may reschedule or cancel flights due to operational reasons. In such cases, we will assist you in rescheduling or processing a refund as per the airline's policy, but we are not liable for any additional costs incurred.
                            </p>
                        </section>

                        <div className="divider"></div>

                        <section className="section">
                            <div className="section-title">
                                <FaBan className="icon" />
                                <h2>6. Prohibited Activities</h2>
                            </div>
                            <p>You may not access or use the Site for any purpose other than that for which we make the Site available. Prohibited activities include, but are not limited to:</p>
                            <ul className="terms-list">
                                <li>Systematically retrieving data or other content from the Site to create or compile, directly or indirectly, a collection, compilation, database, or directory without written permission from us.</li>
                                <li>Making any unauthorized use of the Site, including collecting usernames and/or email addresses of users by electronic or other means for the purpose of sending unsolicited email.</li>
                                <li>Using the Site to advertise or offer to sell goods and services.</li>
                                <li>Circumventing, disabling, or otherwise interfering with security-related features of the Site.</li>
                            </ul>
                        </section>

                        <div className="contact-note">
                            <p>
                                If you have any questions regarding these Terms & Conditions, please contact us at <a href="mailto:legal@bookbyown.com">legal@bookbyown.com</a>.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
    );
};

export default Termsconditions;
