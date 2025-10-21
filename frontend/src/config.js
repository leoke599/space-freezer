// API Configuration
// Automatically uses the current host for production builds
// Uses localhost for development

const API_BASE_URL = import.meta.env.DEV 
  ? 'http://127.0.0.1:8000'  // Development mode
  : window.location.origin;   // Production mode - use same host as frontend

export { API_BASE_URL };
