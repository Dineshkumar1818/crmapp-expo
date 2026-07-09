import api from './api';
import { getLocationCrossPlatform } from './locationService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';

// ✅ Define background location task name
const BACKGROUND_LOCATION_TASK = 'background-location-task';

// ✅ Define the background task
TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ data, error }) => {
  if (error) {
    console.log('❌ Background location error:', error);
    return;
  }
  
  if (data) {
    const { locations } = data;
    const location = locations[0];
    
    if (!location) {
      console.log('⚠️ No location from background task');
      return;
    }
    
    console.log(`📍 Background location: ${location.coords.latitude}, ${location.coords.longitude}`);
    
    try {
      const empcode = await AsyncStorage.getItem('tracking_empcode');
      const branch = await AsyncStorage.getItem('tracking_branch');
      const sessionId = await AsyncStorage.getItem('tracking_sessionId');
      const trackedLocations = await AsyncStorage.getItem('tracked_locations');
      
      if (empcode) {
        // Send to backend
        const payload = {
          empcode: parseInt(empcode),
          branch: parseInt(branch || 1),
          sessionId: sessionId || `JRN_${empcode}_${Date.now()}`,
          location: {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy || 0,
          }
        };
        
        console.log('📤 Background location payload:', JSON.stringify(payload, null, 2));
        
        try {
          const response = await api.post('/auth/location-track', payload);
          if (response.data && response.data.success) {
            console.log('✅ Background location saved to backend!');
            
            // ✅ Save to local storage for persistence
            let savedLocations = trackedLocations ? JSON.parse(trackedLocations) : [];
            savedLocations.push({
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              accuracy: location.coords.accuracy || 0,
              tracked_at: new Date().toISOString(),
            });
            await AsyncStorage.setItem('tracked_locations', JSON.stringify(savedLocations));
          } else {
            console.log('⚠️ Background location save failed:', response.data?.message);
          }
        } catch (error) {
          console.log('❌ Background location API error:', error.message);
        }
      }
    } catch (error) {
      console.log('❌ Error processing background location:', error);
    }
  }
});

class LocationTrackService {
  constructor() {
    this.trackingInterval = null;
    this.isTracking = false;
    this.locations = [];
    this.empcode = null;
    this.branch = null;
    this.sessionId = null;
    this.failedLocations = [];
    this.isPaused = false;
    this.backgroundTaskStarted = false;
    this.isRestoring = false;
    this.isStopping = false;
  }

  /**
   * Start tracking location with background support and session resume
   */
  startTracking = async (empcode, branch, interval = 60000) => {
    // ✅ Check if we're already tracking
    if (this.isTracking && !this.isRestoring) {
      console.log('📍 Location tracking already running');
      return { success: true, message: 'Already tracking' };
    }

    if (!empcode) {
      console.log('❌ Cannot start tracking: empcode is required');
      return { success: false, message: 'Empcode required' };
    }

    // ✅ Check for existing session
    const storedSessionId = await AsyncStorage.getItem('tracking_sessionId');
    const storedEmpcode = await AsyncStorage.getItem('tracking_empcode');
    const storedLocations = await AsyncStorage.getItem('tracked_locations');
    const storedBranch = await AsyncStorage.getItem('tracking_branch');

    // ✅ If we have a stored session with same empcode, restore it
    if (storedSessionId && storedEmpcode && parseInt(storedEmpcode) === parseInt(empcode)) {
      console.log(`🔄 Restoring existing session: ${storedSessionId}`);
      console.log(`📍 Found ${storedLocations ? JSON.parse(storedLocations).length : 0} stored locations`);
      
      this.sessionId = storedSessionId;
      this.empcode = parseInt(empcode);
      this.branch = parseInt(storedBranch || branch || 1);
      
      // Restore previously tracked locations
      if (storedLocations) {
        this.locations = JSON.parse(storedLocations);
        console.log(`📍 Restored ${this.locations.length} locations from storage`);
      }
      
      this.isTracking = true;
      this.isRestoring = true;
      
      // ✅ Start interval for tracking
      if (this.trackingInterval) {
        clearInterval(this.trackingInterval);
      }
      
      this.trackingInterval = setInterval(async () => {
        if (!this.isPaused && this.isTracking && !this.isStopping) {
          await this.trackLocation();
        }
      }, interval);
      
      console.log(`✅ Tracking restored with session: ${this.sessionId}`);
      this.isRestoring = false;
      
      // ✅ Check and restart background tracking
      await this.ensureBackgroundTracking();
      
      return { 
        success: true, 
        sessionId: this.sessionId, 
        restored: true, 
        locations: this.locations.length,
        message: 'Session restored successfully'
      };
    }

    // ✅ NEW SESSION - Generate new session ID
    this.sessionId = `JRN_${empcode}_${Date.now()}`;
    this.empcode = parseInt(empcode);
    this.branch = parseInt(branch || 1);
    this.isTracking = true;
    this.locations = [];
    this.isPaused = false;
    this.failedLocations = [];
    this.isStopping = false;

    // ✅ Store tracking info for persistence
    await AsyncStorage.setItem('tracking_empcode', String(empcode));
    await AsyncStorage.setItem('tracking_branch', String(branch || 1));
    await AsyncStorage.setItem('tracking_sessionId', this.sessionId);
    await AsyncStorage.setItem('is_tracking', 'true');
    await AsyncStorage.setItem('tracked_locations', JSON.stringify([]));

    console.log('====================================');
    console.log('📍 STARTING NEW LOCATION TRACKING');
    console.log(`📌 Empcode: ${this.empcode}`);
    console.log(`📌 Branch: ${this.branch}`);
    console.log(`📌 Session ID: ${this.sessionId}`);
    console.log('✅ Tracking data saved to AsyncStorage');
    console.log('====================================');

    // ✅ Request and start background location tracking
    await this.startBackgroundTracking();

    // ✅ Get initial location immediately
    await this.trackLocation();

    // ✅ Start interval for periodic tracking
    this.trackingInterval = setInterval(async () => {
      if (!this.isPaused && this.isTracking && !this.isStopping) {
        await this.trackLocation();
      }
    }, interval);

    console.log('✅ Location tracking started successfully');
    return { 
      success: true, 
      sessionId: this.sessionId, 
      backgroundTracking: this.backgroundTaskStarted,
      message: 'New tracking session started'
    };
  };

