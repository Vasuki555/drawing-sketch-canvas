// API Configuration
// Update this file to change the backend URL

import { Platform } from 'react-native';

// Get local network IP for mobile development
// Replace '192.168.1.100' with your computer's actual IP address
const LOCAL_IP = '10.10.44.215';

export const API_CONFIG = {
  // Development - automatically uses correct URL based on platform
  BASE_URL: __DEV__ 
    ? (Platform.OS === 'web' ? 'http://localhost:8000' : `http://${LOCAL_IP}:8000`)
    : 'https://your-production-api.com',
  
  TIMEOUT: 10000, // 10 seconds
  
  // Enable/disable backend integration
  ENABLED: true,
};

export default API_CONFIG;