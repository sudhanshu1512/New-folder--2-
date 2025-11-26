import React, { useState, useEffect, useCallback } from "react";
import "./Navbar.css";
import api from "../../lib/api";
import { Link, useNavigate } from "react-router-dom";
import { FiMenu, FiX } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import { getLogo } from "../../services/logoService";
import logo from "../../assets/logo-img.png"

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState(null); // store user data
  const [logoUrl, setLogoUrl] = useState(logo); // Default to local logo
  const [isLogoLoading, setIsLogoLoading] = useState(true);
  const { currentUser, loading, logout } = useAuth();
  const [balance, setBalance] = useState(0);
  const navigate = useNavigate();

  const handleLogout = useCallback(async () => {
    try {
      await logout();
      setUser(null);
      navigate('/login');
    } catch (error) {
      console.error("Failed to log out", error);
    }
  }, [logout, navigate]);

  // Effect to fetch logo from database
  useEffect(() => {
    const fetchLogo = async () => {
      try {
        setIsLogoLoading(true);
        const result = await getLogo();
        if (result.success && result.url) {
          setLogoUrl(result.url);
        }
        // If no logo found or error, keep the default logo
      } catch (error) {
        console.error('Error loading logo:', error);
        // Keep default logo on error
      } finally {
        setIsLogoLoading(false);
      }
    };
    fetchLogo();
  }, []);

  // Effect to handle user state changes
  useEffect(() => {
    if (currentUser) {
      setUser(currentUser);
    } else {
      setUser(null);
    }
  }, [currentUser]);

  // Effect to handle navigation based on auth state
 useEffect(() => {
  const fetchBalance = async () => {
    try {
      const response = await api.get('auth/balance', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setBalance(data.balance);
      }
    } catch (error) {
      console.error('Error fetching balance:', error);
    }
  };

  if (user) {
    fetchBalance();
    // Optionally refresh balance every 5 minutes
    const interval = setInterval(fetchBalance, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }
}, [user]);

  if (loading) {
    return <div>Loading...</div>;
  }

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  return (
    <nav className="navbar">
      {/* Logo */}
      <div className="navbar-logo">
        <Link to="/" style={{ textDecoration: "none", color: "inherit" }}>
          {isLogoLoading ? (
            <div className="logo-loading">Loading...</div>
          ) : (
            <img 
              src={logoUrl} 
              alt="Company Logo" 
              onError={(e) => {
                // Fallback to default logo if database logo fails to load
                e.target.onerror = null;
                e.target.src = logo;
              }}
              style={{ maxHeight: '50px', width: 'auto' }}
            />
          )}
        </Link>
      </div>

      {/* Hamburger Menu Button */}
      <div className="menu-toggle" onClick={toggleMenu}>
        {isOpen ? <FiX size={28} /> : <FiMenu size={28} />}
      </div>

      {/* Menu */}
      <ul className={`navbar-menu ${isOpen ? "active" : ""}`}>
        {!user ? (
          <>
            {/* Before login */}
            <li><Link to="/services" onClick={closeMenu}>Services</Link></li>
            <li><Link to="/aboutus" onClick={closeMenu}>About</Link></li>
            <li><Link to="/contact" onClick={closeMenu}>Contact Us</Link></li>
            <li>
              <Link to="/signup" className="btn-started" onClick={closeMenu}>
                Get Started
              </Link>
            </li>
          </>
        ) : (
          <>
            {/* After login */}
            <li>
              <Link to="/dashboard" onClick={closeMenu}>Dashboard</Link>
            </li>
            <li className="navbar-user">
              👋 {user.name}
            </li>
            <li>
              <Link to="/booking-search" onClick={closeMenu}>Bookings</Link>
            </li>
            <li className="navbar-balance">
              💰 Balance: ₹ {balance.toFixed(2)}
            </li>
            <li>
              <Link to="/my-profile" onClick={closeMenu}>My Profile</Link>
            </li>
            <li>
              <button className="btn-started" onClick={handleLogout}>
                Logout
              </button>
            </li>
          </>
        )}
      </ul>
    </nav>
  );
};

export default Navbar;
