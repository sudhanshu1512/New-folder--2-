import React from 'react';
import { FaExclamationTriangle, FaShieldAlt, FaInfoCircle, FaFileContract } from 'react-icons/fa';
import './Disclaimer.css';

const Disclaimer = () => {
    return (
            <div className="disclaimer-container">
                {/* --- HERO SECTION --- */}
                <header className="disclaimer-header">
                    <div className="header-content">
                        <h1>Disclaimer</h1>
                        <p>Please read this disclaimer carefully before using our services.</p>
                    </div>
                </header>

                {/* --- MAIN CONTENT --- */}
                <div className="content-wrapper">
                    <div className="disclaimer-card">
                        <div className="last-updated">
                            Last Updated: November 21, 2025
                        </div>

                        <section className="section">
                            <div className="section-title">
                                <FaInfoCircle className="icon" />
                                <h2>General Information</h2>
                            </div>
                            <p>
                                The information provided by <strong>BookByOwn</strong> ("we," "us," or "our") on this website 
                                is for general informational purposes only. All information on the site is provided in good faith, 
                                however, we make no representation or warranty of any kind, express or implied, regarding the accuracy, 
                                adequacy, validity, reliability, availability, or completeness of any information on the site.
                            </p>
                        </section>

                        <div className="divider"></div>

                        <section className="section">
                            <div className="section-title">
                                <FaExclamationTriangle className="icon" />
                                <h2>External Links Disclaimer</h2>
                            </div>
                            <p>
                                The site may contain (or you may be sent through the site) links to other websites or content belonging 
                                to or originating from third parties or links to websites and features in banners or other advertising. 
                                Such external links are not investigated, monitored, or checked for accuracy, adequacy, validity, reliability, 
                                availability, or completeness by us.
                            </p>
                            <p>
                                We do not warrant, endorse, guarantee, or assume responsibility for the accuracy or reliability of any 
                                information offered by third-party websites linked through the site or any website or feature linked 
                                in any banner or other advertising. We will not be a party to or in any way be responsible for monitoring 
                                any transaction between you and third-party providers of products or services.
                            </p>
                        </section>

                        <div className="divider"></div>

                        <section className="section">
                            <div className="section-title">
                                <FaShieldAlt className="icon" />
                                <h2>Professional Disclaimer</h2>
                            </div>
                            <p>
                                The travel information provided is for general guidance only and does not substitute professional advice. 
                                Accordingly, before taking any actions based upon such information, we encourage you to consult with 
                                the appropriate professionals. We do not provide any kind of specific travel advice tailored to individual 
                                circumstances without direct consultation.
                            </p>
                            <p>
                                Reliance on any information provided by this site is solely at your own risk.
                            </p>
                        </section>

                        <div className="divider"></div>

                        <section className="section">
                            <div className="section-title">
                                <FaFileContract className="icon" />
                                <h2>Limitation of Liability</h2>
                            </div>
                            <p>
                                In no event shall we, nor our directors, employees, partners, agents, suppliers, or affiliates, be liable for 
                                any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of 
                                profits, data, use, goodwill, or other intangible losses, resulting from (i) your access to or use of or inability 
                                to access or use the service; (ii) any conduct or content of any third party on the service; (iii) any content 
                                obtained from the service; and (iv) unauthorized access, use, or alteration of your transmissions or content, 
                                whether based on warranty, contract, tort (including negligence), or any other legal theory, whether or not 
                                we have been informed of the possibility of such damage.
                            </p>
                        </section>

                        <div className="contact-note">
                            <p>
                                If you require any more information or have any questions about our site's disclaimer, 
                                please feel free to contact us by email at <a href="mailto:support@bookbyown.com">support@bookbyown.com</a>.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
    );
};

export default Disclaimer;