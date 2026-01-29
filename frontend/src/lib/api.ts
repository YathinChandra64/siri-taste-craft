import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// 🔐 Attach JWT automatically - FIX: Use 'authToken' not 'token'
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken"); // ✅ FIXED: Changed from 'token' to 'authToken'
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 🚨 Handle expired token
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("authToken"); // ✅ FIXED: Changed from 'token' to 'authToken'
      localStorage.removeItem("user"); // ✅ FIXED: Also remove user data
      // Optionally redirect to login
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default API;