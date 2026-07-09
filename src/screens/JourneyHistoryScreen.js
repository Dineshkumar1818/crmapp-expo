import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import locationTrackService from '../services/locationTrackService';

const { width, height } = Dimensions.get('window');

const JourneyHistoryScreen = ({ navigation, route }) => {
  const { user } = useAuth();
  const { filters } = route.params || {};
  
  const [allJourneys, setAllJourneys] = useState([]);
  const [displayedJourneys, setDisplayedJourneys] = useState([]);
  const [selectedJourney, setSelectedJourney] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [filterInfo, setFilterInfo] = useState(null);
  const scrollViewRef = useRef(null);
  
  const PAGE_SIZE = 10;

  const fetchJourneys = useCallback(async () => {
    try {
      setLoading(true);
      
      // ✅ If filters exist, use them
      if (filters) {
        console.log('📥 Using filters from navigation:', filters);
        setFilterInfo(filters);
        
        // ✅ Fetch data from backend
        const filteredData = await locationTrackService.getJourneyHistoryWithFilters(
          filters.empcode,
          filters.branch,
          filters.fromDate,
          filters.toDate
        );
        
        console.log(`📥 Raw data from backend: ${filteredData.length} journeys`);
        
        // ✅ APPLY CLIENT-SIDE DATE FILTERING (Backup for when backend doesn't filter)
        let finalData = filteredData;
        
        if (filters.fromDate && filters.toDate) {
          const from = new Date(filters.fromDate);
          const to = new Date(filters.toDate);
          // Set to end of day
          to.setHours(23, 59, 59, 999);
          
          finalData = filteredData.filter(journey => {
            const journeyDate = new Date(journey.date);
            return journeyDate >= from && journeyDate <= to;
          });
          
          console.log(`📥 After client-side date filter: ${finalData.length} journeys`);
          console.log(`📋 Filtered dates: ${finalData.map(j => new Date(j.date).toLocaleDateString()).join(', ')}`);
        }
        
        const sorted = finalData.sort((a, b) => new Date(b.date) - new Date(a.date));
        setAllJourneys(sorted);
        const initialData = sorted.slice(0, PAGE_SIZE);
        setDisplayedJourneys(initialData);
        setHasMore(sorted.length > PAGE_SIZE);
        setPage(1);
        
        if (initialData.length > 0) {
          setSelectedJourney(initialData[0]);
        }
        return;
      }
      
      // ✅ Fallback to default (current user) - No filters
      console.log('📥 No filters, using current user');
      setFilterInfo(null);
      
      const empcode = user?.empcode || user?.username;
      const branch = user?.branch || 1;
      
      const allJourneysData = await locationTrackService.getJourneyHistory(empcode, branch);
      
      console.log(`📥 Total journeys fetched: ${allJourneysData.length}`);
      
      const sorted = allJourneysData.sort((a, b) => new Date(b.date) - new Date(a.date));
      
      setAllJourneys(sorted);
      
      const initialData = sorted.slice(0, PAGE_SIZE);
      setDisplayedJourneys(initialData);
      setHasMore(sorted.length > PAGE_SIZE);
      setPage(1);
      
      if (initialData.length > 0) {
        setSelectedJourney(initialData[0]);
      }
      
      console.log(`📍 Displaying ${initialData.length} journeys, Has more: ${sorted.length > PAGE_SIZE}`);
    } catch (error) {
      console.log('Error fetching journeys:', error);
      Alert.alert('Error', 'Failed to load journey history');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, filters]);

  useEffect(() => {
    fetchJourneys();
  }, [fetchJourneys]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchJourneys();
  };

  const handleLoadMore = () => {
    if (loadingMore || !hasMore) return;
    
    setLoadingMore(true);
    
    const nextPage = page + 1;
    const endIndex = nextPage * PAGE_SIZE;
    
    const newData = allJourneys.slice(0, endIndex);
    setDisplayedJourneys(newData);
    setHasMore(allJourneys.length > endIndex);
    setPage(nextPage);
    
    console.log(`📥 Loaded ${newData.length} journeys, Has more: ${allJourneys.length > endIndex}`);
    
    setLoadingMore(false);
  };

  // ✅ Clear history - only works for local data
  const clearHistory = () => {
    // ✅ Check if we're viewing filtered data
    if (filters) {
      Alert.alert(
        'Info',
        'Clear history is only available for your own journey history. Please go back and remove filters.',
        [{ text: 'OK' }]
      );
      return;
    }

    // ✅ Web: Use window.confirm
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to clear all journey history?')) {
        performClearHistory();
      }
      return;
    }
    
    // ✅ Mobile: Use Alert.alert
    Alert.alert(
      'Clear History',
      'Are you sure you want to clear all journey history?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear', 
          style: 'destructive',
          onPress: performClearHistory
        }
      ]
    );
  };

  // ✅ Actual clear function
  const performClearHistory = async () => {
    try {
      await locationTrackService.clearJourneyHistory();
      setAllJourneys([]);
      setDisplayedJourneys([]);
      setSelectedJourney(null);
      setHasMore(false);
      
      // ✅ Show success message
      if (Platform.OS === 'web') {
        alert('✅ Journey history cleared successfully!');
      } else {
        Alert.alert('Success', 'Journey history cleared');
      }
    } catch (error) {
      console.log('Error clearing history:', error);
      if (Platform.OS === 'web') {
        alert('❌ Failed to clear journey history');
      } else {
        Alert.alert('Error', 'Failed to clear journey history');
      }
    }
  };

  // ✅ Go back to filter screen
  const goBackToFilters = () => {
    navigation.goBack();
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric'
      });
    } catch {
      return 'Unknown';
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return "";

    try {
      // Extract only the time portion from SQL datetime
      const time = dateString.split(" ")[1]; // "15:23:21.587"

      const [hour, minute, second] = time.split(":");

      let h = parseInt(hour, 10);
      const ampm = h >= 12 ? "PM" : "AM";

      h = h % 12;
      if (h === 0) h = 12;

      return `${String(h).padStart(2, "0")}:${minute}:${second.substring(0,2)} ${ampm}`;

    } catch (e) {
      return "";
    }
  };

  const getDuration = (startTime, endTime) => {
    if (!startTime || !endTime) return 'Unknown';
    try {
      const start = new Date(startTime);
      const end = new Date(endTime);
      const diffMs = end - start;
      
      if (diffMs < 0) return '0s';
      
      const diffMins = Math.floor(diffMs / 60000);
      const diffSecs = Math.floor((diffMs % 60000) / 1000);
      
      if (diffMins > 0) {
        return `${diffMins}m ${diffSecs}s`;
      } else {
        return `${diffSecs}s`;
      }
    } catch {
      return 'Unknown';
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

  const renderFooter = () => {
    if (loadingMore) {
      return (
        <View style={styles.footerContainer}>
          <ActivityIndicator size="small" color="#D4AF37" />
          <Text style={styles.footerText}>Loading more...</Text>
        </View>
      );
    }
    
    if (hasMore && displayedJourneys.length > 0) {
      return (
        <TouchableOpacity 
          style={styles.loadMoreButton}
          onPress={handleLoadMore}
        >
          <Text style={styles.loadMoreText}>📥 Load More Journeys</Text>
        </TouchableOpacity>
      );
    }
    
    if (!hasMore && displayedJourneys.length > 0) {
      return (
        <View style={styles.footerContainer}>
          <Text style={styles.footerText}>✅ All {allJourneys.length} journeys loaded</Text>
        </View>
      );
    }
    
    return null;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={goBackToFilters}
        >
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>📍 Journey History</Text>
        {!filters && allJourneys.length > 0 && (
          <TouchableOpacity onPress={clearHistory}>
            <Text style={styles.deleteText}>🗑️</Text>
          </TouchableOpacity>
        )}
        {filters && (
          <View style={styles.filterBadge}>
            <Text style={styles.filterBadgeText}>🔍</Text>
          </View>
        )}
      </View>

      {/* ✅ Filter Info Bar */}
      {filters && (
        <View style={styles.filterInfoBar}>
          <View style={styles.filterInfoRow}>
            <Text style={styles.filterInfoLabel}>👤 Employee:</Text>
            <Text style={styles.filterInfoValue}>{filters.employeeName || filters.empcode}</Text>
          </View>
          <View style={styles.filterInfoRow}>
            <Text style={styles.filterInfoLabel}>🏢 Branch:</Text>
            <Text style={styles.filterInfoValue}>{filters.branchName || filters.branch}</Text>
          </View>
          <View style={styles.filterInfoRow}>
            <Text style={styles.filterInfoLabel}>📅 From:</Text>
            <Text style={styles.filterInfoValue}>{filters.fromDateDisplay || filters.fromDate}</Text>
            <Text style={styles.filterInfoLabel}> To:</Text>
            <Text style={styles.filterInfoValue}>{filters.toDateDisplay || filters.toDate}</Text>
          </View>
          <TouchableOpacity 
            style={styles.clearFilterButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.clearFilterText}>✕ Change Filters</Text>
          </TouchableOpacity>
        </View>
      )}

      {allJourneys.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🗺️</Text>
          <Text style={styles.emptyTitle}>No Journeys Found</Text>
          <Text style={styles.emptySubtext}>
            {filters 
              ? `No journeys found for:\n\n👤 ${filters.employeeName || filters.empcode}\n🏢 ${filters.branchName || filters.branch}\n📅 ${filters.fromDateDisplay || filters.fromDate} to ${filters.toDateDisplay || filters.toDate}\n\nTry changing your search criteria.`
              : 'Your travel paths will appear here after you login and move around'
            }
          </Text>
          {filters && (
            <TouchableOpacity 
              style={styles.backToFilterButton}
              onPress={goBackToFilters}
            >
              <Text style={styles.backToFilterText}>🔍 Change Filters</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <ScrollView
          ref={scrollViewRef}
          style={[
            styles.content,
            Platform.OS === 'web' && styles.webScrollView
          ]}
          contentContainerStyle={[
            styles.contentContainer,
            Platform.OS === 'web' && styles.webContentContainer
          ]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={true}
          scrollEventThrottle={16}
        >
          {displayedJourneys.map((journey, index) => {
            const locationCount = journey.locations?.length || 0;
            const distance = journey.totalDistance || 
              (journey.locations && journey.locations.length > 1 ? 
                getTotalDistance(journey.locations) : 0);
            const isSelected = selectedJourney?.id === journey.id;
            
            const firstLoc = journey.locations?.[0];
            const lastLoc = journey.locations?.[journey.locations?.length - 1];
            const startTime = firstLoc?.tracked_at || journey.startTime || journey.date;
            const endTime = lastLoc?.tracked_at || journey.endTime || journey.date;
            
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
                      🟢 Start: {formatTime(startTime)}
                    </Text>
                    <Text style={styles.journeyTime}>
                      🔴 End: {formatTime(endTime)}
                    </Text>
                    <Text style={styles.journeyDuration}>
                      ⏱️ Duration: {getDuration(startTime, endTime)}
                    </Text>
                  </View>
                  <View style={styles.journeyStats}>
                    <Text style={styles.journeyLocations}>
                      📍 {locationCount} locations
                    </Text>
                    {distance > 0 && (
                      <Text style={styles.journeyDistance}>
                        📏 {(distance * 1000).toFixed(0)} m
                      </Text>
                    )}
                  </View>
                </View>
                
                {isSelected && journey.locations && journey.locations.length > 0 && (
                  <View style={styles.journeyDetails}>
                    <Text style={styles.detailsTitle}>📍 Route Details</Text>
                    {journey.locations.slice(0, 5).map((loc, idx) => {
                      const isStart = idx === 0;
                      const isEnd = idx === journey.locations.length - 1;
                      const label = isStart ? 'Start' : isEnd ? 'End' : `Point ${idx}`;
                      
                      return (
                        <View key={idx} style={styles.locationPoint}>
                          <Text style={styles.pointNumber}>{idx + 1}.</Text>
                          <Text style={styles.pointLabel}>{label}:</Text>
                          <Text style={styles.pointCoords}>
                            {loc.latitude?.toFixed(6)}, {loc.longitude?.toFixed(6)}
                          </Text>
                          <Text style={styles.pointTime}>
                            {formatTime(loc.tracked_at)}
                          </Text>
                        </View>
                      );
                    })}
                    {journey.locations.length > 5 && (
                      <Text style={styles.morePoints}>
                        ... and {journey.locations.length - 5} more locations
                      </Text>
                    )}
                    <TouchableOpacity 
                      style={styles.viewMapButton}
                      onPress={() => {
                        navigation.navigate('TravelMap', { 
                          locations: journey.locations,
                          journeyDate: journey.date
                        });
                      }}
                    >
                      <Text style={styles.viewMapText}>🗺️ View on Map</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
          
          {renderFooter()}
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
  filterBadge: {
    backgroundColor: '#D4AF37',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  filterBadgeText: {
    fontSize: 16,
    color: '#fff',
  },
  filterInfoBar: {
    backgroundColor: '#FFF8E7',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  filterInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  filterInfoLabel: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
    marginRight: 4,
  },
  filterInfoValue: {
    fontSize: 13,
    color: '#333',
    fontWeight: '600',
    marginRight: 12,
  },
  clearFilterButton: {
    marginTop: 6,
    paddingVertical: 4,
    paddingHorizontal: 12,
    backgroundColor: '#D4AF37',
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  clearFilterText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
  },
  backToFilterButton: {
    marginTop: 16,
    backgroundColor: '#D4AF37',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  backToFilterText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  webScrollView: {
    overflowY: 'auto',
    WebkitOverflowScrolling: 'touch',
    height: '100%',
    maxHeight: 'calc(100vh - 120px)',
  },
  contentContainer: {
    paddingBottom: 20,
  },
  webContentContainer: {
    minHeight: '100%',
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
  journeyDuration: {
    fontSize: 13,
    color: '#D4AF37',
    fontWeight: '600',
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
  pointLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#D4AF37',
    width: 45,
  },
  pointCoords: {
    fontSize: 12,
    color: '#333',
    flex: 1,
  },
  pointTime: {
    fontSize: 11,
    color: '#999',
    width: 65,
    textAlign: 'right',
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
  footerContainer: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerText: {
    color: '#999',
    fontSize: 14,
    marginTop: 8,
  },
  loadMoreButton: {
    backgroundColor: '#D4AF37',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginVertical: 12,
    alignItems: 'center',
  },
  loadMoreText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default JourneyHistoryScreen;