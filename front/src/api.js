import axios from 'axios';

// Assume the backend is running on this URL. Change if necessary.
const API_BASE_URL = 'https://new-folder-2-4ub8.onrender.com/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Fetches inventory records from the backend.
 * @param {object} filters - The filter criteria.
 * @returns {Promise<axios.AxiosResponse<any>>}
 */
export const getInventory = (filters) => {
  return apiClient.get('/inventory', { params: filters });
};

/**
 * Updates the fare for a specific inventory record.
 * @param {number} id - The ID of the record.
 * @param {number} newFare - The new fare value.
 * @returns {Promise<axios.AxiosResponse<any>>}
 */
export const updateFare = (id, fareData) => {
  return apiClient.put(`/inventory/${id}/fare`, fareData);
};

export const addSeats = (id, data) => {
  return apiClient.post(`/inventory/${id}/add-seats`, data);
};

// In your API service (api.js)
export const getFares = (id) => {
  return apiClient.get(`/inventory/${id}/fares`);
};

export const getInventoryDetails = (id) => {
  return apiClient.get(`/inventory/${id}/details`);
};

export const minusSeats = async (id, data) => {
  try {
    const response = await apiClient.post(`/inventory/${id}/minus-seats`, data);
    return response;
  } catch (error) {
    console.error('Error in minusSeats API call:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    throw error;
  }
};

export const addMoreSeats = async (id, data) => {
  try {
    console.log('Sending add more seats request:', { id, data });
    const response = await apiClient.post(`/inventory/${id}/add-more-seats`, data);
    console.log('Add more seats response:', response.data);
    return response;
  } catch (error) {
    console.error('Error in addMoreSeats API call:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    throw error;
  }
};

export const toggleStatus = (id, enabled) => {
  return apiClient.put(`/inventory/${id}/toggle-status`, { enabled });
};

export const fetchUserCount = async () => {
  try {
    const response = await apiClient.get('/usersno');
    return response.data;
  } catch (error) {
    console.error('Error fetching user count:', error);
    throw error;
  }
};

export const deleteRecord = (id) => {
  return apiClient.delete(`/inventory/${id}`);
};

export const fetchFareData = async (id) => {
  try {
    const response = await apiClient.get(`/inventory/${id}/fares`);
    return response.data;
  } catch (error) {
    console.error('Error in fetchFareData:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    throw error;
  }
};
