import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import {
  FaMobile, FaLock, FaPlane, FaHotel, FaTrain, FaUmbrellaBeach,
  FaShip, FaPassport, FaCheckCircle, FaTimesCircle, FaExclamationTriangle,
  FaInfoCircle, FaTimes, FaGlobeAmericas, FaHeadset, FaShieldAlt,
  FaStar
} from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import "./Loginpage.css";
import Adv from "./Adv";

// --- KEEPING YOUR TOAST COMPONENT EXACTLY AS IS ---
const Toast = ({ message, type = 'success', onClose, duration = 5000, position = 'top-right' }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => handleClose(), duration);
    return () => clearTimeout(timer);
  }, [duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => { setIsVisible(false); onClose(); }, 300);
  };

  const getToastConfig = () => {
    switch (type) {
      case 'success': return { icon: <FaCheckCircle />, className: 'toast-success', title: 'Success!' };
      case 'error': return { icon: <FaTimesCircle />, className: 'toast-error', title: 'Error!' };
      case 'warning': return { icon: <FaExclamationTriangle />, className: 'toast-warning', title: 'Warning!' };
      default: return { icon: <FaInfoCircle />, className: 'toast-info', title: 'Info' };
    }
  };
  if (!isVisible) return null;
  const config = getToastConfig();

  return (
    <div className={`toast-container ${position}`}>
      <div className={`toast ${config.className} ${isExiting ? 'toast-exit' : 'toast-enter'}`}>
        <div className="toast-content">
          <div className="toast-icon">{config.icon}</div>
          <div className="toast-message">
            <div className="toast-title">{config.title}</div>
            <div className="toast-text">{message}</div>
          </div>
        </div>
        <button className="toast-close" onClick={handleClose}><FaTimes /></button>
        <div className="toast-progress"><div className="toast-progress-bar" style={{ animationDuration: `${duration}ms` }}></div></div>
      </div>
      {/* Inline styles for Toast kept for portability */}
      <style jsx>{`
        .toast-container { position: fixed; z-index: 9999; pointer-events: none; top: 20px; right: 20px; }
        .toast { min-width: 300px; background: white; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.15); position: relative; pointer-events: auto; border-left: 4px solid; margin-bottom: 10px; overflow: hidden; }
        .toast-content { display: flex; padding: 16px 20px; gap: 12px; }
        .toast-icon { font-size: 24px; margin-top: 2px; }
        .toast-title { font-weight: 600; font-size: 16px; margin-bottom: 4px; }
        .toast-text { font-size: 14px; color: #666; }
        .toast-close { position: absolute; top: 8px; right: 8px; background: none; border: none; cursor: pointer; opacity: 0.5; }
        .toast-progress { position: absolute; bottom: 0; left: 0; width: 100%; height: 4px; background: rgba(0,0,0,0.1); }
        .toast-progress-bar { height: 100%; background: rgba(0,0,0,0.2); animation: progressBar linear forwards; }
        .toast-success { border-left-color: #10b981; } .toast-success .toast-icon { color: #10b981; }
        .toast-error { border-left-color: #ef4444; } .toast-error .toast-icon { color: #ef4444; }
        @keyframes progressBar { from { transform: scaleX(1); } to { transform: scaleX(0); } }
        @keyframes toastSlideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        .toast-enter { animation: toastSlideIn 0.3s ease-out forwards; }
      `}</style>
    </div>
  );
};

