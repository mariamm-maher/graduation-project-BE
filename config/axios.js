const axios = require('axios');

/** Shared API client for frontend-style services (base URL includes /api). */
const api = axios.create({
  baseURL: process.env.VITE_API_BASE_URL || process.env.API_BASE_URL || 'http://localhost:5000/api',
  withCredentials: true,
});

module.exports = api;
