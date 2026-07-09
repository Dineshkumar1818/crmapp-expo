import * as Location from 'expo-location';
import { Alert, Platform } from 'react-native';

/**
 * Show alert - cross-platform compatible
 */
const showAlert = (title, message, buttons = [{ text: 'OK' }]) => {
  if (Platform.OS === 'web') {
    // ✅ Use browser alert for web
    alert(`${title}\n\n${message}`);
    return;
  }
  // ✅ Use React Native Alert for mobile
  Alert.alert(title, message, buttons);
};

/**
 * Check if location services are enabled on the device
 */
export const checkLocationEnabled = async () => {
  try {
    // ✅ Web doesn't have location services check, skip it
    if (Platform.OS === 'web') {
      console.log('📍 Web platform - checking if geolocation is available');
      if (!navigator.geolocation) {
        showAlert(
          'Location Error',
          'Geolocation is not supported by your browser.'
        );
        return false;
      }
      return true;
    }

    const enabled = await Location.hasServicesEnabledAsync();
    console.log('📍 Location services enabled:', enabled);
    
    if (!enabled) {
      console.log('📍 Location services are OFF');
      showAlert(
        'Location Required',
        'Please enable location services to logout.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Open Settings', 
            onPress: async () => {
              try {
                await Location.enableNetworkProviderAsync();
              } catch (error) {
                console.log('Error opening location settings:', error);
              }
            }
          }
        ]
      );
      return false;
    }
    return true;
  } catch (error) {
    console.log('Error checking location services:', error);
    return false;
  }
};

/**
 * Request foreground location permission
 */
export const requestLocationPermission = async () => {
  try {
    // ✅ Web permission handling
    if (Platform.OS === 'web') {
      console.log('📍 Web platform - checking geolocation permission');
      // Check if geolocation is available
      if (!navigator.geolocation) {
        showAlert(
          'Location Error',
          'Geolocation is not supported by your browser.'
        );
        return false;
      }
      
      // Try to get a quick location to check permission
      try {
        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 5000,
            maximumAge: 0,
          });
        });
        // If we get a position, permission is granted
        console.log('📍 Web location permission granted');
        return true;
      } catch (error) {
        console.log('📍 Web location permission denied or error:', error);
        showAlert(
          'Permission Required',
          'Location permission is required for logout tracking. Please enable it in browser settings.'
        );
        return false;
      }
    }

    const { status } = await Location.requestForegroundPermissionsAsync();
    console.log('📍 Location permission status:', status);
    
    if (status !== 'granted') {
      showAlert(
        'Permission Denied',
        'Location permission is required for tracking. Please enable it in settings.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  } catch (error) {
    console.log('Error requesting location permission:', error);
    return false;
  }
};

/**
 * ✅ NEW: Request background location permission
 */
export const requestBackgroundLocationPermission = async () => {
  try {
    if (Platform.OS === 'web') {
      console.log('📍 Web platform - background location not supported');
      return false;
    }

    console.log('📍 Requesting background location permission...');
    const { status } = await Location.requestBackgroundPermissionsAsync();
    console.log('📍 Background permission status:', status);
    
    if (status !== 'granted') {
      console.log('⚠️ Background location permission denied');
      showAlert(
        'Background Location',
        'Background location permission is required for tracking when the app is closed. Please enable it in settings.',
        [
          { text: 'OK' }
        ]
      );
      return false;
    }
    
    console.log('✅ Background location permission granted');
    return true;
  } catch (error) {
    console.log('Error requesting background permission:', error);
    return false;
  }
};

/**
 * ✅ NEW: Check if background location permission is granted
 */
export const checkBackgroundLocationPermission = async () => {
  try {
    if (Platform.OS === 'web') {
      return false;
    }
    const { status } = await Location.getBackgroundPermissionsAsync();
    console.log('📍 Background permission status:', status);
    return status === 'granted';
  } catch (error) {
    console.log('Error checking background permission:', error);
    return false;
  }
};

/**
 * ✅ NEW: Check both foreground and background permissions
 */
export const requestAllLocationPermissions = async () => {
  try {
    console.log('📍 Requesting all location permissions...');
    
    // First, check foreground permission
    const foregroundGranted = await requestLocationPermission();
    if (!foregroundGranted) {
      console.log('❌ Foreground permission denied');
      return {
        foreground: false,
        background: false,
        allGranted: false,
      };
    }

    // Then, check background permission
    const backgroundGranted = await requestBackgroundLocationPermission();
    
    return {
      foreground: true,
      background: backgroundGranted,
      allGranted: foregroundGranted && backgroundGranted,
    };
  } catch (error) {
    console.log('Error requesting all permissions:', error);
    return {
      foreground: false,
      background: false,
      allGranted: false,
    };
  }
};

