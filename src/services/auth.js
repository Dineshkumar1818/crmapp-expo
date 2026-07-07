import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ENV } from '../config/env';

export const authService = {

  // =========================
  // LOGIN - Updated with Location
  // =========================
  login: async (username, password, branchId, location = null) => {
    try {
      // 🔍 Debug input values
      console.log('LOGIN INPUT:', {
        username: username,
        password: password,
        branch: Number(branchId),
        location: location,
      });

      // 🧾 Payload sent to backend
      const payload = {
        username: username,
        password: password,
        branch: Number(branchId),
      };

      // ✅ Add location if available
      if (location) {
        payload.location = {
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy || null,
        };
      }

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
          empcode: user.empcode || user.Username || user.id,
          branch: Number(branchId),
        })
      );

      return {
        success: true,
        token,
        user: {
          ...user,
          empcode: user.empcode || user.Username || user.id,
          branch: Number(branchId),
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
  // LOGOUT - Updated with empcode
  // =========================
  logout: async (location = null) => {
    try {
      // Get current user for logout tracking
      const user = await authService.getCurrentUser();
      
      // Prepare logout payload
      const payload = {};
      
      // ✅ Use empcode instead of userId
      if (user && user.empcode) {
        payload.empcode = user.empcode;
      }
      
      // Add branch if available
      if (user && user.branch) {
        payload.branch = user.branch;
      }
      
      // Add location if available
      if (location) {
        payload.location = {
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy || null,
        };
        payload.action = 'logout';
      }

      console.log('LOGOUT PAYLOAD:', payload);

      // ✅ Send logout location to backend (if user is logged in)
      if (user && user.empcode) {
        try {
          await api.post('/auth/logout-location', payload);
          console.log('✅ Logout location saved');
        } catch (error) {
          console.log('⚠️ Logout location save failed:', error);
          // Don't block logout if location save fails
        }
      }

      // Clear local storage
      await AsyncStorage.removeItem(ENV.STORAGE_KEYS.TOKEN);
      await AsyncStorage.removeItem(ENV.STORAGE_KEYS.USER);
      
      return { success: true };

    } catch (error) {
      console.log('LOGOUT ERROR:', error);
      // Still clear storage even if API fails
      await AsyncStorage.removeItem(ENV.STORAGE_KEYS.TOKEN);
      await AsyncStorage.removeItem(ENV.STORAGE_KEYS.USER);
      return { success: false, error };
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
        const parsedUser = JSON.parse(user);
        return {
          isLoggedIn: true,
          user: parsedUser,
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