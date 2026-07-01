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
import { getBarcode } from '../utils/barcode';

const CustomerChitScreen = ({ navigation }) => {
  const { selectedBranch } = useAuth();
  const scrollViewRef = useRef(null);

  const mobileNoRef = useRef(null);
  const groupNameRef = useRef(null);
  const groupNoRef = useRef(null);
  const noOfInstallmentRef = useRef(null);
  const amountRef = useRef(null);
  const scanBarcodeRef = useRef(null);
  const cardNoRef = useRef(null);
  const chitCanvasTypeRef = useRef(null);
  const maturityDateRef = useRef(null);

  const fieldRefs = {
    mobileNo: mobileNoRef,
    groupName: groupNameRef,
    groupNo: groupNoRef,
    noOfInstallment: noOfInstallmentRef,
    amount: amountRef,
    scanBarcode: scanBarcodeRef,
    cardNo: cardNoRef,
    chitCanvasType: chitCanvasTypeRef,
    maturityDate: maturityDateRef,
  };

  const [groupName, setGroupName] = useState('');
  const [groupNo, setGroupNo] = useState('');
  const [noOfInstallment, setNoOfInstallment] = useState('');
  const [amount, setAmount] = useState('');
  const [cardNo, setCardNo] = useState('');
  const [chitCanvasType, setChitCanvasType] = useState('');
  const [mobileNo, setMobileNo] = useState('');
  const [maturityDate, setMaturityDate] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [address1, setAddress1] = useState('');
  const [address2, setAddress2] = useState('');
  const [pincode, setPincode] = useState('');
  const [area, setArea] = useState('');
  const [city, setCity] = useState('');
  const [mailId, setMailId] = useState('');

  const [groupModalVisible, setGroupModalVisible] = useState(false);
  const [amountModalVisible, setAmountModalVisible] = useState(false);
  const [canvasModalVisible, setCanvasModalVisible] = useState(false);

  const [amountOptions, setAmountOptions] = useState([]);
  const [groupOptions, setGroupOptions] = useState([]);
  const [loadingAmounts, setLoadingAmounts] = useState(false);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [fetchingGroupDetails, setFetchingGroupDetails] = useState(false);

  // ===== CANVAS TYPES - Dynamic from Backend with Fallback =====
  const [canvasTypes, setCanvasTypes] = useState(['Type 1', 'Type 2']);
  const [loadingCanvasTypes, setLoadingCanvasTypes] = useState(false);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState(new Date());

  const [saving, setSaving] = useState(false);
  const [fetchingCustomer, setFetchingCustomer] = useState(false);
  const [errors, setErrors] = useState({});

  const formatDate = (date) => {
    if (!date || !(date instanceof Date) || isNaN(date)) {
      return '';
    }
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

  const handleBarcodeScanned = (data) => {
    console.log('📷 Scanned Barcode Data:', data);
    setCardNo(data);
    setErrors(prev => ({ ...prev, cardNo: '' }));
  };

  const clearCustomerFields = () => {
    setCustomerName('');
    setAddress1('');
    setAddress2('');
    setPincode('');
    setArea('');
    setCity('');
    setMailId('');
  };

  const clearGroupDetails = () => {
    setGroupNo('');
    setNoOfInstallment('');
  };

  const clearGroupName = () => {
    setGroupName('');
    clearGroupDetails();
  };

  const saveCustomerToLocal = async (customer) => {
    try {
      const existing = await AsyncStorage.getItem('customers');
      let customers = existing ? JSON.parse(existing) : [];
      const index = customers.findIndex(c => c.mobileNumber === customer.mobileNumber);
      if (index !== -1) {
        customers[index] = customer;
      } else {
        customers.push(customer);
      }
      await AsyncStorage.setItem('customers', JSON.stringify(customers));
      console.log('✅ Customer saved to LOCAL storage');
    } catch (error) {
      console.log('Error saving customer to local:', error);
    }
  };

  // ===== LISTEN FOR BARCODE DATA =====
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      const data = getBarcode();
      if (data) {
        setCardNo(data);
        setErrors(prev => ({ ...prev, cardNo: '' }));
      }
    });
    return unsubscribe;
  }, [navigation]);

  const populateCustomerFields = (customer) => {
    setCustomerName(customer.customerName || customer.name || customer.CUSNAME || '');
    setAddress1(customer.cusadd1 || customer.address1 || customer.CUSADD1 || '');
    setAddress2(customer.cusadd2 || customer.address2 || customer.CUSADD2 || '');
    setPincode(customer.CUSPINCODE || customer.pincode || customer.postalCode || '');
    setArea(customer.cusadd3 || customer.area || customer.CUSADD3 || '');
    setCity(customer.cuscity || customer.city || customer.CUSCITY || '');
    setMailId(customer.cusemail || customer.mailId || customer.email || customer.CUSEMAIL || '');
  };

  const autoScrollToField = (fieldName) => {
    setTimeout(() => {
      if (fieldName && fieldRefs[fieldName]?.current) {
        fieldRefs[fieldName].current.measureLayout(
          scrollViewRef.current,
          (x, y) => {
            scrollViewRef.current.scrollTo({ y: y - 100, animated: true });
          },
          () => { }
        );
      }
    }, 300);
  };

  const fetchGroupDetails = async (groupName) => {
    if (!groupName) {
      clearGroupDetails();
      return;
    }
    setFetchingGroupDetails(true);
    try {
      console.log('📡 Fetching group details for:', groupName);
      const result = await customerService.getGroupDetails(groupName);
      console.log('📥 Group Details Result:', result);
      if (result.success && result.data) {
        setGroupNo(result.data.groupNo || '');
        setNoOfInstallment(result.data.noOfInstallment || '');
        console.log('✅ Group details loaded:', result.data);
        autoScrollToField('groupNo');
      } else {
        clearGroupDetails();
        if (result.message && result.message.includes('maximum customer limit')) {
          if (Platform.OS === 'web') {
            window.alert('⚠️ ' + result.message);
          } else {
            Alert.alert('⚠️ Group Full', result.message, [{ text: 'OK' }]);
          }
        } else {
          if (Platform.OS === 'web') {
            window.alert('❌ ' + (result.message || 'Failed to fetch group details.'));
          } else {
            Alert.alert('Error', result.message || 'Failed to fetch group details. Please try again.');
          }
        }
      }
    } catch (error) {
      console.log('❌ Error fetching group details:', error);
      clearGroupDetails();
      if (Platform.OS === 'web') {
        window.alert('❌ Failed to fetch group details. Please check your connection.');
      } else {
        Alert.alert('Error', 'Failed to fetch group details. Please check your connection.');
      }
    } finally {
      setFetchingGroupDetails(false);
    }
  };

  const fetchCustomerByMobile = async (mobile) => {
    if (!mobile || mobile.length !== 10) {
      clearCustomerFields();
      return;
    }
    setFetchingCustomer(true);
    try {
      console.log('📡 Checking BACKEND for customer...');
      const result = await customerService.getCustomerByMobile(mobile);
      if (result.success && result.data) {
        const customer = result.data;
        await saveCustomerToLocal(customer);
        populateCustomerFields(customer);
        console.log('✅ Customer found in BACKEND and saved locally');
        setFetchingCustomer(false);
        autoScrollToField('amount');
        return;
      }
      console.log('📡 Customer not in backend, checking LOCAL storage...');
      const stored = await AsyncStorage.getItem('customers');
      if (stored) {
        const customers = JSON.parse(stored);
        const customer = customers.find(c => c.mobileNumber === mobile);
        if (customer) {
          populateCustomerFields(customer);
          console.log('✅ Customer found in LOCAL storage');
          setFetchingCustomer(false);
          autoScrollToField('amount');
          return;
        }
      }
      clearCustomerFields();
      console.log('❌ Customer not found in BACKEND or LOCAL');
      setFetchingCustomer(false);
    } catch (error) {
      console.log('Error fetching customer:', error);
      try {
        console.log('📡 Backend failed, checking LOCAL storage as fallback...');
        const stored = await AsyncStorage.getItem('customers');
        if (stored) {
          const customers = JSON.parse(stored);
          const customer = customers.find(c => c.mobileNumber === mobile);
          if (customer) {
            populateCustomerFields(customer);
            console.log('✅ Customer found in LOCAL storage (backend failed)');
            setFetchingCustomer(false);
            autoScrollToField('amount');
            return;
          }
        }
      } catch (localError) {
        console.log('Local storage error:', localError);
      }
      clearCustomerFields();
      setFetchingCustomer(false);
    }
  };

  const handleMobileChange = (text) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    setMobileNo(cleaned);
    if (cleaned.length === 10) {
      fetchCustomerByMobile(cleaned);
    } else {
      clearCustomerFields();
    }
  };

  const fetchAmounts = async () => {
    setLoadingAmounts(true);
    try {
      const result = await customerService.getAmounts();
      console.log('📥 Amounts Result:', result);
      if (result.success && result.data && result.data.length > 0) {
        setAmountOptions(result.data);
        console.log('✅ Amounts loaded:', result.data);
      } else {
        const fallbackAmounts = ['500', '1000', '2000', '5000'];
        setAmountOptions(fallbackAmounts);
        console.log('⚠️ Using fallback amounts:', fallbackAmounts);
      }
    } catch (error) {
      console.log('❌ Error fetching amounts:', error);
      setAmountOptions(['500', '1000', '2000', '5000']);
    } finally {
      setLoadingAmounts(false);
    }
  };

  // ===== FETCH CANVAS TYPES FROM BACKEND =====
  const fetchCanvasTypes = async () => {
    setLoadingCanvasTypes(true);
    try {
      const result = await customerService.getCanvasTypes();
      console.log('📥 Canvas Types Result:', result);
      
      if (result.success && result.data && result.data.length > 0) {
        setCanvasTypes(result.data);
        console.log('✅ Canvas types loaded:', result.data);
      } else {
        // Keep static fallback
        console.log('⚠️ Using static canvas types as fallback');
        setCanvasTypes(['Type 1', 'Type 2']);
      }
    } catch (error) {
      console.log('❌ Error fetching canvas types:', error);
      // Keep static fallback on error
      setCanvasTypes(['Type 1', 'Type 2']);
    } finally {
      setLoadingCanvasTypes(false);
    }
  };

  const fetchGroups = async () => {
    if (!amount) {
      setGroupOptions([]);
      return;
    }
    setLoadingGroups(true);
    try {
      const result = await customerService.getGroups(amount);
      console.log('📥 Groups Result for amount', amount, ':', result);
      if (result.success && result.data && result.data.length > 0) {
        setGroupOptions(result.data);
        console.log('✅ Groups loaded:', result.data);
      } else {
        setGroupOptions([]);
        if (Platform.OS === 'web') {
          window.alert('No groups available for this amount.');
        } else {
          Alert.alert('No Groups', 'No groups available for this amount.');
        }
      }
    } catch (error) {
      console.log('❌ Error fetching groups:', error);
      setGroupOptions([]);
    } finally {
      setLoadingGroups(false);
    }
  };

  useEffect(() => {
    fetchAmounts();
    fetchCanvasTypes(); // ✅ Fetch canvas types on screen load
  }, []);

  useEffect(() => {
    if (amount) {
      fetchGroups();
      clearGroupName();
    } else {
      setGroupOptions([]);
      clearGroupName();
    }
  }, [amount]);

  const onWebDateChange = (e) => {
    const val = e.target.value;
    if (val) {
      const [year, month, day] = val.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      if (!isNaN(date)) {
        setMaturityDate(formatDate(date));
        setTempDate(date);
        setErrors(prev => ({ ...prev, maturityDate: '' }));
      }
    }
  };

  const renderAmountItem = ({ item }) => (
    <TouchableOpacity
      style={styles.dropdownItem}
      onPress={() => {
        setAmount(item);
        setAmountModalVisible(false);
        setErrors(prev => ({ ...prev, amount: '' }));
      }}
    >
      <Text style={styles.dropdownItemText}>₹ {item}</Text>
    </TouchableOpacity>
  );

  const renderGroupItem = ({ item }) => (
    <TouchableOpacity
      style={styles.dropdownItem}
      onPress={() => {
        setGroupName(item);
        setGroupModalVisible(false);
        setErrors(prev => ({ ...prev, groupName: '' }));
        fetchGroupDetails(item);
      }}
    >
      <Text style={styles.dropdownItemText}>{item}</Text>
    </TouchableOpacity>
  );

  const renderCanvasItem = ({ item }) => (
    <TouchableOpacity
      style={styles.dropdownItem}
      onPress={() => {
        setChitCanvasType(item);
        setCanvasModalVisible(false);
        setErrors(prev => ({ ...prev, chitCanvasType: '' }));
      }}
    >
      <Text style={styles.dropdownItemText}>{item}</Text>
    </TouchableOpacity>
  );

  const scrollToField = (fieldName) => {
    if (fieldName && fieldRefs[fieldName]?.current) {
      fieldRefs[fieldName].current.measureLayout(
        scrollViewRef.current,
        (x, y) => {
          scrollViewRef.current.scrollTo({ y: y - 100, animated: true });
        },
        () => { }
      );
    }
  };

  const validate = () => {
    let valid = true;
    let newErrors = {};
    let firstErrorField = null;

    if (!selectedBranch) {
      newErrors.branch = 'Branch is required';
      valid = false;
      if (!firstErrorField) firstErrorField = 'mobileNo';
    }
    if (!mobileNo || mobileNo.length !== 10) {
      newErrors.mobileNo = 'Enter a valid 10-digit mobile number';
      valid = false;
      if (!firstErrorField) firstErrorField = 'mobileNo';
    }
    if (!amount) {
      newErrors.amount = 'Please select an amount';
      valid = false;
      if (!firstErrorField) firstErrorField = 'amount';
    }
    if (!groupName.trim()) {
      newErrors.groupName = 'Group Name is required';
      valid = false;
      if (!firstErrorField) firstErrorField = 'groupName';
    }
    if (!groupNo.trim()) {
      newErrors.groupNo = 'Group No is required';
      valid = false;
      if (!firstErrorField) firstErrorField = 'groupNo';
    }
    if (!noOfInstallment || parseInt(noOfInstallment) <= 0) {
      newErrors.noOfInstallment = 'Enter a valid number of installments';
      valid = false;
      if (!firstErrorField) firstErrorField = 'noOfInstallment';
    }
    if (!cardNo.trim()) {
      newErrors.cardNo = 'Card No is required';
      valid = false;
      if (!firstErrorField) firstErrorField = 'cardNo';
    }
    if (!chitCanvasType) {
      newErrors.chitCanvasType = 'Please select a Chit Canvas Type';
      valid = false;
      if (!firstErrorField) firstErrorField = 'chitCanvasType';
    }
    if (!maturityDate) {
      newErrors.maturityDate = 'Please select a maturity date';
      valid = false;
      if (!firstErrorField) firstErrorField = 'maturityDate';
    }

    setErrors(newErrors);

    if (firstErrorField) {
      scrollToField(firstErrorField);
    }

    return valid;
  };

  const handleSave = async () => {
    if (validate()) {
      setSaving(true);

      const formData = {
        branch: selectedBranch,
        mobileNo: mobileNo,
        amount: parseFloat(amount),
        groupName: groupName,
        groupNo: groupNo,
        noOfInstallment: parseInt(noOfInstallment),
        cardNo: cardNo,
        chitCanvasType: chitCanvasType,
        maturityDate: maturityDate,
        customerName: customerName,
        address1: address1,
        address2: address2,
        pincode: pincode,
        area: area,
        city: city,
        mailId: mailId,
      };

      console.log('📤 Sending Chit Data:', formData);

      try {
        const result = await customerService.saveChit(formData);
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

  const clearForm = () => {
    setAmount('');
    setGroupName('');
    setGroupNo('');
    setNoOfInstallment('');
    setCardNo('');
    setChitCanvasType('');
    setMobileNo('');
    setMaturityDate('');
    setCustomerName('');
    setAddress1('');
    setAddress2('');
    setPincode('');
    setArea('');
    setCity('');
    setMailId('');
    setErrors({});
    setGroupOptions([]);
  };

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
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Text style={styles.backButtonText}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Customer Chit</Text>
            <View style={styles.headerSpacer} />
          </View>

          <View style={styles.goldLine} />

          <View style={styles.formContainer}>
            <View ref={fieldRefs.mobileNo} style={styles.fieldContainer} collapsable={false}>
              <Text style={styles.label}>Mobile Number <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={[styles.input, errors.mobileNo && styles.errorBorder]}
                placeholder="Enter 10-digit mobile number"
                placeholderTextColor="#B0A090"
                value={mobileNo}
                keyboardType="phone-pad"
                maxLength={10}
                onChangeText={(text) => {
                  handleMobileChange(text);
                  setErrors(prev => ({ ...prev, mobileNo: '' }));
                }}
              />
              {fetchingCustomer && <Text style={styles.fetchingText}>🔍 Searching for customer...</Text>}
              {errors.mobileNo && <Text style={styles.errorText}>{errors.mobileNo}</Text>}
              <Text style={styles.hintText}>Enter registered mobile to auto-fill customer details</Text>
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Customer Name</Text>
              <TextInput
                style={[styles.input, styles.readonlyField]}
                placeholder="Auto-filled from mobile"
                placeholderTextColor="#B0A090"
                value={customerName}
                editable={false}
              />
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Address 1</Text>
              <TextInput
                style={[styles.input, styles.readonlyField]}
                placeholder="Auto-filled from mobile"
                placeholderTextColor="#B0A090"
                value={address1}
                editable={false}
              />
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Address 2</Text>
              <TextInput
                style={[styles.input, styles.readonlyField]}
                placeholder="Auto-filled from mobile"
                placeholderTextColor="#B0A090"
                value={address2}
                editable={false}
              />
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Pincode</Text>
              <TextInput
                style={[styles.input, styles.readonlyField]}
                placeholder="Auto-filled from mobile"
                placeholderTextColor="#B0A090"
                value={pincode}
                editable={false}
              />
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Area</Text>
              <TextInput
                style={[styles.input, styles.readonlyField]}
                placeholder="Auto-filled from mobile"
                placeholderTextColor="#B0A090"
                value={area}
                editable={false}
              />
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.label}>City</Text>
              <TextInput
                style={[styles.input, styles.readonlyField]}
                placeholder="Auto-filled from mobile"
                placeholderTextColor="#B0A090"
                value={city}
                editable={false}
              />
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Mail id</Text>
              <TextInput
                style={[styles.input, styles.readonlyField]}
                placeholder="Auto-filled from mobile"
                placeholderTextColor="#B0A090"
                value={mailId}
                editable={false}
              />
            </View>

            <View ref={fieldRefs.amount} style={styles.fieldContainer} collapsable={false}>
              <Text style={styles.label}>Amount <Text style={styles.required}>*</Text></Text>
              <TouchableOpacity
                style={[styles.dropdown, errors.amount && styles.errorBorder]}
                onPress={() => {
                  if (amountOptions.length > 0) {
                    setAmountModalVisible(true);
                  } else {
                    if (Platform.OS === 'web') {
                      window.alert('No amounts available. Please try again later.');
                    } else {
                      Alert.alert('No Amounts', 'No amounts available. Please try again later.');
                    }
                  }
                }}
                disabled={loadingAmounts}
              >
                <Text style={amount ? styles.dropdownText : styles.placeholderText}>
                  {loadingAmounts ? 'Loading amounts...' : (amount ? `₹ ${amount}` : 'Select Amount')}                </Text>
                <Text style={styles.dropdownArrow}>▼</Text>
              </TouchableOpacity>
              {errors.amount && <Text style={styles.errorText}>{errors.amount}</Text>}
            </View>

            <View ref={fieldRefs.groupName} style={styles.fieldContainer} collapsable={false}>
              <Text style={styles.label}>Group Name <Text style={styles.required}>*</Text></Text>
              <TouchableOpacity
                style={[styles.dropdown, errors.groupName && styles.errorBorder]}
                onPress={() => {
                  if (!amount) {
                    if (Platform.OS === 'web') {
                      window.alert('Please select an amount first.');
                    } else {
                      Alert.alert('Select Amount First', 'Please select an amount first.');
                    }
                    return;
                  }
                  if (groupOptions.length > 0) {
                    setGroupModalVisible(true);
                  } else {
                    if (Platform.OS === 'web') {
                      window.alert('No groups available for this amount.');
                    } else {
                      Alert.alert('No Groups', 'No groups available for this amount.');
                    }
                  }
                }}
                disabled={loadingGroups || !amount}
              >
                <Text style={groupName ? styles.dropdownText : styles.placeholderText}>
                  {loadingGroups ? 'Loading groups...' : (groupName || 'Select Group')}
                </Text>
                <Text style={styles.dropdownArrow}>▼</Text>
              </TouchableOpacity>
              {errors.groupName && <Text style={styles.errorText}>{errors.groupName}</Text>}
            </View>

            <View ref={fieldRefs.groupNo} style={styles.fieldContainer} collapsable={false}>
              <Text style={styles.label}>Group No <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={[styles.input, styles.readonlyField, errors.groupNo && styles.errorBorder]}
                placeholder="Auto-filled from group selection"
                placeholderTextColor="#B0A090"
                value={groupNo}
                editable={false}
              />
              {fetchingGroupDetails && <Text style={styles.fetchingText}>⏳ Loading group details...</Text>}
              {errors.groupNo && <Text style={styles.errorText}>{errors.groupNo}</Text>}
            </View>

            <View ref={fieldRefs.noOfInstallment} style={styles.fieldContainer} collapsable={false}>
              <Text style={styles.label}>No of Installment <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={[styles.input, styles.readonlyField, errors.noOfInstallment && styles.errorBorder]}
                placeholder="Auto-filled from group selection"
                placeholderTextColor="#B0A090"
                value={noOfInstallment}
                editable={false}
              />
              {errors.noOfInstallment && <Text style={styles.errorText}>{errors.noOfInstallment}</Text>}
            </View>

            <View ref={fieldRefs.scanBarcode} style={styles.fieldContainer} collapsable={false}>
              <Text style={styles.label}>Scan Card Barcode</Text>
              <View style={styles.rowContainer}>
                <TouchableOpacity
                  style={styles.scanButton}
                  onPress={() => navigation.navigate('BarcodeScanner')}
                >
                  <Text style={styles.scanButtonIcon}>📷</Text>
                  <Text style={styles.scanButtonText}>Scan</Text>
                </TouchableOpacity>
                <Text style={styles.scanHint}>Tap to scan barcode</Text>
              </View>
            </View>

            <View ref={fieldRefs.cardNo} style={styles.fieldContainer} collapsable={false}>
              <Text style={styles.label}>Card No <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={[styles.input, errors.cardNo && styles.errorBorder]}
                placeholder="Enter card number"
                placeholderTextColor="#B0A090"
                value={cardNo}
                onChangeText={(text) => {
                  setCardNo(text);
                  setErrors(prev => ({ ...prev, cardNo: '' }));
                }}
              />
              {errors.cardNo && <Text style={styles.errorText}>{errors.cardNo}</Text>}
            </View>

           {/* 15. CHIT CANVAS TYPE - DYNAMIC WITH FALLBACK */}
<View ref={fieldRefs.chitCanvasType} style={styles.fieldContainer} collapsable={false}>
  <Text style={styles.label}>
    Chit Canvas Type <Text style={styles.required}>*</Text>
  </Text>
  <TouchableOpacity
    style={[styles.dropdown, errors.chitCanvasType && styles.errorBorder]}
    onPress={() => {
      if (canvasTypes.length > 0) {
        setCanvasModalVisible(true);
      } else {
        if (Platform.OS === 'web') {
          window.alert('No canvas types available. Please try again later.');
        } else {
          Alert.alert('No Canvas Types', 'No canvas types available. Please try again later.');
        }
      }
    }}
    disabled={loadingCanvasTypes}
  >
    <Text style={chitCanvasType ? styles.dropdownText : styles.placeholderText}>
      {loadingCanvasTypes ? 'Loading canvas types...' : (chitCanvasType || 'Select Canvas Type')}
    </Text>
    <Text style={styles.dropdownArrow}>▼</Text>
  </TouchableOpacity>
  {errors.chitCanvasType && <Text style={styles.errorText}>{errors.chitCanvasType}</Text>}
</View>
            <View ref={fieldRefs.maturityDate} style={styles.fieldContainer} collapsable={false}>
              <Text style={styles.label}>Maturity Date <Text style={styles.required}>*</Text></Text>
              {Platform.OS === 'web' ? (
                <input
                  type="date"
                  value={formatDateForInput(maturityDate)}
                  onChange={onWebDateChange}
                  min={new Date().toISOString().split('T')[0]}
                  style={{
                    width: '100%',
                    padding: '12px 15px',
                    fontSize: '15px',
                    borderRadius: '10px',
                    border: '1px solid rgba(212, 175, 55, 0.15)', backgroundColor: 'rgba(255, 255, 255, 0.8)',
                    color: '#1A1108',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              ) : (
                <TouchableOpacity
                  style={[styles.datePickerButton, errors.maturityDate && styles.errorBorder]}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text style={maturityDate ? styles.datePickerText : styles.placeholderText}>
                    {maturityDate || 'Select Maturity Date'}
                  </Text>
                  <Text style={styles.datePickerIcon}>📅</Text>
                </TouchableOpacity>
              )}
              {errors.maturityDate && <Text style={styles.errorText}>{errors.maturityDate}</Text>}
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={handleCancel}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.saveButton]} onPress={handleSave} disabled={saving}>
              {saving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.saveButtonText}>Save</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>

      <Modal
        transparent
        visible={amountModalVisible}
        animationType="fade"
        onRequestClose={() => setAmountModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setAmountModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Amount</Text>
            <FlatList
              data={amountOptions}
              keyExtractor={(item, index) => index.toString()}
              renderItem={renderAmountItem}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={<Text style={styles.emptyText}>No amounts available</Text>}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal
        transparent
        visible={groupModalVisible}
        animationType="fade"
        onRequestClose={() => setGroupModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setGroupModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Group</Text>
            <FlatList
              data={groupOptions}
              keyExtractor={(item, index) => index.toString()}
              renderItem={renderGroupItem}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={<Text style={styles.emptyText}>No groups available</Text>}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal
        transparent
        visible={canvasModalVisible}
        animationType="fade"
        onRequestClose={() => setCanvasModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setCanvasModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Canvas Type</Text>
            <FlatList
              data={canvasTypes}
              keyExtractor={(item, index) => index.toString()}
              renderItem={renderCanvasItem}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      {Platform.OS !== 'web' && showDatePicker && (
        <DateTimePicker
          value={tempDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedDate) => {
            if (Platform.OS === 'android') {
              setShowDatePicker(false);
            }
            if (selectedDate) {
              setMaturityDate(formatDate(selectedDate));
              setTempDate(selectedDate);
              setErrors(prev => ({ ...prev, maturityDate: '' }));
            }
          }}
          minimumDate={new Date()}
        />
      )}
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
  scrollView: { flex: 1 },
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
  backButton: { padding: 8 },
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
  headerSpacer: { width: 40 },
  goldLine: {
    width: 50,
    height: 2,
    backgroundColor: '#D4AF37',
    borderRadius: 1,
    marginBottom: 25,
    alignSelf: 'center',
  },
  formContainer: { width: '100%' },
  fieldContainer: { marginBottom: 18 },
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
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  scanButton: {
    backgroundColor: '#D4AF37',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    minWidth: 100,
  },
  scanButtonIcon: {
    fontSize: 20,
    color: '#FFFFFF',
  },
  scanButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  scanHint: {
    fontSize: 13,
    color: '#8A7A6A',
    fontStyle: 'italic',
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
  hintText: {
    fontSize: 11,
    color: '#8A7A6A',
    marginTop: 4,
    fontStyle: 'italic',
  },
  fetchingText: {
    fontSize: 12,
    color: '#D4AF37',
    marginTop: 4,
    marginLeft: 4,
    fontWeight: '500',
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
  emptyText: {
    fontSize: 16,
    color: '#8A7A6A',
    textAlign: 'center',
    paddingVertical: 20,
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

export default CustomerChitScreen;