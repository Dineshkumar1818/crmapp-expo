import React, { useState, useRef, useEffect } from 'react';
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
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { customerService } from '../services/customer';
import { useAuth } from '../context/AuthContext';

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

const CustomerRegistrationScreen = ({ navigation }) => {
  // ===== GET SELECTED BRANCH FROM AUTH CONTEXT =====
  const { selectedBranch } = useAuth();
  
  // ✅ Convert branch ID to name
  const branchName = selectedBranch ? BRANCH_MAP[selectedBranch] || String(selectedBranch) : null;

  // ===== STATE =====
  const [mobileNumber, setMobileNumber] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [dob, setDob] = useState('');
  const [weddingDate, setWeddingDate] = useState('');
  const [pincode, setPincode] = useState('');
  const [area, setArea] = useState('');
  const [city, setCity] = useState('');
  const [address1, setAddress1] = useState('');
  const [address2, setAddress2] = useState('');
  const [pan, setPan] = useState('');
  const [aadhaar, setAadhaar] = useState('');
  const [gst, setGst] = useState('');

  // ===== DATE PICKER STATE =====
  const [showDobPicker, setShowDobPicker] = useState(false);
  const [showWeddingPicker, setShowWeddingPicker] = useState(false);
  const [tempDob, setTempDob] = useState(new Date());
  const [tempWedding, setTempWedding] = useState(new Date());

  const [areaOptions, setAreaOptions] = useState([]);
  const [selectedAreaData, setSelectedAreaData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [errors, setErrors] = useState({});
  const [checkingMobile, setCheckingMobile] = useState(false);
  const [mobileExists, setMobileExists] = useState(false);
  const [lastCheckedMobile, setLastCheckedMobile] = useState('');

  // ===== REFS FOR AUTO-SCROLL =====
  const scrollViewRef = useRef(null);
  const fieldRefs = {
    branch: useRef(null),
    mobileNumber: useRef(null),
    name: useRef(null),
    email: useRef(null),
    dob: useRef(null),
    weddingDate: useRef(null),
    pincode: useRef(null),
    area: useRef(null),
    address1: useRef(null),
    address2: useRef(null),
    pan: useRef(null),
    aadhaar: useRef(null),
    gst: useRef(null),
  };

  // ===== DATE HELPER FUNCTIONS =====
  const formatDate = (date) => {
    if (!date) return '';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    const parts = dateString.split('/');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return '';
  };

  const parseDate = (dateString) => {
    if (!dateString) return null;
    const parts = dateString.split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0],10);
      const month = parseInt(parts[1],10) - 1;
      const year = parseInt(parts[2],10);
      return new Date(year, month, day);
    }
    return null;
  };

  const isValidDate = (date) => {
    return date instanceof Date && !isNaN(date);
  };

  // ===== WEB DATE HANDLERS =====
  const onWebDobChange = (e) => {
    const val = e.target.value;
    if (val) {
      const [year, month, day] = val.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      if (!isNaN(date)) {
        setDob(formatDate(date));
        setTempDob(date);
        setErrors(prev => ({ ...prev, dob: '' }));
      }
    }
  };

  const onWebWeddingChange = (e) => {
    const val = e.target.value;
    if (val) {
      const [year, month, day] = val.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      if (!isNaN(date)) {
        setWeddingDate(formatDate(date));
        setTempWedding(date);
        setErrors(prev => ({ ...prev, weddingDate: '' }));
      }
    }
  };

  // ===== API CALL: Fetch Pincode Data =====
  const fetchPincodeData = async (pinCodeValue) => {
    if (pinCodeValue.length !== 6) return;

    setLoading(true);
    setAreaOptions([]);
    setArea('');
    setCity('');
    setSelectedAreaData(null);

    try {
      const response = await fetch(`https://api.postalpincode.in/pincode/${pinCodeValue}`);
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

  // ===== HANDLE PINCODE CHANGE =====
  const handlePincodeChange = (text) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    setPincode(cleaned);
    if (cleaned.length === 6) {
      fetchPincodeData(cleaned);
    } else {
      setAreaOptions([]);
      setArea('');
      setCity('');
      setSelectedAreaData(null);
    }
  };

  // ===== DATE PICKER HANDLERS =====
  const onDobChange = (event, selectedDate) => {
    if (selectedDate && isValidDate(selectedDate)) {
      setDob(formatDate(selectedDate));
      setTempDob(selectedDate);
      setErrors(prev => ({ ...prev, dob: '' }));
    }
    setShowDobPicker(false);
  };

  const onWeddingChange = (event, selectedDate) => {
    if (selectedDate && isValidDate(selectedDate)) {
      setWeddingDate(formatDate(selectedDate));
      setTempWedding(selectedDate);
      setErrors(prev => ({ ...prev, weddingDate: '' }));
    }
    setShowWeddingPicker(false);
  };

  // ===== VALIDATIONS =====
  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validatePAN = (pan) => {
    const re = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    return re.test(pan);
  };

  const validateDate = (dateString) => {
    if (!dateString) return false;
    const date = parseDate(dateString);
    if (!date || !isValidDate(date)) return false;
    
    const today = new Date();
    const inputDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    if (inputDate > today) return false;
    
    return true;
  };

  // ===== VALIDATE WITH AUTO-SCROLL =====
  const validateAndScroll = () => {
    let valid = true;
    let newErrors = {};
    let firstErrorField = null;

    if (!selectedBranch) {
      newErrors.branch = 'Branch is required';
      valid = false;
      if (!firstErrorField) firstErrorField = 'branch';
    }
    if (!mobileNumber || mobileNumber.length !== 10) {
      newErrors.mobileNumber = 'Enter a valid 10-digit mobile number';
      valid = false;
      if (!firstErrorField) firstErrorField = 'mobileNumber';
    }
    if (!name.trim()) {
      newErrors.name = 'Name is required';
      valid = false;
      if (!firstErrorField) firstErrorField = 'name';
    }
    if (!email || !validateEmail(email)) {
      newErrors.email = 'Enter a valid email address';
      valid = false;
      if (!firstErrorField) firstErrorField = 'email';
    }
    if (!pincode || pincode.length !== 6) {
      newErrors.pincode = 'Enter a valid 6-digit pincode';
      valid = false;
      if (!firstErrorField) firstErrorField = 'pincode';
    }
    if (!area) {
      newErrors.area = 'Please select an area';
      valid = false;
      if (!firstErrorField) firstErrorField = 'area';
    }
    if (!address1.trim()) {
      newErrors.address1 = 'Address 1 is required';
      valid = false;
      if (!firstErrorField) firstErrorField = 'address1';
    }
    if (!address2.trim()) {
      newErrors.address2 = 'Address 2 is required';
      valid = false;
      if (!firstErrorField) firstErrorField = 'address2';
    }

    setErrors(newErrors);

    if (firstErrorField && fieldRefs[firstErrorField]?.current) {
      fieldRefs[firstErrorField].current.measureLayout(
        scrollViewRef.current,
        (x, y) => {
          scrollViewRef.current.scrollTo({ y: y - 100, animated: true });
        },
        () => {}
      );
    }

    return valid;
  };

  // ===== CHECK MOBILE NUMBER (Backend + Local) =====
  const checkMobileNumber = async (mobile) => {
    if (mobile.length !== 10) return;
    if (mobile === lastCheckedMobile) return;

    setLastCheckedMobile(mobile);

    try {
      setCheckingMobile(true);

      const localCustomers = await AsyncStorage.getItem('customers');
      if (localCustomers) {
        const customers = JSON.parse(localCustomers);
        const found = customers.find(c => c.mobileNumber === mobile);
        if (found) {
          setMobileExists(true);
          setCheckingMobile(false);
          const msg = `Customer Already Registered\nName: ${found.customerName || found.name || ''}`;
          if (Platform.OS === 'web') {
            window.alert(msg);
          } else {
            Alert.alert('Customer Already Registered', `Customer Name: ${found.customerName || found.name || ''}`);
          }
          return;
        }
      }

      const result = await customerService.checkMobile(mobile);
      if (result.success && result.exists) {
        setMobileExists(true);
        const msg = `Customer Already Registered\nName: ${result.customer?.CUSNAME || ''}`;
        if (Platform.OS === 'web') {
          window.alert(msg);
        } else {
          Alert.alert('Customer Already Registered', `Customer Name: ${result.customer?.CUSNAME || ''}`);
        }
      } else {
        setMobileExists(false);
      }
    } catch (error) {
      console.log('Mobile Check Error:', error);
    } finally {
      setCheckingMobile(false);
    }
  };

  // ===== SAVE TO LOCAL STORAGE =====
  const saveCustomerToLocal = async (customerData) => {
    try {
      const existing = await AsyncStorage.getItem('customers');
      let customers = existing ? JSON.parse(existing) : [];
      
      const index = customers.findIndex(c => c.mobileNumber === customerData.mobileNumber);
      if (index !== -1) {
        customers[index] = customerData;
      } else {
        customers.push(customerData);
      }
      
      await AsyncStorage.setItem('customers', JSON.stringify(customers));
      console.log('✅ Customer saved locally');
    } catch (error) {
      console.log('Error saving customer locally:', error);
    }
  };

  // ===== FORMAT DATE FOR SQL =====
  const formatDateForSQL = (dateString) => {
    if (!dateString) return null;
    const parts = dateString.split('/');
    if (parts.length === 3) {
      const day = parts[0].padStart(2, '0');
      const month = parts[1].padStart(2, '0');
      const year = parts[2];
      return `${year}-${month}-${day}`;
    }
    return null;
  };

  // ===== SAVE (FIXED FOR WEB) =====
  const handleSave = async () => {
    if (checkingMobile) {
      if (Platform.OS === 'web') {
        window.alert('Mobile number verification is in progress.');
      } else {
        Alert.alert('Please Wait', 'Mobile number verification is in progress.');
      }
      return;
    }

    if (mobileExists) {
      if (Platform.OS === 'web') {
        window.alert('This mobile number is already registered.');
      } else {
        Alert.alert('Duplicate Mobile', 'This mobile number is already registered.');
      }
      return;
    }

    if (validateAndScroll()) {
      setSaving(true);
      
      const dobSQL = formatDateForSQL(dob);
      const weddingDateSQL = formatDateForSQL(weddingDate);

      const formData = {
        customerName: name,
        cusadd1: address1,
        cusadd2: address2,
        cusadd3: area,
        cuscity: city,
        mobileNumber: mobileNumber,
        postalCode: pincode,
        cusbran: selectedBranch,
        cusdob: dobSQL,
        cusdow: weddingDateSQL,
        cusemail: email,
        cuspan: pan,
        cusaadhar: aadhaar,
        cusgstno: gst,
      };
      
      console.log("📤 Registration Form Data:", formData);
      
      try {
        const result = await customerService.registration(formData);
        await saveCustomerToLocal(formData);
        
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
          { text: 'Yes', onPress: clearForm, style: 'destructive' }
        ]
      );
    }
  };

  // ===== CLEAR FORM =====
  const clearForm = () => {
    setMobileNumber('');
    setName('');
    setEmail('');
    setDob('');
    setWeddingDate('');
    setPincode('');
    setArea('');
    setCity('');
    setAddress1('');
    setAddress2('');
    setPan('');
    setAadhaar('');
    setGst('');
    setAreaOptions([]);
    setSelectedAreaData(null);
    setErrors({});
    setMobileExists(false);
    setCheckingMobile(false);
    setLastCheckedMobile('');
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
    <View style={styles.container}>
      <View style={styles.scrollContainer}>
        <ScrollView
          ref={scrollViewRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.contentContainer}
          style={styles.scrollView}
          nestedScrollEnabled={true}
          scrollEnabled={true}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Text style={styles.backButtonText}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Customer Registration</Text>
            <View style={styles.headerSpacer} />
          </View>

          <View style={styles.goldLine} />

          {/* ===== FORM ===== */}
          <View style={styles.formContainer}>

            {/* 1. BRANCH - READONLY */}
            <View ref={fieldRefs.branch} style={styles.fieldContainer} collapsable={false}>
              <Text style={styles.label}>Branch <Text style={styles.required}>*</Text></Text>
              <View style={[styles.dropdown, styles.readonlyField]}>
                <Text style={styles.dropdownText}>
                  {branchName || 'No branch selected'}
                </Text>
              </View>
              {errors.branch && <Text style={styles.errorText}>{errors.branch}</Text>}
            </View>

            {/* 2. MOBILE NUMBER */}
            <View ref={fieldRefs.mobileNumber} style={styles.fieldContainer} collapsable={false}>
              <Text style={styles.label}>Mobile Number <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={[
                  styles.input,
                  errors.mobileNumber && styles.errorBorder,
                  mobileExists && { borderColor: 'red', borderWidth: 2 }
                ]}
                placeholder="Enter 10-digit mobile number"
                placeholderTextColor="#B0A090"
                value={mobileNumber}
                keyboardType="phone-pad"
                maxLength={10}
                onChangeText={(text) => {
                  const cleaned = text.replace(/[^0-9]/g, '');
                  setMobileNumber(cleaned);
                  setMobileExists(false);
                  setErrors(prev => ({
                    ...prev,
                    mobileNumber: ''
                  }));
                }}
                onBlur={() => {
                  if (mobileNumber.length === 10) {
                    checkMobileNumber(mobileNumber);
                  }
                }}
              />
              {checkingMobile && (
                <Text style={{ color: '#D4AF37', marginTop: 5 }}>
                  Checking mobile number...
                </Text>
              )}
              {mobileExists && (
                <Text style={{ color: 'red', marginTop: 5 }}>
                  Mobile number already registered
                </Text>
              )}
              {errors.mobileNumber && <Text style={styles.errorText}>{errors.mobileNumber}</Text>}
            </View>

            {/* 3. NAME */}
            <View ref={fieldRefs.name} style={styles.fieldContainer} collapsable={false}>
              <Text style={styles.label}>Name <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={[styles.input, errors.name && styles.errorBorder]}
                placeholder="Enter customer name"
                placeholderTextColor="#B0A090"
                value={name}
                onChangeText={(text) => {
                  setName(text);
                  setErrors(prev => ({ ...prev, name: '' }));
                }}
              />
              {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
            </View>

            {/* 4. EMAIL */}
            <View ref={fieldRefs.email} style={styles.fieldContainer} collapsable={false}>
              <Text style={styles.label}>Email <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={[styles.input, errors.email && styles.errorBorder]}
                placeholder="Enter email address"
                placeholderTextColor="#B0A090"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  setErrors(prev => ({ ...prev, email: '' }));
                }}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
            </View>

            {/* 5. DATE OF BIRTH */}
            <View ref={fieldRefs.dob} style={styles.fieldContainer} collapsable={false}>
              <Text style={styles.label}>Date of Birth</Text>
              {Platform.OS === 'web' ? (
                <input
                  type="date"
                  value={formatDateForInput(dob)}
                  onChange={onWebDobChange}
                  max={new Date().toISOString().split('T')[0]}
                  style={{
                    width: '100%',
                    padding: '12px 15px',
                    fontSize: '15px',
                    borderRadius: '10px',
                    border: `1px solid ${errors.dob ? '#DC3545' : 'rgba(212, 175, 55, 0.15)'}`,
                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                    color: '#1A1108',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              ) : (
                <TouchableOpacity
                  style={[styles.datePickerButton, errors.dob && styles.errorBorder]}
                  onPress={() => setShowDobPicker(true)}
                >
                  <Text style={dob ? styles.datePickerText : styles.placeholderText}>
                    {dob || 'Select Date of Birth'}
                  </Text>
                  <Text style={styles.datePickerIcon}>📅</Text>
                </TouchableOpacity>
              )}
              {errors.dob && <Text style={styles.errorText}>{errors.dob}</Text>}
            </View>

            {/* 6. WEDDING DATE */}
            <View ref={fieldRefs.weddingDate} style={styles.fieldContainer} collapsable={false}>
              <Text style={styles.label}>Wedding Date</Text>
              {Platform.OS === 'web' ? (
                <input
                  type="date"
                  value={formatDateForInput(weddingDate)}
                  onChange={onWebWeddingChange}
                  max={new Date().toISOString().split('T')[0]}
                  style={{
                    width: '100%',
                    padding: '12px 15px',
                    fontSize: '15px',
                    borderRadius: '10px',
                    border: `1px solid ${errors.weddingDate ? '#DC3545' : 'rgba(212, 175, 55, 0.15)'}`,
                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                    color: '#1A1108',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              ) : (
                <TouchableOpacity
                  style={[styles.datePickerButton, errors.weddingDate && styles.errorBorder]}
                  onPress={() => setShowWeddingPicker(true)}
                >
                  <Text style={weddingDate ? styles.datePickerText : styles.placeholderText}>
                    {weddingDate || 'Select Wedding Date'}
                  </Text>
                  <Text style={styles.datePickerIcon}>📅</Text>
                </TouchableOpacity>
              )}
              {errors.weddingDate && <Text style={styles.errorText}>{errors.weddingDate}</Text>}
            </View>

            {/* 7. PINCODE */}
            <View ref={fieldRefs.pincode} style={styles.fieldContainer} collapsable={false}>
              <Text style={styles.label}>Pincode <Text style={styles.required}>*</Text></Text>
              <View style={styles.postalContainer}>
                <TextInput
                  style={[styles.input, styles.postalInput, errors.pincode && styles.errorBorder]}
                  placeholder="Enter 6-digit pincode"
                  placeholderTextColor="#B0A090"
                  value={pincode}
                  onChangeText={handlePincodeChange}
                  keyboardType="phone-pad"
                  maxLength={6}
                />
                {loading && <ActivityIndicator size="small" color="#D4AF37" style={styles.loader} />}
              </View>
              {errors.pincode && <Text style={styles.errorText}>{errors.pincode}</Text>}
            </View>

            {/* 8. AREA */}
            <View ref={fieldRefs.area} style={styles.fieldContainer} collapsable={false}>
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

            {/* 9. CITY */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>City <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={[styles.input, styles.readonlyField]}
                placeholder="Auto-filled from area selection"
                placeholderTextColor="#B0A090"
                value={city}
                editable={false}
              />
              {!city && <Text style={styles.errorText}>City will auto-fill after selecting area</Text>}
            </View>

            {/* 10. ADDRESS 1 */}
            <View ref={fieldRefs.address1} style={styles.fieldContainer} collapsable={false}>
              <Text style={styles.label}>Address 1 <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={[styles.input, styles.textArea, errors.address1 && styles.errorBorder]}
                placeholder="Enter address line 1"
                placeholderTextColor="#B0A090"
                value={address1}
                onChangeText={(text) => {
                  setAddress1(text);
                  setErrors(prev => ({ ...prev, address1: '' }));
                }}
                multiline
                numberOfLines={2}
              />
              {errors.address1 && <Text style={styles.errorText}>{errors.address1}</Text>}
            </View>

            {/* 11. ADDRESS 2 */}
            <View ref={fieldRefs.address2} style={styles.fieldContainer} collapsable={false}>
              <Text style={styles.label}>Address 2 <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={[styles.input, styles.textArea, errors.address2 && styles.errorBorder]}
                placeholder="Enter address line 2"
                placeholderTextColor="#B0A090"
                value={address2}
                onChangeText={(text) => {
                  setAddress2(text);
                  setErrors(prev => ({ ...prev, address2: '' }));
                }}
                multiline
                numberOfLines={2}
              />
              {errors.address2 && <Text style={styles.errorText}>{errors.address2}</Text>}
            </View>

            {/* 12. PAN */}
            <View ref={fieldRefs.pan} style={styles.fieldContainer} collapsable={false}>
              <Text style={styles.label}>PAN</Text>
              <TextInput
                style={[styles.input, errors.pan && styles.errorBorder]}
                placeholder="ABCDE1234F"
                placeholderTextColor="#B0A090"
                value={pan}
                onChangeText={(text) => {
                  setPan(text.toUpperCase());
                  setErrors(prev => ({ ...prev, pan: '' }));
                }}
                autoCapitalize="characters"
                maxLength={10}
              />
              {errors.pan && <Text style={styles.errorText}>{errors.pan}</Text>}
            </View>

            {/* 13. AADHAAR */}
            <View ref={fieldRefs.aadhaar} style={styles.fieldContainer} collapsable={false}>
              <Text style={styles.label}>Aadhaar</Text>
              <TextInput
                style={[styles.input, errors.aadhaar && styles.errorBorder]}
                placeholder="Enter 12-digit Aadhaar number"
                placeholderTextColor="#B0A090"
                value={aadhaar}
                onChangeText={(text) => {
                  const cleaned = text.replace(/[^0-9]/g, '');
                  setAadhaar(cleaned);
                  setErrors(prev => ({ ...prev, aadhaar: '' }));
                }}
                keyboardType="phone-pad"
                maxLength={12}
              />
              {errors.aadhaar && <Text style={styles.errorText}>{errors.aadhaar}</Text>}
            </View>

            {/* 14. GST */}
            <View ref={fieldRefs.gst} style={styles.fieldContainer} collapsable={false}>
              <Text style={styles.label}>GST</Text>
              <TextInput
                style={[styles.input, errors.gst && styles.errorBorder]}
                placeholder="Enter GST number"
                placeholderTextColor="#B0A090"
                value={gst}
                onChangeText={(text) => {
                  setGst(text.toUpperCase());
                  setErrors(prev => ({ ...prev, gst: '' }));
                }}
                autoCapitalize="characters"
              />
              {errors.gst && <Text style={styles.errorText}>{errors.gst}</Text>}
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
        </ScrollView>
      </View>

      {/* ===== DATE PICKERS (Mobile Only) ===== */}
      {Platform.OS !== 'web' && showDobPicker && (
        <DateTimePicker
          value={tempDob}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onDobChange}
          maximumDate={new Date()}
        />
      )}

      {Platform.OS !== 'web' && showWeddingPicker && (
        <DateTimePicker
          value={tempWedding}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onWeddingChange}
          maximumDate={new Date()}
        />
      )}

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
  );
};

const styles = StyleSheet.create({
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#D4AF37',
    letterSpacing: 1,
  },
  headerSpacer: {
    width: 40,
  },
  goldLine: {
    width: 50,
    height: 2,
    backgroundColor: '#D4AF37',
    borderRadius: 1,
    marginBottom: 25,
    alignSelf: 'center',
  },
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
  textArea: {
    minHeight: 60,
    textAlignVertical: 'top',
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
  datePickerButton: {
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
  datePickerText: {
    fontSize: 15,
    color: '#1A1108',
  },
  datePickerIcon: {
    fontSize: 18,
  },
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

export default CustomerRegistrationScreen;