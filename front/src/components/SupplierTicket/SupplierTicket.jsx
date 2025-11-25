import React, { useState } from 'react';
import { FiFileText } from 'react-icons/fi';
import axios from 'axios';
import styles from './SupplierTicket.module.css';
import Layout from '../Layout/Layout';

// --- NEW Dummy Data (Reflecting the 20 new columns) ---
const DUMMY_TICKETS = [
  {
    id: 1,
    status: 'Confirmed',
    orderId: 'ORD-2025-001',
    invoiceNo: 'INV-A1B2',
    supplierName: 'Indigo',
    supplierMobile: '9988776655',
    supplierEmail: 'indigo@supplier.com',
    agencyName: 'Sky High Travels',
    agencyMobile: '8877665544',
    agencyEmail: 'contact@skyhigh.com',
    paxMobile: '7766554433',
    pnr: 'AB12CD',
    ticketNo: 'TKT12345678',
    paxName: 'Mr. Rohan Sharma',
    airline: 'Indigo (6E)',
    sector: 'DEL-BOM',
    bookingDate: '2025-09-01',
    journeyDate: '2025-09-10',
    baseFare: 4500,
    otherTax: 1200,
    totalAmount: 5700,
  },
  {
    id: 2,
    status: 'Cancelled',
    orderId: 'ORD-2025-002',
    invoiceNo: 'INV-C3D4',
    supplierName: 'Air India',
    supplierMobile: '9123456789',
    supplierEmail: 'airindia@supplier.com',
    agencyName: 'Happy Journeys',
    agencyMobile: '8234567890',
    agencyEmail: 'info@happyjourneys.com',
    paxMobile: '7345678901',
    pnr: 'EF34GH',
    ticketNo: 'TKT87654321',
    paxName: 'Ms. Priya Mehta',
    airline: 'Air India (AI)',
    sector: 'BOM-DXB',
    bookingDate: '2025-08-25',
    journeyDate: '2025-09-12',
    baseFare: 12000,
    otherTax: 3500,
    totalAmount: 15500,
  },
  {
    id: 3,
    status: 'Cancelled',
    orderId: 'ORD-2025-002',
    invoiceNo: 'INV-C3D4',
    supplierName: 'Air India',
    supplierMobile: '9123456789',
    supplierEmail: 'airindia@supplier.com',
    agencyName: 'Happy Journeys',
    agencyMobile: '8234567890',
    agencyEmail: 'info@happyjourneys.com',
    paxMobile: '7345678901',
    pnr: 'EF34GH',
    ticketNo: 'TKT87654321',
    paxName: 'Ms. Priya Mehta',
    airline: 'Air India (AI)',
    sector: 'BOM-DXB',
    bookingDate: '2025-08-25',
    journeyDate: '2025-09-12',
    baseFare: 12000,
    otherTax: 3500,
    totalAmount: 15500,
  },
  {
    id: 4,
    status: 'Cancelled',
    orderId: 'ORD-2025-002',
    invoiceNo: 'INV-C3D4',
    supplierName: 'Air India',
    supplierMobile: '9123456789',
    supplierEmail: 'airindia@supplier.com',
    agencyName: 'Happy Journeys',
    agencyMobile: '8234567890',
    agencyEmail: 'info@happyjourneys.com',
    paxMobile: '7345678901',
    pnr: 'EF34GH',
    ticketNo: 'TKT87654321',
    paxName: 'Ms. Priya Mehta',
    airline: 'Air India (AI)',
    sector: 'BOM-DXB',
    bookingDate: '2025-08-25',
    journeyDate: '2025-09-12',
    baseFare: 12000,
    otherTax: 3500,
    totalAmount: 15500,
  },
  {
    id: 5,
    status: 'Cancelled',
    orderId: 'ORD-2025-002',
    invoiceNo: 'INV-C3D4',
    supplierName: 'Air India',
    supplierMobile: '9123456789',
    supplierEmail: 'airindia@supplier.com',
    agencyName: 'Happy Journeys',
    agencyMobile: '8234567890',
    agencyEmail: 'info@happyjourneys.com',
    paxMobile: '7345678901',
    pnr: 'EF34GH',
    ticketNo: 'TKT87654321',
    paxName: 'Ms. Priya Mehta',
    airline: 'Air India (AI)',
    sector: 'BOM-DXB',
    bookingDate: '2025-08-25',
    journeyDate: '2025-09-12',
    baseFare: 12000,
    otherTax: 3500,
    totalAmount: 15500,
  },
  {
    id: 6,
    status: 'Cancelled',
    orderId: 'ORD-2025-002',
    invoiceNo: 'INV-C3D4',
    supplierName: 'Air India',
    supplierMobile: '9123456789',
    supplierEmail: 'airindia@supplier.com',
    agencyName: 'Happy Journeys',
    agencyMobile: '8234567890',
    agencyEmail: 'info@happyjourneys.com',
    paxMobile: '7345678901',
    pnr: 'EF34GH',
    ticketNo: 'TKT87654321',
    paxName: 'Ms. Priya Mehta',
    airline: 'Air India (AI)',
    sector: 'BOM-DXB',
    bookingDate: '2025-08-25',
    journeyDate: '2025-09-12',
    baseFare: 12000,
    otherTax: 3500,
    totalAmount: 15500,
  },
  {
    id: 7,
    status: 'Cancelled',
    orderId: 'ORD-2025-002',
    invoiceNo: 'INV-C3D4',
    supplierName: 'Air India',
    supplierMobile: '9123456789',
    supplierEmail: 'airindia@supplier.com',
    agencyName: 'Happy Journeys',
    agencyMobile: '8234567890',
    agencyEmail: 'info@happyjourneys.com',
    paxMobile: '7345678901',
    pnr: 'EF34GH',
    ticketNo: 'TKT87654321',
    paxName: 'Ms. Priya Mehta',
    airline: 'Air India (AI)',
    sector: 'BOM-DXB',
    bookingDate: '2025-08-25',
    journeyDate: '2025-09-12',
    baseFare: 12000,
    otherTax: 3500,
    totalAmount: 15500,
  },
  {
    id: 8,
    status: 'Cancelled',
    orderId: 'ORD-2025-002',
    invoiceNo: 'INV-C3D4',
    supplierName: 'Air India',
    supplierMobile: '9123456789',
    supplierEmail: 'airindia@supplier.com',
    agencyName: 'Happy Journeys',
    agencyMobile: '8234567890',
    agencyEmail: 'info@happyjourneys.com',
    paxMobile: '7345678901',
    pnr: 'EF34GH',
    ticketNo: 'TKT87654321',
    paxName: 'Ms. Priya Mehta',
    airline: 'Air India (AI)',
    sector: 'BOM-DXB',
    bookingDate: '2025-08-25',
    journeyDate: '2025-09-12',
    baseFare: 12000,
    otherTax: 3500,
    totalAmount: 15500,
  },
  {
    id: 9,
    status: 'Cancelled',
    orderId: 'ORD-2025-002',
    invoiceNo: 'INV-C3D4',
    supplierName: 'Air India',
    supplierMobile: '9123456789',
    supplierEmail: 'airindia@supplier.com',
    agencyName: 'Happy Journeys',
    agencyMobile: '8234567890',
    agencyEmail: 'info@happyjourneys.com',
    paxMobile: '7345678901',
    pnr: 'EF34GH',
    ticketNo: 'TKT87654321',
    paxName: 'Ms. Priya Mehta',
    airline: 'Air India (AI)',
    sector: 'BOM-DXB',
    bookingDate: '2025-08-25',
    journeyDate: '2025-09-12',
    baseFare: 12000,
    otherTax: 3500,
    totalAmount: 15500,
  },
  {
    id: 10,
    status: 'Cancelled',
    orderId: 'ORD-2025-002',
    invoiceNo: 'INV-C3D4',
    supplierName: 'Air India',
    supplierMobile: '9123456789',
    supplierEmail: 'airindia@supplier.com',
    agencyName: 'Happy Journeys',
    agencyMobile: '8234567890',
    agencyEmail: 'info@happyjourneys.com',
    paxMobile: '7345678901',
    pnr: 'EF34GH',
    ticketNo: 'TKT87654321',
    paxName: 'Ms. Priya Mehta',
    airline: 'Air India (AI)',
    sector: 'BOM-DXB',
    bookingDate: '2025-08-25',
    journeyDate: '2025-09-12',
    baseFare: 12000,
    otherTax: 3500,
    totalAmount: 15500,
  },
  {
    id: 11,
    status: 'Cancelled',
    orderId: 'ORD-2025-002',
    invoiceNo: 'INV-C3D4',
    supplierName: 'Air India',
    supplierMobile: '9123456789',
    supplierEmail: 'airindia@supplier.com',
    agencyName: 'Happy Journeys',
    agencyMobile: '8234567890',
    agencyEmail: 'info@happyjourneys.com',
    paxMobile: '7345678901',
    pnr: 'EF34GH',
    ticketNo: 'TKT87654321',
    paxName: 'Ms. Priya Mehta',
    airline: 'Air India (AI)',
    sector: 'BOM-DXB',
    bookingDate: '2025-08-25',
    journeyDate: '2025-09-12',
    baseFare: 12000,
    otherTax: 3500,
    totalAmount: 15500,
  },
  {
    id: 12,
    status: 'Cancelled',
    orderId: 'ORD-2025-002',
    invoiceNo: 'INV-C3D4',
    supplierName: 'Air India',
    supplierMobile: '9123456789',
    supplierEmail: 'airindia@supplier.com',
    agencyName: 'Happy Journeys',
    agencyMobile: '8234567890',
    agencyEmail: 'info@happyjourneys.com',
    paxMobile: '7345678901',
    pnr: 'EF34GH',
    ticketNo: 'TKT87654321',
    paxName: 'Ms. Priya Mehta',
    airline: 'Air India (AI)',
    sector: 'BOM-DXB',
    bookingDate: '2025-08-25',
    journeyDate: '2025-09-12',
    baseFare: 12000,
    otherTax: 3500,
    totalAmount: 15500,
  },
  {
    id: 13,
    status: 'Cancelled',
    orderId: 'ORD-2025-002',
    invoiceNo: 'INV-C3D4',
    supplierName: 'Air India',
    supplierMobile: '9123456789',
    supplierEmail: 'airindia@supplier.com',
    agencyName: 'Happy Journeys',
    agencyMobile: '8234567890',
    agencyEmail: 'info@happyjourneys.com',
    paxMobile: '7345678901',
    pnr: 'EF34GH',
    ticketNo: 'TKT87654321',
    paxName: 'Ms. Priya Mehta',
    airline: 'Air India (AI)',
    sector: 'BOM-DXB',
    bookingDate: '2025-08-25',
    journeyDate: '2025-09-12',
    baseFare: 12000,
    otherTax: 3500,
    totalAmount: 15500,
  },
  {
    id: 14,
    status: 'Cancelled',
    orderId: 'ORD-2025-002',
    invoiceNo: 'INV-C3D4',
    supplierName: 'Air India',
    supplierMobile: '9123456789',
    supplierEmail: 'airindia@supplier.com',
    agencyName: 'Happy Journeys',
    agencyMobile: '8234567890',
    agencyEmail: 'info@happyjourneys.com',
    paxMobile: '7345678901',
    pnr: 'EF34GH',
    ticketNo: 'TKT87654321',
    paxName: 'Ms. Priya Mehta',
    airline: 'Air India (AI)',
    sector: 'BOM-DXB',
    bookingDate: '2025-08-25',
    journeyDate: '2025-09-12',
    baseFare: 12000,
    otherTax: 3500,
    totalAmount: 15500,
  },
  {
    id: 15,
    status: 'Cancelled',
    orderId: 'ORD-2025-002',
    invoiceNo: 'INV-C3D4',
    supplierName: 'Air India',
    supplierMobile: '9123456789',
    supplierEmail: 'airindia@supplier.com',
    agencyName: 'Happy Journeys',
    agencyMobile: '8234567890',
    agencyEmail: 'info@happyjourneys.com',
    paxMobile: '7345678901',
    pnr: 'EF34GH',
    ticketNo: 'TKT87654321',
    paxName: 'Ms. Priya Mehta',
    airline: 'Air India (AI)',
    sector: 'BOM-DXB',
    bookingDate: '2025-08-25',
    journeyDate: '2025-09-12',
    baseFare: 12000,
    otherTax: 3500,
    totalAmount: 15500,
  },
  {
    id: 16,
    status: 'Cancelled',
    orderId: 'ORD-2025-002',
    invoiceNo: 'INV-C3D4',
    supplierName: 'Air India',
    supplierMobile: '9123456789',
    supplierEmail: 'airindia@supplier.com',
    agencyName: 'Happy Journeys',
    agencyMobile: '8234567890',
    agencyEmail: 'info@happyjourneys.com',
    paxMobile: '7345678901',
    pnr: 'EF34GH',
    ticketNo: 'TKT87654321',
    paxName: 'Ms. Priya Mehta',
    airline: 'Air India (AI)',
    sector: 'BOM-DXB',
    bookingDate: '2025-08-25',
    journeyDate: '2025-09-12',
    baseFare: 12000,
    otherTax: 3500,
    totalAmount: 15500,
  },
  // ... add more dummy data here to test pagination if needed
];

