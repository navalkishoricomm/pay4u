// Bank Mapping Example - Expected Structure for Paysprint Bank List
// This shows how we will extract and use bank IDs once the API is working

const expectedBankListResponse = {
  "response_code": 1,
  "status": "SUCCESS",
  "message": "Bank list retrieved successfully",
  "data": [
    {
      "id": "HDFC0000001",
      "bankname": "HDFC Bank",
      "ifsc": "HDFC0000001",
      "active": true
    },
    {
      "id": "ICIC0000001", 
      "bankname": "ICICI Bank",
      "ifsc": "ICIC0000001",
      "active": true
    },
    {
      "id": "SBIN0000001",
      "bankname": "State Bank of India",
      "ifsc": "SBIN0000001", 
      "active": true
    }
    // ... more banks
  ]
};

// Function to create bank mapping from API response
function createBankMapping(bankListResponse) {
  const bankMapping = {};
  
  if (bankListResponse.data && Array.isArray(bankListResponse.data)) {
    bankListResponse.data.forEach(bank => {
      const bankId = bank.id || bank.bankid || bank.bank_id;
      const bankName = bank.bankname || bank.bank_name || bank.name;
      const ifscCode = bank.ifsc || bank.ifsc_code;
      
      if (bankId && bankName) {
        // Create multiple mapping keys for easy lookup
        const normalizedName = bankName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
        
        bankMapping[normalizedName] = {
          id: bankId,
          name: bankName,
          ifsc: ifscCode,
          active: bank.active !== false
        };
        
        // Also map by IFSC code for quick lookup
        if (ifscCode) {
          bankMapping[ifscCode] = {
            id: bankId,
            name: bankName,
            ifsc: ifscCode,
            active: bank.active !== false
          };
        }
      }
    });
  }
  
  return bankMapping;
}

// Function to find bank ID by name or IFSC
function findBankId(bankMapping, searchTerm) {
  const normalizedSearch = searchTerm.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
  
  // Try exact match first
  if (bankMapping[normalizedSearch]) {
    return bankMapping[normalizedSearch].id;
  }
  
  // Try IFSC match
  if (bankMapping[searchTerm.toUpperCase()]) {
    return bankMapping[searchTerm.toUpperCase()].id;
  }
  
  // Try partial name match
  for (const key in bankMapping) {
    if (key.includes(normalizedSearch) || normalizedSearch.includes(key)) {
      return bankMapping[key].id;
    }
  }
  
  return null;
}

// Example usage once bank list API is working:
function demonstrateBankMapping() {
  console.log('🏦 Bank Mapping Example');
  console.log('======================');
  
  // Create mapping from expected response
  const bankMapping = createBankMapping(expectedBankListResponse);
  
  console.log('\n📋 Generated Bank Mapping:');
  console.log(JSON.stringify(bankMapping, null, 2));
  
  console.log('\n🔍 Bank ID Lookup Examples:');
  console.log('HDFC Bank ID:', findBankId(bankMapping, 'HDFC Bank'));
  console.log('ICICI Bank ID:', findBankId(bankMapping, 'icici bank'));
  console.log('SBI ID:', findBankId(bankMapping, 'State Bank of India'));
  console.log('By IFSC HDFC0000001:', findBankId(bankMapping, 'HDFC0000001'));
  
  console.log('\n💡 How to use in DMT transactions:');
  console.log('1. Get bank name from user input');
  console.log('2. Use findBankId() to get the bank ID');
  console.log('3. Pass bank ID in beneficiary registration/transaction requests');
  
  console.log('\n📝 Example transaction request with bank ID:');
  const exampleRequest = {
    mobile: '9999999999',
    beneficiary_name: 'John Doe',
    beneficiary_account: '1234567890',
    bank_id: findBankId(bankMapping, 'HDFC Bank'), // This will be the extracted bank ID
    ifsc: 'HDFC0000001',
    amount: 1000
  };
  
  console.log(JSON.stringify(exampleRequest, null, 2));
}

// Run demonstration
if (require.main === module) {
  demonstrateBankMapping();
}

module.exports = {
  createBankMapping,
  findBankId,
  expectedBankListResponse
};