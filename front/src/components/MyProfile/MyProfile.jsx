import React, { useState, useEffect } from 'react';
import {
  FaUser, FaBuilding, FaFileInvoice, FaKey, FaSave, FaTimes,
  FaEdit, FaCheckCircle, FaPhone, FaMailBulk, FaSpinner
} from 'react-icons/fa';
import styles from './MyProfile.module.css';
import Layout from '../Layout/Layout';
import { getProfile, updateProfile, changePassword } from '../../services/profileService';

// Initial empty state
const INITIAL_PROFILE_STATE = {
  personal: {
    title: '',
    name: '',
    firstName: '',
    middleName: '',
    lastName: '',
    mobile: '',
    email: '',
    phone: '',
    altEmail: ''
  },
  company: {
    agencyName: '',
    address: '',
    city: '',
    district: '',
    pincode: '',
    state: '',
    country: '',
    website: '',
    panNo: '',
    gstNo: '',
    stateCode: '',
    branch: '',
    area: ''
  },
  gst: {
    gstNo: '',
    companyAddress: '',
    companyName: '',
    city: '',
    state: '',
    pincode: '',
    phoneNo: '',
    email: ''
  }
};

export default function MyProfile() {
  const [profile, setProfile] = useState(INITIAL_PROFILE_STATE);
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Load profile data on component mount
  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const result = await getProfile();
      if (result.success) {
        setProfile(result.data);
      } else {
        setMessage({ text: result.message || 'Failed to load profile', type: 'error' });
      }
    } catch (error) {
      setMessage({ text: 'Error loading profile', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      personal: { ...prev.personal, [name]: value },
    }));
  };

  const handleCompanyChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      company: { ...prev.company, [name]: value },
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage({ text: '', type: '' });

      // Prepare data for API (excluding mobile and agency name)
      const updateData = {
        title: profile.personal.title,
        firstName: profile.personal.firstName,
        middleName: profile.personal.middleName,
        lastName: profile.personal.lastName,
        email: profile.personal.email,
        phone: profile.personal.phone,
        altEmail: profile.personal.altEmail,
        address: profile.company.address,
        city: profile.company.city,
        district: profile.company.district,
        pincode: profile.company.pincode,
        state: profile.company.state,
        country: profile.company.country,
        website: profile.company.website,
        panNo: profile.company.panNo,
        gstNo: profile.company.gstNo,
        stateCode: profile.company.stateCode,
        branch: profile.company.branch,
        area: profile.company.area
      };

      const result = await updateProfile(updateData);

      if (result.success) {
        setMessage({ text: 'Profile updated successfully!', type: 'success' });
        setIsEditing(false);
        // Reload profile to get updated data
        await loadProfile();
      } else {
        setMessage({ text: result.message || 'Failed to update profile', type: 'error' });
      }
    } catch (error) {
      setMessage({ text: 'Error updating profile', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswords(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (!passwords.currentPassword || !passwords.newPassword) {
      setMessage({ text: 'Please fill both password fields.', type: 'error' });
      return;
    }

    if (passwords.newPassword.length < 6) {
      setMessage({ text: 'New password must be at least 6 characters long.', type: 'error' });
      return;
    }

    try {
      setSaving(true);
      const result = await changePassword(passwords);

      if (result.success) {
        setMessage({ text: 'Password updated successfully!', type: 'success' });
        setShowPasswordModal(false);
        setPasswords({ currentPassword: '', newPassword: '' });
      } else {
        setMessage({ text: result.message || 'Failed to update password', type: 'error' });
      }
    } catch (error) {
      setMessage({ text: 'Error updating password', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const clearMessage = () => {
    setMessage({ text: '', type: '' });
  };

  if (loading) {
    return (
      <Layout>
        <div className={styles.profileContainer}>
          <div className={styles.loadingContainer}>
            <FaSpinner className={styles.spinner} />
            <p>Loading profile...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className={styles.profileContainer}>
        <h2 className={styles.pageTitle}><FaUser /> Agent Profile</h2>

        {/* Message Display */}
        {message.text && (
          <div className={`${styles.message} ${styles[message.type]}`}>
            <span>{message.text}</span>
            <button onClick={clearMessage} className={styles.closeMessage}>
              <FaTimes />
            </button>
          </div>
        )}

        {/* Personal Details */}
        <div className={`${styles.profileCard} ${styles.fadeIn}`}>
          <div className={styles.cardHeader}>
            <h3><FaUser /> Personal Details</h3>
            <div className={styles.headerActions}>
              {isEditing ? (
                <button
                  className={`${styles.button} ${styles.saveButton}`}
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? <FaSpinner className={styles.spinner} /> : <FaCheckCircle />}
                  {saving ? 'Saving...' : 'Save'}
                </button>
              ) : (
                <button className={`${styles.button} ${styles.editButton}`} onClick={() => setIsEditing(true)}>
                  <FaEdit /> Edit
                </button>
              )}
              <button className={`${styles.button} ${styles.passwordButton}`} onClick={() => setShowPasswordModal(true)}>
                <FaKey /> Change Password
              </button>
            </div>
          </div>
          <div className={styles.cardBody}>
            <div className={styles.detailItem}>
              <label><FaUser /> First Name</label>
              {isEditing ? (
                <input
                  type="text"
                  name="firstName"
                  value={profile.personal.firstName}
                  onChange={handleProfileChange}
                  className={styles.inlineInput}
                  required
                />
              ) : (
                <span>{profile.personal.firstName}</span>
              )}
            </div>
            <div className={styles.detailItem}>
              <label><FaUser /> Middle Name</label>
              {isEditing ? (
                <input
                  type="text"
                  name="middleName"
                  value={profile.personal.middleName}
                  onChange={handleProfileChange}
                  className={styles.inlineInput}
                />
              ) : (
                <span>{profile.personal.middleName}</span>
              )}
            </div>
            <div className={styles.detailItem}>
              <label><FaUser /> Last Name</label>
              {isEditing ? (
                <input
                  type="text"
                  name="lastName"
                  value={profile.personal.lastName}
                  onChange={handleProfileChange}
                  className={styles.inlineInput}
                />
              ) : (
                <span>{profile.personal.lastName}</span>
              )}
            </div>
            <div className={styles.detailItem}>
              <label><FaMailBulk /> Email ID</label>
              {isEditing ? (
                <input
                  type="email"
                  name="email"
                  value={profile.personal.email}
                  onChange={handleProfileChange}
                  className={styles.inlineInput}
                  required
                />
              ) : (
                <span>{profile.personal.email}</span>
              )}
            </div>
            <div className={styles.detailItem}>
              <label><FaPhone className='phoneicon' /> Mobile No</label>
              <span className={styles.nonEditable}>{profile.personal.mobile}</span>
              <small className={styles.helpText}>Mobile number cannot be changed</small>
            </div>
            <div className={styles.detailItem}>
              <label><FaMailBulk /> Alternate Email</label>
              {isEditing ? (
                <input
                  type="email"
                  name="altEmail"
                  value={profile.personal.altEmail}
                  onChange={handleProfileChange}
                  className={styles.inlineInput}
                />
              ) : (
                <span>{profile.personal.altEmail}</span>
              )}
            </div>
          </div>
        </div>

        {/* Company Details */}
        <div className={`${styles.profileCard} ${styles.fadeIn}`}>
          <div className={styles.cardHeader}><h3><FaBuilding /> Company Details</h3></div>
          <div className={styles.cardBody}>
            <div className={styles.detailItem}>
              <label>Agency Name</label>
              <span className={styles.nonEditable}>{profile.company.agencyName}</span>
              <small className={styles.helpText}>Company name cannot be changed</small>
            </div>
            <div className={styles.detailItem}>
              <label>Address</label>
              {isEditing ? (
                <textarea
                  name="address"
                  value={profile.company.address}
                  onChange={handleCompanyChange}
                  className={styles.inlineTextarea}
                  rows="2"
                />
              ) : (
                <span>{profile.company.address}</span>
              )}
            </div>
            <div className={styles.detailItem}>
              <label>City</label>
              {isEditing ? (
                <input
                  type="text"
                  name="city"
                  value={profile.company.city}
                  onChange={handleCompanyChange}
                  className={styles.inlineInput}
                />
              ) : (
                <span>{profile.company.city}</span>
              )}
            </div>
            <div className={styles.detailItem}>
              <label>District</label>
              {isEditing ? (
                <input
                  type="text"
                  name="district"
                  value={profile.company.district}
                  onChange={handleCompanyChange}
                  className={styles.inlineInput}
                />
              ) : (
                <span>{profile.company.district}</span>
              )}
            </div>
            <div className={styles.detailItem}>
              <label>State</label>
              {isEditing ? (
                <input
                  type="text"
                  name="state"
                  value={profile.company.state}
                  onChange={handleCompanyChange}
                  className={styles.inlineInput}
                />
              ) : (
                <span>{profile.company.state}</span>
              )}
            </div>
            <div className={styles.detailItem}>
              <label>Pincode</label>
              {isEditing ? (
                <input
                  type="text"
                  name="pincode"
                  value={profile.company.pincode}
                  onChange={handleCompanyChange}
                  className={styles.inlineInput}
                />
              ) : (
                <span>{profile.company.pincode}</span>
              )}
            </div>
            <div className={styles.detailItem}>
              <label>Country</label>
              {isEditing ? (
                <input
                  type="text"
                  name="country"
                  value={profile.company.country}
                  onChange={handleCompanyChange}
                  className={styles.inlineInput}
                />
              ) : (
                <span>{profile.company.country}</span>
              )}
            </div>
            <div className={styles.detailItem}>
              <label>Website</label>
              {isEditing ? (
                <input
                  type="url"
                  name="website"
                  value={profile.company.website}
                  onChange={handleCompanyChange}
                  className={styles.inlineInput}
                />
              ) : (
                <span>{profile.company.website}</span>
              )}
            </div>
            <div className={styles.detailItem}>
              <label>PAN Number</label>
              {isEditing ? (
                <input
                  type="text"
                  name="panNo"
                  value={profile.company.panNo}
                  onChange={handleCompanyChange}
                  className={styles.inlineInput}
                  style={{ textTransform: 'uppercase' }}
                  maxLength="10"
                />
              ) : (
                <span>{profile.company.panNo}</span>
              )}
            </div>
          </div>
        </div>

        {/* GST Details */}
        <div className={`${styles.profileCard} ${styles.fadeIn}`}>
          <div className={styles.cardHeader}>
            <h3><FaFileInvoice /> GST Details</h3>
          </div>
          <div className={styles.cardBody}>
            {profile.gst ? (
              <>
                {/* Editable GST Number */}
                <div className={styles.detailItem}>
                  <label>GST Number</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="gstNo"
                      value={profile.company?.gstNo || ''}
                      onChange={handleCompanyChange}
                      className={styles.inlineInput}
                      placeholder="Enter 15-digit GST number"
                      maxLength={15}
                      style={{ textTransform: 'uppercase' }}
                    />
                  ) : (
                    <span>{profile.company?.gstNo || 'Not provided'}</span>
                  )}
                </div>

                {/* Read-only GST Details */}
                {Object.entries(profile.gst)
                  .filter(([key]) => key !== 'gstNo')
                  .map(([key, value], i) => (
                    <div key={i} className={styles.detailItem}>
                      <label>
                        {key
                          .replace(/([A-Z])/g, ' $1')
                          .replace(/^./, str => str.toUpperCase())}
                      </label>
                      <span>{value || 'Not provided'}</span>
                    </div>
                  ))}
              </>
            ) : (
              <div className={styles.detailItem}>
                <span>GST details not available</span>
              </div>
            )}
          </div>
        </div>
        {/* Password Modal */}
        {showPasswordModal && (
          <div className={styles.modalOverlay}>
            <div className={`${styles.modalContent} ${styles.zoomIn}`}>
              <button className={styles.closeButton} onClick={() => setShowPasswordModal(false)}><FaTimes /></button>
              <h3><FaKey /> Change Your Password</h3>
              <form onSubmit={handlePasswordSubmit}>
                <div className={styles.formGroup}>
                  <label>Current Password</label>
                  <input type="password" name="currentPassword" value={passwords.currentPassword} onChange={handlePasswordChange} required />
                </div>
                <div className={styles.formGroup}>
                  <label>New Password</label>
                  <input type="password" name="newPassword" value={passwords.newPassword} onChange={handlePasswordChange} required />
                </div>
                <button
                  type="submit"
                  className={`${styles.button} ${styles.saveButton}`}
                  disabled={saving}
                >
                  {saving ? <FaSpinner className={styles.spinner} /> : <FaSave />}
                  {saving ? 'Updating...' : 'Update Password'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
