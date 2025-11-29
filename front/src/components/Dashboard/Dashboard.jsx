import React, { useEffect, useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Layout from "../Layout/Layout";
import { fetchUserCount } from "../../api.js";
import {
  FaBoxes,
  FaUsers,
  FaTicketAlt,
  FaBook,
  FaCloudUploadAlt,
  FaFileExcel,
  FaSignOutAlt,
  FaBullhorn,
} from "react-icons/fa";
import { FiActivity } from "react-icons/fi";
import "./Dashboard.css";

function Dashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [userCount, setUserCount] = useState(0);
  const [newestSupplier, setNewestSupplier] = useState("");
  const [totalInventory, setTotalInventory] = useState(0);
  const [todayInventory, setTodayInventory] = useState(0);
  const [totalBookings, setTotalBookings] = useState(0);
  const [todayBookings, setTodayBookings] = useState(0);

  // Function to fetch user count
  const getUserCount = async () => {
    try {
      const response = await fetchUserCount();
      if (response.success && response.data.length > 0) {
        setUserCount(response.data[0].usersno);
        // Set the newest supplier name if available
        if (response.newestSuppliers && response.newestSuppliers.length > 0) {
          setNewestSupplier(response.newestSuppliers[0].fullname);
        }
        // Set flight search data if available
        if (response.flightSearchData) {
          setTotalInventory(response.flightSearchData.total);
          setTodayInventory(response.flightSearchData.today);
        }
        // Set booking data if available
        if (response.bookingData) {
          setTotalBookings(response.bookingData.total);
          setTodayBookings(response.bookingData.today);
        }
      }
    } catch (error) {
      console.error('Failed to fetch user count:', error);
    }
  };

  // Fetch user count on component mount
  useEffect(() => {
    getUserCount();
  }, []);

  const features = [
    {
      icon: <FaUsers />,
      value: userCount.toString(),
      label: "Users Active",
      color: "#ff6a00",
    },
    {
      icon: <FaBoxes />,
      value: totalInventory.toString(),
      label: "Total Inventory",
      color: "#2a5d4f",
    },
    {
      icon: <FaTicketAlt />,
      value: totalBookings.toString(),
      label: "Total Bookings",
      color: "#0077ff",
    },
    {
      icon: <FaBook />,
      value: "₹4.5M",
      label: "Ledger Balance",
      color: "#e91e63",
    },
  ];

  const recentActivity = [
    newestSupplier ? `New ticket booked for: ${newestSupplier}` : "New user registered: Loading...",
    `Inventory updated: + ${todayInventory} items`,
    `Tickets Booked Today: + ${todayBookings} tickets`,
    "Ledger credited with ₹50,000",
  ];

  const { currentUser, loading, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = useCallback(async () => {
    await logout();
  }, [logout]);

  useEffect(() => {
    if (!loading && !currentUser) {
      navigate("/");
    }
  }, [loading, currentUser, navigate]);

  if (loading) {
    return <div className="loading-container">Loading...</div>;
  }

  if (!currentUser) return null;

  return (
    <Layout>
      <div className="container">
        <div className="dashboard-container">
          {/* Header */}
          <div className="dashboard-header">
            <h1>
              Welcome back, <span>{currentUser.name || "User"}</span> 👋
            </h1>
          </div>

          {/* Stats */}
          <div className="dashboard">
            {features.map((item, index) => (
              <div
                key={index}
                className="stat-card"
                style={{ backgroundColor: item.color }}
              >
                <div className="stat-icon">{item.icon}</div>
                <div className="stat-info">
                  <div className="stat-top">
                    <h2>{item.value}</h2>
                    <span>{item.percent}</span>
                  </div>
                  <p>{item.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Recent Activity + Notice + Progress */}
          <div className="extras">
            <div className="activity">
              <h3>
                <FiActivity /> Recent Activity
              </h3>
              <ul>
                {recentActivity.map((activity, i) => (
                  <li key={i}>{activity}</li>
                ))}
              </ul>
            </div>

            <div className="announcement">
              <h3>
                <FaBullhorn /> Announcement
              </h3>
              <p>
                🚀 New version of the dashboard will launch next week with more
                analytics and insights!
              </p>
            </div>

            {/* Progress Card */}
            <div className="progress-card">
              <h3>Task Completion</h3>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: "75%" }}></div>
              </div>
              <span className="progress-text">75% Completed</span>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default React.memo(Dashboard);
