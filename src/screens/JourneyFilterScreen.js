import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
  Modal,
  FlatList,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { customerService } from '../services/customer';
import DateTimePicker from '@react-native-community/datetimepicker';

const { width, height } = Dimensions.get('window');

// ✅ FALLBACK BRANCHES - Generic names (only if backend fails)
const FALLBACK_BRANCHES = [
  { id: '1', name: 'Branch 1' },
  { id: '2', name: 'Branch 2' },
  { id: '3', name: 'Branch 3' },
  { id: '4', name: 'Branch 4' },
  { id: '5', name: 'Branch 5' },
];

const JourneyFilterScreen = ({ navigation }) => {
  const { user } = useAuth();
  
  // State for dropdowns
  const [employees, setEmployees] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [loadingBranches, setLoadingBranches] = useState(false);
  
  // Selected values
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  
  // Dropdown visibility
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);
  const [showBranchDropdown, setShowBranchDropdown] = useState(false);
  
  // Date picker visibility (Mobile only)
  const [showFromDatePicker, setShowFromDatePicker] = useState(false);
  const [showToDatePicker, setShowToDatePicker] = useState(false);
  
  // Loading state for view button
  const [loadingView, setLoadingView] = useState(false);

  // ✅ Fetch branches on mount only
  useEffect(() => {
    console.log('📱 Component mounted, fetching branches...');
    fetchBranches();
  }, []);

  // ✅ Fetch employees when branch AND both dates are selected
  useEffect(() => {
    console.log('🔄 useEffect triggered - Checking filters:');
    console.log(`  selectedBranch: ${selectedBranch ? selectedBranch.name : 'null'}`);
    console.log(`  fromDate: ${fromDate ? formatDateDisplay(fromDate) : 'null'}`);
    console.log(`  toDate: ${toDate ? formatDateDisplay(toDate) : 'null'}`);
    
    if (selectedBranch && fromDate && toDate) {
      console.log('✅ All filters selected, fetching employees...');
      fetchEmployees();
    } else {
      console.log('⚠️ Some filters missing, clearing employees');
      setEmployees([]);
      setSelectedEmployee(null);
    }
  }, [selectedBranch, fromDate, toDate]);

  // ✅ Fetch Employees from backend - WITH EMPCODE 666 FALLBACK
  const fetchEmployees = async () => {
    try {
      setLoadingEmployees(true);
      
      const branch = selectedBranch.id || selectedBranch;
      const from = formatDateForAPI(fromDate);
      const to = formatDateForAPI(toDate);
      
      console.log('📤 Calling getFilterEmployees with:');
      console.log(`  Branch: ${branch}`);
      console.log(`  From: ${from}`);
      console.log(`  To: ${to}`);
      
      const result = await customerService.getFilterEmployees(branch, from, to);
      console.log('📥 Filter Employees result:', JSON.stringify(result, null, 2));
      
      let employeeList = [];
      
      if (result.success && result.data && result.data.length > 0) {
        employeeList = result.data.map(emp => ({
          ...emp,
          ecNo: emp.ecNo || emp.id || '',
          id: emp.id || emp.ecNo || '',
        }));
        console.log(`✅ Loaded ${employeeList.length} employees from backend`);
        console.log('📋 Backend employees:', employeeList.map(e => `${e.ecNo} - ${e.name}`).join(', '));
      } else {
        console.log('⚠️ No employees from backend');
      }
      
      // ✅ ALWAYS ADD EMPCODE 666 AS FALLBACK
      const hasEmp666 = employeeList.some(emp => emp.ecNo === '666');
      if (!hasEmp666) {
        employeeList.push({
          id: '666',
          ecNo: '666',
          name: 'IT',
          crmDate: null,
        });
        console.log('✅ Added empcode 666 to employee list (fallback)');
      }
      
      if (employeeList.length === 0) {
        employeeList.push({
          id: '666',
          ecNo: '666',
          name: 'IT',
          crmDate: null,
        });
        console.log('✅ Using fallback employee: 666 - IT');
      }
      
      setEmployees(employeeList);
      console.log('📋 Final employee list:', employeeList.map(e => `${e.ecNo} - ${e.name}`).join(', '));
      
    } catch (error) {
      console.log('❌ Error fetching employees:', error);
      setEmployees([
        { id: '666', ecNo: '666', name: 'IT', crmDate: null },
      ]);
    } finally {
      setLoadingEmployees(false);
    }
  };

  // ✅ Fetch Branches from backend
  const fetchBranches = async () => {
    try {
      setLoadingBranches(true);
      console.log('📤 Fetching filter branches...');
      
      const result = await customerService.getFilterBranches();
      console.log('📥 Filter Branches result:', JSON.stringify(result, null, 2));
      
      if (result.success && result.data && result.data.length > 0) {
        setBranches(result.data);
        console.log(`✅ Loaded ${result.data.length} branches from backend`);
      } else {
        console.log('⚠️ No branches from backend, using fallback');
        setBranches(FALLBACK_BRANCHES);
      }
    } catch (error) {
      console.log('❌ Error fetching branches:', error);
      setBranches(FALLBACK_BRANCHES);
    } finally {
      setLoadingBranches(false);
    }
  };

  // ✅ Format date to DD-MM-YYYY (for display)
  const formatDateDisplay = (date) => {
    if (!date) return '';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  // ✅ Format date to YYYY-MM-DD (for API)
  const formatDateForAPI = (date) => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // ✅ Handle View Journey History
  const handleViewJourney = () => {
    if (!selectedBranch) {
      Alert.alert('Validation', 'Please select a branch');
      return;
    }
    
    if (!selectedEmployee) {
      Alert.alert('Validation', 'Please select an employee');
      return;
    }
    
    if (!fromDate) {
      Alert.alert('Validation', 'Please select From Date');
      return;
    }
    
    if (!toDate) {
      Alert.alert('Validation', 'Please select To Date');
      return;
    }
    
    if (fromDate > toDate) {
      Alert.alert('Validation', 'From Date cannot be after To Date');
      return;
    }
    
    setLoadingView(true);
    
    try {
      const empcode = selectedEmployee.ecNo || selectedEmployee.id;
      const branch = selectedBranch.id || selectedBranch;
      
      const filters = {
        empcode: empcode,
        branch: branch,
        fromDate: formatDateForAPI(fromDate),
        toDate: formatDateForAPI(toDate),
        employeeName: selectedEmployee.name,
        branchName: selectedBranch.name || selectedBranch,
        fromDateDisplay: formatDateDisplay(fromDate),
        toDateDisplay: formatDateDisplay(toDate),
      };
      
      console.log('📤 Navigating with filters:', filters);
      
      navigation.navigate('JourneyHistory', { filters });
    } catch (error) {
      console.log('❌ Error navigating:', error);
      Alert.alert('Error', 'Failed to load journey history');
    } finally {
      setLoadingView(false);
    }
  };

  // ✅ Render Date Picker - FIXED FOR WEB
  const renderDatePicker = (label, date, setDate, showPicker, setShowPicker) => {
    // ✅ Web: Use HTML input
    if (Platform.OS === 'web') {
      const dateValue = date ? formatDateForAPI(date) : '';
      return (
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>{label}</Text>
          <input
            type="date"
            value={dateValue}
            onChange={(e) => {
              const val = e.target.value;
              if (val) {
                const [year, month, day] = val.split('-');
                const newDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                if (!isNaN(newDate)) {
                  setDate(newDate);
                }
              } else {
                setDate(null);
              }
            }}
            style={{
              width: '100%',
              padding: '12px 15px',
              fontSize: '15px',
              borderRadius: '10px',
              border: '1px solid rgba(212, 175, 55, 0.15)',
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
              color: '#1A1108',
              outline: 'none',
              boxSizing: 'border-box',
              fontFamily: 'inherit',
            }}
          />
        </View>
      );
    }

    // ✅ Mobile: Use React Native DateTimePicker
    return (
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>{label}</Text>
        <TouchableOpacity
          style={styles.datePickerButton}
          onPress={() => setShowPicker(true)}
        >
          <Text style={date ? styles.datePickerText : styles.placeholderText}>
            {date ? formatDateDisplay(date) : 'Select Date'}
          </Text>
          <Text style={styles.datePickerIcon}>📅</Text>
        </TouchableOpacity>
        
        {showPicker && (
          <DateTimePicker
            value={date || new Date()}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(event, selectedDate) => {
              setShowPicker(false);
              if (selectedDate) {
                setDate(selectedDate);
              }
            }}
          />
        )}
      </View>
    );
  };

  // ✅ Render Employee Dropdown
  const renderEmployeeDropdown = () => {
    if (loadingEmployees) {
      return (
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>👤 Select Employee</Text>
          <View style={styles.dropdown}>
            <ActivityIndicator size="small" color="#D4AF37" />
            <Text style={styles.placeholderText}>Loading employees...</Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>👤 Select Employee</Text>
        <TouchableOpacity
          style={styles.dropdown}
          onPress={() => setShowEmployeeDropdown(true)}
        >
          <Text style={selectedEmployee ? styles.dropdownText : styles.placeholderText}>
            {selectedEmployee 
              ? `${selectedEmployee.ecNo || selectedEmployee.id} - ${selectedEmployee.name}` 
              : employees.length > 0 
                ? 'Select Employee' 
                : 'No employees available'}
          </Text>
          <Text style={styles.dropdownArrow}>▼</Text>
        </TouchableOpacity>
        
        <Modal
          visible={showEmployeeDropdown}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowEmployeeDropdown(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowEmployeeDropdown(false)}
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select Employee</Text>
              {employees.length === 0 ? (
                <Text style={styles.emptyText}>
                  {loadingEmployees ? 'Loading...' : 'No employees available'}
                </Text>
              ) : (
                <FlatList
                  data={employees}
                  keyExtractor={(item, index) => String(item.ecNo || item.id || index)}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[
                        styles.dropdownItem,
                        selectedEmployee?.ecNo === item.ecNo && styles.selectedItem,
                      ]}
                      onPress={() => {
                        console.log('✅ Selected employee:', item);
                        setSelectedEmployee(item);
                        setShowEmployeeDropdown(false);
                      }}
                    >
                      <Text style={styles.dropdownItemText}>
                        {item.ecNo || item.id} - {item.name}
                      </Text>
                    </TouchableOpacity>
                  )}
                />
              )}
            </View>
          </TouchableOpacity>
        </Modal>
      </View>
    );
  };

  // ✅ Render Branch Dropdown
  const renderBranchDropdown = () => {
    if (loadingBranches) {
      return (
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>🏢 Select Branch</Text>
          <View style={styles.dropdown}>
            <ActivityIndicator size="small" color="#D4AF37" />
            <Text style={styles.placeholderText}>Loading branches...</Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>🏢 Select Branch</Text>
        <TouchableOpacity
          style={styles.dropdown}
          onPress={() => setShowBranchDropdown(true)}
        >
          <Text style={selectedBranch ? styles.dropdownText : styles.placeholderText}>
            {selectedBranch ? selectedBranch.name : 'Select Branch'}
          </Text>
          <Text style={styles.dropdownArrow}>▼</Text>
        </TouchableOpacity>
        
        <Modal
          visible={showBranchDropdown}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowBranchDropdown(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowBranchDropdown(false)}
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select Branch</Text>
              {branches.length === 0 ? (
                <Text style={styles.emptyText}>No branches available</Text>
              ) : (
                <FlatList
                  data={branches}
                  keyExtractor={(item, index) => String(item.id || index)}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[
                        styles.dropdownItem,
                        selectedBranch?.id === item.id && styles.selectedItem,
                      ]}
                      onPress={() => {
                        setSelectedBranch(item);
                        setShowBranchDropdown(false);
                      }}
                    >
                      <Text style={styles.dropdownItemText}>{item.name}</Text>
                    </TouchableOpacity>
                  )}
                />
              )}
            </View>
          </TouchableOpacity>
        </Modal>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView 
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
          <Text style={styles.headerTitle}>📍 Journey History Filter</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.goldLine} />

        <View style={styles.infoCard}>
          <Text style={styles.infoIcon}>ℹ️</Text>
          <Text style={styles.infoText}>
            Select branch, date range, then employee to view journey history
          </Text>
        </View>

        {renderBranchDropdown()}
        {renderDatePicker('📅 From Date', fromDate, setFromDate, showFromDatePicker, setShowFromDatePicker)}
        {renderDatePicker('📅 To Date', toDate, setToDate, showToDatePicker, setShowToDatePicker)}
        {renderEmployeeDropdown()}

        <TouchableOpacity
          style={[
            styles.viewButton,
            (!selectedBranch || !selectedEmployee || !fromDate || !toDate) && 
            styles.viewButtonDisabled
          ]}
          onPress={handleViewJourney}
          disabled={!selectedBranch || !selectedEmployee || !fromDate || !toDate || loadingView}
        >
          {loadingView ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.viewButtonText}>🔍 View Journey History</Text>
          )}
        </TouchableOpacity>

        {(selectedBranch || selectedEmployee || fromDate || toDate) && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => {
              setSelectedBranch(null);
              setSelectedEmployee(null);
              setFromDate(null);
              setToDate(null);
              setEmployees([]);
            }}
          >
            <Text style={styles.clearButtonText}>🔄 Clear All Filters</Text>
          </TouchableOpacity>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {branches.length} branches • {employees.length} employees
          </Text>
        </View>
      </ScrollView>
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
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.15)',
    marginBottom: 20,
  },
  infoIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#4A3A2A',
    lineHeight: 18,
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0EAE0',
  },
  selectedItem: {
    backgroundColor: '#D4AF37',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#1A1108',
    flex: 1,
  },
  emptyText: {
    fontSize: 16,
    color: '#8A7A6A',
    textAlign: 'center',
    paddingVertical: 20,
  },
  viewButton: {
    backgroundColor: '#D4AF37',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 12,
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  viewButtonDisabled: {
    backgroundColor: '#B0A090',
    shadowOpacity: 0,
    elevation: 0,
  },
  viewButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  clearButton: {
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  clearButtonText: {
    fontSize: 14,
    color: '#D4AF37',
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  footer: {
    alignItems: 'center',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(212, 175, 55, 0.15)',
    marginTop: 10,
  },
  footerText: {
    fontSize: 12,
    color: '#8A7A6A',
  },
});

export default JourneyFilterScreen;