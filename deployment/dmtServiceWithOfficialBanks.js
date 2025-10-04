const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const DmtService = require('./services/dmtService');
const productionLogger = require('./utils/productionLogger');

/**
 * Enhanced DMT Service with Official Paysprint Bank Integration
 * This service integrates the official Paysprint bank list for real DMT transactions
 */
class EnhancedDmtService {
    constructor() {
        this.dmtService = null;
        this.bankMapping = null;
        this.bankList = null;
        this.initialized = false;
    }

    /**
     * Initialize the service with database connection and bank data
     */
    async initialize() {
        try {
            console.log('🚀 Initializing Enhanced DMT Service...');
            
            // Connect to database
            await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/pay4u', {
                useNewUrlParser: true,
                useUnifiedTopology: true
            });
            console.log('✅ Database connected');
            
            // Initialize DMT service
            this.dmtService = require('./services/dmtService');
            await this.dmtService.initialize();
            console.log('✅ DMT Service initialized');
            
            // Load official bank data
            await this.loadOfficialBankData();
            console.log('✅ Official bank data loaded');
            
            this.initialized = true;
            console.log('🎯 Enhanced DMT Service ready for transactions!');
            
        } catch (error) {
            console.error('❌ Failed to initialize Enhanced DMT Service:', error);
            throw error;
        }
    }

    /**
     * Load official Paysprint bank data
     */
    async loadOfficialBankData() {
        try {
            const bankMappingPath = path.join(__dirname, 'paysprint_bank_mapping_official.json');
            const bankListPath = path.join(__dirname, 'paysprint_banks_official.json');
            
            if (!fs.existsSync(bankMappingPath) || !fs.existsSync(bankListPath)) {
                throw new Error('Official bank data files not found. Please run parsePaysprintBankList.js first.');
            }
            
            this.bankMapping = JSON.parse(fs.readFileSync(bankMappingPath, 'utf8'));
            this.bankList = JSON.parse(fs.readFileSync(bankListPath, 'utf8'));
            
            console.log(`📊 Loaded ${Object.keys(this.bankMapping).length} banks from official Paysprint data`);
            
        } catch (error) {
            console.error('❌ Failed to load official bank data:', error);
            throw error;
        }
    }

    /**
     * Find bank by name (fuzzy search)
     */
    findBankByName(searchName) {
        if (!this.bankMapping) {
            throw new Error('Bank data not loaded. Please initialize first.');
        }
        
        const normalizedSearch = searchName.toLowerCase().trim();
        
        // First try exact match
        for (const [id, bank] of Object.entries(this.bankMapping)) {
            if (bank.name.toLowerCase() === normalizedSearch) {
                return bank;
            }
        }
        
        // Then try partial match
        for (const [id, bank] of Object.entries(this.bankMapping)) {
            if (bank.name.toLowerCase().includes(normalizedSearch) || 
                normalizedSearch.includes(bank.name.toLowerCase())) {
                return bank;
            }
        }
        
        return null;
    }

    /**
     * Find bank by ID
     */
    findBankById(bankId) {
        if (!this.bankMapping) {
            throw new Error('Bank data not loaded. Please initialize first.');
        }
        
        return this.bankMapping[bankId.toString()] || null;
    }

    /**
     * Get all banks (with optional filtering)
     */
    getAllBanks(filter = null) {
        if (!this.bankMapping) {
            throw new Error('Bank data not loaded. Please initialize first.');
        }
        
        let banks = Object.values(this.bankMapping);
        
        if (filter) {
            const normalizedFilter = filter.toLowerCase();
            banks = banks.filter(bank => 
                bank.name.toLowerCase().includes(normalizedFilter)
            );
        }
        
        return banks;
    }

    /**
     * Register a new remitter
     */
    async registerRemitter(remitterData) {
        if (!this.initialized) {
            throw new Error('Service not initialized. Please call initialize() first.');
        }
        
        console.log('📝 Registering remitter:', remitterData.mobile);
        
        try {
            const result = await this.dmtService.registerRemitter(remitterData);
            
            productionLogger.logRequest('DMT_REGISTER_REMITTER', {
                mobile: remitterData.mobile,
                name: remitterData.fname + ' ' + remitterData.lname,
                result: result
            });
            
            return result;
            
        } catch (error) {
            productionLogger.logError('DMT_REGISTER_REMITTER_ERROR', {
                mobile: remitterData.mobile,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Perform remitter KYC
     */
    async performRemitterKyc(kycData) {
        if (!this.initialized) {
            throw new Error('Service not initialized. Please call initialize() first.');
        }
        
        console.log('🔍 Performing remitter KYC:', kycData.mobile);
        
        try {
            const result = await this.dmtService.performRemitterKyc(kycData);
            
            productionLogger.logRequest('DMT_REMITTER_KYC', {
                mobile: kycData.mobile,
                result: result
            });
            
            return result;
            
        } catch (error) {
            productionLogger.logError('DMT_REMITTER_KYC_ERROR', {
                mobile: kycData.mobile,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Add beneficiary with bank validation
     */
    async addBeneficiary(beneficiaryData) {
        if (!this.initialized) {
            throw new Error('Service not initialized. Please call initialize() first.');
        }
        
        console.log('👤 Adding beneficiary:', beneficiaryData.bene_name);
        
        // Validate bank
        const bank = this.findBankById(beneficiaryData.bankid);
        if (!bank) {
            throw new Error(`Invalid bank ID: ${beneficiaryData.bankid}`);
        }
        
        console.log(`✅ Bank validated: ${bank.name} (ID: ${bank.id})`);
        
        try {
            const result = await this.dmtService.addBeneficiary(beneficiaryData);
            
            productionLogger.logRequest('DMT_ADD_BENEFICIARY', {
                mobile: beneficiaryData.mobile,
                beneficiary: beneficiaryData.bene_name,
                bank: bank.name,
                bankId: bank.id,
                result: result
            });
            
            return result;
            
        } catch (error) {
            productionLogger.logError('DMT_ADD_BENEFICIARY_ERROR', {
                mobile: beneficiaryData.mobile,
                beneficiary: beneficiaryData.bene_name,
                bank: bank.name,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Transfer money with enhanced logging and validation
     */
    async transferMoney(transferData) {
        if (!this.initialized) {
            throw new Error('Service not initialized. Please call initialize() first.');
        }
        
        console.log('💸 Processing money transfer:', {
            mobile: transferData.mobile,
            amount: transferData.amount,
            beneficiary: transferData.bene_id
        });
        
        try {
            const result = await this.dmtService.transferMoney(transferData);
            
            productionLogger.logRequest('DMT_TRANSFER_MONEY', {
                mobile: transferData.mobile,
                amount: transferData.amount,
                beneficiary: transferData.bene_id,
                result: result
            });
            
            return result;
            
        } catch (error) {
            productionLogger.logError('DMT_TRANSFER_MONEY_ERROR', {
                mobile: transferData.mobile,
                amount: transferData.amount,
                beneficiary: transferData.bene_id,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Check transaction status
     */
    async checkTransactionStatus(txnId) {
        if (!this.initialized) {
            throw new Error('Service not initialized. Please call initialize() first.');
        }
        
        console.log('🔍 Checking transaction status:', txnId);
        
        try {
            const result = await this.dmtService.checkTransactionStatus(txnId);
            
            productionLogger.logRequest('DMT_CHECK_STATUS', {
                txnId: txnId,
                result: result
            });
            
            return result;
            
        } catch (error) {
            productionLogger.logError('DMT_CHECK_STATUS_ERROR', {
                txnId: txnId,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Get account balance
     */
    async getBalance() {
        if (!this.initialized) {
            throw new Error('Service not initialized. Please call initialize() first.');
        }
        
        console.log('💰 Checking account balance...');
        
        try {
            const result = await this.dmtService.getBalance();
            
            productionLogger.logRequest('DMT_GET_BALANCE', {
                result: result
            });
            
            return result;
            
        } catch (error) {
            productionLogger.logError('DMT_GET_BALANCE_ERROR', {
                error: error.message
            });
            throw error;
        }
    }
}

// Export singleton instance
module.exports = new EnhancedDmtService();

// If running directly, demonstrate the service
if (require.main === module) {
    async function demonstrateService() {
        try {
            const enhancedDmt = require('./dmtServiceWithOfficialBanks');
            
            console.log('🎯 Demonstrating Enhanced DMT Service with Official Banks\n');
            
            // Initialize service
            await enhancedDmt.initialize();
            
            // Demonstrate bank search
            console.log('\n🔍 Bank Search Examples:');
            
            const hdfc = enhancedDmt.findBankByName('HDFC BANK');
            console.log('HDFC Bank:', hdfc ? `${hdfc.name} (ID: ${hdfc.id})` : 'Not found');
            
            const sbi = enhancedDmt.findBankByName('STATE BANK OF INDIA');
            console.log('SBI:', sbi ? `${sbi.name} (ID: ${sbi.id})` : 'Not found');
            
            const icici = enhancedDmt.findBankByName('ICICI');
            console.log('ICICI:', icici ? `${icici.name} (ID: ${icici.id})` : 'Not found');
            
            // Show some popular banks
            console.log('\n🏦 Popular Banks Available:');
            const popularBanks = enhancedDmt.getAllBanks().slice(0, 10);
            popularBanks.forEach((bank, index) => {
                console.log(`${index + 1}. ${bank.name} (ID: ${bank.id})`);
            });
            
            console.log('\n✅ Enhanced DMT Service demonstration completed!');
            console.log('🎯 Ready for real DMT transactions with official Paysprint bank data!');
            
        } catch (error) {
            console.error('❌ Demonstration failed:', error);
        } finally {
            process.exit(0);
        }
    }
    
    demonstrateService();
}