export default function SupplierTicket() {
  const [filters, setFilters] = useState({});
  const [tickets, setTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // --- PAGINATION STATE ---
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  // ------------------------

  // --- NEW: Helper to open picker on click ---
  const handleInputClick = (e) => {
    try {
      if (typeof e.target.showPicker === 'function') {
        e.target.showPicker();
      }
    } catch (error) {
      console.log('Picker could not be opened programmatically', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters(prevFilters => ({ ...prevFilters, [name]: value }));
  };

  const handleSearch = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setTickets(DUMMY_TICKETS);
      setCurrentPage(1); // Reset to page 1 on new search
    } catch (err) {
      setError("Could not fetch data.");
      setTickets([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = () => {
    if (tickets.length === 0) {
      alert('No data to export');
      return;
    }

    // Define all column headers
    const headers = [
      'STATUS',
      'ORDER ID',
      'INVOICE NO',
      'SUPPLIER NAME',
      'SUPPLIER MOBILE',
      'SUPPLIER EMAIL',
      'AGENCY NAME',
      'AGENCY MOBILE',
      'AGENCY EMAIL',
      'PAX MOBILE',
      'PNR',
      'TICKET NO',
      'PAX NAME',
      'AIRLINE',
      'SECTOR',
      'BOOKING DATE',
      'JOURNEY DATE',
      'BASE FARE',
      'OTHER TAX',
      'TOTAL AMOUNT'
    ];

    // Create CSV rows
    const csvRows = [
      headers.join(','), // Header row
      ...tickets.map(ticket => [
        `"${ticket.status}"`,
        `"${ticket.orderId}"`,
        `"${ticket.invoiceNo}"`,
        `"${ticket.supplierName}"`,
        `"${ticket.supplierMobile}"`,
        `"${ticket.supplierEmail}"`,
        `"${ticket.agencyName}"`,
        `"${ticket.agencyMobile}"`,
        `"${ticket.agencyEmail}"`,
        `"${ticket.paxMobile}"`,
        `"${ticket.pnr}"`,
        `"${ticket.ticketNo}"`,
        `"${ticket.paxName}"`,
        `"${ticket.airline}"`,
        `"${ticket.sector}"`,
        `"${new Date(ticket.bookingDate).toLocaleDateString()}"`,
        `"${new Date(ticket.journeyDate).toLocaleDateString()}"`,
        `"₹${ticket.baseFare?.toLocaleString() || '0'}"`,
        `"₹${ticket.otherTax?.toLocaleString() || '0'}"`,
        `"₹${ticket.totalAmount?.toLocaleString() || '0'}"`
      ].map(field => field.replace(/"/g, '""')).join(',')) // Escape quotes in data
    ];

    // Create CSV string
    const csvString = csvRows.join('\n');

    // Create a Blob with the CSV data
    const blob = new Blob(["\uFEFF" + csvString], { type: 'text/csv;charset=utf-8;' });

    // Create a download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `supplier-tickets-${new Date().toISOString().split('T')[0]}.csv`);

    // Trigger the download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- PAGINATION LOGIC ---
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = tickets.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(tickets.length / itemsPerPage);

  const handlePageChange = (pageNumber) => {
    if (pageNumber > 0 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };
  // ------------------------

  return (

    <Layout>
      <div className={styles.ticketReportContainer}>
        <h2 className={styles.pageTitle}><FiFileText className={styles.icon} /> Supplier Ticket Report</h2>

        {/* --- The Search Form Card --- */}
        <div className={styles.searchCard}>
          <div className={styles.formGrid}>
            <div className={styles.formGroup}><label>Supplier</label><select name="supplier" value={filters.supplier} onChange={handleChange}><option value="">Select supplier</option><option value="Indigo">Indigo</option></select></div>

            {/* --- UPDATED: Added onClick and cursor style --- */}
            <div className={styles.formGroup}>
              <label>From</label>
              <input
                type="date"
                name="fromDate"
                value={filters.fromDate}
                onChange={handleChange}
                onClick={handleInputClick}
                style={{ cursor: 'pointer' }}
              />
            </div>

            {/* --- UPDATED: Added onClick and cursor style --- */}
            <div className={styles.formGroup}>
              <label>To</label>
              <input
                type="date"
                name="toDate"
                value={filters.toDate}
                onChange={handleChange}
                onClick={handleInputClick}
                style={{ cursor: 'pointer' }}
              />
            </div>

            <div className={styles.formGroup}><label>PNR</label><input type="text" name="pnr" placeholder="PNR..." value={filters.pnr} onChange={handleChange} /></div>
            <div className={styles.formGroup}><label>Order Id</label><input type="text" name="orderId" placeholder="Orderid.." value={filters.orderId} onChange={handleChange} /></div>
            <div className={styles.formGroup}><label>Pax Mobile</label><input type="text" name="paxMobile" placeholder="Pax Mobile.." value={filters.paxMobile} onChange={handleChange} /></div>
            <div className={styles.formGroup}><label>Agency Name</label><select name="agencyName" value={filters.agencyName} onChange={handleChange}><option value="">Select Agency</option><option value="Sky Travels">Sky Travels</option></select></div>
            <div className={styles.formGroup}><label>Ticket No.</label><input type="text" name="ticketNo" placeholder="TicketNo.." value={filters.ticketNo} onChange={handleChange} /></div>
            <div className={styles.formGroup}><label>Airline</label><select name="airline" value={filters.airline} onChange={handleChange}><option value="">Select Airline</option><option value="6E">Indigo (6E)</option></select></div>
            <div className={styles.formGroup}><label>Status</label><select name="status" value={filters.status} onChange={handleChange}><option value="">Select</option><option value="Confirmed">Confirmed</option></select></div>
          </div>
          <div className={styles.buttonGroup}>
            <button className={styles.searchButton} onClick={handleSearch} disabled={isLoading}>{isLoading ? 'Searching...' : 'SEARCH RESULT'}</button>
            <button className={styles.exportButton} onClick={handleExport}>EXPORT</button>
          </div>
        </div>

        {/* --- Results Section --- */}
        <div className={styles.resultsCard}>
          <table className={styles.resultsTable}>
            <thead>
              <tr>
                <th>STATUS</th>
                <th>ORDER ID</th>
                <th>INVOICE NO</th>
                <th>SUPPLIER NAME</th>
                <th>SUPPLIER MOBILE</th>
                <th>SUPPLIER EMAIL</th>
                <th>AGENCY NAME</th>
                <th>AGENCY MOBILE</th>
                <th>AGENCY EMAIL</th>
                <th>PAX MOBILE</th>
                <th>PNR</th>
                <th>TICKET NO</th>
                <th>PAX NAME</th>
                <th>AIRLINE</th>
                <th>SECTOR</th>
                <th>BOOKING DATE</th>
                <th>JOURNEY DATE</th>
                <th>BASE FARE</th>
                <th>OTHER TAX</th>
                <th>TOTAL AMOUNT</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan="20" className={styles.loadingCell}>Loading...</td></tr>
              ) : tickets.length > 0 ? (
                // --- PAGINATION: Use currentItems here ---
                currentItems.map((ticket) => (
                  <tr key={ticket.id}>
                    <td><span className={`${styles.statusBadge} ${styles[`status${ticket.status}`]}`}>{ticket.status}</span></td>
                    <td>{ticket.orderId}</td>
                    <td>{ticket.invoiceNo}</td>
                    <td>{ticket.supplierName}</td>
                    <td>{ticket.supplierMobile}</td>
                    <td>{ticket.supplierEmail}</td>
                    <td>{ticket.agencyName}</td>
                    <td>{ticket.agencyMobile}</td>
                    <td>{ticket.agencyEmail}</td>
                    <td>{ticket.paxMobile}</td>
                    <td>{ticket.pnr}</td>
                    <td>{ticket.ticketNo}</td>
                    <td>{ticket.paxName}</td>
                    <td>{ticket.airline}</td>
                    <td>{ticket.sector}</td>
                    <td>{ticket.bookingDate}</td>
                    <td>{ticket.journeyDate}</td>
                    <td className={styles.currency}>₹{ticket.baseFare.toLocaleString('en-IN')}</td>
                    <td className={styles.currency}>₹{ticket.otherTax.toLocaleString('en-IN')}</td>
                    <td className={`${styles.currency} ${styles.total}`}>₹{ticket.totalAmount.toLocaleString('en-IN')}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="20" className={styles.noRecordFound}>No Record Found</td>
                </tr>
              )}
            </tbody>
          </table>

          {/* --- PAGINATION CONTROLS --- */}
          {tickets.length > itemsPerPage && (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              marginTop: '20px',
              padding: '10px',
              gap: '15px'
            }}>
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                style={{
                  padding: '8px 16px',
                  backgroundColor: currentPage === 1 ? '#e2e8f0' : '#007bff',
                  color: currentPage === 1 ? '#64748b' : '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  transition: 'background-color 0.2s'
                }}
              >
                Previous
              </button>

              <span style={{ fontSize: '14px', fontWeight: '600', color: '#334155' }}>
                Page {currentPage} of {totalPages}
              </span>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                style={{
                  padding: '8px 16px',
                  backgroundColor: currentPage === totalPages ? '#e2e8f0' : '#007bff',
                  color: currentPage === totalPages ? '#64748b' : '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  transition: 'background-color 0.2s'
                }}
              >
                Next
              </button>
            </div>
          )}

        </div>

      </div>
    </Layout>
  );
}