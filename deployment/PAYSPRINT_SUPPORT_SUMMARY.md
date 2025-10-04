# Paysprint API Integration Issues - Support Summary

**Date:** September 2, 2025  
**Environment:** UAT (https://sit.paysprint.in)  
**Partner ID:** PS0012468  
**Issue:** All API endpoints returning 500 Internal Server Error with 404 HTML content

## 🔍 Problem Description

We are experiencing persistent 500 Internal Server Error responses from all Paysprint UAT API endpoints. Despite following the official documentation for authentication and request structure, all endpoints return HTML 404 pages instead of JSON responses.

## 📋 Current Configuration

### Base URL
```
https://sit.paysprint.in/service-api/api/v1/service
```

### Authentication Details
- **Partner ID:** PS0012468
- **JWT Algorithm:** HS256
- **JWT Payload Structure:**
  ```json
  {
    "timestamp": "<current_timestamp>",
    "partnerId": "PS0012468",
    "reqid": "<unique_request_id>"
  }
  ```

### Request Headers
```json
{
  "Content-Type": "application/json",
  "Accept": "application/json",
  "Authorization": "Bearer <JWT_TOKEN>",
  "X-Partner-Id": "PS003214",
  "X-API-Version": "v1",
  "PARTNERID": "PS0012468",
  "AES_KEY": "060e37d1XXXXXXXX",
  "AES_IV": "788a4b95XXXXXXXX"
}
```

## 🚨 Specific Issues Encountered

### 1. Bank List Endpoint
**URL:** `https://sit.paysprint.in/service-api/api/v1/service/dmt/banklist`  
**Method:** GET  
**Response:** 500 Internal Server Error with HTML 404 page

### 2. Balance Check Endpoint
**URL:** `https://sit.paysprint.in/service-api/api/v1/service/balance`  
**Method:** GET  
**Response:** 500 Internal Server Error with HTML 404 page

### 3. Query Remitter Endpoint
**URL:** `https://sit.paysprint.in/service-api/api/v1/service/dmt/remitter/queryremitter`  
**Method:** POST  
**Body:** `{"mobile": "9999999999"}`  
**Response:** 500 Internal Server Error with empty content

## 📊 Response Analysis

### Common Response Headers
```
server: Apache
x-powered-by: PAYSPRINT PVT LTD
strict-transport-security: max-age=31536000; includeSubDomains
access-control-allow-origin: https://sit.paysprint.in
```

### Response Content
All GET endpoints return HTML 404 page content instead of JSON:
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <title>404 Page Not Founds</title>
</head>
<body>
    <div class="welcome_screen">
        <div class="content_blk">
            <img src="asset/images/_default/404.png">
        </div>
    </div>
</body>
</html>
```

## 🔧 Troubleshooting Steps Completed

1. ✅ **URL Structure Verification**
   - Tested multiple base URL variations
   - Confirmed using documented UAT URL structure

2. ✅ **Authentication Implementation**
   - JWT token generation with correct payload
   - HS256 algorithm implementation
   - All required headers included

3. ✅ **Request Format Validation**
   - JSON content-type headers
   - Proper HTTP methods (GET/POST)
   - AES encryption for POST body data

4. ✅ **Environment Testing**
   - Tested both production and UAT environments
   - UAT environment shows server response (500 vs 404)

## 📁 Production Logs Available

Detailed production logs have been generated and are available in the following files:

1. **Complete Support Logs:** `production_logs/paysprint_support_logs_2025-09-02.json`
2. **Request Logs:** `production_logs/requests_2025-09-02.json`
3. **Response Logs:** `production_logs/responses_2025-09-02.json`

These logs contain:
- Complete request/response cycles
- Full headers and body data
- Error stack traces
- Timing information
- Request IDs for tracking

## 🎯 Specific Questions for Paysprint Support

1. **URL Verification:** Is the UAT base URL `https://sit.paysprint.in/service-api/api/v1/service` correct?

2. **Authentication:** Are there any missing headers or authentication parameters?

3. **Partner Credentials:** Are the provided UAT credentials (PS0012468) active and properly configured?

4. **Endpoint Availability:** Are the following endpoints available in UAT?
   - `/dmt/banklist`
   - `/balance`
   - `/dmt/remitter/queryremitter`

5. **Request Format:** Is there a specific request format or additional parameters required?

6. **AES Encryption:** Is AES encryption mandatory for all requests or only specific endpoints?

## 🚀 Next Steps Required

1. **Immediate:** Verify UAT environment endpoint availability
2. **Authentication:** Confirm all required headers and authentication parameters
3. **Bank List:** Once resolved, we need to extract bank IDs for transaction requests
4. **Production:** Provide production credentials and URL for live integration

## 📞 Contact Information

**Technical Contact:** Development Team  
**Integration Type:** DMT (Domestic Money Transfer)  
**Priority:** High - Blocking production deployment

---

**Note:** All sensitive credentials have been masked in this document. Complete logs with full authentication details are available in the attached JSON files.