// --- MAIN LOGIN COMPONENT ---
export default function Login() {
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const [toast, setToast] = useState({ show: false, message: '', type: 'success', duration: 5000 });
  const [activeFaq, setActiveFaq] = useState(null);

  const showToast = (message, type = 'success', duration = 5000) => {
    setToast({ show: true, message, type, duration });
  };

  const hideToast = () => {
    setToast({ ...toast, show: false });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    showToast('Verifying credentials...', 'info', 2000);

    // Simulated delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    try {
      const response = await login(mobile, password);
      if (response.success) {
        showToast('Login successful! Redirecting...', 'success', 3000);
        setTimeout(() => navigate('/flight-search'), 2000);
      } else {
        console.log("Entering Error Block");
        const errorMsg = response.error || 'Login failed';
        setError(errorMsg);
        showToast(errorMsg, 'error');
      }
    } catch (err) {
      console.log("Entering Error Block");
      setError('Network error');
      showToast('Network error. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFaq = (index) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  return (
    <div className="login-page-wrapper">
      {toast.show && <Toast {...toast} onClose={hideToast} key={toast.message + toast.type} />}

      {/* --- SECTION 1: HERO LOGIN AREA --- */}
      <div className="login-container">
        <div className="login-left">
          <div className="image-container">
            <div className="person-image"></div>
          </div>
          <div className="services-container">
            <h1>One Stop Solution For<br />All Your Travel Needs</h1>
            <div className="services">
              <div className="service"><FaPlane className="service-icon" /><span>Flights</span></div>
              <div className="service"><FaHotel className="service-icon" /><span>Hotels</span></div>
              <div className="service"><FaTrain className="service-icon" /><span>Trains</span></div>
              <div className="service"><FaUmbrellaBeach className="service-icon" /><span>Holidays</span></div>
              <div className="service"><FaShip className="service-icon" /><span>Cruises</span></div>
              <div className="service"><FaPassport className="service-icon" /><span>Visas</span></div>
            </div>
          </div>
        </div>

        <div className="login-right">
          <h2>Welcome Back</h2>
          <p>Please login to manage your bookings</p>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="input-group">
              <FaMobile className="icon" />
              <input
                type="tel" placeholder="Mobile Number"
                value={mobile} onChange={(e) => setMobile(e.target.value)}
                required pattern="[0-9]{10}"
              />
            </div>
            <div className="input-group">
              <FaLock className="icon" />
              <input
                type="password" placeholder="Password"
                value={password} onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <div style={{ color: '#e74c3c', fontSize: '0.9rem' }}>{error}</div>}
            <button type="submit" className="login-btn" disabled={isLoading}>
              {isLoading ? 'Authenticating...' : 'Sign In Securely'}
            </button>
          </form>

          <div className="links">
            <Link to="/forgot-password">Forgot Password?</Link>
            <p>New User? <Link to="/signup"><span>Create Account</span></Link></p>
          </div>
        </div>
      </div>
      <Adv />

      {/* --- SECTION 2: WHY CHOOSE US --- */}
      <section className="content-section features-bg">
        <div className="section-header">
          <h2>Why Book With Us?</h2>
          <p>We provide the most reliable and comprehensive travel solutions in the market.</p>
        </div>
        <div className="features-grid">
          <div className="feature-card">
            <FaGlobeAmericas className="f-icon" />
            <h3>Global Coverage</h3>
            <p>Access flights and hotels in over 190 countries with real-time availability.</p>
          </div>
          <div className="feature-card">
            <FaHeadset className="f-icon" />
            <h3>24/7 Support</h3>
            <p>Our dedicated support team is available round the clock to assist you.</p>
          </div>
          <div className="feature-card">
            <FaShieldAlt className="f-icon" />
            <h3>Secure Booking</h3>
            <p>Bank-grade encryption ensures your data and payments are always safe.</p>
          </div>
          <div className="feature-card">
            <FaStar className="f-icon" />
            <h3>Best Rates</h3>
            <p>We guarantee the lowest prices with no hidden charges or convenience fees.</p>
          </div>
        </div>
      </section>

      {/* --- SECTION 4: STATS --- */}
      <section className="stats-bg">
        <div className="stats-container">
          <div className="stats-item"><h3>1M+</h3><p>Happy Travelers</p></div>
          <div className="stats-item"><h3>500+</h3><p>Airlines</p></div>
          <div className="stats-item"><h3>24/7</h3><p>Customer Support</p></div>
          <div className="stats-item"><h3>100%</h3><p>Secure Payments</p></div>
        </div>
      </section>

      {/* --- SECTION 3: POPULAR DESTINATIONS --- */}
      <section className="content-section destinations-bg">
        <div className="section-header">
          <h2>Trending Destinations</h2>
          <p>Explore the most visited cities this season.</p>
        </div>
        <div className="destinations-carousel">
          <Slider
            dots={true}
            infinite={true}
            speed={500}
            slidesToShow={4}
            slidesToScroll={1}
            autoplay={true}
            autoplaySpeed={3000}
            pauseOnHover={true}
            responsive={[
              {
                breakpoint: 1024,
                settings: {
                  slidesToShow: 3,
                  slidesToScroll: 1,
                }
              },
              {
                breakpoint: 768,
                settings: {
                  slidesToShow: 2,
                  slidesToScroll: 1
                }
              },
              {
                breakpoint: 480,
                settings: {
                  slidesToShow: 1,
                  slidesToScroll: 1
                }
              }
            ]}
          >
            {[
              { id: 1, name: 'Dubai', price: 499, image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=500&q=80' },
              { id: 2, name: 'Paris', price: 599, image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=500&q=80' },
              { id: 3, name: 'New York', price: 399, image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=500&q=80' },
              { id: 4, name: 'India', price: 999, image: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=500&q=80' },
              { id: 5, name: 'Tokyo', price: 899, image: 'https://images.unsplash.com/photo-1492571350019-22de08371fd3?w=500&q=80' },
              { id: 6, name: 'Sydney', price: 799, image: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=500&q=80' },
            ].map((destination) => (
              <div key={destination.id} className="carousel-slide">
                <div className="dest-card">
                  <div className="image-container2">
                    <img src={destination.image} alt={destination.name} className="dest-img" />
                  </div>
                  <div className="dest-overlay">
                    <h3>{destination.name}</h3>
                    <p>Starting @ ${destination.price}</p>
                    <button className="explore-btn">Explore Now</button>
                  </div>
                </div>
              </div>
            ))}
          </Slider>
        </div>
      </section>

    </div>
  );
}