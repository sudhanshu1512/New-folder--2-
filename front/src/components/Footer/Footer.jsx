import React from 'react';
import './Footer.css';
import logo from '../../assets/logo-img.png'; // Make sure you have your logo here
import { FaFacebookF, FaWhatsapp, FaLinkedinIn } from 'react-icons/fa';

const Footer = () => {
  return (
    <footer className="footer-redesigned">
      <div className="footer-container-redesigned">
        <div className="footer-main-content">
          {/* Column 1: About the Company */}
          <div className="footer-column-redesigned about-column">
            <img className='footer-logo-redesigned' src={logo} alt="Travel Agency Logo" />
            <p className="footer-description-redesigned">
              A premier travel agency creating unforgettable experiences. From exotic getaways to business trips, we cater to all your travel needs with competitive prices and exceptional service.
            </p>
          </div>

          {/* Column 2: Quick Links */}
          <div className="footer-column-redesigned">
            <h3 className="footer-heading-redesigned">Quick Links</h3>
            <ul className="footer-links-list">
              <li><a href="/contact">Contact</a></li>
              <li><a href="/aboutus">About Us</a></li>
              <li><a href="/query">Query</a></li>
            </ul>
          </div>

          {/* Column 3: Legal */}
          <div className="footer-column-redesigned">
            <h3 className="footer-heading-redesigned">Legal</h3>
            <ul className="footer-links-list">
              <li><a href="/disclaimer">Disclaimer</a></li>
              <li><a href="/privacy-policy">Privacy Policy</a></li>
              <li><a href="/terms-conditions">Terms & Conditions</a></li>
            </ul>
          </div>

          {/* Column 4: Connect */}
          <div className="footer-column-redesigned">
            <h3 className="footer-heading-redesigned">Connect With Us</h3>
            <div className="social-icons-redesigned">
              <a href="https://www.facebook.com/" aria-label="Facebook"><FaFacebookF /></a>
              <a href="https://wa.me/+91" aria-label="WhatsApp"><FaWhatsapp /></a>
              <a href="https://www.linkedin.com/in/" aria-label="LinkedIn"><FaLinkedinIn /></a>
            </div>
          </div>
        </div>

        <div className="footer-bottom-redesigned">
          <p>&copy; {new Date().getFullYear()} Logoipsum. All Rights Reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;