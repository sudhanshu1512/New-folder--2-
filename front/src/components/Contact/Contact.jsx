import React, { useState } from 'react';
import { api } from '../../lib/api';
import './Contact.css';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    interest: '',
    message: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await api.post('/contact', formData);

      if (response.data && response.data.success) {
        setIsSubmitted(true);
        
        // Reset form after 3 seconds
        setTimeout(() => {
          setIsSubmitted(false);
          setFormData({
            name: '',
            email: '',
            phone: '',
            interest: '',
            message: ''
          });
        }, 3000);
      } else {
        throw new Error(response.data?.message || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error submitting contact form:', error);
      alert(error.response?.data?.message || 'Failed to send your message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="contact-section" id="contact">
      <div className="wave-bg"></div>
      <div className="contact-container">
        <div className="contact-header">
          <h1>Get in Touch</h1>
          <p>Your journey begins here – our experts are ready to guide you!</p>
        </div>

        <div className="contact-content">
          {/* Contact Info */}
          <div className="contact-info">
            <div className="info-item">
              <div className="info-icon"><i className="fas fa-phone"></i></div>
              <div className="info-text">
                <h3>Call Us</h3>
                <p>+91 800 555 0123<br />Mon-Fri: 8am-6pm</p>
              </div>
            </div>
            <div className="info-item">
              <div className="info-icon"><i className="fas fa-envelope"></i></div>
              <div className="info-text">
                <h3>Email Us</h3>
                <p>info@travel.com<br />Replies within 24 hrs</p>
              </div>
            </div>
            <div className="info-item">
              <div className="info-icon"><i className="fas fa-map-marker-alt"></i></div>
              <div className="info-text">
                <h3>Visit Us</h3>
                <p>123 Travel Street<br />New Delhi, INDIA</p>
              </div>
            </div>

            <div className="social-links">
              <a href="#"><i className="fab fa-facebook-f"></i></a>
              <a href="#"><i className="fab fa-instagram"></i></a>
              <a href="#"><i className="fab fa-twitter"></i></a>
              <a href="#"><i className="fab fa-linkedin-in"></i></a>
            </div>
          </div>

          {/* Contact Form */}
          <div className="contact-form">
            <h2>✈️ Send a Message</h2>
            <form onSubmit={handleSubmit}>
              {['name','email','phone'].map((field, i) => (
                <div className="form-group floating" key={i}>
                  <input
                    type={field === 'email' ? 'email' : field === 'phone' ? 'tel' : 'text'}
                    name={field}
                    value={formData[field]}
                    onChange={handleChange}
                    required={field !== 'phone'}
                    className="form-control"
                  />
                  <label>{field.charAt(0).toUpperCase() + field.slice(1)}</label>
                </div>
              ))}

              <div className="form-group floating">
                <select
                  name="interest"
                  value={formData.interest}
                  onChange={handleChange}
                  className="form-control"
                >
                  <option value="">Select Interest</option>
                  <option value="vacation">Vacation Packages</option>
                  <option value="flights">Flight Bookings</option>
                  <option value="hotels">Hotel Reservations</option>
                  <option value="tours">Guided Tours</option>
                </select>
                <label>Interested In</label>
              </div>

              <div className="form-group floating">
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  className="form-control"
                  rows="4"
                  required
                ></textarea>
                <label>Your Message</label>
              </div>

              <button 
                type="submit"
                className={`submit-btn ${isSubmitting ? 'submitting' : ''} ${isSubmitted ? 'submitted' : ''}`}
                onClick={handleSubmit}
                disabled={isSubmitting || isSubmitted}
              >
                {isSubmitting ? (
                  <><i className="fas fa-spinner fa-spin"></i> Sending...</>
                ) : isSubmitted ? (
                  <><i className="fas fa-check"></i> Sent!</>
                ) : (
                  <><i className="fas fa-paper-plane"></i> Send</>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
