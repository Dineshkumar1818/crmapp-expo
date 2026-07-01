import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
  Platform,
  ImageBackground,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { COLORS } from '../styles/colors';
import { customerService } from '../services/customer';

// ✅ Branch mapping (ID → Name)
const BRANCH_MAP = {
  13: 'Karur',
  21: 'Ooty',
  7: 'Trichy',
  23: 'Vellore',
  32: 'Kumbakonam',
  34: 'Thanjavur',
  36: 'Pudhukottai',
};

const CustomerQuickEntryScreen = ({ navigation }) => {
  // ===== STATE =====
  const [customerName, setCustomerName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [area, setArea] = useState('');
  const [city, setCity] = useState('');
  
  // ✅ Get selectedBranch from AuthContext
  const { selectedBranch } = useAuth();
  
  // ✅ Convert branch ID to name
  const branchName = selectedBranch ? BRANCH_MAP[selectedBranch] || String(selectedBranch) : null;
  
  console.log('🔍 QuickEntry - branch ID:', selectedBranch);
  console.log('🔍 QuickEntry - branch Name:', branchName);
  
  const [areaOptions, setAreaOptions] = useState([]);
  const [selectedAreaData, setSelectedAreaData] = useState(null);
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  
  const [errors, setErrors] = useState({});

  // ===== API CALL: Fetch Pincode Data =====
  const fetchPincodeData = async (pincode) => {
    if (pincode.length !== 6) return;
    
    setLoading(true);
    setAreaOptions([]);
    setArea('');
    setCity('');
    setSelectedAreaData(null);
    
    try {
      const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
      const data = await response.json();
      
      if (data && data[0] && data[0].Status === 'Success') {
        const postOffices = data[0].PostOffice || [];
        if (postOffices.length > 0) {
          const areaNames = postOffices.map(item => item.Name);
          setAreaOptions(areaNames);
          setSelectedAreaData(postOffices);
          
          if (areaNames.length === 1) {
            setArea(areaNames[0]);
            setCity(postOffices[0].District || '');
          }
        } else {
          if (Platform.OS === 'web') {
            window.alert('No areas found for this pincode.');
          } else {
            Alert.alert('No Data', 'No areas found for this pincode.');
          }
        }
      } else {
        if (Platform.OS === 'web') {
          window.alert('Please enter a valid 6-digit pincode.');
        } else {
          Alert.alert('Invalid Pincode', 'Please enter a valid 6-digit pincode.');
        }
      }
    } catch (error) {
      if (Platform.OS === 'web') {
        window.alert('Failed to fetch pincode data. Please try again.');
      } else {
        Alert.alert('Error', 'Failed to fetch pincode data. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ===== HANDLE AREA SELECTION =====
  const handleAreaSelect = (selectedArea) => {
    setArea(selectedArea);
    setModalVisible(false);
    
    if (selectedAreaData) {
      const selected = selectedAreaData.find(item => item.Name === selectedArea);
      if (selected) {
        setCity(selected.District || '');
      }
    }
  };

  // ===== HANDLE POSTAL CODE CHANGE =====
  const handlePostalCodeChange = (text) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    setPostalCode(cleaned);
    if (cleaned.length === 6) {
      fetchPincodeData(cleaned);
    } else {
      setAreaOptions([]);
      setArea('');
      setCity('');
      setSelectedAreaData(null);
    }
  };

  // ===== VALIDATION =====
  const validate = () => {
    let valid = true;
    let newErrors = {};

    if (!selectedBranch) {
      newErrors.branch = 'Branch is required';
      valid = false;
    }
    if (!customerName.trim()) {
      newErrors.customerName = 'Customer name is required';
      valid = false;
    }
    if (!mobileNumber || mobileNumber.length !== 10) {
      newErrors.mobileNumber = 'Enter a valid 10-digit mobile number';
      valid = false;
    }
    if (!postalCode || postalCode.length !== 6) {
      newErrors.postalCode = 'Enter a valid 6-digit pincode';
      valid = false;
    }
    if (!area) {
      newErrors.area = 'Please select an area';
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  // ===== SAVE (FIXED FOR WEB) =====
  const handleSave = async () => {
    if (validate()) {
      setSaving(true);
      
      const formData = {
        branch: selectedBranch,
        customerName,
        mobileNumber,
        postalCode,
        area,
        city,
      };
      
      console.log("FORM DATA:", formData);
      
      try {
        const result = await customerService.quickEntry(formData);
        setSaving(false);
        
        if (result.success) {
          if (Platform.OS === 'web') {
            window.alert('✅ ' + result.message);
            clearForm();
            navigation.goBack();
          } else {
            Alert.alert('✅ Success', result.message, [
              {
                text: 'OK',
                onPress: () => {
                  clearForm();
                  navigation.goBack();
                },
              },
            ]);
          }
        } else {
          if (Platform.OS === 'web') {
            window.alert('❌ ' + result.message);
          } else {
            Alert.alert('Error', result.message);
          }
        }
      } catch (error) {
        setSaving(false);
        if (Platform.OS === 'web') {
          window.alert('❌ Failed to save. Please try again.');
        } else {
          Alert.alert('Error', 'Failed to save. Please try again.');
        }
      }
    }
  };

  // ===== CANCEL (FIXED FOR WEB) =====
  const handleCancel = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to clear all fields?')) {
        clearForm();
      }
    } else {
      Alert.alert(
        'Cancel',
        'Are you sure you want to clear all fields?',
        [
          { text: 'No', style: 'cancel' },
          { 
            text: 'Yes', 
            onPress: clearForm,
            style: 'destructive'
          }
        ]
      );
    }
  };

  // ===== CLEAR FORM =====
  const clearForm = () => {
    setCustomerName('');
    setMobileNumber('');
    setPostalCode('');
    setArea('');
    setCity('');
    setAreaOptions([]);
    setSelectedAreaData(null);
    setErrors({});
  };

  // ===== RENDER AREA DROPDOWN =====
  const renderAreaItem = ({ item }) => (
    <TouchableOpacity
      style={styles.dropdownItem}
      onPress={() => handleAreaSelect(item)}
    >
      <Text style={styles.dropdownItemText}>{item}</Text>
    </TouchableOpacity>
  );

  return (
    <ImageBackground
      source={require('../assets/images/pattern.png')}
      style={styles.backgroundImage}
      imageStyle={{ opacity: 0.12 }}
      resizeMode="cover"
    >
      <View style={styles.container}>
        <View style={styles.scrollContainer}>
          <ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.contentContainer}
            style={styles.scrollView}
            nestedScrollEnabled={true}
            scrollEnabled={true}
          >
            {/* Top Gold Accent Line */}
            <View style={styles.topGoldLine} />

            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                <Text style={styles.backButtonText}>‹</Text>
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Customer Quick Entry</Text>
              <View style={styles.headerSpacer} />
            </View>

            {/* Gold Line */}
            <View style={styles.goldLine} />

            {/* ===== FORM ===== */}
            <View style={styles.formContainer}>

              {/* 1. BRANCH - READONLY */}
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Branch <Text style={styles.required}>*</Text></Text>
                <View style={[styles.dropdown, styles.readonlyField]}>
                  <Text style={styles.dropdownText}>
                    {branchName || 'No branch selected'}
                  </Text>
                </View>
                {errors.branch && <Text style={styles.errorText}>{errors.branch}</Text>}
              </View>

              {/* 2. CUSTOMER NAME */}
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Customer Name <Text style={styles.required}>*</Text></Text>
                <TextInput
                  style={[styles.input, errors.customerName && styles.errorBorder]}
                  placeholder="Enter customer name"
                  placeholderTextColor="#B0A090"
                  value={customerName}
                  onChangeText={(text) => {
                    setCustomerName(text);
                    setErrors(prev => ({ ...prev, customerName: '' }));
                  }}
                />
                {errors.customerName && <Text style={styles.errorText}>{errors.customerName}</Text>}
              </View>

              {/* 3. MOBILE NUMBER */}
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Mobile Number <Text style={styles.required}>*</Text></Text>
                <TextInput
                  style={[styles.input, errors.mobileNumber && styles.errorBorder]}
                  placeholder="Enter 10-digit mobile number"
                  placeholderTextColor="#B0A090"
                  value={mobileNumber}
                  onChangeText={(text) => {
                    const cleaned = text.replace(/[^0-9]/g, '');
                    setMobileNumber(cleaned);
                    setErrors(prev => ({ ...prev, mobileNumber: '' }));
                  }}
                  keyboardType="phone-pad"
                  maxLength={10}
                />
                {errors.mobileNumber && <Text style={styles.errorText}>{errors.mobileNumber}</Text>}
              </View>

              {/* 4. POSTAL CODE */}
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Postal Code <Text style={styles.required}>*</Text></Text>
                <View style={styles.postalContainer}>
                  <TextInput
                    style={[styles.input, styles.postalInput, errors.postalCode && styles.errorBorder]}
                    placeholder="Enter 6-digit pincode"
                    placeholderTextColor="#B0A090"
                    value={postalCode}
                    onChangeText={handlePostalCodeChange}
                    keyboardType="phone-pad"
                    maxLength={6}
                  />
                  {loading && <ActivityIndicator size="small" color="#D4AF37" style={styles.loader} />}
                </View>
                {errors.postalCode && <Text style={styles.errorText}>{errors.postalCode}</Text>}
              </View>

              {/* 5. AREA */}
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Area <Text style={styles.required}>*</Text></Text>
                <TouchableOpacity
                  style={[
                    styles.dropdown, 
                    errors.area && styles.errorBorder,
                    area && styles.readonlyField
                  ]}
                  onPress={() => {
                    if (areaOptions.length > 0) {
                      setModalVisible(true);
                    } else {
                      if (Platform.OS === 'web') {
                        window.alert('Please enter a valid pincode first.');
                      } else {
                        Alert.alert('No Areas', 'Please enter a valid pincode first.');
                      }
                    }
                  }}
                  disabled={!areaOptions.length}
                >
                  <Text style={area ? styles.dropdownText : styles.placeholderText}>
                    {area || 'Select Area (Enter pincode first)'}
                  </Text>
                  {areaOptions.length > 0 && <Text style={styles.dropdownArrow}>▼</Text>}
                </TouchableOpacity>
                {errors.area && <Text style={styles.errorText}>{errors.area}</Text>}
              </View>

              {/* 6. CITY */}
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>City</Text>
                <TextInput
                  style={[styles.input, styles.readonlyField]}
                  placeholder="Auto-filled from area selection"
                  placeholderTextColor="#B0A090"
                  value={city}
                  editable={false}
                />
              </View>

            </View>

            {/* ===== BUTTONS ===== */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={[styles.button, styles.cancelButton]} 
                onPress={handleCancel}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.button, styles.saveButton]} 
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveButtonText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Bottom Gold Accent Line */}
            <View style={styles.bottomGoldLine} />
          </ScrollView>
        </View>

        {/* ===== AREA MODAL ===== */}
        <Modal
          transparent
          visible={modalVisible}
          animationType="fade"
          onRequestClose={() => setModalVisible(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setModalVisible(false)}
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select Area</Text>
              <FlatList
                data={areaOptions}
                keyExtractor={(item) => item}
                renderItem={renderAreaItem}
                showsVerticalScrollIndicator={false}
              />
            </View>
          </TouchableOpacity>
        </Modal>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    backgroundColor: '#FDF8F0',
  },
  container: {
    flex: 1,
    backgroundColor: '#FDF8F0',
    ...(Platform.OS === 'web' && {
      height: '100vh',
      overflow: 'hidden',
    }),
  },
  scrollContainer: {
    flex: 1,
    ...(Platform.OS === 'web' && {
      overflow: 'auto',
      maxHeight: '100vh',
    }),
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingVertical: 30,
    paddingBottom: 40,
    ...(Platform.OS === 'web' && {
      minHeight: '100%',
    }),
  },

  // ===== TOP GOLD LINE =====
  topGoldLine: {
    width: 50,
    height: 2,
    backgroundColor: '#D4AF37',
    borderRadius: 1,
    marginBottom: 15,
    alignSelf: 'center',
  },

  // ===== HEADER =====
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 30,
    color: '#D4AF37',
    fontWeight: '300',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#D4AF37',
    letterSpacing: 1,
  },
  headerSpacer: {
    width: 40,
  },

  // ===== GOLD LINE =====
  goldLine: {
    width: 50,
    height: 2,
    backgroundColor: '#D4AF37',
    borderRadius: 1,
    marginBottom: 25,
    alignSelf: 'center',
  },

  // ===== BOTTOM GOLD LINE =====
  bottomGoldLine: {
    width: 50,
    height: 2,
    backgroundColor: '#D4AF37',
    borderRadius: 1,
    marginTop: 20,
    alignSelf: 'center',
  },

  // ===== FORM =====
  formContainer: {
    width: '100%',
  },
  fieldContainer: {
    marginBottom: 18,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1108',
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  required: {
    color: '#8B1A1A',
    fontSize: 16,
  },

  // ===== INPUTS =====
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1A1108',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.15)',
  },
  dropdown: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.15)',
  },
  dropdownText: {
    fontSize: 15,
    color: '#1A1108',
  },
  placeholderText: {
    fontSize: 15,
    color: '#B0A090',
  },
  dropdownArrow: {
    fontSize: 12,
    color: '#B0A090',
  },
  readonlyField: {
    backgroundColor: 'rgba(200, 200, 200, 0.2)',
  },
  errorBorder: {
    borderColor: '#DC3545',
    borderWidth: 1.5,
  },
  errorText: {
    fontSize: 12,
    color: '#DC3545',
    marginTop: 4,
    marginLeft: 4,
  },
  postalContainer: {
    position: 'relative',
  },
  postalInput: {
    paddingRight: 40,
  },
  loader: {
    position: 'absolute',
    right: 12,
    top: 12,
  },

  // ===== MODAL =====
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 25,
    width: '85%',
    maxHeight: '60%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#D4AF37',
    textAlign: 'center',
    marginBottom: 15,
    letterSpacing: 1,
  },
  dropdownItem: {
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0EAE0',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#1A1108',
  },

  // ===== BUTTONS =====
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 10,
    gap: 15,
  },
  button: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButton: {
    backgroundColor: '#D4AF37',
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#D4AF37',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#D4AF37',
    letterSpacing: 1,
  },
});

export default CustomerQuickEntryScreen;