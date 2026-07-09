import React, { createContext, useState, useContext, useEffect } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../services/auth';
import locationTrackService from '../services/locationTrackService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [isResuming, setIsResuming] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const result = await authService.checkAuth();
        console.log('🔍 checkAuth result:', result);
        setIsLoggedIn(result.isLoggedIn);
        setUser(result.user);
        
        if (result.user?.branch) {
          setSelectedBranch(result.user.branch);
          console.log('🔍 Restored branch from storage:', result.user.branch);
        }

        if (result.isLoggedIn && result.user?.empcode) {
          console.log('🔄 Resuming tracking on app start...');
          setIsResuming(true);
          try {
            const resumed = await locationTrackService.resumeTracking();
            if (resumed) {
              console.log('✅ Tracking resumed successfully');
            } else {
              console.log('ℹ️ No existing session to resume, starting new tracking...');
              await locationTrackService.startTracking(
                result.user.empcode,
                result.user.branch || 1,
                60000
              );
            }
          } catch (error) {
            console.log('⚠️ Error resuming tracking:', error);
          } finally {
            setIsResuming(false);
          }
        }
      } catch (error) {
        console.log('Auth check error:', error);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextAppState) => {
      console.log(`📱 App state changed to: ${nextAppState}`);
      
      if (nextAppState === 'active') {
        console.log('📱 App came to foreground');
        if (isLoggedIn && user?.empcode && !isResuming) {
          console.log('🔄 Checking tracking status...');
          try {
            const resumed = await locationTrackService.resumeTracking();
            if (resumed) {
              console.log('✅ Tracking resumed on app reopen');
            }
          } catch (error) {
            console.log('⚠️ Error resuming tracking on app reopen:', error);
          }
        }
      } else if (nextAppState === 'background') {
        console.log('📱 App went to background');
      } else if (nextAppState === 'inactive') {
        console.log('📱 App is inactive');
      }
    });

    return () => {
      subscription.remove();
    };
  }, [isLoggedIn, user, isResuming]);

  const login = async (username, password, branch, location = null) => {
    console.log('🔍 AuthContext - login called with branch:', branch);
    console.log('🔍 AuthContext - location:', location);
    
    const result = await authService.login(username, password, branch, location);
    console.log('🔍 AuthContext - login result:', result);
    
    if (result.success) {
      const userData = {
        ...result.user,
        empcode: result.user.empcode || result.user.username || result.user.name || username,
      };
      
      setIsLoggedIn(true);
      setUser(userData);
      setSelectedBranch(branch);
      console.log('🔍 AuthContext - branch stored in state:', branch);
      console.log('🔍 AuthContext - empcode:', userData.empcode);
      
      if (userData.empcode) {
        console.log('📍 Starting location tracking for user:', userData.empcode);
        try {
          const storedSessionId = await AsyncStorage.getItem('tracking_sessionId');
          const storedEmpcode = await AsyncStorage.getItem('tracking_empcode');
          
          if (storedSessionId && storedEmpcode && parseInt(storedEmpcode) === parseInt(userData.empcode)) {
            console.log('🔄 Found existing session, resuming instead of starting new...');
            await locationTrackService.resumeTracking();
          } else {
            console.log('🔄 Starting new tracking session...');
            await locationTrackService.startTracking(
              userData.empcode,
              branch,
              60000
            );
          }
          console.log('✅ Location tracking started successfully');
        } catch (error) {
          console.log('❌ Failed to start location tracking:', error);
        }
      } else {
        console.log('⚠️ No empcode found, skipping location tracking');
      }
    }
    return result;
  };

  // ✅ FIXED: Proper logout - Stop tracking IMMEDIATELY
  const logout = async (location = null) => {
    console.log('====================================');
    console.log('🚪 LOGOUT STARTED');
    console.log('====================================');
    
    // ✅ STEP 1: Stop tracking IMMEDIATELY
    console.log('📍 Stopping location tracking immediately...');
    try {
      const trackedLocations = locationTrackService.getTrackedLocations();
      console.log(`📍 Journey has ${trackedLocations.length} locations`);
      
      // ✅ Stop tracking - this clears intervals and background tasks
      await locationTrackService.stopTracking();
      console.log('✅ Location tracking stopped successfully');
    } catch (error) {
      console.log('⚠️ Error stopping location tracking:', error);
    }
    
    // ✅ STEP 2: Save logout location to backend
    if (location) {
      try {
        console.log('📍 Saving logout location to backend...');
        await authService.logout(location);
        console.log('✅ Logout location saved');
      } catch (error) {
        console.log('⚠️ Error saving logout location:', error);
      }
    } else {
      console.log('⚠️ No location provided for logout');
      await authService.logout(null);
    }
    
    // ✅ STEP 3: Clear all state
    setIsLoggedIn(false);
    setUser(null);
    setSelectedBranch(null);
    
    // ✅ STEP 4: Clear AsyncStorage tracking data
    try {
      await AsyncStorage.removeItem('tracking_empcode');
      await AsyncStorage.removeItem('tracking_branch');
      await AsyncStorage.removeItem('tracking_sessionId');
      await AsyncStorage.removeItem('is_tracking');
      await AsyncStorage.removeItem('tracked_locations');
      console.log('✅ Tracking data cleared from AsyncStorage');
    } catch (error) {
      console.log('⚠️ Error clearing tracking data:', error);
    }
    
    console.log('🔍 AuthContext - logged out, branch cleared');
    console.log('====================================');
    console.log('🚪 LOGOUT COMPLETED');
    console.log('====================================');
  };

  const contextValue = {
    isLoggedIn,
    user,
    loading,
    login,
    logout,
    selectedBranch,
    setSelectedBranch,
    isResuming,
  };

  console.log('🔍 AuthContext - contextValue has selectedBranch:', contextValue.selectedBranch);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};