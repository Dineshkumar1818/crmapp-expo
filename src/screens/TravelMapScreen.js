import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Linking,
  Alert,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

// Simple map view using fallback
const SimpleMapView = ({ locations }) => {
  if (!locations || locations.length === 0) {
    return (
      <View style={styles.placeholderContainer}>
        <Text style={styles.placeholderIcon}>🗺️</Text>
        <Text style={styles.placeholderText}>No locations to display</Text>
      </View>
    );
  }

  // ✅ Format time with local timezone
  const formatTime = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return '';
    }
  };

  // ✅ Function to open Google Maps with the route
  const openGoogleMaps = () => {
    try {
      if (!locations || locations.length === 0) {
        Alert.alert('Error', 'No locations to display');
        return;
      }

      const start = locations[0];
      const end = locations[locations.length - 1];
      
      let url = '';
      
      if (locations.length === 1) {
        url = `https://www.google.com/maps/search/?api=1&query=${start.latitude},${start.longitude}`;
      } else {
        url = `https://www.google.com/maps/dir/?api=1&origin=${start.latitude},${start.longitude}&destination=${end.latitude},${end.longitude}`;
        
        if (locations.length > 2) {
          const midPoints = locations.slice(1, -1).map(loc => `${loc.latitude},${loc.longitude}`).join('|');
          url += `&waypoints=${midPoints}`;
        }
        
        url += '&travelmode=driving';
      }
      
      console.log('📍 Opening Google Maps URL:', url);
      
      Linking.openURL(url).catch(() => {
        Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${locations[0].latitude},${locations[0].longitude}`);
      });
      
    } catch (error) {
      console.log('Error opening Google Maps:', error);
      Alert.alert('Error', 'Could not open Google Maps');
    }
  };

  return (
    <View style={styles.mapContainer}>
      {/* ✅ WRAPPED IN SCROLLVIEW WITH WEB SUPPORT */}
      <ScrollView 
        style={[
          styles.locationListScroll,
          Platform.OS === 'web' && styles.webScrollView
        ]}
        contentContainerStyle={[
          styles.locationListContent,
          Platform.OS === 'web' && styles.webContentContainer
        ]}
        showsVerticalScrollIndicator={true}
        scrollEventThrottle={16}
      >
        <Text style={styles.locationTitle}>📍 Route Details ({locations.length} locations)</Text>
        
        {locations.map((loc, index) => {
          const isStart = index === 0;
          const isEnd = index === locations.length - 1;
          const icon = isStart ? '🟢' : isEnd ? '🔴' : '🔵';
          const label = isStart ? 'Start' : isEnd ? 'End' : `Point ${index}`;
          
          return (
            <View key={index} style={styles.locationItem}>
              <Text style={styles.locationIcon}>{icon}</Text>
              <View style={styles.locationInfo}>
                <Text style={styles.locationLabel}>{label}</Text>
                <Text style={styles.locationCoords}>
                  {loc.latitude?.toFixed(6)}, {loc.longitude?.toFixed(6)}
                </Text>
                <Text style={styles.locationTime}>
                  {formatTime(loc.tracked_at)}
                </Text>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* ✅ Google Maps Button - Fixed at bottom */}
      <TouchableOpacity 
        style={styles.googleMapsButton}
        onPress={openGoogleMaps}
        activeOpacity={0.8}
      >
        <View style={styles.googleMapsButtonContent}>
          <Text style={styles.googleMapsIcon}>🗺️</Text>
          <View style={styles.googleMapsTextContainer}>
            <Text style={styles.googleMapsTitle}>View Full Route</Text>
            <Text style={styles.googleMapsSubtext}>
              Open in Google Maps to see the full journey
            </Text>
          </View>
          <Text style={styles.googleMapsArrow}>›</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const TravelMapScreen = ({ navigation, route }) => {
  const { locations, journeyDate } = route.params || { locations: [], journeyDate: null };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', {
        timeZone: 'Asia/Kolkata',
        month: 'short', 
        day: 'numeric', 
        year: 'numeric'
      });
    } catch {
      return '';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🗺️ Journey Route</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Map/Route View */}
      <SimpleMapView locations={locations || []} />

      {/* Footer Info */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          📍 {locations?.length || 0} locations tracked
        </Text>
        {journeyDate && (
          <Text style={styles.footerText}>
            📅 {formatDate(journeyDate)}
          </Text>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 4,
  },
  backText: {
    fontSize: 28,
    color: '#333',
    fontWeight: '300',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  mapContainer: {
    flex: 1,
    padding: 16,
  },
  // ✅ ScrollView styles with web support
  locationListScroll: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
  },
  // ✅ Web-specific scroll styles
  webScrollView: {
    overflowY: 'auto',
    WebkitOverflowScrolling: 'touch',
    maxHeight: 'calc(100vh - 280px)',
    minHeight: 200,
  },
  locationListContent: {
    padding: 16,
    paddingBottom: 8,
  },
  webContentContainer: {
    minHeight: '100%',
  },
  locationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  locationIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  locationInfo: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  locationCoords: {
    fontSize: 12,
    color: '#999',
    marginTop: 1,
  },
  locationTime: {
    fontSize: 11,
    color: '#D4AF37',
    marginTop: 1,
  },
  // ✅ Google Maps Button Styles
  googleMapsButton: {
    backgroundColor: '#4285F4',
    borderRadius: 12,
    padding: 12,
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  googleMapsButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  googleMapsIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  googleMapsTextContainer: {
    flex: 1,
  },
  googleMapsTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  googleMapsSubtext: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    marginTop: 2,
  },
  googleMapsArrow: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '300',
    marginLeft: 8,
  },
  mapFallback: {
    marginTop: 12,
    backgroundColor: '#f8f8f8',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eee',
    alignItems: 'center',
  },
  fallbackTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  fallbackText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  fallbackSubtext: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  placeholderIcon: {
    fontSize: 48,
    marginBottom: 10,
  },
  placeholderText: {
    fontSize: 16,
    color: '#999',
  },
  footer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: {
    fontSize: 14,
    color: '#666',
  },
});

export default TravelMapScreen;