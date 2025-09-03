# Admin Utility Scripts

This directory contains utility scripts for managing admin users and system maintenance.

## Available Scripts

### 1. Reset Admin Password
```bash
node scripts/resetAdminPassword.js
```

**Purpose:** Resets the admin user password or creates a new admin user if none exists.

**Features:**
- Finds existing admin user by role
- If no admin exists, creates a new one
- Resets password to default: `Admin@123`
- Provides clear feedback with email and password details

**Default Admin Credentials:**
- Email: `admin@pay4u.com`
- Password: `Admin@123`
- Role: `admin`

### 2. Check Admin User
```bash
node scripts/checkAdminUser.js
```

**Purpose:** Displays current admin user information without making changes.

**Information Displayed:**
- Email address
- Full name
- Phone number
- User ID
- Creation date
- Last update date
- Password change date

## Security Notes

⚠️ **Important Security Reminders:**

1. **Change Default Password:** Always change the default password `Admin@123` after logging in
2. **Secure Access:** These scripts have direct database access - use carefully
3. **Environment:** Ensure proper `.env` configuration for database connection
4. **Backup:** Consider backing up user data before running reset scripts

## Usage Examples

### First Time Setup
```bash
# Check if admin exists
node scripts/checkAdminUser.js

# Create/reset admin if needed
node scripts/resetAdminPassword.js
```

### Password Recovery
```bash
# Reset forgotten admin password
node scripts/resetAdminPassword.js
```

### System Verification
```bash
# Verify admin account details
node scripts/checkAdminUser.js
```

## Troubleshooting

- **Database Connection Error:** Check your `.env` file for correct `MONGODB_URI`
- **Permission Issues:** Ensure the scripts have read/write access to the database
- **Multiple Admins:** The scripts work with the first admin user found by role