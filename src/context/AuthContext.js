import React, { createContext, useState, useContext, useEffect } from 'react';
import { authService } from '../services/auth';

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

  // ✅ Updated login with location
  const login = async (username, password, branch, location = null) => {
    console.log('🔍 AuthContext - login called with branch:', branch);
    console.log('🔍 AuthContext - location:', location);
    
    const result = await authService.login(username, password, branch, location);
    console.log('🔍 AuthContext - login result:', result);
    
    if (result.success) {
      setIsLoggedIn(true);
      setUser(result.user);
      setSelectedBranch(branch);
      console.log('🔍 AuthContext - branch stored in state:', branch);
    }
    return result;
  };

  // ✅ Updated logout with location
  const logout = async (location = null) => {
    await authService.logout(location);
    setIsLoggedIn(false);
    setUser(null);
    setSelectedBranch(null);
    console.log('🔍 AuthContext - logged out, branch cleared');
  };

  // ✅ The context value MUST include selectedBranch
  const contextValue = {
    isLoggedIn,
    user,
    loading,
    login,
    logout,
    selectedBranch,     // ✅ MUST be here
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