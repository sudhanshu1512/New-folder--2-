import React, { useState, useEffect } from 'react';
import { FaBook } from 'react-icons/fa'; // Using a relevant icon from Font Awesome
import styles from './SupplierLedger.module.css';
import Layout from '../Layout/Layout';
import api from '../../lib/api';

export default function SupplierLedger() {
  const [filters, setFilters] = useState({
    fromDate: '',
    toDate: '',
    supplier: '',
  });

  const [ledgerEntries, setLedgerEntries] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // --- PAGINATION STATE ---
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  // ------------------------

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

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

  const handleSearch = async () => {
    setLoading(true);
    setError('');
    setHasSearched(true);

    try {
      // Build query string based on filters
      const queryParams = new URLSearchParams();
      if (filters.supplier) queryParams.append('AgentID', filters.supplier);
      if (filters.fromDate) queryParams.append('fromDate', filters.fromDate);
      if (filters.toDate) queryParams.append('toDate', filters.toDate);

      const url = queryParams.toString() ? `/ledger?${queryParams.toString()}` : '/ledger';
      const response = await api.get(url);

      console.log('API Response:', response);

      if (response.data && response.data.length > 0) {
        // Map API response to component structure
        const mappedData = response.data.map(entry => ({
          id: entry.Counter,
          supplierId: entry.AgentID,
          supplierName: entry.AgencyName,
          invoiceNo: entry.InvoiceNo,
          pnr: entry.PnrNo,
          dr: entry.Debit || 0,
          cr: entry.Credit || 0,
          balance: entry.Aval_Balance || 0,
          bookingType: entry.BookingType,
          createdDate: new Date(entry.CreatedDate).toLocaleDateString('en-IN'),
          remark: entry.Remark
        }));

        // Apply additional client-side filters if needed (in case backend doesn't support all filters)
        const filteredData = mappedData.filter(entry =>
          (!filters.supplier || entry.supplierId.toString().includes(filters.supplier.toString())) &&
          (!filters.fromDate || new Date(entry.createdDate) >= new Date(filters.fromDate)) &&
          (!filters.toDate || new Date(entry.createdDate) <= new Date(filters.toDate))
        );

        setLedgerEntries(mappedData); // Or filteredData if you prefer strict client filtering
        setCurrentPage(1); // Reset to page 1 on new search
      } else {
        console.log('No data received from server or data is empty.');
        setError('No records found');
        setLedgerEntries([]);
      }
    } catch (err) {
      console.error('Error fetching ledger data:', err);
      setError(err.response?.data?.message || 'Failed to fetch ledger data');
      setLedgerEntries([]);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (ledgerEntries.length === 0) {
      alert('No data to export');
      return;
    }

    // Define all column headers
    const headers = [
      'Agent ID',
      'Agency Name',
      'Invoice No',
      'PNR',
      'DR',
      'CR',
      'Balance',
      'Booking Type',
      'Created Date',
      'Remark'
    ];

    // Format number to Indian Rupees without spaces
    const formatINR = (amount) => {
      return amount ? amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '') : '0';
    };

    // Create CSV rows
    const csvRows = [
      headers.join(','), // Header row
      ...ledgerEntries.map(entry => [
        `"${entry.supplierId}"`,
        `${entry.supplierName}`,
        `${entry.invoiceNo}`,
        `${entry.pnr}`,
        `${formatINR(entry.dr)}`,
        `${formatINR(entry.cr)}`,
        `${formatINR(entry.balance)}`,
        `${entry.bookingType}`,
        `"${entry.createdDate}"`,
        `${entry.remark}`
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
    link.setAttribute('download', `supplier-ledger-${new Date().toISOString().split('T')[0]}.csv`);

    // Trigger the download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- PAGINATION LOGIC ---
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = ledgerEntries.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(ledgerEntries.length / itemsPerPage);

  const handlePageChange = (pageNumber) => {
    if (pageNumber > 0 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };
  // ------------------------

  return (
    <Layout>
      <div className={styles.ledgerReportContainer}>
        <h2 className={styles.pageTitle}>
          <FaBook /> Ledger Report List
        </h2>

        <div className={styles.searchCard}>
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label>From</label>
              {/* --- UPDATED: Added onClick and cursor style --- */}
              <input
                type="date"
                name="fromDate"
                value={filters.fromDate}
                onChange={handleChange}
                onClick={handleInputClick}
                style={{ cursor: 'pointer' }}
              />
            </div>
            <div className={styles.formGroup}>
              <label>To</label>
              {/* --- UPDATED: Added onClick and cursor style --- */}
              <input
                type="date"
                name="toDate"
                value={filters.toDate}
                onChange={handleChange}
                onClick={handleInputClick}
                style={{ cursor: 'pointer' }}
              />
            </div>
            <div className={styles.formGroup}>
              <label>Supplier ID</label>
              <input
                type="text"
                name="supplier"
                value={filters.supplier}
                onChange={handleChange}
                placeholder="Enter Supplier ID"
              />
            </div>
            <div className={styles.buttonCell}>
              <button className={styles.searchButton} onClick={handleSearch}>SEARCH RESULT</button>
            </div>
            <div className={styles.buttonCell}>
              <button className={styles.exportButton} onClick={handleExport}>EXPORT</button>
            </div>
          </div>
        </div>

        <div className={styles.pnrtablecontainer}>
          <table className={styles.pnrtable}>
            <thead>
              <tr>
                <th>Agent ID</th>
                <th>Agency Name</th>
                <th>Invoice No</th>
                <th>PNR</th>
                <th>DR.</th>
                <th>CR.</th>
                <th>BALANCE</th>
                <th>BOOKING TYPE</th>
                <th>CREATED DATE</th>
                <th>REMARK</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="10" className={styles.loadingState}>
                    <div className={styles.spinnerContainer}>
                      <div className={styles.spinner}></div>
                      <p>Loading ledger data...</p>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="10" className={styles.errorState}>
                    <div className={styles.errorContainer}>
                      <p className={styles.errorMessage}>{error}</p>
                    </div>
                  </td>
                </tr>
              ) : hasSearched && ledgerEntries.length > 0 ? (
                // --- PAGINATION: Use currentItems here ---
                currentItems.map((entry) => (
                  <tr key={entry.id}>
                    <td>{entry.supplierId}</td>
                    <td>{entry.supplierName}</td>
                    <td>{entry.invoiceNo}</td>
                    <td>{entry.pnr}</td>
                    <td className={styles.currency}>₹{entry.dr.toLocaleString('en-IN')}</td>
                    <td className={styles.currency}>₹{entry.cr.toLocaleString('en-IN')}</td>
                    <td className={`${styles.currency} ${styles.balance}`}>₹{entry.balance.toLocaleString('en-IN')}</td>
                    <td>{entry.bookingType}</td>
                    <td>{entry.createdDate}</td>
                    <td>{entry.remark}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="10" className={styles.norecordfound}>
                    {hasSearched ? 'No Record Found' : 'Please search to see results'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* --- PAGINATION CONTROLS --- */}
          {ledgerEntries.length > itemsPerPage && (
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