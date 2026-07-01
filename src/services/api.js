import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ENV } from '../config/env';

const api = axios.create({
  baseURL: ENV.API_URL,
  timeout: ENV.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem(ENV.STORAGE_KEYS.TOKEN);

      console.log('TOKEN FROM STORAGE:', token);

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;

        console.log(
          'Authorization Header:',
          config.headers.Authorization
        );
      }
    } catch (error) {
      console.log('Error getting token:', error);
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem(ENV.STORAGE_KEYS.TOKEN);
      await AsyncStorage.removeItem(ENV.STORAGE_KEYS.USER);
    }
    return Promise.reject(error);
  }
);

export default api;