  /**
   * Ensure background tracking is running
   */
  ensureBackgroundTracking = async () => {
    try {
      const isRunning = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
      if (!isRunning) {
        console.log('🔄 Background tracking not running, restarting...');
        await this.startBackgroundTracking();
      } else {
        console.log('✅ Background tracking is already running');
      }
    } catch (error) {
      console.log('⚠️ Could not check background task:', error);
      await this.startBackgroundTracking();
    }
  };

  /**
   * Start background tracking
   */
  startBackgroundTracking = async () => {
    try {
      const { status } = await Location.requestBackgroundPermissionsAsync();
      console.log(`📍 Background permission status: ${status}`);
      
      if (status === 'granted') {
        await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
          accuracy: Location.Accuracy.High,
          timeInterval: 60000,
          distanceInterval: 10,
          foregroundService: {
            notificationTitle: '📍 Location Tracking',
            notificationBody: 'Tracking your journey in background...',
            notificationColor: '#D4AF37',
          },
        });
        this.backgroundTaskStarted = true;
        console.log('✅ Background location tracking started');
        return true;
      } else {
        console.log('⚠️ Background location permission denied');
        return false;
      }
    } catch (error) {
      console.log('⚠️ Could not start background tracking:', error.message);
      return false;
    }
  };

  /**
   * Stop tracking location
   */
  stopTracking = async () => {
    console.log('====================================');
    console.log('📍 STOPPING LOCATION TRACKING');
    console.log('====================================');
    
    this.isStopping = true;
    this.isTracking = false;
    
    if (this.trackingInterval) {
      clearInterval(this.trackingInterval);
      this.trackingInterval = null;
      console.log('✅ Tracking interval cleared');
    }
    
    try {
      if (this.backgroundTaskStarted) {
        await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
        console.log('✅ Background tracking stopped');
        this.backgroundTaskStarted = false;
      }
    } catch (error) {
      console.log('⚠️ Could not stop background tracking:', error.message);
    }
    
    await AsyncStorage.removeItem('tracking_empcode');
    await AsyncStorage.removeItem('tracking_branch');
    await AsyncStorage.removeItem('tracking_sessionId');
    await AsyncStorage.removeItem('is_tracking');
    await AsyncStorage.removeItem('tracked_locations');
    console.log('✅ Tracking data cleared from AsyncStorage');

    if (this.locations.length > 0) {
      try {
        console.log('📌 Getting logout location...');
        const logoutLocation = await getLocationCrossPlatform();
        if (logoutLocation) {
          console.log('📌 Logout location obtained:', logoutLocation);
          await this.sendLocationToBackend({
            latitude: logoutLocation.latitude,
            longitude: logoutLocation.longitude,
            accuracy: logoutLocation.accuracy || 0,
            action: 'logout',
          });
        } else {
          console.log('⚠️ Could not get logout location');
        }
      } catch (error) {
        console.log('⚠️ Failed to get logout location:', error);
      }
    }

    if (this.locations.length > 0) {
      await this.saveJourneyToStorage();
      console.log(`✅ Journey saved with ${this.locations.length} locations`);
    } else {
      console.log('⚠️ No locations to save');
    }

    await this.retryFailedLocations();
    this.isStopping = false;

    console.log(`📍 Location tracking stopped. Tracked ${this.locations.length} locations`);
    console.log('====================================');
  };

  /**
   * Resume tracking after app comes back to foreground
   */
  resumeTracking = async () => {
    console.log('🔄 Attempting to resume tracking...');
    
    const empcode = await AsyncStorage.getItem('tracking_empcode');
    const sessionId = await AsyncStorage.getItem('tracking_sessionId');
    const storedLocations = await AsyncStorage.getItem('tracked_locations');
    const branch = await AsyncStorage.getItem('tracking_branch');
    
    if (empcode && sessionId) {
      console.log(`🔄 Found existing session: ${sessionId}`);
      
      if (storedLocations) {
        const parsed = JSON.parse(storedLocations);
        this.locations = parsed;
        console.log(`📍 Restored ${parsed.length} locations from storage`);
      }
      
      this.empcode = parseInt(empcode);
      this.branch = parseInt(branch || 1);
      this.sessionId = sessionId;
      this.isTracking = true;
      this.isStopping = false;
      
      if (!this.trackingInterval) {
        this.trackingInterval = setInterval(async () => {
          if (!this.isPaused && this.isTracking && !this.isStopping) {
            await this.trackLocation();
          }
        }, 60000);
        console.log('✅ Tracking interval restarted');
      }
      
      await this.ensureBackgroundTracking();
      
      console.log('✅ Tracking resumed successfully');
      return true;
    }
    
    console.log('ℹ️ No existing session to resume');
    return false;
  };

  /**
   * Pause tracking
   */
  pauseTracking = () => {
    this.isPaused = true;
    console.log('📍 Location tracking paused');
  };

  /**
   * Resume tracking (UI)
   */
  resumeTrackingUI = () => {
    this.isPaused = false;
    console.log('📍 Location tracking resumed');
  };

  /**
   * Track a single location
   */
  trackLocation = async () => {
    try {
      if (this.isRestoring || this.isStopping) {
        console.log('⏳ Skipping track (restoring or stopping)...');
        return;
      }
      
      console.log(`📍 Tracking location #${this.locations.length + 1}...`);
      
      const location = await getLocationCrossPlatform();
      
      if (!location) {
        console.log('⚠️ Could not get location for tracking');
        return;
      }

      console.log(`📍 Location obtained: ${location.latitude}, ${location.longitude}`);

      if (this.locations.length > 0) {
        const lastLocation = this.locations[this.locations.length - 1];
        const distance = this.calculateDistance(
          lastLocation.latitude, lastLocation.longitude,
          location.latitude, location.longitude
        );
        
        if (distance < 0.05) {
          console.log(`📍 Location unchanged (${(distance * 1000).toFixed(0)}m), skipping...`);
          return;
        }
        console.log(`📍 Distance from last: ${(distance * 1000).toFixed(0)} meters`);
      }

      const locationData = {
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy || 0,
        tracked_at: new Date().toISOString(),
      };

      this.locations.push(locationData);
      console.log(`✅ Location tracked (${this.locations.length} total)`);

      await AsyncStorage.setItem('tracked_locations', JSON.stringify(this.locations));

      const success = await this.sendLocationToBackend(locationData);
      
      if (!success) {
        console.log('⚠️ Location not saved to backend, will retry later');
      }

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
        return false;
      }

      const payload = {
        empcode: this.empcode,
        branch: this.branch || 1,
        sessionId: this.sessionId || `JRN_${this.empcode}_${Date.now()}`,
        location: {
          latitude: parseFloat(locationData.latitude),
          longitude: parseFloat(locationData.longitude),
          accuracy: parseFloat(locationData.accuracy || 0),
        }
      };

      if (locationData.action) {
        payload.action = locationData.action;
      }

      console.log('📤 SENDING LOCATION TO BACKEND:');
      console.log(`📌 Endpoint: ${api.defaults.baseURL}/auth/location-track`);
      console.log('📌 Payload:', JSON.stringify(payload, null, 2));

      const response = await api.post('/auth/location-track', payload);
      
      console.log('📥 BACKEND RESPONSE:');
      console.log(`📌 Status: ${response.status}`);
      console.log('📌 Data:', JSON.stringify(response.data, null, 2));

      if (response.data && response.data.success) {
        console.log('✅ Location saved to backend successfully!');
        return true;
      } else {
        console.log('⚠️ Backend returned error:', response.data?.message || 'Unknown error');
        this.failedLocations.push(payload);
        return false;
      }
    } catch (error) {
      console.log('❌ FAILED TO SEND LOCATION TO BACKEND:', error.message);
      
      if (locationData && this.empcode) {
        const payload = {
          empcode: this.empcode,
          branch: this.branch || 1,
          sessionId: this.sessionId || `JRN_${this.empcode}_${Date.now()}`,
          location: {
            latitude: parseFloat(locationData.latitude),
            longitude: parseFloat(locationData.longitude),
            accuracy: parseFloat(locationData.accuracy || 0),
          }
        };
        if (locationData.action) {
          payload.action = locationData.action;
        }
        this.failedLocations.push(payload);
        console.log(`📥 Queued location for retry (${this.failedLocations.length} total)`);
      }
      return false;
    }
  };

  /**
   * Retry failed locations
   */
  retryFailedLocations = async () => {
    if (this.failedLocations.length === 0) return;

    console.log(`🔄 RETRYING ${this.failedLocations.length} FAILED LOCATIONS...`);
    const stillFailed = [];

    for (let i = 0; i < this.failedLocations.length; i++) {
      const payload = this.failedLocations[i];
      try {
        console.log(`🔄 Retry ${i + 1}/${this.failedLocations.length}:`, payload);
        const response = await api.post('/auth/location-track', payload);
        if (response.data && response.data.success) {
          console.log('✅ Retry successful!');
        } else {
          stillFailed.push(payload);
        }
      } catch (error) {
        console.log(`❌ Retry ${i + 1} failed:`, error.message);
        stillFailed.push(payload);
      }
    }

    this.failedLocations = stillFailed;
    console.log(`📊 ${stillFailed.length} locations still failed`);
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
    this.failedLocations = [];
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

  /**
   * Save journey to local storage for history
   */
  saveJourneyToStorage = async () => {
    try {
      const journeyData = {
        id: this.sessionId || Date.now().toString(),
        date: new Date().toISOString(),
        empcode: this.empcode,
        branch: this.branch,
        locations: this.locations,
        loginLocation: this.locations[0] || null,
        logoutLocation: this.locations[this.locations.length - 1] || null,
        totalDistance: this.calculateTotalDistance(),
        totalLocations: this.locations.length,
      };

      const existingJourneys = await AsyncStorage.getItem('journey_history');
      let journeys = existingJourneys ? JSON.parse(existingJourneys) : [];
      journeys.unshift(journeyData);
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
   * Get journey history from backend
   */
  getJourneyHistoryFromBackend = async (empcode, branch) => {
    try {
      if (!empcode) {
        console.log('⚠️ No empcode provided');
        return [];
      }

      console.log(`📤 Fetching journey history from backend for empcode: ${empcode}, branch: ${branch}`);
      
      const response = await api.get(`/auth/journey/history/${empcode}?branch=${branch || 1}`);
      
      console.log('📥 Backend response status:', response.status);
      console.log('📥 Backend response data:', JSON.stringify(response.data, null, 2));
      
      if (response.data && response.data.success) {
        const data = response.data.data || [];
        console.log(`✅ Fetched ${data.length} journeys from backend`);
        return data;
      } else {
        console.log('⚠️ Backend returned error:', response.data?.message || 'Unknown error');
        return [];
      }
    } catch (error) {
      console.log('❌ Failed to fetch journey history from backend:', error.message);
      if (error.response) {
        console.log('Status:', error.response.status);
        console.log('Data:', error.response.data);
      }
      return [];
    }
  };

  /**
   * ✅ FIXED: Get journey history with filters - WITH CLIENT-SIDE DATE FILTERING
   */
  getJourneyHistoryWithFilters = async (empcode, branch, fromDate, toDate) => {
    try {
      if (!empcode) {
        console.log('⚠️ No empcode provided');
        return [];
      }

      console.log('====================================');
      console.log('📤 FETCHING FILTERED JOURNEY HISTORY');
      console.log(`  Empcode: ${empcode}`);
      console.log(`  Branch: ${branch}`);
      console.log(`  From Date: ${fromDate}`);
      console.log(`  To Date: ${toDate}`);
      console.log('====================================');
      
      // ✅ Build query params - send all filters to backend
      const params = new URLSearchParams();
      if (branch) params.append('branch', branch);
      if (fromDate) params.append('fromDate', fromDate);
      if (toDate) params.append('toDate', toDate);
      
      const url = `/auth/journey/history/${empcode}${params.toString() ? '?' + params.toString() : ''}`;
      console.log(`📌 URL: ${url}`);
      
      const response = await api.get(url);
      
      console.log('📥 Backend response status:', response.status);
      console.log('📥 Backend response data:', JSON.stringify(response.data, null, 2));
      
      let journeys = [];
      
      if (response.data && response.data.success) {
        journeys = response.data.data || [];
        console.log(`📥 Raw data from backend: ${journeys.length} journeys`);
      } else {
        console.log('⚠️ Backend returned error:', response.data?.message || 'Unknown error');
        return [];
      }
      
      // ✅ APPLY CLIENT-SIDE DATE FILTERING (Backup for when backend doesn't filter)
      let filteredJourneys = journeys;
      
      if (fromDate && toDate) {
        const from = new Date(fromDate);
        const to = new Date(toDate);
        // Set to end of day
        to.setHours(23, 59, 59, 999);
        
        filteredJourneys = journeys.filter(journey => {
          const journeyDate = new Date(journey.date);
          return journeyDate >= from && journeyDate <= to;
        });
        
        console.log(`📥 After client-side date filter: ${filteredJourneys.length} journeys`);
        console.log(`📋 Filtered dates: ${filteredJourneys.map(j => new Date(j.date).toLocaleDateString()).join(', ')}`);
      }
      
      // ✅ Also filter by branch if needed
      if (branch) {
        filteredJourneys = filteredJourneys.filter(journey => {
          // Check if journey has branch field or use the one from filter
          return true; // Keep as is, branch is already in URL
        });
      }
      
      console.log(`✅ Returning ${filteredJourneys.length} filtered journeys`);
      return filteredJourneys;
    } catch (error) {
      console.log('❌ Failed to fetch filtered journey history:', error.message);
      if (error.response) {
        console.log('Status:', error.response.status);
        console.log('Data:', JSON.stringify(error.response.data, null, 2));
      }
      return [];
    }
  };

  /**
   * Get local journey history only
   */
  getLocalJourneyHistory = async () => {
    try {
      const journeys = await AsyncStorage.getItem('journey_history');
      if (journeys) {
        const parsed = JSON.parse(journeys);
        console.log(`📍 Local journeys: ${parsed.length}`);
        return parsed;
      }
      return [];
    } catch (error) {
      console.log('❌ Failed to get local journey history:', error);
      return [];
    }
  };

  /**
   * Get journey history (combines local and backend)
   */
  getJourneyHistory = async (empcode, branch) => {
    try {
      console.log('📥 Fetching journey history for empcode:', empcode);
      
      const localJourneys = await this.getLocalJourneyHistory();
      console.log(`📍 Local journeys: ${localJourneys.length}`);
      
      let backendJourneys = [];
      if (empcode) {
        backendJourneys = await this.getJourneyHistoryFromBackend(empcode, branch);
        console.log(`📍 Backend journeys: ${backendJourneys.length}`);
      }
      
      const allJourneys = [...backendJourneys];
      
      localJourneys.forEach(local => {
        const exists = allJourneys.some(j => j.id === local.id);
        if (!exists) {
          allJourneys.push(local);
        }
      });
      
      allJourneys.sort((a, b) => new Date(b.date) - new Date(a.date));
      
      console.log(`📍 Total journeys: ${allJourneys.length} (${backendJourneys.length} from backend, ${localJourneys.length} from local)`);
      
      return allJourneys;
    } catch (error) {
      console.log('❌ Failed to get journey history:', error);
      return await this.getLocalJourneyHistory();
    }
  };

  /**
   * Clear all journey history (local only)
   */
  clearJourneyHistory = async () => {
    try {
      await AsyncStorage.removeItem('journey_history');
      console.log('✅ Journey history cleared');
    } catch (error) {
      console.log('❌ Failed to clear journey history:', error);
    }
  };
}

export default new LocationTrackService();