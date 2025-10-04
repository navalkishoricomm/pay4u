const fs = require('fs');
const path = require('path');

class ProductionLogger {
    constructor() {
        this.logsDir = path.join(__dirname, '..', 'production_logs');
        this.ensureLogsDirectory();
    }

    ensureLogsDirectory() {
        if (!fs.existsSync(this.logsDir)) {
            fs.mkdirSync(this.logsDir, { recursive: true });
        }
    }

    logRequest(endpoint, method, headers, body, additionalInfo = {}) {
        const timestamp = new Date().toISOString();
        const requestId = this.generateRequestId();
        
        const logEntry = {
            requestId,
            timestamp,
            type: 'REQUEST',
            endpoint,
            method,
            headers: this.sanitizeHeaders(headers),
            body: body || null,
            additionalInfo
        };

        this.writeLog('requests', logEntry);
        console.log(`📤 [${requestId}] REQUEST: ${method} ${endpoint}`);
        
        return requestId;
    }

    logResponse(requestId, status, statusText, headers, data, error = null) {
        const timestamp = new Date().toISOString();
        
        const logEntry = {
            requestId,
            timestamp,
            type: 'RESPONSE',
            status,
            statusText,
            headers: headers || {},
            data: data || null,
            error: error ? {
                message: error.message,
                stack: error.stack
            } : null
        };

        this.writeLog('responses', logEntry);
        
        if (error) {
            console.log(`📥 [${requestId}] ERROR: ${status} - ${error.message}`);
        } else {
            console.log(`📥 [${requestId}] RESPONSE: ${status} ${statusText}`);
        }
    }

    logPaysprintTransaction(transactionData) {
        const timestamp = new Date().toISOString();
        const requestId = this.generateRequestId();
        
        const logEntry = {
            requestId,
            timestamp,
            type: 'PAYSPRINT_TRANSACTION',
            transactionData
        };

        this.writeLog('paysprint_transactions', logEntry);
        console.log(`💰 [${requestId}] PAYSPRINT TRANSACTION LOGGED`);
        
        return requestId;
    }

    writeLog(category, logEntry) {
        const date = new Date().toISOString().split('T')[0];
        const filename = `${category}_${date}.json`;
        const filepath = path.join(this.logsDir, filename);
        
        let logs = [];
        if (fs.existsSync(filepath)) {
            try {
                const existingContent = fs.readFileSync(filepath, 'utf8');
                logs = JSON.parse(existingContent);
            } catch (error) {
                console.error('Error reading existing log file:', error.message);
                logs = [];
            }
        }
        
        logs.push(logEntry);
        
        try {
            fs.writeFileSync(filepath, JSON.stringify(logs, null, 2));
        } catch (error) {
            console.error('Error writing log file:', error.message);
        }
    }

    sanitizeHeaders(headers) {
        const sanitized = { ...headers };
        
        // Remove sensitive information but keep structure for debugging
        if (sanitized.Authorization) {
            sanitized.Authorization = `Bearer ${sanitized.Authorization.substring(7, 20)}...`;
        }
        if (sanitized.Authorisedkey) {
            sanitized.Authorisedkey = `${sanitized.Authorisedkey.substring(0, 10)}...`;
        }
        
        return sanitized;
    }

    generateRequestId() {
        return `REQ_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // Get logs for Paysprint support
    getLogsForSupport(date = null) {
        const targetDate = date || new Date().toISOString().split('T')[0];
        const supportLogs = {
            date: targetDate,
            requests: [],
            responses: [],
            transactions: []
        };

        try {
            // Read requests
            const requestsFile = path.join(this.logsDir, `requests_${targetDate}.json`);
            if (fs.existsSync(requestsFile)) {
                supportLogs.requests = JSON.parse(fs.readFileSync(requestsFile, 'utf8'));
            }

            // Read responses
            const responsesFile = path.join(this.logsDir, `responses_${targetDate}.json`);
            if (fs.existsSync(responsesFile)) {
                supportLogs.responses = JSON.parse(fs.readFileSync(responsesFile, 'utf8'));
            }

            // Read transactions
            const transactionsFile = path.join(this.logsDir, `paysprint_transactions_${targetDate}.json`);
            if (fs.existsSync(transactionsFile)) {
                supportLogs.transactions = JSON.parse(fs.readFileSync(transactionsFile, 'utf8'));
            }

            // Save combined support file
            const supportFile = path.join(this.logsDir, `paysprint_support_logs_${targetDate}.json`);
            fs.writeFileSync(supportFile, JSON.stringify(supportLogs, null, 2));
            
            console.log(`📋 Support logs generated: ${supportFile}`);
            return supportFile;
            
        } catch (error) {
            console.error('Error generating support logs:', error.message);
            return null;
        }
    }

    // Clean old logs (keep last 30 days)
    cleanOldLogs() {
        try {
            const files = fs.readdirSync(this.logsDir);
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            
            files.forEach(file => {
                const filePath = path.join(this.logsDir, file);
                const stats = fs.statSync(filePath);
                
                if (stats.mtime < thirtyDaysAgo) {
                    fs.unlinkSync(filePath);
                    console.log(`🗑️ Cleaned old log file: ${file}`);
                }
            });
        } catch (error) {
            console.error('Error cleaning old logs:', error.message);
        }
    }
}

// Export singleton instance
module.exports = new ProductionLogger();