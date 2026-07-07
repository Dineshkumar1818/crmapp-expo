import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../context/AuthContext';
import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen';
import CustomerQuickEntryScreen from '../screens/CustomerQuickEntryScreen';
import CustomerChitScreen from '../screens/CustomerChitScreen';
import CustomerRegistrationScreen from '../screens/CustomerRegistrationScreen';
import ChitTransactionScreen from '../screens/ChitTransactionScreen';
import BarcodeScannerScreen from '../screens/BarcodeScannerScreen';
import JourneyHistoryScreen from '../screens/JourneyHistoryScreen';
import TravelMapScreen from '../screens/TravelMapScreen';

const Stack = createStackNavigator();

const AppNavigator = () => {
  const { isLoggedIn } = useAuth();

  return (
    <Stack.Navigator 
      screenOptions={{ 
        headerShown: false,
        cardStyle: { backgroundColor: 'transparent' }
      }}
    >
      {isLoggedIn ? (
        <>
          <Stack.Screen name="Dashboard" component={DashboardScreen} />
          <Stack.Screen name="CustomerQuickEntry" component={CustomerQuickEntryScreen} />
          <Stack.Screen name="CustomerChit" component={CustomerChitScreen} />
          <Stack.Screen name="CustomerRegistration" component={CustomerRegistrationScreen} />
          <Stack.Screen name="ChitTransaction" component={ChitTransactionScreen} />
          <Stack.Screen name="BarcodeScanner" component={BarcodeScannerScreen} />
          <Stack.Screen name="JourneyHistory" component={JourneyHistoryScreen} options={{ headerShown: false }} />
          <Stack.Screen name="TravelMap" component={TravelMapScreen} options={{ headerShown: false }} />
        </>
      ) : (
        <Stack.Screen name="Login" component={LoginScreen} />
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;
