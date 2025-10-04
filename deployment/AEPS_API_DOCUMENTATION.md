# AEPS (Aadhaar Enabled Payment System) API Documentation

## Overview
The AEPS service enables Aadhaar-based financial transactions including balance inquiry, cash withdrawal, cash deposit, and mini statement operations through biometric authentication.

## Base URL
```
http://localhost:5000/api/aeps
```

## Authentication
All endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

## Common Request Headers
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer <jwt_token>"
}
```

## Common Response Format
```json
{
  "status": "success" | "error",
  "data": {},
  "message": "string"
}
```

---

## Endpoints

### 1. Balance Inquiry
**POST** `/balance-inquiry`

Check account balance using Aadhaar and biometric authentication.

#### Request Body
```json
{
  "aadhaarNumber": "123456789012",
  "customerMobile": "+919876543210",
  "bankIin": "607152",
  "bankName": "State Bank of India",
  "biometricType": "fingerprint",
  "pidData": "<encrypted_biometric_data>",
  "wadh": "<encrypted_aadhaar_hash>",
  "merchantId": "MERCHANT123",
  "terminalId": "TERMINAL456"
}
```

#### Response
```json
{
  "status": "success",
  "data": {
    "transaction": {
      "transactionId": "TXN123456789",
      "status": "success",
      "timestamp": "2024-01-15T10:30:00Z"
    },
    "balance": "5000.00",
    "rrn": "123456789012",
    "message": "Balance inquiry successful"
  }
}
```

---

### 2. Cash Withdrawal
**POST** `/cash-withdrawal`

Withdraw cash from customer's account.

#### Request Body
```json
{
  "aadhaarNumber": "123456789012",
  "customerMobile": "+919876543210",
  "amount": 1000,
  "bankIin": "607152",
  "bankName": "State Bank of India",
  "biometricType": "fingerprint",
  "pidData": "<encrypted_biometric_data>",
  "wadh": "<encrypted_aadhaar_hash>",
  "merchantId": "MERCHANT123",
  "terminalId": "TERMINAL456"
}
```

#### Validation Rules
- Amount: ₹50 - ₹10,000
- Must be in multiples of ₹50
- Biometric authentication required

#### Response
```json
{
  "status": "success",
  "data": {
    "transaction": {
      "transactionId": "TXN123456789",
      "status": "success",
      "timestamp": "2024-01-15T10:30:00Z"
    },
    "amount": 1000,
    "charges": 15,
    "rrn": "123456789012",
    "message": "Cash withdrawal successful"
  }
}
```

---

### 3. Cash Deposit
**POST** `/cash-deposit`

Deposit cash to customer's account.

#### Request Body
```json
{
  "aadhaarNumber": "123456789012",
  "customerMobile": "+919876543210",
  "amount": 5000,
  "bankIin": "607152",
  "bankName": "State Bank of India",
  "biometricType": "fingerprint",
  "pidData": "<encrypted_biometric_data>",
  "wadh": "<encrypted_aadhaar_hash>",
  "merchantId": "MERCHANT123",
  "terminalId": "TERMINAL456"
}
```

#### Validation Rules
- Amount: ₹1 - ₹50,000
- Biometric authentication required

#### Response
```json
{
  "status": "success",
  "data": {
    "transaction": {
      "transactionId": "TXN123456789",
      "status": "success",
      "timestamp": "2024-01-15T10:30:00Z"
    },
    "amount": 5000,
    "charges": 10,
    "rrn": "123456789012",
    "message": "Cash deposit successful"
  }
}
```

---

### 4. Mini Statement
**POST** `/mini-statement`

Get mini statement of customer's account.

#### Request Body
```json
{
  "aadhaarNumber": "123456789012",
  "customerMobile": "+919876543210",
  "bankIin": "607152",
  "bankName": "State Bank of India",
  "biometricType": "fingerprint",
  "pidData": "<encrypted_biometric_data>",
  "wadh": "<encrypted_aadhaar_hash>",
  "merchantId": "MERCHANT123",
  "terminalId": "TERMINAL456"
}
```

#### Response
```json
{
  "status": "success",
  "data": {
    "transaction": {
      "transactionId": "TXN123456789",
      "status": "success",
      "timestamp": "2024-01-15T10:30:00Z"
    },
    "balance": "5000.00",
    "miniStatement": [
      {
        "date": "2024-01-15",
        "description": "UPI Payment",
        "amount": "-500.00",
        "balance": "4500.00"
      },
      {
        "date": "2024-01-14",
        "description": "Salary Credit",
        "amount": "+25000.00",
        "balance": "5000.00"
      }
    ],
    "charges": 5,
    "rrn": "123456789012",
    "message": "Mini statement retrieved successfully"
  }
}
```

---

### 5. Get Transaction Status
**GET** `/transaction/:transactionId`

Get status of a specific AEPS transaction.

#### Parameters
- `transactionId` (URL parameter): Transaction ID to check

#### Response
```json
{
  "status": "success",
  "data": {
    "transactionId": "TXN123456789",
    "status": "success",
    "amount": 1000,
    "charges": 15,
    "rrn": "123456789012",
    "timestamp": "2024-01-15T10:30:00Z",
    "paysprintResponse": {
      "status": "SUCCESS",
      "message": "Transaction completed successfully"
    }
  }
}
```

---

### 6. Get User Transactions
**GET** `/transactions`

Get user's AEPS transaction history with pagination and filtering.

#### Query Parameters
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)
- `transactionType` (optional): Filter by type (`balance_inquiry`, `cash_withdrawal`, `cash_deposit`, `mini_statement`)
- `startDate` (optional): Start date (ISO 8601 format)
- `endDate` (optional): End date (ISO 8601 format)

#### Example Request
```
GET /transactions?page=1&limit=20&transactionType=cash_withdrawal&startDate=2024-01-01&endDate=2024-01-31
```

#### Response
```json
{
  "status": "success",
  "data": {
    "transactions": [
      {
        "transactionId": "TXN123456789",
        "transactionType": "cash_withdrawal",
        "amount": 1000,
        "charges": 15,
        "status": "success",
        "timestamp": "2024-01-15T10:30:00Z",
        "rrn": "123456789012"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 50,
      "itemsPerPage": 10
    }
  }
}
```

---

### 7. Get AEPS Statistics
**GET** `/stats`

Get AEPS statistics for the user.

#### Query Parameters
- `startDate` (optional): Start date (ISO 8601 format)
- `endDate` (optional): End date (ISO 8601 format)

#### Response
```json
{
  "status": "success",
  "data": {
    "totalTransactions": 150,
    "successfulTransactions": 145,
    "failedTransactions": 5,
    "totalAmount": 75000,
    "totalCharges": 1125,
    "transactionsByType": {
      "balance_inquiry": 50,
      "cash_withdrawal": 75,
      "cash_deposit": 20,
      "mini_statement": 5
    },
    "dateRange": {
      "startDate": "2024-01-01",
      "endDate": "2024-01-31"
    }
  }
}
```

---

### 8. Get Bank List
**GET** `/banks`

Get list of supported banks for AEPS transactions.

#### Response
```json
{
  "status": "success",
  "data": {
    "banks": [
      {
        "bankName": "State Bank of India",
        "bankIin": "607152",
        "isActive": true
      },
      {
        "bankName": "HDFC Bank",
        "bankIin": "607153",
        "isActive": true
      }
    ],
    "message": "Bank list retrieved successfully"
  }
}
```

---

### 9. Check Service Status
**GET** `/service-status`

Check if AEPS service is active and available.

#### Response
```json
{
  "status": "success",
  "data": {
    "serviceStatus": "active",
    "message": "AEPS service is active",
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

---

### 10. Validate Aadhaar
**POST** `/validate-aadhaar`

Validate Aadhaar number format and checksum.

#### Request Body
```json
{
  "aadhaarNumber": "123456789012"
}
```

#### Response
```json
{
  "status": "success",
  "data": {
    "aadhaarNumber": "XXXXXXXX9012",
    "isValid": true,
    "message": "Valid Aadhaar number"
  }
}
```

---

### 11. Get Wallet Balance
**GET** `/wallet-balance`

Get user's wallet balance for AEPS transaction charges.

#### Response
```json
{
  "status": "success",
  "data": {
    "balance": 5000.00,
    "currency": "INR",
    "lastUpdated": "2024-01-15T10:30:00Z"
  }
}
```

---

## Error Responses

### Validation Errors
```json
{
  "status": "error",
  "message": "Validation failed",
  "errors": [
    {
      "field": "aadhaarNumber",
      "message": "Aadhaar number must be exactly 12 digits"
    }
  ]
}
```

### Authentication Errors
```json
{
  "status": "error",
  "message": "Authentication failed",
  "error": "Invalid or expired token"
}
```

### Service Errors
```json
{
  "status": "error",
  "message": "AEPS service temporarily unavailable",
  "error": "Connection timeout"
}
```

---

## Biometric Data Format

### PID Data Structure
The `pidData` field should contain encrypted biometric data in the following format:
```xml
<PidData>
  <Resp errCode="0" errInfo="Success" fCount="1" fType="0" nmPoints="36" qScore="80">
    <DeviceInfo dpId="MANTRA.MSIPL" rdsId="MANTRA.WIN.001" rdsVer="1.0.5" mi="MFS100" mc="MIIEGjCCAwKgAwIBAgIGAWd" dc="d1d7a8e4-2a5f-4b8c-9e3d-1a2b3c4d5e6f"/>
    <Skey ci="20250101">encrypted_session_key</Skey>
    <Hmac>hmac_value</Hmac>
    <Data type="X">encrypted_biometric_template</Data>
  </Resp>
</PidData>
```

### WADH Format
The `wadh` field should contain the encrypted Aadhaar hash:
```
encrypted_aadhaar_hash_value
```

---

## Rate Limits
- Balance Inquiry: 10 requests per minute
- Cash Withdrawal: 5 requests per minute
- Cash Deposit: 5 requests per minute
- Mini Statement: 10 requests per minute
- Other endpoints: 20 requests per minute

---

## Transaction Limits

### Cash Withdrawal
- Minimum: ₹50
- Maximum: ₹10,000 per transaction
- Daily limit: ₹25,000 per Aadhaar
- Must be in multiples of ₹50

### Cash Deposit
- Minimum: ₹1
- Maximum: ₹50,000 per transaction
- Daily limit: ₹2,00,000 per Aadhaar

---

## Charges Structure

| Transaction Type | Charge Amount |
|------------------|---------------|
| Balance Inquiry  | ₹5           |
| Cash Withdrawal  | ₹15          |
| Cash Deposit     | ₹10          |
| Mini Statement   | ₹5           |

*Charges are deducted from the user's wallet balance.*

---

## Integration Notes

1. **Biometric Device**: Ensure proper biometric device integration for capturing PID data
2. **Encryption**: All biometric data must be encrypted before transmission
3. **Error Handling**: Implement proper error handling for network timeouts and service unavailability
4. **Logging**: All transactions are logged for audit purposes
5. **Compliance**: Ensure compliance with RBI guidelines for AEPS transactions

---

## Testing

For testing purposes, you can use the following test data:

### Test Aadhaar Numbers
- Valid: `999999990019` (Test Aadhaar with valid checksum)
- Invalid: `123456789012` (Invalid checksum)

### Test Bank IINs
- SBI: `607152`
- HDFC: `607153`
- ICICI: `607154`

**Note**: Use only test data in development environment. Never use real Aadhaar numbers or biometric data for testing.

---

## Support

For technical support or integration assistance, contact:
- Email: support@traepay4u.com
- Documentation: [API Documentation Portal]
- Status Page: [Service Status Page]