import React, { useState, useEffect } from 'react';
import { FaList, FaPlus, FaPen } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import styles from './VenderList.module.css';
import Layout from '../Layout/Layout';
import api from "../../lib/api";

// Validation function
const validateVendor = (vendor) => {
  const errors = {};
  
  if (!vendor.companyName?.trim()) {
    errors.companyName = 'Company name is required';
  }
  
  if (!vendor.contactPerson?.trim()) {
    errors.contactPerson = 'Contact person is required';
  }
  
  if (!vendor.mobile?.trim()) {
    errors.mobile = 'Mobile number is required';
  } else if (!/^[6-9]\d{9}$/.test(vendor.mobile)) {
    errors.mobile = 'Please enter a valid 10-digit mobile number';
  }
  
  if (vendor.alternateMobile && !/^[6-9]\d{9}$/.test(vendor.alternateMobile)) {
    errors.alternateMobile = 'Please enter a valid 10-digit mobile number';
  }
  
  if (!vendor.email?.trim()) {
    errors.email = 'Email is required';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(vendor.email)) {
    errors.email = 'Please enter a valid email address';
  }
  
  if (!vendor.address?.trim()) {
    errors.address = 'Address is required';
  }
  
  if (!vendor.city?.trim()) {
    errors.city = 'City is required';
  }
  
  if (!vendor.state?.trim()) {
    errors.state = 'State is required';
  }
  
  if (!vendor.pincode?.trim()) {
    errors.pincode = 'Pincode is required';
  } else if (!/^[1-9][0-9]{5}$/.test(vendor.pincode)) {
    errors.pincode = 'Please enter a valid 6-digit pincode';
  }
  
  return errors;
};

const INITIAL_FORM_STATE = {
  companyName: '',
  contactPerson: '',
  mobile: '',
  alternateMobile: '',
  email: '',
  address: '',
  city: '',
  state: '',
  pincode: '',
};

