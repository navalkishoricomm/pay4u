const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Function to parse Paysprint bank list Excel file
function parsePaysprintBankList() {
    try {
        console.log('📊 Parsing Paysprint Bank List Excel File...');
        
        // Read the Excel file
        const filePath = path.join(__dirname, 'paysprint_bank_list.xlsx');
        
        if (!fs.existsSync(filePath)) {
            throw new Error('Bank list Excel file not found. Please ensure paysprint_bank_list.xlsx exists.');
        }
        
        console.log('✅ Excel file found, reading...');
        
        // Read workbook
        const workbook = XLSX.readFile(filePath);
        const sheetNames = workbook.SheetNames;
        
        console.log('📋 Available sheets:', sheetNames);
        
        // Get the first sheet (usually contains the bank data)
        const firstSheetName = sheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        console.log(`\n📊 Found ${jsonData.length} rows of data`);
        
        if (jsonData.length > 0) {
            console.log('\n🔍 Sample data structure:');
            console.log('First row keys:', Object.keys(jsonData[0]));
            console.log('First row data:', JSON.stringify(jsonData[0], null, 2));
            
            if (jsonData.length > 1) {
                console.log('Second row data:', JSON.stringify(jsonData[1], null, 2));
            }
        }
        
        // Create bank mapping
        const bankMapping = {};
        const bankList = [];
        
        jsonData.forEach((row, index) => {
            try {
                // Try different possible column names for bank data
                const bankId = row['BankId'] || row['Bank ID'] || row['BANK_ID'] || row['bankId'] || row['id'] || row['ID'];
                const bankName = row['BankName'] || row['Bank Name'] || row['BANK_NAME'] || row['bankName'] || row['name'] || row['NAME'];
                const ifscCode = row['IFSC'] || row['IFSC_CODE'] || row['ifsc'] || row['ifscCode'] || row['IfscCode'];
                const active = row['Active'] || row['ACTIVE'] || row['active'] || row['STATUS'] || true;
                
                if (bankId && bankName) {
                    // Create normalized bank name for lookup
                    const normalizedName = bankName.toLowerCase()
                        .replace(/\s+/g, '_')
                        .replace(/[^a-z0-9_]/g, '')
                        .replace(/_+/g, '_')
                        .replace(/^_|_$/g, '');
                    
                    const bankInfo = {
                        id: bankId.toString(),
                        name: bankName.toString(),
                        ifsc: ifscCode ? ifscCode.toString() : null,
                        active: active !== false && active !== 'N' && active !== 'No' && active !== 0,
                        originalRow: index + 1
                    };
                    
                    // Add to bank list
                    bankList.push(bankInfo);
                    
                    // Add to mapping by normalized name
                    bankMapping[normalizedName] = bankInfo;
                    
                    // Add to mapping by IFSC if available
                    if (ifscCode) {
                        bankMapping[ifscCode.toString().toUpperCase()] = bankInfo;
                    }
                    
                    // Add to mapping by bank ID
                    bankMapping[bankId.toString()] = bankInfo;
                    
                } else {
                    console.log(`⚠️ Row ${index + 1}: Missing bank ID or name`, row);
                }
            } catch (error) {
                console.error(`❌ Error processing row ${index + 1}:`, error.message);
            }
        });
        
        console.log(`\n✅ Successfully processed ${bankList.length} banks`);
        
        // Save bank list
        const bankListFile = 'paysprint_banks_official.json';
        fs.writeFileSync(bankListFile, JSON.stringify(bankList, null, 2));
        console.log(`📄 Bank list saved to: ${bankListFile}`);
        
        // Save bank mapping
        const bankMappingFile = 'paysprint_bank_mapping_official.json';
        fs.writeFileSync(bankMappingFile, JSON.stringify(bankMapping, null, 2));
        console.log(`📄 Bank mapping saved to: ${bankMappingFile}`);
        
        // Show some examples
        console.log('\n🔍 Bank Mapping Examples:');
        const sampleBanks = bankList.slice(0, 5);
        sampleBanks.forEach((bank, index) => {
            console.log(`${index + 1}. ${bank.name} (ID: ${bank.id}, IFSC: ${bank.ifsc || 'N/A'})`);
        });
        
        // Create lookup function example
        console.log('\n💡 Usage Examples:');
        
        function findBankId(searchTerm) {
            const normalizedSearch = searchTerm.toLowerCase()
                .replace(/\s+/g, '_')
                .replace(/[^a-z0-9_]/g, '')
                .replace(/_+/g, '_')
                .replace(/^_|_$/g, '');
            
            // Try exact match
            if (bankMapping[normalizedSearch]) {
                return bankMapping[normalizedSearch];
            }
            
            // Try IFSC match
            if (bankMapping[searchTerm.toUpperCase()]) {
                return bankMapping[searchTerm.toUpperCase()];
            }
            
            // Try partial match
            for (const key in bankMapping) {
                if (key.includes(normalizedSearch) || normalizedSearch.includes(key)) {
                    return bankMapping[key];
                }
            }
            
            return null;
        }
        
        // Test lookup examples
        const testSearches = ['HDFC', 'State Bank', 'ICICI', 'Axis Bank', 'Punjab National Bank'];
        testSearches.forEach(search => {
            const result = findBankId(search);
            if (result) {
                console.log(`🔍 "${search}" → ${result.name} (ID: ${result.id})`);
            } else {
                console.log(`❌ "${search}" → Not found`);
            }
        });
        
        // Create integration example
        const integrationExample = {
            mobile: '9999999999',
            beneficiary_name: 'John Doe',
            beneficiary_account: '1234567890',
            bank_id: sampleBanks[0]?.id || 'BANK_ID_HERE',
            ifsc: sampleBanks[0]?.ifsc || 'IFSC_CODE_HERE',
            amount: 1000
        };
        
        console.log('\n📝 DMT Transaction Request Example:');
        console.log(JSON.stringify(integrationExample, null, 2));
        
        console.log('\n🎯 Summary:');
        console.log(`✅ Parsed ${bankList.length} banks from official Paysprint Excel file`);
        console.log(`✅ Created comprehensive bank mapping with multiple lookup methods`);
        console.log(`✅ Ready for DMT transaction integration`);
        console.log(`✅ Files created: ${bankListFile}, ${bankMappingFile}`);
        
        return {
            bankList,
            bankMapping,
            findBankId
        };
        
    } catch (error) {
        console.error('❌ Error parsing bank list:', error);
        throw error;
    }
}

// Run if called directly
if (require.main === module) {
    parsePaysprintBankList();
}

module.exports = {
    parsePaysprintBankList
};