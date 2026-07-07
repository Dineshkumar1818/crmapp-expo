import api from './api';
import { getLocationCrossPlatform } from './locationService';
import AsyncStorage from '@react-native-async-storage/async-storage';

class LocationTrackService {
  constructor() {
    this.trackingInterval = null;
    this.isTracking = false;
    this.locations = [];
    this.empcode = null;
    this.branch = null;
    this.isPaused = false;
  }

  /**
   * Start tracking location
   */
  startTracking = async (empcode, branch, interval = 30000) => {
    if (this.isTracking) {
      console.log('📍 Location tracking already running');
      return;
    }

    if (!empcode) {
      console.log('❌ Cannot start tracking: empcode is required');
      return;
    }

    this.empcode = empcode;
    this.branch = branch;
    this.isTracking = true;
    this.locations = [];
    this.isPaused = false;

    console.log(`📍 Starting location tracking for empcode: ${empcode}`);

    // Get initial location immediately
    await this.trackLocation();

    // Start interval for periodic tracking
    this.trackingInterval = setInterval(async () => {
      if (!this.isPaused) {
        await this.trackLocation();
      }
    }, interval);

    console.log('📍 Location tracking started successfully');
  };

  /**
   * Stop tracking location
   */
  stopTracking = async () => {
    console.log('📍 Stopping location tracking...');
    this.isTracking = false;
    
    if (this.trackingInterval) {
      clearInterval(this.trackingInterval);
      this.trackingInterval = null;
    }

    // Save tracked locations to storage for history
    if (this.locations.length > 0) {
      await this.saveJourneyToStorage();
    }

    console.log(`📍 Location tracking stopped. Tracked ${this.locations.length} locations`);
  };

  /**
   * Pause tracking
   */
  pauseTracking = () => {
    this.isPaused = true;
    console.log('📍 Location tracking paused');
  };

  /**
   * Resume tracking
   */
  resumeTracking = () => {
    this.isPaused = false;
    console.log('📍 Location tracking resumed');
  };

  /**
   * Track a single location
   */
  trackLocation = async () => {
    try {
      const location = await getLocationCrossPlatform();
      
      if (!location) {
        console.log('⚠️ Could not get location for tracking');
        return;
      }

      // Check if location has changed significantly (more than 50 meters)
      if (this.locations.length > 0) {
        const lastLocation = this.locations[this.locations.length - 1];
        const distance = this.calculateDistance(
          lastLocation.latitude, lastLocation.longitude,
          location.latitude, location.longitude
        );
        
        if (distance < 0.05) { // 50 meters in km
          console.log('📍 Location unchanged, skipping...');
          return;
        }
      }

      const locationData = {
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy || null,
        tracked_at: new Date().toISOString(),
      };

      this.locations.push(locationData);
      console.log(`📍 Location tracked: ${location.latitude}, ${location.longitude} (${this.locations.length} total)`);

      await this.sendLocationToBackend(locationData);

    } catch (error) {
      console.log('❌ Failed to track location:', error);
    }
  };

  /**
   * Send location to backend
   */
  sendLocationToBackend = async (locationData) => {
    try {
      if (!this.empcode) {
        console.log('⚠️ No empcode, skipping backend save');
        return;
      }

      const payload = {
        empcode: this.empcode,
        branch: this.branch || 1,
        location: {
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          accuracy: locationData.accuracy || null,
        }
      };

      const response = await api.post('/location-track', payload);
      
      if (response.data.success) {
        console.log('✅ Location saved to backend');
      } else {
        console.log('⚠️ Backend save failed:', response.data.message);
      }
    } catch (error) {
      console.log('❌ Failed to send location to backend:', error);
    }
  };

  /**
   * Save journey to local storage for history
   */
  saveJourneyToStorage = async () => {
    try {
      const journeyData = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        empcode: this.empcode,
        branch: this.branch,
        locations: this.locations,
        loginLocation: this.locations[0] || null,
        logoutLocation: this.locations[this.locations.length - 1] || null,
        totalDistance: this.calculateTotalDistance(),
        totalLocations: this.locations.length,
      };

      // Get existing journeys
      const existingJourneys = await AsyncStorage.getItem('journey_history');
      let journeys = existingJourneys ? JSON.parse(existingJourneys) : [];
      
      // Add new journey
      journeys.unshift(journeyData);
      
      // Keep only last 50 journeys
      if (journeys.length > 50) {
        journeys = journeys.slice(0, 50);
      }

      await AsyncStorage.setItem('journey_history', JSON.stringify(journeys));
      console.log('✅ Journey saved to local storage');
    } catch (error) {
      console.log('❌ Failed to save journey:', error);
    }
  };

  /**
   * Get tracked locations
   */
  getTrackedLocations = () => {
    return this.locations;
  };

  /**
   * Clear tracked locations
   */
  clearTrackedLocations = () => {
    this.locations = [];
  };

  /**
   * Get journey history from local storage
   */
  getJourneyHistory = async () => {
    try {
      const journeys = await AsyncStorage.getItem('journey_history');
      return journeys ? JSON.parse(journeys) : [];
    } catch (error) {
      console.log('❌ Failed to get journey history:', error);
      return [];
    }
  };

  /**
   * Clear all journey history
   */
  clearJourneyHistory = async () => {
    try {
      await AsyncStorage.removeItem('journey_history');
      console.log('✅ Journey history cleared');
    } catch (error) {
      console.log('❌ Failed to clear journey history:', error);
    }
  };

  /**
   * Calculate distance between two coordinates
   */
  calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  /**
   * Calculate total distance of journey
   */
  calculateTotalDistance = () => {
    if (this.locations.length < 2) return 0;
    let total = 0;
    for (let i = 1; i < this.locations.length; i++) {
      total += this.calculateDistance(
        this.locations[i-1].latitude, this.locations[i-1].longitude,
        this.locations[i].latitude, this.locations[i].longitude
      );
    }
    return total;
  };
}

export default new LocationTrackService();