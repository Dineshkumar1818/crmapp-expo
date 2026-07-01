import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ImageBackground,
  Image,
  Alert,
  Platform,
  Animated,
} from 'react-native';
import { useAuth } from '../context/AuthContext';

const { width, height } = Dimensions.get('window');

const DashboardScreen = ({ navigation }) => {
  const { logout } = useAuth();

  // ✅ Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    // ✅ Start animations when component mounts
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // ✅ FIXED: Logout with platform check
  const handleLogout = () => {
    if (Platform.OS === 'web') {
      // Use browser confirm for web
      if (window.confirm('Are you sure you want to logout?')) {
        logout();
      }
    } else {
      // Use Alert for mobile
      Alert.alert(
        'Logout',
        'Are you sure you want to logout?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Logout', onPress: logout, style: 'destructive' }
        ]
      );
    }
  };

  return (
    <ImageBackground
      source={require('../assets/images/pattern.png')}
      style={styles.backgroundImage}
      imageStyle={{ opacity: 0.70 }}
      resizeMode="cover"
    >
      <Animated.View 
        style={[
          styles.container,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }
        ]}
      >
        {/* Top Gold Line */}
        <View style={styles.topGoldLine} />

        {/* Profile Section */}
        <View style={styles.profileContainer}>
          <View style={styles.avatarBorder}>
            <Image
              source={require('../assets/images/logo.png')}
              style={styles.avatarLogo}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.userName}>Shree Kumaran Thangamaalihai</Text>
          <Text style={styles.userRole}> CRM </Text>
        </View>

        {/* Divider */}
        <View style={styles.dividerContainer}>
          <View style={styles.dividerLine} />
          <View style={styles.dividerDot} />
          <View style={styles.dividerLine} />
        </View>

        {/* Welcome Section */}
        <View style={styles.welcomeContainer}>
          <Text style={styles.welcomeSubText}>Welcome to</Text>
          <Text style={styles.welcomeTitle}>Dashboard</Text>
          <Text style={styles.welcomeDesc}>You're successfully logged in!</Text>

          <View style={styles.accentContainer}>
            <View style={styles.accentLine} />
            <Text style={styles.accentDiamond}>◆</Text>
            <View style={styles.accentLine} />
          </View>
        </View>

        {/* ===== FOUR MENU BUTTONS ===== */}
        <View style={styles.menuContainer}>
          {/* Customer Registration */}
          <TouchableOpacity 
            style={styles.menuItem} 
            onPress={() => navigation.navigate('CustomerRegistration')}
          >
            <Text style={styles.menuTitle}>Customer Registration</Text>
          </TouchableOpacity>

          {/* Customer Quick Entry */}
          <TouchableOpacity 
            style={styles.menuItem} 
            onPress={() => navigation.navigate('CustomerQuickEntry')}
          >
            <Text style={styles.menuTitle}>Customer Quick Entry</Text>
          </TouchableOpacity>

          {/* Customer Chit */}
          <TouchableOpacity 
            style={styles.menuItem} 
            onPress={() => navigation.navigate('CustomerChit')}
          >
            <Text style={styles.menuTitle}>Customer Chit</Text>
          </TouchableOpacity>

          {/* Chit Transaction */}
          <TouchableOpacity 
            style={styles.menuItem} 
            onPress={() => navigation.navigate('ChitTransaction')}
          >
            <Text style={styles.menuTitle}>Chit Transaction</Text>
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <View style={styles.logoutGradient}>
            <Text style={styles.logoutText}>Logout</Text>
          </View>
        </TouchableOpacity>

        {/* Bottom Brand */}
        <Text style={styles.brandText}>Shree Kumaran Thangamaalihai</Text>
        <View style={styles.bottomGoldLine} />
      </Animated.View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: width,
    height: height,
    backgroundColor: '#FDF8F0',
  },
  container: {
    flex: 1,
    paddingHorizontal: 25,
    paddingVertical: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topGoldLine: {
    width: 50,
    height: 2,
    backgroundColor: '#D4AF37',
    borderRadius: 1,
    marginBottom: 20,
  },
  profileContainer: {
    alignItems: 'center',
    marginBottom: 15,
  },
  avatarBorder: {
    width: 75,
    height: 75,
    borderRadius: 38,
    padding: 2,
    backgroundColor: '#D4AF37',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarLogo: {
    width: 68,
    height: 68,
    borderRadius: 34,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#8B1A1A',
    marginTop: 8,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  userRole: {
    fontSize: 18,
    color: '#0a0707',
    fontWeight: '500',
    letterSpacing: 1.5,
    marginTop: 1,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '40%',
    marginBottom: 15,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#D4AF37',
    opacity: 0.4,
  },
  dividerDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D4AF37',
    marginHorizontal: 8,
  },
  welcomeContainer: {
    alignItems: 'center',
    marginBottom: 18,
  },
  welcomeSubText: {
    fontSize: 12,
    color: '#8A7A6A',
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    marginBottom: 1,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#D4AF37',
    letterSpacing: 1.5,
  },
  welcomeDesc: {
    fontSize: 12,
    color: '#6B5B4B',
    marginTop: 3,
    letterSpacing: 0.5,
  },
  accentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  accentLine: {
    width: 20,
    height: 1,
    backgroundColor: '#D4AF37',
    opacity: 0.5,
  },
  accentDiamond: {
    fontSize: 8,
    color: '#D4AF37',
    marginHorizontal: 5,
  },
  menuContainer: {
    width: '100%',
    marginBottom: 18,
  },
  menuItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: '#D4AF37',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1108',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  logoutButton: {
    width: '60%',
    borderRadius: 25,
    overflow: 'hidden',
    marginBottom: 12,
  },
  logoutGradient: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D4AF37',
  },
  logoutText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  brandText: {
    fontSize: 11,
    color: '#8A7A6A',
    letterSpacing: 2.5,
    opacity: 0.5,
    fontWeight: '400',
  },
  bottomGoldLine: {
    width: 30,
    height: 1.5,
    backgroundColor: '#D4AF37',
    borderRadius: 1,
    marginTop: 5,
    opacity: 0.3,
  },
});

export default DashboardScreen;