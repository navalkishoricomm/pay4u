# Environment Configuration Guide

## Overview

This guide explains how to configure TraePay4U for different Paysprint environments (UAT and Live) based on the official Paysprint support response.

## Environment Types

### 1. Development/UAT Environment
- **Purpose**: Testing and development
- **NODE_ENV**: `development`
- **Paysprint URL**: `https://sit.paysprint.in/service-api/api/v1/service`
- **Use Case**: Safe testing without real money transactions

### 2. Production/Live Environment
- **Purpose**: Live transactions with real money
- **NODE_ENV**: `production`
- **Paysprint URL**: `https://api.paysprint.in/api/v1/service`
- **Use Case**: Production deployment

## Configuration Setup

### Step 1: Environment Variables

Create or update your `.env` file:

#### For Development/UAT
```bash
# Environment Configuration
NODE_ENV=development

# Database
MONGO_URI=mongodb://localhost:27017/pay4u_dev

# JWT
JWT_SECRET=your_development_jwt_secret
JWT_EXPIRES_IN=90d

# Paysprint UAT Credentials
PAYSPRINT_API_KEY=your_uat_api_key
PAYSPRINT_API_SECRET=your_uat_api_secret
PAYSPRINT_PARTNER_ID=your_uat_partner_id
```

#### For Production/Live
```bash
# Environment Configuration
NODE_ENV=production

# Database
MONGO_URI=mongodb://localhost:27017/pay4u_production

# JWT
JWT_SECRET=your_production_jwt_secret_strong_key
JWT_EXPIRES_IN=90d

# Paysprint Live Credentials
PAYSPRINT_API_KEY=your_live_api_key
PAYSPRINT_API_SECRET=your_live_api_secret
PAYSPRINT_PARTNER_ID=your_live_partner_id
```

### Step 2: Automatic URL Selection

The application automatically selects the correct Paysprint URL based on `NODE_ENV`:

```javascript
// In dmtService.js and aepsService.js
getBaseURL() {
  const environment = process.env.NODE_ENV || 'development';
  
  if (environment === 'production') {
    // Live/Production environment
    return 'https://api.paysprint.in/api/v1/service';
  } else {
    // UAT/Development environment
    return 'https://sit.paysprint.in/service-api/api/v1/service';
  }
}
```

## URL Structure Comparison

### UAT Environment URLs
```
Base URL: https://sit.paysprint.in/service-api/api/v1/service

# DMT Endpoints
Balance: /balance/balance/mainbalance
Bank List: /dmt/bank/banklist
Remitter Register: /dmt/remitter/register
Money Transfer: /dmt/transfer/transfer

# AEPS Endpoints
AEPS Balance: /balance/balance/aepsbalance
Balance Inquiry: /aeps/balance/inquiry
Cash Withdrawal: /aeps/cash/withdrawal
Mini Statement: /aeps/mini/statement
```

### Live Environment URLs
```
Base URL: https://api.paysprint.in/api/v1/service

# DMT Endpoints
Balance: /balance/balance/mainbalance
Bank List: /dmt/bank/banklist
Remitter Register: /dmt/remitter/register
Money Transfer: /dmt/transfer/transfer

# AEPS Endpoints
AEPS Balance: /balance/balance/aepsbalance
Balance Inquiry: /aeps/balance/inquiry
Cash Withdrawal: /aeps/cash/withdrawal
Mini Statement: /aeps/mini/statement
```

## Testing Procedures

### 1. UAT Environment Testing

```bash
# Set environment to development
export NODE_ENV=development
# or on Windows
set NODE_ENV=development

# Start the application
npm start

# Test endpoints
curl -X POST http://localhost:5000/api/dmt/balance \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 2. Production Environment Testing

```bash
# Set environment to production
export NODE_ENV=production
# or on Windows
set NODE_ENV=production

# Start the application
npm run prod

# Test endpoints (use with caution - real transactions)
curl -X POST http://localhost:5000/api/dmt/balance \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Deployment Configurations

### Development Server
```bash
# package.json scripts
"scripts": {
  "dev": "NODE_ENV=development nodemon server.js",
  "start": "NODE_ENV=development node server.js"
}
```

### Production Server
```bash
# package.json scripts
"scripts": {
  "prod": "NODE_ENV=production node server.js",
  "start:prod": "NODE_ENV=production pm2 start server.js"
}
```

### Docker Configuration

#### Development Dockerfile
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
ENV NODE_ENV=development
EXPOSE 5000
CMD ["npm", "start"]
```

#### Production Dockerfile
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
ENV NODE_ENV=production
EXPOSE 5000
CMD ["npm", "run", "prod"]
```

## Environment Verification

### Check Current Environment
```javascript
// Add this to any controller for debugging
console.log('Current Environment:', process.env.NODE_ENV);
console.log('Paysprint Base URL:', dmtService.getBaseURL());
```

### Verify URL Configuration
```bash
# Test URL resolution
node -e "console.log('NODE_ENV:', process.env.NODE_ENV); const DmtService = require('./services/dmtService'); const service = new DmtService(); console.log('Base URL:', service.getBaseURL());"
```

## Security Best Practices

### 1. Environment Separation
- Use different databases for UAT and Production
- Use different API credentials for each environment
- Never use production credentials in development

### 2. Credential Management
- Store credentials in environment variables
- Use different `.env` files for different environments
- Never commit `.env` files to version control

### 3. Testing Safety
- Always test in UAT environment first
- Verify all endpoints work in UAT before production
- Use small amounts for initial production testing

## Troubleshooting

### Common Issues

1. **Wrong Environment URL**
   - Check `NODE_ENV` value
   - Verify `getBaseURL()` method returns correct URL

2. **Authentication Failures**
   - Ensure credentials match the environment
   - UAT credentials won't work with Live URLs and vice versa

3. **Database Connection Issues**
   - Use different database names for different environments
   - Verify `MONGO_URI` points to correct database

### Debug Commands

```bash
# Check environment variables
echo $NODE_ENV
echo $MONGO_URI

# Test database connection
node -e "require('mongoose').connect(process.env.MONGO_URI).then(() => console.log('DB Connected')).catch(err => console.log('DB Error:', err.message))"

# Test Paysprint URL resolution
node -e "const service = require('./services/dmtService'); console.log(new service().getBaseURL())"
```

## Support and Documentation

### Paysprint Documentation
- UAT Environment: Contact Paysprint support for UAT credentials
- Live Environment: Use production credentials provided by Paysprint

### Internal Documentation
- `PAYSPRINT_AUTHENTICATION_ANALYSIS.md` - Authentication analysis
- `AEPS_API_DOCUMENTATION.md` - AEPS API documentation
- `PAYSPRINT_INTEGRATION_GUIDE.md` - Integration guide

---

**Last Updated**: January 2025  
**Status**: Ready for Implementation  
**Environments Supported**: UAT and Live