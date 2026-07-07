import React, { createContext, useState, useContext, useEffect } from 'react';
import { authService } from '../services/auth';
import locationTrackService from '../services/locationTrackService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedBranch, setSelectedBranch] = useState(null);

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
      } catch (error) {
        console.log('Auth check error:', error);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  // ✅ Updated login with location tracking
  const login = async (username, password, branch, location = null) => {
    console.log('🔍 AuthContext - login called with branch:', branch);
    console.log('🔍 AuthContext - location:', location);
    
    const result = await authService.login(username, password, branch, location);
    console.log('🔍 AuthContext - login result:', result);
    
    if (result.success) {
      // ✅ Ensure empcode exists - use username if empcode is missing
      const userData = {
        ...result.user,
        empcode: result.user.empcode || result.user.username || result.user.name || username,
      };
      
      setIsLoggedIn(true);
      setUser(userData);
      setSelectedBranch(branch);
      console.log('🔍 AuthContext - branch stored in state:', branch);
      console.log('🔍 AuthContext - empcode:', userData.empcode);
      
      // ✅ Start location tracking after successful login
      if (userData.empcode) {
        console.log('📍 Starting location tracking for user:', userData.empcode);
        try {
          await locationTrackService.startTracking(
            userData.empcode,
            branch,
            30000 // Track every 30 seconds
          );
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

  // ✅ Updated logout with location tracking
  const logout = async (location = null) => {
    // ✅ Stop location tracking and save journey
    console.log('📍 Stopping location tracking...');
    
    try {
      const trackedLocations = await locationTrackService.getTrackedLocations();
      console.log(`📍 Journey has ${trackedLocations.length} locations`);
      
      await locationTrackService.stopTracking();
    } catch (error) {
      console.log('⚠️ Error stopping location tracking:', error);
    }
    
    await authService.logout(location);
    setIsLoggedIn(false);
    setUser(null);
    setSelectedBranch(null);
    console.log('🔍 AuthContext - logged out, branch cleared');
  };

  const contextValue = {
    isLoggedIn,
    user,
    loading,
    login,
    logout,
    selectedBranch,
    setSelectedBranch,
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