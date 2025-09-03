# Environment Configuration Guide

This guide provides detailed information about configuring the Pay4U application for different environments and the new security features.

## Environment Variables Configuration

### Development/UAT Environment
- `NODE_ENV=development`
- `PAYSPRINT_BASE_URL=https://paysprint.in/service-api/api/v1/service`
- `PAYSPRINT_UAT_URL=https://paysprint.in/service-api/api/v1/service`
- `DATABASE_URI=mongodb://localhost:27017/pay4u_dev`
- `JWT_SECRET=your_development_jwt_secret_here`
- `PAYSPRINT_JWT_KEY=your_paysprint_jwt_key`
- `PAYSPRINT_AUTHORISED_KEY=your_paysprint_authorised_key`

### Production/Live Environment
- `NODE_ENV=production`
- `PAYSPRINT_BASE_URL=https://paysprint.in/service-api/api/v1/service`
- `PAYSPRINT_LIVE_URL=https://paysprint.in/service-api/api/v1/service`
- `DATABASE_URI=mongodb://your_production_mongodb_uri`
- `JWT_SECRET=your_production_jwt_secret_here`
- `PAYSPRINT_JWT_KEY=your_production_paysprint_jwt_key`
- `PAYSPRINT_AUTHORISED_KEY=your_production_paysprint_authorised_key`

## New Features Configuration

### Audit Logging System
The application now includes comprehensive transaction audit logging that captures:
- User location and IP address
- Device fingerprinting and MAC address
- Transaction metadata and security information
- Real-time monitoring of all financial transactions

**Features:**
- Automatic logging for all transaction endpoints (DMT, AEPS, Recharge, Wallet, Voucher)
- Device fingerprinting with browser and system information
- Geolocation tracking for enhanced security
- Comprehensive admin dashboard with filtering and analytics

**Required Environment Variables:**
- Audit logging is enabled by default in all environments
- No additional configuration required - uses existing database connection
- Audit data is stored in the `transactionaudits` collection

**Admin Dashboard Access:**
- Audit dashboard available at `/admin/audit-dashboard`
- Requires admin authentication
- Provides filtering, search, and analytics capabilities
- Real-time transaction monitoring

### Enhanced KYC Verification
The DMT (Domestic Money Transfer) system now includes enhanced KYC verification:
- Biometric authentication options
- Document verification workflows
- Real-time KYC status tracking
- Multi-step verification process

**KYC Features:**
- Integrated into remitter registration flow
- Supports multiple verification methods (Aadhaar, PAN, biometric)
- Real-time status updates and progress tracking
- Secure document upload and verification

**KYC Configuration:**
- KYC verification is integrated into remitter registration
- Uses existing Paysprint API credentials for verification
- No additional environment variables required
- Frontend component handles biometric capture and document upload

## Security Enhancements

### Transaction Security
- All financial transactions are now audited with comprehensive metadata
- Device fingerprinting prevents unauthorized access
- Location-based verification for enhanced security
- Real-time fraud detection capabilities

### Data Protection
- Sensitive data is encrypted and securely stored
- Audit logs include security metadata without exposing sensitive information
- Compliance with financial transaction security standards

## Deployment Considerations

### Database Requirements
- Ensure MongoDB has sufficient storage for audit logs
- Consider implementing log rotation for production environments
- Monitor database performance with increased audit data volume

### Performance Optimization
- Audit middleware is optimized for minimal performance impact
- Asynchronous logging prevents transaction delays
- Efficient database indexing for audit queries

### Monitoring and Maintenance
- Regular review of audit logs for security analysis
- Monitor system performance with new features enabled
- Backup strategies should include audit data

## Troubleshooting

### Common Issues
1. **Audit logging not working**: Verify database connection and permissions
2. **KYC verification failures**: Check Paysprint API credentials and network connectivity
3. **Performance issues**: Monitor database queries and consider indexing optimization

### Support
For technical support regarding the new features, refer to:
- Application logs for detailed error information
- Admin dashboard for transaction audit analysis
- Database monitoring tools for performance metrics