export default function VenderList() {
  const [vendors, setVendors] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newVendor, setNewVendor] = useState(INITIAL_FORM_STATE);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  // --- PAGINATION STATE ---
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  // ------------------------

  // Fetch vendors on component mount
  useEffect(() => {
    const fetchVendors = async () => {
      try {
        setIsLoading(true);
        const response = await api.get('/vendors');
        setVendors(response.data);
        setCurrentPage(1); // Reset to page 1 on fetch
      } catch (error) {
        console.error('Error fetching vendors:', error);
        toast.error('Failed to load vendors');
      } finally {
        setIsLoading(false);
      }
    };

    fetchVendors();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewVendor(prev => ({ ...prev, [name]: value }));
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    const validationErrors = validateVendor(newVendor);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast.error('Please fix the form errors');
      return;
    }

    try {
      setIsLoading(true);
      // If there's an ID, it's an update, otherwise it's a new vendor
      if (newVendor.id) {
        await api.put(`/vendors/${newVendor.id}`, newVendor);
        setVendors(prev => 
          prev.map(v => v.id === newVendor.id ? newVendor : v)
        );
        toast.success('Vendor updated successfully');
      } else {
        const response = await api.post('/vendors', newVendor);
        setVendors(prev => [...prev, response.data]);
        // Since we added a new item, user might want to see it. 
        // You could choose to stay on current page or go to last page.
        // For simplicity, staying on current behavior or resetting to page 1.
        toast.success('Vendor added successfully');
      }
      
      setNewVendor(INITIAL_FORM_STATE);
      setShowAddForm(false);
    } catch (error) {
      console.error('Error saving vendor:', error);
      toast.error(error.response?.data?.message || 'Failed to save vendor');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (vendor) => {
    setNewVendor(vendor);
    setShowAddForm(true);
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleClear = () => {
    setNewVendor(INITIAL_FORM_STATE);
    setErrors({});
  };

  // --- PAGINATION LOGIC ---
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = vendors.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(vendors.length / itemsPerPage);

  const handlePageChange = (pageNumber) => {
    if (pageNumber > 0 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };
  // ------------------------

  return (
    <Layout>
      <div className={styles.venderListContainer}>
        <header className={styles.header}>
          <h2 className={styles.pageTitle}>
            <FaList /> Vender List
          </h2>
          <button 
            className={styles.addButton} 
            onClick={() => {
              setShowAddForm(!showAddForm);
              if (!showAddForm) {
                setNewVendor(INITIAL_FORM_STATE);
                setErrors({});
              }
            }}
          >
            <FaPlus /> {newVendor.id ? 'Edit Vender' : 'Add New Vender'}
          </button>
        </header>

        {showAddForm && (
          <div className={styles.addVenderFormCard}>
            <form onSubmit={handleSubmit} className={styles.formGrid}>
              {['companyName', 'contactPerson', 'mobile', 'alternateMobile', 'email', 
                'address', 'city', 'state', 'pincode'].map((field) => (
                <div className={styles.formGroup} key={field}>
                  <label>
                    {field === 'companyName' ? 'Vender Company Name' : 
                     field === 'contactPerson' ? 'Vender Contact Person' : 
                     field === 'alternateMobile' ? 'Alternate Mobile Number' : 
                     field === 'email' ? 'Email ID' :
                     field === 'pincode' ? 'Pincode' : 
                     field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1').trim()}
                    {['companyName', 'contactPerson', 'mobile', 'email', 'address', 'city', 'state', 'pincode'].includes(field) && (
                      <span className={styles.required}>*</span>
                    )}
                  </label>
                  <input
                    type={
                      field === 'email' ? 'email' : 
                      field === 'mobile' || field === 'alternateMobile' ? 'tel' : 
                      'text'
                    }
                    name={field}
                    placeholder={`Enter ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}...`}
                    value={newVendor[field] || ''}
                    onChange={handleInputChange}
                    className={errors[field] ? styles.errorInput : ''}
                    disabled={isLoading}
                  />
                  {errors[field] && (
                    <span className={styles.errorText}>{errors[field]}</span>
                  )}
                </div>
              ))}

              <div className={styles.buttonGroup}>
                <button 
                  type="submit" 
                  className={styles.submitButton}
                  disabled={isLoading}
                >
                  {isLoading ? 'Saving...' : 'Submit'}
                </button>
                <button 
                  type="button" 
                  className={styles.clearButton} 
                  onClick={handleClear}
                  disabled={isLoading}
                >
                  Clear
                </button>
              </div>
            </form>
          </div>
        )}

        <div className={styles.resultsCard}>
          {isLoading && vendors.length === 0 ? (
            <div className={styles.loading}>Loading vendors...</div>
          ) : (
            <>
              <table className={styles.resultsTable}>
                <thead>
                  <tr>
                    <th>VenderID</th>
                    <th>Vender Company Name</th>
                    <th>Contact Person</th>
                    <th>Vender Mobile</th>
                    <th>Alternate Mobile</th>
                    <th>Email ID</th>
                    <th>Address</th>
                    <th>City</th>
                    <th>State</th>
                    <th>Pincode</th>
                    <th>Update</th>
                  </tr>
                </thead>
                <tbody>
                  {vendors.length > 0 ? (
                    // --- PAGINATION: Use currentItems here ---
                    currentItems.map((vendor) => (
                      <tr key={vendor.id}>
                        <td>{vendor.id}</td>
                        <td>{vendor.companyName}</td>
                        <td>{vendor.contactPerson}</td>
                        <td>{vendor.mobile}</td>
                        <td>{vendor.alternateMobile || 'N/A'}</td>
                        <td>{vendor.email}</td>
                        <td>{vendor.address}</td>
                        <td>{vendor.city}</td>
                        <td>{vendor.state}</td>
                        <td>{vendor.pincode}</td>
                        <td className={styles.updateCell}>
                          <button 
                            onClick={() => handleEdit(vendor)}
                            className={styles.editButton}
                            title="Edit vendor"
                          >
                            <FaPen />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="11" className={styles.noRecordsFound}>
                        No vendors found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* --- PAGINATION CONTROLS --- */}
              {vendors.length > itemsPerPage && (
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
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}