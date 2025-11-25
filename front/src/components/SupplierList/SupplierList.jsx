import React, { useState, useEffect } from 'react';
import './SupplierList.css';
import Layout from '../Layout/Layout';
import api from '../../lib/api';
import { toast } from 'react-hot-toast';

export default function SupplierList() {
  // State for form inputs
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [suppliers, setSuppliers] = useState([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState([]);

  // --- PAGINATION STATE ---
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  // ------------------------

  // Fetch suppliers on component mount
  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        setIsLoading(true);
        const response = await api.get('/suppliers');
        if (response.data.success) {
          setSuppliers(response.data.data);
          setFilteredSuppliers(response.data.data);
          setCurrentPage(1); // Reset to page 1 on load
        } else {
          setError('Failed to load suppliers');
        }
      } catch (err) {
        console.error('Error fetching suppliers:', err);
        setError('Failed to load suppliers. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSuppliers();
  }, []);

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

  // Update the handleSearch function
  const handleSearch = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params = {
        mobile: mobile || undefined,
        email: email || undefined,
        agencyName: selectedSupplier || undefined
      };

      const response = await api.get('/suppliers/search', { params });

      if (response.data.success) {
        const resultCount = response.data.data.length;
        if (resultCount > 0) {
          setFilteredSuppliers(response.data.data);
          setCurrentPage(1); // Reset to page 1 on new search
          toast.success(`Found ${resultCount} supplier(s)`);
        } else {
          setFilteredSuppliers([]);
          toast('No suppliers found matching your criteria', {
            icon: 'ℹ️',
            style: {
              borderRadius: '10px',
              background: '#333',
              color: '#fff',
            }
          });
        }
      } else {
        setError('No matching suppliers found');
        setFilteredSuppliers([]);
        toast.error(response.data.message || 'Failed to search suppliers');
      }
    } catch (err) {
      console.error('Error searching suppliers:', err);
      const errorMessage = err.response?.data?.message || 'Failed to search suppliers. Please try again.';
      setError(errorMessage);
      setFilteredSuppliers([]);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // --- PAGINATION LOGIC ---
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredSuppliers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredSuppliers.length / itemsPerPage);

  const handlePageChange = (pageNumber) => {
    if (pageNumber > 0 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };
  // ------------------------

  return (
    <Layout>
      <div className="supplier-list-container">
        <h2 className="page-title">
          <span className="icon">📋</span> Supplier List
        </h2>

        <div className="search-card">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="supplier">Supplier</label>
              <select
                id="supplier"
                value={selectedSupplier}
                onChange={(e) => setSelectedSupplier(e.target.value)}
              >
                <option value="">All Suppliers</option>
                {suppliers.map((supplier, index) => (
                  <option
                    key={`${supplier.agencyId || 'null'}-${index}`}
                    value={supplier.agencyName || 'NA'}
                  >
                    {supplier.agencyName || 'NA'}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="from">From</label>
              {/* --- UPDATED: Added onClick and cursor style --- */}
              <input
                type="date"
                id="from"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                onClick={handleInputClick}
                style={{ cursor: 'pointer' }}
              />
            </div>
            <div className="form-group">
              <label htmlFor="to">To</label>
              {/* --- UPDATED: Added onClick and cursor style --- */}
              <input
                type="date"
                id="to"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                onClick={handleInputClick}
                style={{ cursor: 'pointer' }}
              />
            </div>
            <div className="form-group">
              <label htmlFor="mobile">Mobile</label>
              <input
                type="text"
                id="mobile"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="Enter mobile number"
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email"
              />
            </div>
          </div>
          <button className="bt-search" onClick={handleSearch}>
            🔍 Search
          </button>
        </div>

        <div className="results-card">
          <table className="results-table">
            <thead>
              <tr>
                <th>Agency Id</th>
                <th>Agency Name</th>
                <th>Agency Type</th>
                <th>Mobile</th>
                <th>Email</th>
                <th>Address</th>
                <th>State</th>
                <th>City</th>
                <th>Balance</th>
                <th>Agent Limit</th>
                <th>Due Amount</th>
                <th>Pan No</th>
                <th>GST No</th>
                <th>HeadPerson</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="14" className="loading">
                    Loading suppliers...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="14" className="error">
                    {error}
                  </td>
                </tr>
              ) : filteredSuppliers.length > 0 ? (
                // --- PAGINATION: Map through currentItems instead of filteredSuppliers ---
                currentItems.map((supplier, index) => (
                  <tr key={`${supplier.agencyId || 'row'}-${index}`}>
                    <td className={!supplier.agencyId ? 'not-available' : ''}>
                      {supplier.agencyId || <span style={{ color: 'red' }}>Not Available</span>}
                    </td>
                    <td className={!supplier.agencyName ? 'not-available' : ''}>
                      {supplier.agencyName || <span style={{ color: 'red' }}>Not Available</span>}
                    </td>
                    <td className={!supplier.agentType ? 'not-available' : ''}>
                      {supplier.agentType || <span style={{ color: 'red' }}>Not Available</span>}
                    </td>
                    <td className={!supplier.mobile ? 'not-available' : ''}>
                      {supplier.mobile || <span style={{ color: 'red' }}>Not Available</span>}
                    </td>
                    <td className={!supplier.email ? 'not-available' : ''}>
                      {supplier.email || <span style={{ color: 'red' }}>Not Available</span>}
                    </td>
                    <td className={!supplier.address ? 'not-available' : ''}>
                      {supplier.address || <span style={{ color: 'red' }}>Not Available</span>}
                    </td>
                    <td className={!supplier.state ? 'not-available' : ''}>
                      {supplier.state || <span style={{ color: 'red' }}>Not Available</span>}
                    </td>
                    <td className={!supplier.city ? 'not-available' : ''}>
                      {supplier.city || <span style={{ color: 'red' }}>Not Available</span>}
                    </td>
                    <td className={`balance-cell ${!supplier.crdLimit ? 'not-available' : ''}`}>
                      {supplier.crdLimit ? `₹${supplier.crdLimit.toLocaleString('en-IN')}` : <span style={{ color: 'red' }}>Not Available</span>}
                    </td>
                    <td className={!supplier.agentLimit ? 'not-available' : ''}>
                      {supplier.agentLimit || <span style={{ color: 'red' }}>Not Available</span>}
                    </td>
                    <td className={!supplier.dueAmount ? 'not-available' : ''}>
                      {supplier.dueAmount || <span style={{ color: 'red' }}>Not Available</span>}
                    </td>
                    <td className={!supplier.panNo ? 'not-available' : ''}>
                      {supplier.panNo || <span style={{ color: 'red' }}>Not Available</span>}
                    </td>
                    <td className={!supplier.gstNo ? 'not-available' : ''}>
                      {supplier.gstNo || <span style={{ color: 'red' }}>Not Available</span>}
                    </td>
                    <td className={!supplier.headPerson ? 'not-available' : ''}>
                      {supplier.headPerson || <span style={{ color: 'red' }}>Not Available</span>}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="14" className="no-record-found">
                    <span style={{ color: 'red' }}>No Record Found</span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* --- PAGINATION CONTROLS --- */}
          {filteredSuppliers.length > itemsPerPage && (
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