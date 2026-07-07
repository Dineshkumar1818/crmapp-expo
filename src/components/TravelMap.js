import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';

// Import MapView conditionally for web compatibility
let MapView, Marker, Polyline, Circle;

if (Platform.OS === 'web') {
  // Web version
  try {
    const maps = require('react-native-web-maps');
    MapView = maps.default;
    Marker = maps.Marker;
    Polyline = maps.Polyline;
    Circle = maps.Circle;
  } catch (e) {
    console.log('Web maps not available:', e);
  }
} else {
  // Mobile version
  try {
    const maps = require('react-native-maps');
    MapView = maps.default;
    Marker = maps.Marker;
    Polyline = maps.Polyline;
    Circle = maps.Circle;
  } catch (e) {
    console.log('Mobile maps not available:', e);
  }
}

const { width, height: screenHeight } = Dimensions.get('window');

const TravelMap = ({ 
  locations = [], 
  height = screenHeight * 0.5,
}) => {
  const mapRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);

  // Calculate center of all locations
  const getInitialRegion = () => {
    if (!locations || locations.length === 0) {
      return {
        latitude: 11.1096584,
        longitude: 77.3377032,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      };
    }

    const lats = locations.map(l => l.latitude);
    const longs = locations.map(l => l.longitude);
    
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLong = Math.min(...longs);
    const maxLong = Math.max(...longs);

    const deltaLat = (maxLat - minLat) * 1.5 + 0.01;
    const deltaLong = (maxLong - minLong) * 1.5 + 0.01;

    return {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLong + maxLong) / 2,
      latitudeDelta: Math.max(deltaLat, 0.01),
      longitudeDelta: Math.max(deltaLong, 0.01),
    };
  };

  // Fit map to show all locations
  const fitToLocations = () => {
    if (mapRef.current && locations && locations.length > 0) {
      try {
        const coordinates = locations.map(l => ({
          latitude: l.latitude,
          longitude: l.longitude,
        }));
        mapRef.current.fitToCoordinates(coordinates, {
          edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
          animated: true,
        });
      } catch (error) {
        console.log('Error fitting map:', error);
      }
    }
  };

  useEffect(() => {
    if (locations && locations.length > 0) {
      setIsLoading(false);
      setTimeout(fitToLocations, 500);
    } else {
      setIsLoading(false);
    }
  }, [locations]);

  // Loading state
  if (isLoading) {
    return (
      <View style={[styles.container, { height }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#D4AF37" />
          <Text style={styles.loadingText}>Loading map...</Text>
        </View>
      </View>
    );
  }

  // No locations state
  if (!locations || locations.length === 0) {
    return (
      <View style={[styles.container, { height }]}>
        <View style={styles.noLocations}>
          <Text style={styles.noLocationsIcon}>🗺️</Text>
          <Text style={styles.noLocationsText}>No location data available</Text>
        </View>
      </View>
    );
  }

  // Check if MapView is available
  if (!MapView) {
    return (
      <View style={[styles.container, { height }]}>
        <View style={styles.noLocations}>
          <Text style={styles.noLocationsIcon}>📱</Text>
          <Text style={styles.noLocationsText}>Map not available</Text>
          <Text style={styles.noLocationsSubtext}>Please install react-native-maps</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { height }]}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={getInitialRegion()}
        mapType="standard"
        showsUserLocation={false}
        showsMyLocationButton={false}
        zoomEnabled={true}
        scrollEnabled={true}
      >
        {/* Draw path/polyline between locations */}
        {locations.length > 1 && (
          <Polyline
            coordinates={locations.map(l => ({
              latitude: l.latitude,
              longitude: l.longitude,
            }))}
            strokeColor="#D4AF37"
            strokeWidth={4}
            geodesic={true}
          />
        )}

        {/* Show location markers */}
        {locations.map((location, index) => {
          const isStart = index === 0;
          const isEnd = index === locations.length - 1;
          const color = isStart ? '#4CAF50' : isEnd ? '#F44336' : '#FF9800';
          const label = isStart ? 'Start' : isEnd ? 'End' : 'Point ' + index;
          
          return (
            <Marker
              key={index}
              coordinate={{
                latitude: location.latitude,
                longitude: location.longitude,
              }}
              title={label}
              description={location.latitude?.toFixed(6) + ', ' + location.longitude?.toFixed(6)}
              pinColor={color}
            />
          );
        })}

        {/* Start and End circles */}
        {locations.length > 0 && (
          <>
            <Circle
              center={{
                latitude: locations[0].latitude,
                longitude: locations[0].longitude,
              }}
              radius={100}
              strokeColor="rgba(76, 175, 80, 0.3)"
              fillColor="rgba(76, 175, 80, 0.1)"
            />
            <Circle
              center={{
                latitude: locations[locations.length - 1].latitude,
                longitude: locations[locations.length - 1].longitude,
              }}
              radius={100}
              strokeColor="rgba(244, 67, 54, 0.3)"
              fillColor="rgba(244, 67, 54, 0.1)"
            />
          </>
        )}
      </MapView>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#4CAF50' }]} />
          <Text style={styles.legendText}>Start</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#FF9800' }]} />
          <Text style={styles.legendText}>Points</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#F44336' }]} />
          <Text style={styles.legendText}>End</Text>
        </View>
      </View>

      {/* Info Overlay */}
      <View style={styles.infoOverlay}>
        <Text style={styles.infoText}>
          📍 {locations.length} locations
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 14,
  },
  map: {
    flex: 1,
    width: '100%',
  },
  noLocations: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  noLocationsIcon: {
    fontSize: 48,
  },
  noLocationsText: {
    fontSize: 16,
    color: '#999',
    marginTop: 10,
  },
  noLocationsSubtext: {
    fontSize: 12,
    color: '#bbb',
    marginTop: 4,
  },
  legend: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(255,255,255,0.9)',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#333',
  },
  infoOverlay: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  infoText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default TravelMap;
