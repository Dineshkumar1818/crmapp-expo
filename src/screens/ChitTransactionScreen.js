import React, { useState } from 'react';
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
import { useAuth } from '../context/AuthContext';

const ChitTransactionScreen = ({ navigation }) => {
  // ===== GET BRANCH FROM AUTH =====
  const { selectedBranch } = useAuth();

  // ===== STATE =====
  const [receiptNo, setReceiptNo] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [cardNo, setCardNo] = useState('');
  const [groupName, setGroupName] = useState('');
  const [groupNo, setGroupNo] = useState('');
  const [cashType, setCashType] = useState('');
  const [goldRate, setGoldRate] = useState('');
  const [silverRate, setSilverRate] = useState('');

  // ===== DROPDOWN STATE =====
  const [groupModalVisible, setGroupModalVisible] = useState(false);
  const [cashTypeModalVisible, setCashTypeModalVisible] = useState(false);

  // ===== STATIC DATA =====
  const groupOptions = ['Group 1', 'Group 2', 'Group 3', 'Group 4', 'Group 5'];
  const cashTypeOptions = ['Cash', 'Cheque', 'Online Transfer', 'Card'];

  // ===== LOADING STATE =====
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  // ===== DATE HELPER =====
  const formatDate = (date) => {
    if (!date || !(date instanceof Date) || isNaN(date)) {
      return '';
    }
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatDateForInput = (date) => {
    if (!date || !(date instanceof Date) || isNaN(date)) {
      return '';
    }
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // ===== WEB DATE HANDLER =====
  const onWebDateChange = (e) => {
    const val = e.target.value;
    if (val) {
      const [year, month, day] = val.split('-');
      const selectedDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      if (!isNaN(selectedDate)) {
        setDate(selectedDate);
        setErrors(prev => ({ ...prev, date: '' }));
      }
    }
  };

  // ===== MOBILE DATE HANDLER =====
  const onDateChange = (selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
      setErrors(prev => ({ ...prev, date: '' }));
    }
  };

  // ===== VALIDATION =====
  const validate = () => {
    let valid = true;
    let newErrors = {};

    if (!receiptNo.trim()) {
      newErrors.receiptNo = 'Receipt No is required';
      valid = false;
    }
    if (!date) {
      newErrors.date = 'Date is required';
      valid = false;
    }
    if (!cardNo.trim()) {
      newErrors.cardNo = 'Card No is required';
      valid = false;
    }
    if (!groupName.trim()) {
      newErrors.groupName = 'Group Name is required';
      valid = false;
    }
    if (!groupNo.trim()) {
      newErrors.groupNo = 'Group No is required';
      valid = false;
    }
    if (!cashType.trim()) {
      newErrors.cashType = 'Cash Type is required';
      valid = false;
    }
    if (!goldRate.trim()) {
      newErrors.goldRate = 'Gold Rate is required';
      valid = false;
    }
    if (!silverRate.trim()) {
      newErrors.silverRate = 'Silver Rate is required';
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
        receiptNo,
        date: formatDate(date),
        cardNo,
        groupName,
        groupNo,
        cashType,
        goldRate: parseFloat(goldRate),
        silverRate: parseFloat(silverRate),
      };

      console.log('📤 Chit Transaction Data:', formData);

      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        setSaving(false);
        
        if (Platform.OS === 'web') {
          window.alert('✅ Chit transaction saved successfully!');
          clearForm();
          navigation.goBack();
        } else {
          Alert.alert('✅ Success', 'Chit transaction saved successfully!', [
            {
              text: 'OK',
              onPress: () => {
                clearForm();
                navigation.goBack();
              },
            },
          ]);
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
    setReceiptNo('');
    setDate(new Date());
    setCardNo('');
    setGroupName('');
    setGroupNo('');
    setCashType('');
    setGoldRate('');
    setSilverRate('');
    setErrors({});
  };

  // ===== RENDER GROUP DROPDOWN =====
  const renderGroupItem = ({ item }) => (
    <TouchableOpacity
      style={styles.dropdownItem}
      onPress={() => {
        setGroupName(item);
        setGroupModalVisible(false);
        setErrors(prev => ({ ...prev, groupName: '' }));
      }}
    >
      <Text style={styles.dropdownItemText}>{item}</Text>
    </TouchableOpacity>
  );

  // ===== RENDER CASH TYPE DROPDOWN =====
  const renderCashTypeItem = ({ item }) => (
    <TouchableOpacity
      style={styles.dropdownItem}
      onPress={() => {
        setCashType(item);
        setCashTypeModalVisible(false);
        setErrors(prev => ({ ...prev, cashType: '' }));
      }}
    >
      <Text style={styles.dropdownItemText}>{item}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.scrollContainer}>
        <ScrollView 
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
            <Text style={styles.headerTitle}>Chit Transaction</Text>
            <View style={styles.headerSpacer} />
          </View>

          <View style={styles.goldLine} />

          {/* ===== FORM ===== */}
          <View style={styles.formContainer}>

            {/* 1. RECEIPT NO */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Receipt No <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={[styles.input, errors.receiptNo && styles.errorBorder]}
                placeholder="Enter receipt number"
                placeholderTextColor="#B0A090"
                value={receiptNo}
                onChangeText={(text) => {
                  setReceiptNo(text);
                  setErrors(prev => ({ ...prev, receiptNo: '' }));
                }}
              />
              {errors.receiptNo && <Text style={styles.errorText}>{errors.receiptNo}</Text>}
            </View>

            {/* 2. DATE */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Date <Text style={styles.required}>*</Text></Text>
              {Platform.OS === 'web' ? (
                <input
                  type="date"
                  value={formatDateForInput(date)}
                  onChange={onWebDateChange}
                  style={{
                    width: '100%',
                    padding: '12px 15px',
                    fontSize: '15px',
                    borderRadius: '10px',
                    border: `1px solid ${errors.date ? '#DC3545' : 'rgba(212, 175, 55, 0.15)'}`,
                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                    color: '#1A1108',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              ) : (
                <TouchableOpacity
                  style={[styles.datePickerButton, errors.date && styles.errorBorder]}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text style={date ? styles.datePickerText : styles.placeholderText}>
                    {date ? formatDate(date) : 'Select Date'}
                  </Text>
                  <Text style={styles.datePickerIcon}>📅</Text>
                </TouchableOpacity>
              )}
              {errors.date && <Text style={styles.errorText}>{errors.date}</Text>}
            </View>

            {/* 3. CARD NO */}
            <View style={styles.fieldContainer}>
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

            {/* 4. GROUP NAME - DROPDOWN */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Group Name <Text style={styles.required}>*</Text></Text>
              <TouchableOpacity
                style={[styles.dropdown, errors.groupName && styles.errorBorder]}
                onPress={() => setGroupModalVisible(true)}
              >
                <Text style={groupName ? styles.dropdownText : styles.placeholderText}>
                  {groupName || 'Select Group'}
                </Text>
                <Text style={styles.dropdownArrow}>▼</Text>
              </TouchableOpacity>
              {errors.groupName && <Text style={styles.errorText}>{errors.groupName}</Text>}
            </View>

            {/* 5. GROUP NO */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Group No <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={[styles.input, errors.groupNo && styles.errorBorder]}
                placeholder="Enter group number"
                placeholderTextColor="#B0A090"
                value={groupNo}
                onChangeText={(text) => {
                  setGroupNo(text);
                  setErrors(prev => ({ ...prev, groupNo: '' }));
                }}
              />
              {errors.groupNo && <Text style={styles.errorText}>{errors.groupNo}</Text>}
            </View>

            {/* 6. CASH TYPE - DROPDOWN */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Cash Type <Text style={styles.required}>*</Text></Text>
              <TouchableOpacity
                style={[styles.dropdown, errors.cashType && styles.errorBorder]}
                onPress={() => setCashTypeModalVisible(true)}
              >
                <Text style={cashType ? styles.dropdownText : styles.placeholderText}>
                  {cashType || 'Select Cash Type'}
                </Text>
                <Text style={styles.dropdownArrow}>▼</Text>
              </TouchableOpacity>
              {errors.cashType && <Text style={styles.errorText}>{errors.cashType}</Text>}
            </View>

            {/* 7. GOLD RATE */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Gold Rate <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={[styles.input, errors.goldRate && styles.errorBorder]}
                placeholder="Enter gold rate"
                placeholderTextColor="#B0A090"
                value={goldRate}
                onChangeText={(text) => {
                  const cleaned = text.replace(/[^0-9.]/g, '');
                  setGoldRate(cleaned);
                  setErrors(prev => ({ ...prev, goldRate: '' }));
                }}
                keyboardType="numeric"
              />
              {errors.goldRate && <Text style={styles.errorText}>{errors.goldRate}</Text>}
            </View>

            {/* 8. SILVER RATE */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Silver Rate <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={[styles.input, errors.silverRate && styles.errorBorder]}
                placeholder="Enter silver rate"
                placeholderTextColor="#B0A090"
                value={silverRate}
                onChangeText={(text) => {
                  const cleaned = text.replace(/[^0-9.]/g, '');
                  setSilverRate(cleaned);
                  setErrors(prev => ({ ...prev, silverRate: '' }));
                }}
                keyboardType="numeric"
              />
              {errors.silverRate && <Text style={styles.errorText}>{errors.silverRate}</Text>}
            </View>

          </View>

          {/* ===== BUTTONS ===== */}
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

      {/* ===== GROUP DROPDOWN MODAL ===== */}
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
              ListEmptyComponent={
                <Text style={styles.emptyText}>No groups available</Text>
              }
            />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ===== CASH TYPE DROPDOWN MODAL ===== */}
      <Modal
        transparent
        visible={cashTypeModalVisible}
        animationType="fade"
        onRequestClose={() => setCashTypeModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setCashTypeModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Cash Type</Text>
            <FlatList
              data={cashTypeOptions}
              keyExtractor={(item, index) => index.toString()}
              renderItem={renderCashTypeItem}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <Text style={styles.emptyText}>No cash types available</Text>
              }
            />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ===== DATE PICKER (Mobile Only) ===== */}
      {Platform.OS !== 'web' && showDatePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedDate) => {
            if (Platform.OS === 'android') {
              setShowDatePicker(false);
            }
            if (selectedDate) {
              setDate(selectedDate);
              setErrors(prev => ({ ...prev, date: '' }));
            }
          }}
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

  // ===== DROPDOWN =====
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

  // ===== DATE PICKER =====
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
  emptyText: {
    fontSize: 16,
    color: '#8A7A6A',
    textAlign: 'center',
    paddingVertical: 20,
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

export default ChitTransactionScreen;