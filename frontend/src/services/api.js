import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api'
});

let activeRequests = 0;
const TOAST_ID = 'api-loading';

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  activeRequests++;
  if (activeRequests === 1) {
    toast.loading('Loading...', { id: TOAST_ID });
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    activeRequests--;
    if (activeRequests === 0) toast.dismiss(TOAST_ID);
    return response;
  },
  (error) => {
    activeRequests--;
    if (activeRequests === 0) toast.dismiss(TOAST_ID);
    return Promise.reject(error);
  }
);

export default api;
