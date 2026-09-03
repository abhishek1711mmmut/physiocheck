import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api'
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  config._toastId = toast.loading('Loading...');
  return config;
});

api.interceptors.response.use(
  (response) => {
    toast.dismiss(response.config._toastId);
    return response;
  },
  (error) => {
    toast.dismiss(error.config?._toastId);
    return Promise.reject(error);
  }
);

export default api;
