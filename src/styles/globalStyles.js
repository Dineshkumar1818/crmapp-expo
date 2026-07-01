import { StyleSheet } from 'react-native';
import { COLORS } from './colors';
import { Platform, StyleSheet } from 'react-native';

export const globalStyles = StyleSheet.create({
  // ... existing styles
  
  webScrollView: {
    flex: 1,
    ...(Platform.OS === 'web' && {
      overflowY: 'auto',
      height: '100vh',
    }),
  },
});
export const globalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 25,
    marginHorizontal: 20,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.gray,
    textAlign: 'center',
    marginBottom: 20,
  },
});
