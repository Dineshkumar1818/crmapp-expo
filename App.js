import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';

console.log('1. App.js loaded');
console.log('2. AuthProvider:', AuthProvider);
console.log('3. AppNavigator:', AppNavigator);

const App = () => {
  console.log('4. App rendering');
  return (
    <AuthProvider>
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
};

export default App;