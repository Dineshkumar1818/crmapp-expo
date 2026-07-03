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
  // ✅ Registration
registration: async (data) => {
  try {
    console.log('📤 Sending registration data to backend:', JSON.stringify(data, null, 2));
    
    const response = await api.post('/customer/customerreg', data);
    console.log('📥 Registration response:', response.data);
    
    // ✅ Return success: true when backend responds
    return {
      success: true,
      data: response.data,
      message: response.data.message || 'Customer registered successfully!',
    };
  } catch (error) {
    console.log('❌ Registration error:', error);
    console.log('❌ Error response:', error.response?.data);
    
    // ✅ Return success: false when backend fails
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to register customer. Please try again.',
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
    const response = await api.post('/chitcustomerreg/chitnewcusreg', data);
    console.log('✅ Save Chit response:', response.data);
    return {
      success: true,
      data: response.data,
      message: response.data.message || 'Chit details saved successfully!',
    };
  } catch (error) {
    console.log('❌ Save Chit error:', error);
    console.log('❌ Error response status:', error.response?.status);
    console.log('❌ Error response data:', JSON.stringify(error.response?.data, null, 2));
    console.log('❌ Error response headers:', error.response?.headers);
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

    // ✅ Check if response is successful
    if (response.data && response.data.success === false) {
      console.log('❌ Backend error:', response.data.message);
      return {
        success: false,
        message: response.data.message || 'Failed to fetch group details.',
      };
    }

    // ✅ If response is a direct object with groupNo, installment, maturedt
    if (response.data && typeof response.data === 'object') {
      console.log('✅ Group details received:', response.data);
      return {
        success: true,
        data: {
          groupNo: String(response.data.groupNo || ''),
          installment: String(response.data.installment || ''),
          maturedt: response.data.maturedt || '',
        },
      };
    }

    return {
      success: false,
      message: 'Invalid response format from server.',
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
    const response = await api.get('/chitcustomerreg/chitcantype');
    console.log('✅ Canvas Types response:', response.data);
    
    // ✅ Check if response is successful and has canvasType array
    if (response.data && response.data.success === true && Array.isArray(response.data.canvastype)) {
      const canvasData = response.data.canvastype
        .map((item, index) => ({
          id: String(item.CCANTPYECODE || index + 1),
          name: item.CCANTPYENAME || item.name || '',
        }))
        .filter(item => item.name !== '');
      
      console.log('✅ Canvas types extracted with IDs:', canvasData);
      
      if (canvasData.length > 0) {
        return {
          success: true,
          data: canvasData,
        };
      }
    }
    
    // ✅ Check for branches array format (alternative)
    if (response.data && response.data.success === true && Array.isArray(response.data.branches)) {
      const canvasData = response.data.branches
        .map((item, index) => ({
          id: String(item.CCANTPYECODE || index + 1),
          name: item.CCANTPYENAME || item.name || '',
        }))
        .filter(item => item.name !== '');
      
      console.log('✅ Canvas types extracted from branches with IDs:', canvasData);
      
      if (canvasData.length > 0) {
        return {
          success: true,
          data: canvasData,
        };
      }
    }
    
    // ✅ Check for canvasTypes array format
    if (response.data && Array.isArray(response.data.canvasTypes)) {
      const canvasData = response.data.canvasTypes
        .map((item, index) => {
          if (typeof item === 'string') {
            return {
              id: String(index + 1),
              name: item,
            };
          }
          return {
            id: String(item.id || item.CCANTPYECODE || index + 1),
            name: item.name || item.CCANTPYENAME || String(item),
          };
        })
        .filter(item => item.name !== '');
      
      return {
        success: true,
        data: canvasData,
      };
    }
    
    // ✅ Check if response.data is directly an array
    if (Array.isArray(response.data)) {
      // Check if it's an array of strings (no IDs)
      if (typeof response.data[0] === 'string') {
        const canvasData = response.data.map((name, index) => ({
          id: String(index + 1),
          name: name,
        }));
        console.log('✅ Canvas types with generated IDs:', canvasData);
        return {
          success: true,
          data: canvasData,
        };
      }
      
      // If it's an array of objects
      const canvasData = response.data
        .map((item, index) => ({
          id: String(item.CCANTPYECODE || item.id || index + 1),
          name: item.CCANTPYENAME || item.name || String(item),
        }))
        .filter(item => item.name !== '');
      
      if (canvasData.length > 0) {
        return {
          success: true,
          data: canvasData,
        };
      }
      
      return {
        success: true,
        data: response.data,
      };
    }
    
    // ✅ If we reach here, format is invalid
    console.log('⚠️ Invalid response format, using fallback');
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

// ✅ Check Card Number (Check if card already exists)
// ✅ Check Card Number (Check if card already exists)
// ✅ Check Card Number (Check if card already exists) - With enhanced logging
checkCard: async (cardNo) => {
  try {
    // ✅ URL-encode the card number to handle special characters
    const encodedCardNo = encodeURIComponent(cardNo);
    console.log('🔍 Checking card with encoded value:', encodedCardNo);
    
    // ✅ Use the dynamic encoded card number
    const response = await api.get(`/chitcustomerreg/chitcard?cuscard=${encodedCardNo}`);
    
    console.log('✅ Card check response:', response.data);
    console.log('✅ Response type:', typeof response.data);
    console.log('✅ Is array:', Array.isArray(response.data));
    console.log('✅ Response length:', Array.isArray(response.data) ? response.data.length : 'N/A');
    
    // ✅ Handle different response formats
    
    // Case 1: Response is an array
    if (Array.isArray(response.data)) {
      // If array is empty, card doesn't exist
      if (response.data.length === 0) {
        console.log('✅ Card not found (empty array)');
        return {
          success: true,
          exists: false,
          data: [],
          message: 'Card not found'
        };
      }
      
      // If array has data, card exists
      console.log('✅ Card FOUND in array! Length:', response.data.length);
      console.log('✅ Card data:', JSON.stringify(response.data, null, 2));
      return {
        success: true,
        exists: true,
        data: response.data,
        message: 'Card already registered'
      };
    }
    
    // Case 2: Response is an object with exists property
    if (response.data && typeof response.data === 'object') {
      // Check if it has an exists property
      if (response.data.exists !== undefined) {
        console.log('✅ Card exists from object property:', response.data.exists);
        return {
          success: true,
          exists: response.data.exists,
          data: response.data,
        };
      }
      
      // Check if it has data with length
      if (response.data.data && Array.isArray(response.data.data)) {
        const exists = response.data.data.length > 0;
        console.log('✅ Card exists from data array:', exists);
        return {
          success: true,
          exists: exists,
          data: response.data.data,
        };
      }
      
      // Check if it has a records array
      if (response.data.records && Array.isArray(response.data.records)) {
        const exists = response.data.records.length > 0;
        console.log('✅ Card exists from records array:', exists);
        return {
          success: true,
          exists: exists,
          data: response.data.records,
        };
      }
      
      // If it's a non-empty object, consider it as found
      if (Object.keys(response.data).length > 0) {
        console.log('✅ Card found (non-empty object)');
        return {
          success: true,
          exists: true,
          data: response.data,
        };
      }
    }
    
    // Case 3: Response is a boolean
    if (typeof response.data === 'boolean') {
      console.log('✅ Card exists from boolean:', response.data);
      return {
        success: true,
        exists: response.data,
        data: response.data,
      };
    }
    
    // Case 4: Response is a number (0 = false, 1 = true)
    if (typeof response.data === 'number') {
      console.log('✅ Card exists from number:', response.data > 0);
      return {
        success: true,
        exists: response.data > 0,
        data: response.data,
      };
    }
    
    // Default case - treat as not found
    console.log('⚠️ Unknown response format, treating as not found');
    return {
      success: true,
      exists: false,
      data: response.data,
      message: 'Unknown response format',
    };
    
  } catch (error) {
    console.log('❌ Check Card error:', error);
    console.log('❌ Error response:', error.response?.data);
    console.log('❌ Error status:', error.response?.status);
    
    // If 404, the endpoint doesn't exist
    if (error.response?.status === 404) {
      return {
        success: false,
        exists: false,
        message: 'Card check endpoint not found. Please check with your backend team.',
      };
    }
    
    // If the request fails, assume card doesn't exist to allow testing
    return {
      success: false,
      exists: false,
      message: error.response?.data?.message || 'Failed to check card number.',
    };
  }
},  // ✅ Get All Customers
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