import api from './api';

export const customerService = {
  // ✅ Quick Entry
  quickEntry: async (data) => {
    try {
      const response = await api.post('/customer/customerdet', data);
      return {
        success: true,
        data: response.data,
        message: 'Customer details saved successfully!',
      };
    } catch (error) {
      console.log('Quick Entry error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to save customer details.',
      };
    }
  },


  // ✅ Registration
  registration: async (data) => {
    try {
      const response = await api.post('/customer/customerreg', data);
      return {
        success: true,
        data: response.data,
        message: 'Customer registered successfully!',
      };
    } catch (error) {
      console.log('Registration error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to register customer.',
      };
    }
  },

  // ✅ Check Mobile Number
  checkMobile: async (mobile) => {
    try {
      const response = await api.get(`/customer/check-mobile/${mobile}`);
      return response.data;
    } catch (error) {
      console.log('Check Mobile error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to check mobile number.',
      };
    }
  },

  // ✅ Get Customer by Mobile
  getCustomerByMobile: async (mobile) => {
    try {
      const response = await api.get(`/chitcustomerreg/check-mobile/${mobile}`);
      console.log('📥 Customer response:', response.data);

      if (Array.isArray(response.data) && response.data.length > 0) {
        const customer = response.data[0];
        return {
          success: true,
          data: {
            customerName: customer.CUSNAME || '',
            mobileNumber: customer.CUSMOBI || mobile,
            cusadd1: customer.CUSADD1 || '',
            cusadd2: customer.CUSADD2 || '',
            cusadd3: customer.CUSADD3 || '',
            cuscity: customer.CUSCITY || '',
            postalCode: customer.CUSPINCODE ? customer.CUSPINCODE.toString() : '',
            cusemail: customer.CUSEMAIL || '',
          },
        };
      }

      return {
        success: false,
        message: 'Customer not found. Please register first.',
      };
    } catch (error) {
      console.log('❌ Get customer by mobile error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch customer details. Please check your connection.',
      };
    }
  },

  // ✅ Save Chit Details
  saveChit: async (data) => {
    try {
      const response = await api.post('/customer/chit', data);
      return {
        success: true,
        data: response.data,
        message: 'Chit details saved successfully!',
      };
    } catch (error) {
      console.log('Save Chit error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to save chit details. Please try again.',
      };
    }
  },

  // ✅ Fetch Amount List
  getAmounts: async () => {
    try {
      const response = await api.get('/chitcustomerreg/chitinsamnt/');
      console.log('✅ Amounts response:', response.data);

      if (response.data && response.data.success === false) {
        return {
          success: false,
          message: response.data.message || 'Failed to fetch amounts.',
        };
      }

      if (response.data && response.data.success && response.data.branches) {
        const amounts = response.data.branches.map(item => String(item.GRPINSA));
        return {
          success: true,
          data: amounts,
        };
      }

      return {
        success: false,
        message: 'Invalid response format from server.',
      };
    } catch (error) {
      console.log('❌ Get amounts error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch amounts. Please check your connection.',
      };
    }
  },

  // ✅ Fetch Group Names by Amount
  getGroups: async (amount) => {
    try {
      // ✅ Endpoint requires amount parameter
      const response = await api.get(`/chitcustomerreg/chitgroup/${amount}`);
      console.log('✅ Groups response for amount', amount, ':', response.data);

      if (response.data && response.data.success === false) {
        return {
          success: false,
          message: response.data.message || 'Failed to fetch groups.',
        };
      }

      if (response.data && response.data.success && response.data.branches) {
        const groupNames = response.data.branches.map(item => item.GRPNAME);
        return {
          success: true,
          data: groupNames,
        };
      }

      return {
        success: false,
        message: 'Invalid response format from server.',
      };
    } catch (error) {
      console.log('❌ Get groups error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch groups. Please check your connection.',
      };
    }
  },

  // ✅ Fetch Group Details by Group Name
  getGroupDetails: async (groupName) => {
    try {
      const response = await api.get(`/chitcustomerreg/getgrpname/${groupName}`);
      console.log('📥 Group Details response:', response.data);

      // ✅ Handle backend error response
      if (response.data && response.data.success === false) {
        console.log('❌ Backend error:', response.data.message);

        if (response.data.message && response.data.message.includes('Maximum customer limit reached')) {
          return {
            success: false,
            message: `The group "${groupName}" has reached its maximum customer limit. Please select a different group.`,
          };
        }

        return {
          success: false,
          message: response.data.message || 'Failed to fetch group details.',
        };
      }

      // ✅ FORMAT: Object with success, groupNo, installment (KMUSWDC1 format)
      if (response.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
        if (response.data.groupNo !== undefined && response.data.installment !== undefined) {
          console.log('✅ Object format found:', response.data);
          return {
            success: true,
            data: {
              groupNo: String(response.data.groupNo || ''),
              noOfInstallment: String(response.data.installment || ''),
            },
          };
        }
      }

      // ✅ Array format fallback
      if (Array.isArray(response.data) && response.data.length > 0) {
        const details = response.data[0];
        if (details.CCGRPNO !== undefined && details.GRPINST !== undefined) {
          return {
            success: true,
            data: {
              groupNo: String(details.CCGRPNO || ''),
              noOfInstallment: String(details.GRPINST || ''),
            },
          };
        }
      }

      return {
        success: false,
        message: `Invalid data format for group "${groupName}". Please try another group.`,
      };
    } catch (error) {
      console.log('❌ Get group details error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch group details. Please check your connection.',
      };
    }
  },

  // ✅ Fetch Branches
  getBranches: async () => {
    try {
      const response = await api.get('/getbranch/branch');
      console.log('✅ Branches response:', response.data);

      if (response.data && response.data.success === false) {
        return {
          success: false,
          message: response.data.message || 'Failed to fetch branches.',
        };
      }

      if (response.data && response.data.success && response.data.branches) {
        const branchNames = response.data.branches.map(item => item.branname);
        return {
          success: true,
          data: branchNames,
        };
      }

      return {
        success: false,
        message: 'Invalid response format from server.',
      };
    } catch (error) {
      console.log('❌ Get branches error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch branches. Please check your connection.',
      };
    }
  },

  // ✅ Fetch Canvas Types from Backend
getCanvasTypes: async () => {
  try {
    const response = await api.get('/chitcustomerreg/canvastypes');
    console.log('✅ Canvas Types response:', response.data);
    
    if (response.data && response.data.success && response.data.canvasTypes) {
      return {
        success: true,
        data: response.data.canvasTypes,
      };
    }
    
    // If response format is different, try to extract
    if (Array.isArray(response.data)) {
      return {
        success: true,
        data: response.data,
      };
    }
    
    return {
      success: false,
      message: 'Invalid response format from server.',
    };
  } catch (error) {
    console.log('❌ Get canvas types error:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to fetch canvas types.',
    };
  }
},

  // ✅ Get All Customers
  getAllCustomers: async () => {
    try {
      const response = await api.get('/customer/all');
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch customers.',
      };
    }
  },
};