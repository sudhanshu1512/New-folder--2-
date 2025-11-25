// Service for fetching logo from backend
import api from '../lib/api';

export const getLogo = async () => {
  try {
    const response = await api.get('/settings/logo');
    return response.data;
  } catch (error) {
    console.error('Error fetching logo:', error);
    return { success: false, url: null, message: 'Failed to fetch logo' };
  }
};
