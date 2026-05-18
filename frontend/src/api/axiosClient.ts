import axios from 'axios';

console.log('VITE_MAIN_API_URL:', import.meta.env.VITE_MAIN_API_URL);
console.log('VITE_AUTH_API_URL:', import.meta.env.VITE_AUTH_API_URL);

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_MAIN_API_URL || 'https://backend-1s6m.onrender.com/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

const authClient = axios.create({
  baseURL: import.meta.env.VITE_AUTH_API_URL || 'https://backend-1s6m.onrender.com/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for main API
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for main API
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/auth/login';
    }
    return Promise.reject(error);
  }
);

// Request interceptor for auth API
authClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for auth API
authClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/auth/login';
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
export { authClient };
