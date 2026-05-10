import axios from 'axios';

const request = axios.create({
  baseURL: import.meta.env.APP_API_BASE_URL || '',
  timeout: 30000,
});

request.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('user_token');
    if (token) {
      config.headers['user-token'] = token;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

request.interceptors.response.use(
  (response) => {
    if (response.data && typeof response.data === 'object' && 'code' in response.data) {
      const code = response.data.code;
      if (code !== 200 && code !== 0) {
        const msg = response.data.message || response.data.msg || response.data.detail || JSON.stringify(response.data);
        throw new Error(msg);
      }
    }
    return response.data;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default request;
