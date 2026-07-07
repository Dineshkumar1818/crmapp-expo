import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
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

  return (
    <View style={styles.mapContainer}>
      <View style={styles.locationList}>
        <Text style={styles.locationTitle}>📍 Route Details ({locations.length} locations)</Text>
        {locations.map((loc, index) => {
          const isStart = index === 0;
          const isEnd = index === locations.length - 1;
          const icon = isStart ? '🟢' : isEnd ? '🔴' : '🔵';
          const label = isStart ? 'Start' : isEnd ? 'End' : Point ;
          
          return (
            <View key={index} style={styles.locationItem}>
              <Text style={styles.locationIcon}>{icon}</Text>
              <View style={styles.locationInfo}>
                <Text style={styles.locationLabel}>{label}</Text>
                <Text style={styles.locationCoords}>
                  {loc.latitude?.toFixed(6)}, {loc.longitude?.toFixed(6)}
                </Text>
              </View>
            </View>
          );
        })}
      </View>

      {/* Google Maps fallback */}
      <View style={styles.mapFallback}>
        <Text style={styles.fallbackTitle}>🗺️ View Route</Text>
        <Text style={styles.fallbackText}>
          {locations.length === 1 ? '📍 Single location' : '📍 ' + locations.length + ' locations in this journey'}
        </Text>
        <Text style={styles.fallbackSubtext}>
          Open in Google Maps to see the full route
        </Text>
      </View>
    </View>
  );
};

const TravelMapScreen = ({ navigation, route }) => {
  const { locations, journeyDate } = route.params || { locations: [], journeyDate: null };

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
            📅 {new Date(journeyDate).toLocaleDateString()}
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
  locationList: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
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
