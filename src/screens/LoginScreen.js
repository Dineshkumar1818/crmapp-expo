import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import CustomInput from '../components/CustomInput';
import CustomButton from '../components/CustomButton';
import { COLORS } from '../styles/colors';

// ✅ STATIC BRANCHES (hardcoded)
const STATIC_BRANCHES = [
  { id: 13, name: 'Karur' },
  { id: 21, name: 'Ooty' },
  { id: 7, name: 'Trichy' },
  { id: 23, name: 'Vellore' },
  { id: 32, name: 'Kumbakonam' },
  { id: 34, name: 'Thanjavur' },
  { id: 36, name: 'Pudhukottai' },
];

const LoginScreen = () => {
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [modalVisible, setModalVisible] = useState(false);

  const { login } = useAuth();

  const handleLogin = async () => {
    console.log('Username:', username);
    console.log('Password:', password);
    console.log('Selected Branch:', selectedBranch);

    if (!selectedBranch) {
      setError('Please select a branch');
      return;
    }

    if (!username || !password) {
      setError('Please enter username and password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await login(
        username,
        password,
        selectedBranch.id
      );

      if (!result.success) {
        setError(result.message || 'Invalid credentials');
      }
    } catch (err) {
      setError('Login failed');
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const renderBranchItem = ({ item }) => (
    <TouchableOpacity
      style={styles.branchItem}
      onPress={() => {
        setSelectedBranch(item);
        setModalVisible(false);
      }}
    >
      <Text style={styles.branchText}>{item.name}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={COLORS.primaryDark}
      />

      <KeyboardAvoidingView
        style={styles.cardWrapper}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.card}>
          <View style={styles.logoContainer}>
            <Image
              source={require('../assets/images/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          <Text style={styles.welcomeText}>Welcome to</Text>
          <Text style={styles.appName}> CRM </Text>
          <Text style={styles.companyName}>
            Shree Kumaran Thangamaalihai
          </Text>

          <View style={styles.divider} />

          <Text style={styles.label}>Select Branch</Text>

          <TouchableOpacity
            style={styles.dropdown}
            onPress={() => {
              if (STATIC_BRANCHES.length > 0) {
                setModalVisible(true);
              }
            }}
          >
            <Text
              style={
                selectedBranch
                  ? styles.dropdownText
                  : styles.dropdownPlaceholder
              }
            >
              {selectedBranch?.name || 'Choose your branch'}
            </Text>
            <Text style={styles.dropdownArrow}>▼</Text>
          </TouchableOpacity>

          <CustomInput
            label="Username"
            placeholder="Enter username"
            value={username}
            onChangeText={setUsername}
          />

          <CustomInput
            label="Password"
            placeholder="Enter password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          {error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : null}

          <CustomButton
            title="Login"
            onPress={handleLogin}
            loading={loading}
          />
        </View>
      </KeyboardAvoidingView>

      <Modal
        transparent
        visible={modalVisible}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={styles.modalOverlay}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <FlatList
              data={STATIC_BRANCHES}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderBranchItem}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primaryDark,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },

  cardWrapper: {
    flex: 1,
    justifyContent: 'center',
  },

  card: {
    backgroundColor: COLORS.white,
    borderRadius: 25,
    padding: 30,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.2,
    shadowRadius: 25,
    elevation: 10,
  },

  logoContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },

  logo: {
    width: 100,
    height: 100,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.white,
  },

  welcomeText: {
    fontSize: 16,
    color: COLORS.gray,
    textAlign: 'center',
    marginBottom: 2,
  },

  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: 2,
  },

  companyName: {
    fontSize: 18,
    color: COLORS.secondary,
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 15,
  },

  divider: {
    height: 2,
    backgroundColor: COLORS.lightGray,
    marginVertical: 20,
  },

  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: 6,
  },

  dropdown: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0DCD8',
  },

  dropdownText: {
    fontSize: 16,
    color: COLORS.black,
  },

  dropdownPlaceholder: {
    fontSize: 16,
    color: COLORS.gray,
  },

  dropdownArrow: {
    fontSize: 14,
    color: COLORS.gray,
  },

  errorText: {
    color: COLORS.error,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 10,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 20,
    width: '80%',
    maxHeight: '60%',
    elevation: 8,
  },

  branchItem: {
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },

  branchText: {
    fontSize: 16,
    color: COLORS.black,
  },
});

export default LoginScreen;