// src/components/Layout/Layout.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiMenu, FiX } from 'react-icons/fi';
import { FaBoxes, FaUsers, FaTicketAlt, FaBook, FaCloudUploadAlt, FaFileExcel, FaSignOutAlt } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import './Layout.css';

const Layout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { logout } = useAuth(); // Make sure to import useAuth

  return (
    <div className="layout-container">
      {/* Hamburger button (mobile) */}
      <button
        className={`hamburger ${isSidebarOpen ? 'open' : ''}`}
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
      >
        {isSidebarOpen ? <FiX size={24} /> : <FiMenu size={24} />}
      </button>

      {/* Sidebar */}
      <div className={`sidebar ${isSidebarOpen ? "open" : ""}`}>
         <Link className='logo' style={{ textDecoration: "none", color: "inherit" }} to="/dashboard">Dashboard</Link>
        <div className="sidebar-content">
          <Link to="/inventory"><FaBoxes /> All Inventory</Link>
          <Link to="/supplier-list"><FaUsers /> Supplier List</Link>
          <Link to="/supplier-ticket"><FaTicketAlt /> Tickets</Link>
          <Link to="/supplier-ledger"><FaBook /> Ledger</Link>
          <Link to="/vender-list"><FaCloudUploadAlt /> Vendors</Link>
          {/* <Link to="/upload-excel"><FaFileExcel /> Upload Excel</Link> */}
          <button onClick={() => logout()} className="logout-btn">
            <FaSignOutAlt /> Logout
          </button>
        </div>
      </div>

      {/* Page Content */}
      <div className="main-content">
        {children}
      </div>
    </div>
  );
};

export default Layout;