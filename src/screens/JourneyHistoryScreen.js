import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import locationTrackService from '../services/locationTrackService';

const { width, height } = Dimensions.get('window');

const JourneyHistoryScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [journeys, setJourneys] = useState([]);
  const [selectedJourney, setSelectedJourney] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchJourneys = useCallback(async () => {
    try {
      setLoading(true);
      const localJourneys = await locationTrackService.getJourneyHistory();
      localJourneys.sort((a, b) => new Date(b.date) - new Date(a.date));
      setJourneys(localJourneys);
      if (localJourneys.length > 0) {
        setSelectedJourney(localJourneys[0]);
      }
    } catch (error) {
      console.log('Error fetching journeys:', error);
      Alert.alert('Error', 'Failed to load journey history');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchJourneys();
  }, [fetchJourneys]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchJourneys();
  };

  const clearHistory = () => {
    Alert.alert(
      'Clear History',
      'Are you sure you want to clear all journey history?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear', 
          style: 'destructive',
          onPress: async () => {
            await locationTrackService.clearJourneyHistory();
            setJourneys([]);
            setSelectedJourney(null);
            Alert.alert('Success', 'Journey history cleared');
          }
        }
      ]
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
    } catch {
      return 'Unknown';
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch {
      return '';
    }
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
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

  const getTotalDistance = (locations) => {
    if (!locations || locations.length < 2) return 0;
    let total = 0;
    for (let i = 1; i < locations.length; i++) {
      total += calculateDistance(
        locations[i-1].latitude, locations[i-1].longitude,
        locations[i].latitude, locations[i].longitude
      );
    }
    return total;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#D4AF37" />
        <Text style={styles.loadingText}>Loading journeys...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>📍 Journey History</Text>
        {journeys.length > 0 && (
          <TouchableOpacity onPress={clearHistory}>
            <Text style={styles.deleteText}>🗑️</Text>
          </TouchableOpacity>
        )}
      </View>

      {journeys.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🗺️</Text>
          <Text style={styles.emptyTitle}>No Journeys Yet</Text>
          <Text style={styles.emptySubtext}>
            Your travel paths will appear here after you login and move around
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {journeys.map((journey, index) => {
            const locationCount = journey.locations?.length || 0;
            const distance = journey.totalDistance || 
              (journey.locations && journey.locations.length > 1 ? 
                getTotalDistance(journey.locations) : 0);
            const isSelected = selectedJourney?.id === journey.id;
            
            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.journeyCard,
                  isSelected && styles.selectedCard,
                ]}
                onPress={() => setSelectedJourney(journey)}
              >
                <View style={styles.journeyHeader}>
                  <View>
                    <Text style={styles.journeyDate}>
                      {formatDate(journey.date)}
                    </Text>
                    <Text style={styles.journeyTime}>
                      {journey.loginLocation ? '🟢' : '⚪'} Start: {formatTime(journey.loginLocation?.tracked_at || journey.startTime)}
                    </Text>
                    <Text style={styles.journeyTime}>
                      {journey.logoutLocation ? '🔴' : '⚪'} End: {formatTime(journey.logoutLocation?.tracked_at || journey.endTime)}
                    </Text>
                  </View>
                  <View style={styles.journeyStats}>
                    <Text style={styles.journeyLocations}>
                      📍 {locationCount} locations
                    </Text>
                    {distance > 0 && (
                      <Text style={styles.journeyDistance}>
                        📏 {distance.toFixed(2)} km
                      </Text>
                    )}
                  </View>
                </View>
                
                {isSelected && journey.locations && journey.locations.length > 0 && (
                  <View style={styles.journeyDetails}>
                    <Text style={styles.detailsTitle}>📍 Route Details</Text>
                    {journey.locations.slice(0, 5).map((loc, idx) => (
                      <View key={idx} style={styles.locationPoint}>
                        <Text style={styles.pointNumber}>{idx + 1}.</Text>
                        <Text style={styles.pointCoords}>
                          {loc.latitude?.toFixed(6)}, {loc.longitude?.toFixed(6)}
                        </Text>
                        <Text style={styles.pointTime}>
                          {formatTime(loc.tracked_at)}
                        </Text>
                      </View>
                    ))}
                    {journey.locations.length > 5 && (
                      <Text style={styles.morePoints}>
                        ... and {journey.locations.length - 5} more locations
                      </Text>
                    )}
                    <TouchableOpacity 
                      style={styles.viewMapButton}
                      onPress={() => {
                        Alert.alert(
                          'View Route',
                          'Show ' + journey.locations.length + ' locations on map?',
                          [
                            { text: 'Cancel', style: 'cancel' },
                            { 
                              text: 'View Map',
                              onPress: () => {
                                navigation.navigate('TravelMap', { 
                                  locations: journey.locations,
                                  journeyDate: journey.date
                                });
                              }
                            }
                          ]
                        );
                      }}
                    >
                      <Text style={styles.viewMapText}>🗺️ View on Map</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  deleteText: {
    fontSize: 22,
    color: '#F44336',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  journeyCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  selectedCard: {
    borderColor: '#D4AF37',
    borderWidth: 2,
    shadowColor: '#D4AF37',
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  journeyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  journeyDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  journeyTime: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  journeyStats: {
    alignItems: 'flex-end',
  },
  journeyLocations: {
    fontSize: 13,
    color: '#666',
  },
  journeyDistance: {
    fontSize: 13,
    color: '#D4AF37',
    fontWeight: '600',
    marginTop: 2,
  },
  journeyDetails: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  detailsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  locationPoint: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
  },
  pointNumber: {
    fontSize: 12,
    color: '#999',
    width: 24,
  },
  pointCoords: {
    fontSize: 12,
    color: '#333',
    flex: 1,
  },
  pointTime: {
    fontSize: 11,
    color: '#999',
  },
  morePoints: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    marginTop: 4,
  },
  viewMapButton: {
    marginTop: 10,
    backgroundColor: '#D4AF37',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  viewMapText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});

export default JourneyHistoryScreen;