/**
 * Get current location with high accuracy
 */
export const getCurrentLocation = async () => {
  try {
    console.log('📍 Getting current position...');
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
      timeout: 15000,
    });
    
    console.log('📍 Location obtained:', location.coords);
    
    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      accuracy: location.coords.accuracy,
      altitude: location.coords.altitude,
      speed: location.coords.speed,
    };
  } catch (error) {
    console.log('Error getting location:', error);
    console.log('Error code:', error.code);
    console.log('Error message:', error.message);
    
    // Handle specific error cases
    if (error.code === 'E_LOCATION_TIMEOUT') {
      showAlert(
        'Location Timeout',
        'Could not get location. Please try again or check your GPS signal.'
      );
    } else if (error.code === 'E_LOCATION_UNAVAILABLE') {
      showAlert(
        'Location Unavailable',
        'GPS signal is weak. Please move to an open area and try again.'
      );
    } else if (error.code === 'E_NO_PERMISSIONS') {
      showAlert(
        'Permission Required',
        'Location permission is needed. Please grant permission in settings.'
      );
    } else {
      showAlert(
        'Location Error',
        'Could not get your location. Please enable GPS and try again.'
      );
    }
    
    return null;
  }
};

/**
 * Complete location check - checks services, permissions, and gets location
 * Returns location object or null if any step fails
 */
export const getLocationWithCheck = async () => {
  console.log('📍 Starting location check...');
  
  // Step 1: Check if location services are enabled
  const servicesEnabled = await checkLocationEnabled();
  if (!servicesEnabled) {
    console.log('📍 Location services check failed');
    return null;
  }

  // Step 2: Request permission
  const hasPermission = await requestLocationPermission();
  if (!hasPermission) {
    console.log('📍 Location permission check failed');
    return null;
  }

  // Step 3: Get current location
  const location = await getCurrentLocation();
  if (!location) {
    console.log('📍 Failed to get current location');
    return null;
  }

  console.log('📍 Location check successful:', location);
  return location;
};

/**
 * ✅ NEW: Get location with background permission check
 */
export const getLocationWithBackgroundCheck = async () => {
  console.log('📍 Starting location check with background support...');
  
  // Get all permissions
  const permissions = await requestAllLocationPermissions();
  console.log('📍 Permissions result:', permissions);
  
  if (!permissions.foreground) {
    console.log('❌ Foreground permission not granted');
    return { location: null, permissions };
  }

  // Get current location
  const location = await getCurrentLocation();
  
  return {
    location,
    permissions,
    backgroundEnabled: permissions.background,
  };
};

/**
 * Web fallback for browser-based location
 */
export const getWebLocation = () => {
  return new Promise((resolve) => {
    console.log('📍 Getting web location...');
    
    if (!navigator.geolocation) {
      showAlert('Error', 'Geolocation is not supported by your browser.');
      resolve(null);
      return;
    }

    // ✅ First check if we can get location
    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log('📍 Web location obtained:', position.coords);
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      (error) => {
        console.log('Web location error:', error);
        console.log('Error code:', error.code);
        console.log('Error message:', error.message);
        
        // ✅ Show specific error message based on error code
        let message = 'Could not get your location. Please enable location services.';
        if (error.code === 1) {
          message = 'Location permission denied. Please enable location in browser settings.';
        } else if (error.code === 2) {
          message = 'Location unavailable. Please check your GPS signal.';
        } else if (error.code === 3) {
          message = 'Location request timed out. Please try again.';
        }
        
        showAlert('Location Required', message);
        resolve(null);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000,
      }
    );
  });
};

/**
 * Cross-platform location getter
 */
export const getLocationCrossPlatform = async () => {
  console.log('📍 Getting location (cross-platform)...');
  if (Platform.OS === 'web') {
    return await getWebLocation();
  } else {
    return await getLocationWithCheck();
  }
};

/**
 * ✅ NEW: Cross-platform location getter with background support
 */
export const getLocationCrossPlatformWithBackground = async () => {
  console.log('📍 Getting location with background support...');
  if (Platform.OS === 'web') {
    const location = await getWebLocation();
    return { location, backgroundEnabled: false };
  } else {
    return await getLocationWithBackgroundCheck();
  }
};