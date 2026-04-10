import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('aidlink_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => {
    // If our backend follows the { success: true, data: ... } pattern, unwrap it
    if (res.data && res.data.success === true && res.data.data !== undefined) {
      return { ...res, data: res.data.data };
    }
    return res;
  },
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('aidlink_token');
      localStorage.removeItem('aidlink_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
