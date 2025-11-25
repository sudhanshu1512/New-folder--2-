// Service for profile management API calls
import api from '../lib/api';

// Get user profile data
export const getProfile = async () => {
  try {
    const response = await api.get('/profile');
    return response.data;
  } catch (error) {
    console.error('Error fetching profile:', error);
    return { 
      success: false, 
      message: error.response?.data?.message || 'Failed to fetch profile' 
    };
  }
};

// Update user profile (excluding mobile and company name)
export const updateProfile = async (profileData) => {
  try {
    const response = await api.put('/profile', profileData);
    return response.data;
  } catch (error) {
    console.error('Error updating profile:', error);
    return { 
      success: false, 
      message: error.response?.data?.message || 'Failed to update profile' 
    };
  }
};

// Change password
export const changePassword = async (passwordData) => {
  try {
    const response = await api.put('/profile/password', passwordData);
    return response.data;
  } catch (error) {
    console.error('Error changing password:', error);
    return { 
      success: false, 
      message: error.response?.data?.message || 'Failed to change password' 
    };
  }
};
