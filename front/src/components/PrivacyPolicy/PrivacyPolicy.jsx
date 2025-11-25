import React from 'react';
import { FaUserShield, FaDatabase, FaCookieBite, FaLock, FaEnvelope, FaHandshake } from 'react-icons/fa';
import './PrivacyPolicy.css';

const PrivacyPolicy = () => {
    return (
            <div className="policy-container">
                {/* --- HERO SECTION --- */}
                <header className="policy-header">
                    <div className="header-content">
                        <h1>Privacy Policy</h1>
                        <p>Your privacy is important to us. Learn how we handle your data.</p>
                    </div>
                </header>

                {/* --- MAIN CONTENT --- */}
                <div className="content-wrapper">
                    <div className="policy-card">
                        <div className="last-updated">
                            Last Updated: November 21, 2025
                        </div>

                        <section className="section">
                            <div className="section-title">
                                <FaUserShield className="icon" />
                                <h2>Introduction</h2>
                            </div>
                            <p>
                                At <strong>BookByOwn</strong>, accessible from bookbyown.com, one of our main priorities is the privacy of our visitors. 
                                This Privacy Policy document contains types of information that is collected and recorded by BookByOwn and how we use it.
                            </p>
                            <p>
                                If you have additional questions or require more information about our Privacy Policy, do not hesitate to contact us.
                            </p>
                        </section>

                        <div className="divider"></div>

                        <section className="section">
                            <div className="section-title">
                                <FaDatabase className="icon" />
                                <h2>Information We Collect</h2>
                            </div>
                            <p>
                                The personal information that you are asked to provide, and the reasons why you are asked to provide it, will be made clear to you at the point we ask you to provide your personal information.
                            </p>
                            <ul className="policy-list">
                                <li><strong>Account Information:</strong> Name, email address, phone number, and agency details when you register.</li>
                                <li><strong>Booking Data:</strong> Passenger names, passport details (for international travel), and travel preferences required to process bookings.</li>
                                <li><strong>Payment Information:</strong> Transaction history and payment method details (processed securely via our payment gateway partners).</li>
                                <li><strong>Log Data:</strong> IP address, browser type, Internet Service Provider (ISP), date and time stamp, referring/exit pages, and possibly the number of clicks.</li>
                            </ul>
                        </section>

                        <div className="divider"></div>

                        <section className="section">
                            <div className="section-title">
                                <FaHandshake className="icon" />
                                <h2>How We Use Your Information</h2>
                            </div>
                            <p>We use the information we collect in various ways, including to:</p>
                            <ul className="policy-list">
                                <li>Provide, operate, and maintain our website and booking platform.</li>
                                <li>Process your flight bookings and transactions efficiently.</li>
                                <li>Communicate with you, either directly or through one of our partners, including for customer service, to provide you with updates and other information relating to the website.</li>
                                <li>Send you emails regarding booking confirmations, cancellations, or important account alerts.</li>
                                <li>Find and prevent fraud.</li>
                            </ul>
                        </section>

                        <div className="divider"></div>

                        <section className="section">
                            <div className="section-title">
                                <FaCookieBite className="icon" />
                                <h2>Cookies and Web Beacons</h2>
                            </div>
                            <p>
                                Like any other website, BookByOwn uses 'cookies'. These cookies are used to store information including visitors' preferences, and the pages on the website that the visitor accessed or visited. The information is used to optimize the users' experience by customizing our web page content based on visitors' browser type and/or other information.
                            </p>
                        </section>

                        <div className="divider"></div>

                        <section className="section">
                            <div className="section-title">
                                <FaLock className="icon" />
                                <h2>Data Security</h2>
                            </div>
                            <p>
                                We implement appropriate technical and organizational security measures to protect your personal data against accidental or unlawful destruction, loss, change, or damage. All payment transactions are encrypted using SSL technology. However, please note that no method of transmission over the Internet or method of electronic storage is 100% secure.
                            </p>
                        </section>

                        <div className="divider"></div>

                        <section className="section">
                            <div className="section-title">
                                <FaEnvelope className="icon" />
                                <h2>Contact Us</h2>
                            </div>
                            <p>
                                If you have any questions about this Privacy Policy, please contact us:
                            </p>
                            <div className="contact-box">
                                <p>By email: <a href="mailto:privacy@bookbyown.com">privacy@bookbyown.com</a></p>
                                <p>By visiting this page on our website: <a href="/contact-us">/contact-us</a></p>
                            </div>
                        </section>
                    </div>
                </div>
            </div>
    );
};

export default PrivacyPolicy;