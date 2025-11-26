import api from '../lib/api'
// Define your API base URL here (e.g., where your Express server is running)
const API_BASE_URL = 'https://books-vm03.onrender.com/api'; 

// Helper function to get the auth token from localStorage
const getAuthToken = () => {
    return localStorage.getItem('token'); // Assuming you store the token in localStorage after login
};

/**
 * Sends a POST request to the API to create a new flight inventory entry.
 * @param {object} inventoryData - The formData object from the React component state.
 * @returns {Promise<object>} The success response data from the API.
 * @throws {Error} An error containing the message from the API failure.
 */
export const createInventory = async (inventoryData) => {
    const token = getAuthToken();
    
    if (!token) {
        throw new Error('Authentication required. Please log in again.');
    }

    const response = await fetch(`${API_BASE_URL}/inventory`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(inventoryData),
    });

    const result = await response.json();

    if (!response.ok) {
        // If the server responded with an error status (4xx or 5xx)
        let errorMessage = result.message || 'Server failed to save inventory.';
        
        // If the API provided a specific missing field, include it for better debugging
        if (result.field) {
            errorMessage = `${errorMessage} (Field: ${result.field})`;
        }
        
        // Throw a new Error so the component's catch block is triggered
        throw new Error(errorMessage); 
    }

    // Return the successful data (e.g., the new inventory ID)
    return result; 
};

/**
 * Fetches the inventory list with optional filters
 * @param {Object} filters - Object containing filter parameters
 * @returns {Promise<Array>} Array of inventory items
 */
export const deleteInventory = async (id) => {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/inventory/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('Failed to delete inventory');
    return await response.json();
};

export const toggleInventoryStatus = async (id, enabled) => {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/inventory/${id}/toggle-status`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ enabled }),
    });
    if (!response.ok) throw new Error('Failed to toggle status');
    return await response.json();
};

export const getFaresForInventory = async (id) => {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/inventory/${id}/fares`, {
        headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('Failed to fetch fares');
    return await response.json();
};

export const getInventoryDetails = async (id) => {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/inventory/${id}/details`, {
        headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('Failed to fetch inventory details');
    return await response.json();
};

export const updateFareForInventory = async (id, fareData) => {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/inventory/${id}/fare`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(fareData),
    });
    if (!response.ok) throw new Error('Failed to update fare');
    return await response.json();
};

export const addSeatsToInventory = async (id, seatsToAdd) => {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/inventory/${id}/add-seats`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ seatsToAdd }),
    });
    if (!response.ok) throw new Error('Failed to add seats');
    return await response.json();
};

export const removeSeatsFromInventory = async (id, seatsToMinus) => {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/inventory/${id}/minus-seats`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ seatsToMinus }),
    });
    if (!response.ok) throw new Error('Failed to remove seats');
    return await response.json();
};

export const updateInventoryDetails = async (id, data) => {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}/inventory/${id}/details`, {
    method: 'PUT',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to update inventory details');
  return await response.json();
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
        const response = await fetch(`${API_BASE_URL}/inventory?${queryParams.toString()}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || `HTTP error! status: ${response.status}`);
        }

        if (!result.success) {
            throw new Error(result.message || 'Failed to fetch inventory');
        }

        return result.records || [];
    } catch (error) {
        console.error('Error in getInventory:', error);
        throw new Error(`An error occurred while fetching inventory: ${error.message}`);
    }
};