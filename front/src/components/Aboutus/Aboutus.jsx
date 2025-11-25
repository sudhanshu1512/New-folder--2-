import React from 'react';
import { 
  FaPlaneDeparture, 
  FaHandshake, 
  FaGlobeAmericas, 
  FaUsers, 
  FaHeadset, 
  FaChartLine, 
  FaTag,
  FaCheckCircle
} from 'react-icons/fa';
import './AboutUs.css';
import { useNavigate } from 'react-router-dom';

const AboutUs = () => {
  return (
    <div className="about-wrapper">
      {/* --- HERO SECTION --- */}
      <section className="about-hero">
        <div className="hero-content">
          <span className="hero-subtitle">Welcome to BookByOwn</span>
          <h1 className="animate-slide-up">Redefining the <span className="highlight">Travel Industry</span></h1>
          <p className="animate-fade-in">
            Bridging the gap between premium inventory and unbeatable prices for Agents & Travelers.
          </p>
        </div>
      </section>

      <div className="content-container">
        {/* --- OUR STORY / MISSION --- */}
        <section className="mission-section">
          <div className="mission-grid">
            <div className="mission-text">
              <h2 className="section-title">Who We Are</h2>
              <div className="title-underline"></div>
              <p>
                We are a leading aggregator of <strong>Flight Inventory</strong>. 
                Unlike dynamic pricing models, we pre-purchase seats on high-demand sectors to guarantee 
                availability and lock in prices that the open market cannot match.
              </p>
              <p>
                Whether you are a travel agent looking to maximize margins or a solo traveler 
                hunting for the best deal, we provide a seamless, tech-driven platform to meet your needs.
              </p>
              
              <div className="mission-badges">
                <div className="badge">
                    <FaCheckCircle className="badge-icon"/> <span>Fixed Prices</span>
                </div>
                <div className="badge">
                    <FaCheckCircle className="badge-icon"/> <span>Guaranteed Seats</span>
                </div>
              </div>
            </div>
            <div className="mission-image-wrapper">
              <img 
                src="https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=800&q=80" 
                alt="Airplane Wing" 
                className="mission-img"
              />
              <div className="floating-card">
                <FaPlaneDeparture className="float-icon"/>
                <div>
                    <strong>500+</strong>
                    <span>Daily Flights</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* --- STATS SECTION --- */}
        <section className="stats-bar">
            <div className="stat-item">
                <h2>500+</h2>
                <p>Registered Agents</p>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
                <h2>100k+</h2>
                <p>Seats Sold</p>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
                <h2>50+</h2>
                <p>Global Destinations</p>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
                <h2>24/7</h2>
                <p>Support System</p>
            </div>
        </section>

        {/* --- BUSINESS MODELS (B2B & B2C) --- */}
        <section className="solutions-section">
          <div className="section-header center">
            <h2>One Platform, Two Solutions</h2>
            <p>Tailored services for our diverse ecosystem</p>
          </div>

          <div className="models-grid">
            {/* B2B Card */}
            <div className="solution-card b2b">
              <div className="card-icon-bg">
                <FaHandshake />
              </div>
              <h3>For B2B Agents</h3>
              <p className="card-desc">Maximize your earnings with our agent-first platform.</p>
              <ul className="feature-list">
                <li><FaChartLine className="list-icon"/> High Commission Margins</li>
                <li><FaPlaneDeparture className="list-icon"/> Instant PNR Generation</li>
                <li><FaUsers className="list-icon"/> Dedicated Account Manager</li>
                <li><FaGlobeAmericas className="list-icon"/> Exclusive Group Inventory</li>
              </ul>
              <button className="btn-primary"><a href='/signup' style={{textDecoration: 'none', color: 'white'}}>Register as Agent</a></button>
            </div>

            {/* B2C Card */}
            <div className="solution-card b2c">
              <div className="card-icon-bg orange">
                <FaUsers />
              </div>
              <h3>For B2C Travelers</h3>
              <p className="card-desc">Fly cheaper and smarter with our direct inventory.</p>
              <ul className="feature-list">
                <li><FaTag className="list-icon orange-text"/> Unbeatable Flat Rates</li>
                <li><FaHeadset className="list-icon orange-text"/> 24/7 Customer Support</li>
                <li><FaPlaneDeparture className="list-icon orange-text"/> Guaranteed Seats in Peak Season</li>
                <li><FaGlobeAmericas className="list-icon orange-text"/> No Hidden Convenience Fees</li>
              </ul>
              <button className="btn-secondary">Book a Flight</button>
            </div>
          </div>
        </section>

        {/* --- WHY CHOOSE US --- */}
        <section className="features-section">
          <div className="section-header">
            <h2>Why Choose Us?</h2>
          </div>
          <div className="features-grid">
            <div className="feature-box">
              <div className="feature-img-overlay"></div>
              <img src="https://images.unsplash.com/photo-1569154941061-e231b4725ef1?auto=format&fit=crop&w=500&q=60" alt="Price" />
              <div className="feature-content">
                <h3>Price Stability</h3>
                <p>Immune to last-minute price surges. Pay what you see.</p>
              </div>
            </div>
            <div className="feature-box">
              <div className="feature-img-overlay"></div>
              <img src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=500&q=60" alt="Tech" />
              <div className="feature-content">
                <h3>Seamless Tech</h3>
                <p>API integrations and a user-friendly dashboard for instant booking.</p>
              </div>
            </div>
            <div className="feature-box">
              <div className="feature-img-overlay"></div>
              <img src="https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=500&q=60" alt="Inventory" />
              <div className="feature-content">
                <h3>Massive Inventory</h3>
                <p>Access to sectors that are usually sold out on other OTAs.</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AboutUs;