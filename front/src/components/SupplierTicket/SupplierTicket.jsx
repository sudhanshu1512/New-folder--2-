import React, { useState, useEffect } from 'react';
import { FiFileText } from 'react-icons/fi';
import styles from './SupplierTicket.module.css';
import Layout from '../Layout/Layout';
// Using your configured axios instance which likely handles Auth headers
import api from "../../lib/api";

export default function SupplierTicket() {
  const [filters, setFilters] = useState({
    supplier: '',
    fromDate: '',
    toDate: '',
    pnr: '',
    orderId: '',
    paxMobile: '',
    agencyName: '',
    ticketNo: '',
    airline: '',
    status: ''
  });

  const [tickets, setTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // --- PAGINATION STATE ---
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // --- Initial Load ---
  useEffect(() => {
  }, []);

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

  // --- CORE API FETCH FUNCTION ---
  const fetchTickets = async () => {
    setIsLoading(true);
    setError(null);
    setTickets([]);

    try {
      // Prepare Query Params
      const params = {};
      if (filters.orderId) params.orderId = filters.orderId;
      if (filters.fromDate) params.fromDate = filters.fromDate;
      if (filters.toDate) params.toDate = filters.toDate;

      // Make the API Call
      const response = await api.get('/flight-bookings', { params });

      if (response.data.success) {
        const mappedData = response.data.data.map((item, index) => ({
          id: item.OrderId || index, // Unique key
          status: item.Status,
          orderId: item.OrderId,
          invoiceNo: item.Invoice,
          supplierName: item['Supplier Name'],
          supplierMobile: item['Supplier Mob'],
          supplierEmail: item['Supplier Mail'],
          agencyName: item['Agency Name'],
          agencyMobile: item['Agency Mobile'],
          agencyEmail: item['Agency Mail'],
          paxMobile: item['Pax Mobile'],
          pnr: item.PNR,
          ticketNo: item.Ticket,
          paxName: item['Pax Name'],
          airline: item.Airline,
          sector: item.Sector,
          bookingDate: item['Booking Date'],
          journeyDate: item['Journey Date'],
          baseFare: item['Base Fare'],
          otherTax: item['Other Tax'],
          totalAmount: item['Total Amount']
        }));

        const filteredResult = mappedData.filter(ticket => {
          return (
            (!filters.pnr || ticket.pnr?.toLowerCase().includes(filters.pnr.toLowerCase())) &&
            (!filters.paxMobile || ticket.paxMobile?.includes(filters.paxMobile)) &&
            (!filters.ticketNo || ticket.ticketNo?.includes(filters.ticketNo)) &&
            (!filters.status || ticket.status?.toLowerCase() === filters.status.toLowerCase()) &&
            (!filters.airline || ticket.airline?.toLowerCase().includes(filters.airline.toLowerCase())) &&
            (!filters.supplier || ticket.supplierName?.toLowerCase().includes(filters.supplier.toLowerCase())) &&
            (!filters.agencyName || ticket.agencyName?.toLowerCase().includes(filters.agencyName.toLowerCase()))
          );
        });

        setTickets(filteredResult);
        setCurrentPage(1);
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Failed to fetch booking details.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchTickets();
  };

  const handleExport = () => {
    if (tickets.length === 0) {
      alert('No data to export');
      return;
    }

    const headers = [
      'STATUS', 'ORDER ID', 'INVOICE NO', 'SUPPLIER NAME', 'SUPPLIER MOBILE', 'SUPPLIER EMAIL',
      'AGENCY NAME', 'AGENCY MOBILE', 'AGENCY EMAIL', 'PAX MOBILE', 'PNR', 'TICKET NO',
      'PAX NAME', 'AIRLINE', 'SECTOR', 'BOOKING DATE', 'JOURNEY DATE', 'BASE FARE', 'OTHER TAX', 'TOTAL AMOUNT'
    ];

    const csvRows = [
      headers.join(','),
      ...tickets.map(ticket => [
        `"${ticket.status || ''}"`,
        `"${ticket.orderId || ''}"`,
        `"${ticket.invoiceNo || ''}"`,
        `"${ticket.supplierName || ''}"`,
        `"${ticket.supplierMobile || ''}"`,
        `"${ticket.supplierEmail || ''}"`,
        `"${ticket.agencyName || ''}"`,
        `"${ticket.agencyMobile || ''}"`,
        `"${ticket.agencyEmail || ''}"`,
        `"${ticket.paxMobile || ''}"`,
        `"${ticket.pnr || ''}"`,
        `"${ticket.ticketNo || ''}"`,
        `"${ticket.paxName || ''}"`,
        `"${ticket.airline || ''}"`,
        `"${ticket.sector || ''}"`,
        `"${ticket.bookingDate ? new Date(ticket.bookingDate).toLocaleDateString() : ''}"`,
        `"${ticket.journeyDate ? new Date(ticket.journeyDate).toLocaleDateString() : ''}"`,
        `"${ticket.baseFare || 0}"`,
        `"${ticket.otherTax || 0}"`,
        `"${ticket.totalAmount || 0}"`
      ].join(','))
    ];

    const csvString = csvRows.join('\n');
    const blob = new Blob(["\uFEFF" + csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `supplier-tickets-${new Date().toISOString().split('T')[0]}.csv`);
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

  return (
    <Layout>
      <div className={styles.ticketReportContainer}>
        <h2 className={styles.pageTitle}><FiFileText className={styles.icon} /> Supplier Ticket Report</h2>

        {/* --- Search Form --- */}
        <div className={styles.searchCard}>
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label>Supplier</label>
              {/* Note: You might want to populate this select dynamically from an API later */}
              <select name="supplier" value={filters.supplier} onChange={handleChange}>
                <option value="">Select supplier</option>
                <option value="Indigo">Indigo</option>
                <option value="Air India">Air India</option>
                <option value="SpiceJet">SpiceJet</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>From</label>
              <input type="date" name="fromDate" value={filters.fromDate} onChange={handleChange} onClick={handleInputClick} style={{ cursor: 'pointer' }} />
            </div>

            <div className={styles.formGroup}>
              <label>To</label>
              <input type="date" name="toDate" value={filters.toDate} onChange={handleChange} onClick={handleInputClick} style={{ cursor: 'pointer' }} />
            </div>

            <div className={styles.formGroup}><label>PNR</label><input type="text" name="pnr" placeholder="PNR..." value={filters.pnr} onChange={handleChange} /></div>
            <div className={styles.formGroup}><label>Order Id</label><input type="text" name="orderId" placeholder="Orderid.." value={filters.orderId} onChange={handleChange} /></div>
            <div className={styles.formGroup}><label>Pax Mobile</label><input type="text" name="paxMobile" placeholder="Pax Mobile.." value={filters.paxMobile} onChange={handleChange} /></div>
            <div className={styles.formGroup}><label>Agency Name</label><input type="text" name="agencyName" placeholder="Agency Name" value={filters.agencyName} onChange={handleChange} /></div>
            <div className={styles.formGroup}><label>Ticket No.</label><input type="text" name="ticketNo" placeholder="TicketNo.." value={filters.ticketNo} onChange={handleChange} /></div>
            <div className={styles.formGroup}><label>Airline</label><input type="text" name="airline" placeholder="Airline" value={filters.airline} onChange={handleChange} /></div>
            <div className={styles.formGroup}>
              <label>Status</label>
              <select name="status" value={filters.status} onChange={handleChange}>
                <option value="">Select</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Cancelled">Cancelled</option>
                <option value="On Hold">On Hold</option>
              </select>
            </div>
          </div>
          <div className={styles.buttonGroup}>
            <button className={styles.searchButton} onClick={handleSearch} disabled={isLoading}>
              {isLoading ? 'Searching...' : 'SEARCH RESULT'}
            </button>
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
                <tr><td colSpan="20" className={styles.loadingCell}>Loading data...</td></tr>
              ) : error ? (
                <tr><td colSpan="20" style={{ textAlign: 'center', color: 'red', padding: '20px' }}>{error}</td></tr>
              ) : tickets.length > 0 ? (
                currentItems.map((ticket) => (
                  <tr key={ticket.id}>
                    <td><span className={`${styles.statusBadge} ${styles[`status${ticket.status}`] || ''}`}>{ticket.status}</span></td>
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
                    {/* Format Dates safely */}
                    <td>{ticket.bookingDate ? new Date(ticket.bookingDate).toLocaleDateString('en-GB') : '-'}</td>
                    <td>{ticket.journeyDate ? new Date(ticket.journeyDate).toLocaleDateString('en-GB') : '-'}</td>
                    <td className={styles.currency}>₹{ticket.baseFare?.toLocaleString('en-IN') || 0}</td>
                    <td className={styles.currency}>₹{ticket.otherTax?.toLocaleString('en-IN') || 0}</td>
                    <td className={`${styles.currency} ${styles.total}`}>₹{ticket.totalAmount?.toLocaleString('en-IN') || 0}</td>
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
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '20px', padding: '10px', gap: '15px' }}>
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