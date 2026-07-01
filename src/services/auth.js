import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ENV } from '../config/env';

export const authService = {

  // =========================
  // LOGIN
  // =========================
  login: async (username, password, branchId) => {
    try {
      // 🔍 Debug input values
      console.log('LOGIN INPUT:', {
        username: username,
        password: password,
        branch: Number(branchId),
      });

      // 🧾 Payload sent to backend
      const payload = {
        username: username,
        password: password,
        branch: Number(branchId),  // ✅ FIXED: Use branchId
      };

      console.log('LOGIN PAYLOAD SENT:', payload);

      // 🚀 API CALL
      const response = await api.post('/auth/login', payload);

      console.log('LOGIN RESPONSE:', response.data);

      const { token, user } = response.data;

      // 💾 Save token
      await AsyncStorage.setItem(
        ENV.STORAGE_KEYS.TOKEN,
        token
      );

      // 💾 Save user with branch
      await AsyncStorage.setItem(
        ENV.STORAGE_KEYS.USER,
        JSON.stringify({
          ...user,
          branch: Number(branchId),  // ✅ FIXED: Use branchId
        })
      );

      return {
        success: true,
        token,
        user: {
          ...user,
          branch: Number(branchId),  // ✅ FIXED: Use branchId
        },
      };

    } catch (error) {
      console.log(
        'LOGIN ERROR:',
        error.response?.data || error.message
      );

      return {
        success: false,
        message:
          error.response?.data?.message ||
          'Login failed. Please try again.',
      };
    }
  },

  // =========================
  // LOGOUT
  // =========================
  logout: async () => {
    try {
      await AsyncStorage.removeItem(ENV.STORAGE_KEYS.TOKEN);
      await AsyncStorage.removeItem(ENV.STORAGE_KEYS.USER);
    } catch (error) {
      console.log('LOGOUT ERROR:', error);
    }
  },

  // =========================
  // CHECK AUTH
  // =========================
  checkAuth: async () => {
    try {
      const token = await AsyncStorage.getItem(
        ENV.STORAGE_KEYS.TOKEN
      );

      const user = await AsyncStorage.getItem(
        ENV.STORAGE_KEYS.USER
      );

      if (token && user) {
        return {
          isLoggedIn: true,
          user: JSON.parse(user),
        };
      }

      return {
        isLoggedIn: false,
        user: null,
      };

    } catch (error) {
      console.log('CHECK AUTH ERROR:', error);

      return {
        isLoggedIn: false,
        user: null,
      };
    }
  },

  // =========================
  // GET USER
  // =========================
  getCurrentUser: async () => {
    try {
      const user = await AsyncStorage.getItem(
        ENV.STORAGE_KEYS.USER
      );

      return user ? JSON.parse(user) : null;

    } catch (error) {
      console.log('GET USER ERROR:', error);
      return null;
    }
  },
};