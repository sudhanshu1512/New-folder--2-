
import api from '../lib/api'

// Helper function to get the auth token from localStorage
const getAuthToken = () => {
    return localStorage.getItem('token'); // Assuming you store the token in localStorage after login
};

export const createInventory = async (inventoryData) => {
    const token = getAuthToken();
    
    if (!token) {
        throw new Error('Authentication required. Please log in again.');
    }

    try {
        const response = await api.post('/inventory', inventoryData, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return response.data;
    } catch (error) {
        let errorMessage = error.response?.data?.message || 'Server failed to save inventory.';
        if (error.response?.data?.field) {
            errorMessage = `${errorMessage} (Field: ${error.response.data.field})`;
        }
        throw new Error(errorMessage);
    } 
};

export const deleteInventory = async (id) => {
    const token = getAuthToken();
    const response = await api.delete(`/inventory/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.data;
};

export const toggleInventoryStatus = async (id, enabled) => {
    const token = getAuthToken();
    const response = await api.put(`/inventory/${id}/toggle-status`, { enabled }, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.data;
};

export const getFaresForInventory = async (id) => {
    const token = getAuthToken();
    const response = await api.get(`/inventory/${id}/fares`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.data;
};

export const getInventoryDetails = async (id) => {
    const token = getAuthToken();
    const response = await api.get(`/inventory/${id}/details`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.data;
};

export const updateFareForInventory = async (id, fareData) => {
    const token = getAuthToken();
    const response = await api.put(`/inventory/${id}/fare`, fareData, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.data;
};

export const addSeatsToInventory = async (id, seatsToAdd) => {
    const token = getAuthToken();
    const response = await api.post(`/inventory/${id}/add-seats`, { seatsToAdd }, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.data;
};

export const removeSeatsFromInventory = async (id, seatsToMinus) => {
    const token = getAuthToken();
    const response = await api.post(`/inventory/${id}/minus-seats`, { seatsToMinus }, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.data;
};

export const updateInventoryDetails = async (id, data) => {
  const token = getAuthToken();
  const response = await api.put(`/inventory/${id}/details`, data, {
      headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.data;
};

export const getInventory = async (filters = {}) => {
    const token = getAuthToken();
    
    if (!token) {
        throw new Error('Authentication required. Please log in again.');
    }

    // Convert filters object to query string with proper parameter names
    const queryParams = new URLSearchParams();
    
    // Map frontend filter names to backend parameter names
    if (filters.from) queryParams.append('from', filters.from);
    if (filters.to) queryParams.append('to', filters.to);
    if (filters.supplier) queryParams.append('supplier', filters.supplier);
    if (filters.pnr) queryParams.append('pnr', filters.pnr);
    if (filters.airline) queryParams.append('airline', filters.airline);
    if (filters.startDate) queryParams.append('startDate', filters.startDate);
    if (filters.endDate) queryParams.append('endDate', filters.endDate);

    try {
        const response = await api.get(`/inventory?${queryParams.toString()}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const result = response.data;

        if (!result.success) {
            throw new Error(result.message || 'Failed to fetch inventory');
        }

        return result.records || [];
    } catch (error) {
        console.error('Error in getInventory:', error);
        const errorMessage = error.response?.data?.message || error.message;
        throw new Error(`An error occurred while fetching inventory: ${errorMessage}`);
    }
};
