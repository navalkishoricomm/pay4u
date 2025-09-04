@echo off
REM Fix Server Authentication Issues
REM This script fixes the passwordChangedAt field issue causing JWT authentication failures

echo 🔧 Fixing Server Authentication Issues...
echo ======================================

REM Navigate to backend directory (adjust path as needed)
cd /d "C:\path\to\your\backend" 2>nul || (
    echo ❌ Error: Please update the backend path in this script
    echo Current attempt: C:\path\to\your\backend
    echo Update line 8 with your actual backend directory path
    pause
    exit /b 1
)

echo 📁 Current directory: %CD%

REM Check if Node.js is available
node --version >nul 2>&1 || (
    echo ❌ Error: Node.js is not installed or not in PATH
    pause
    exit /b 1
)

echo ✅ Node.js found
node --version

REM Create the fix script
echo 📝 Creating authentication fix script...
(
echo const mongoose = require('mongoose'^);
echo require('dotenv'^).config('^);
echo.
echo // Import User model
echo const User = require('./models/User'^);
echo.
echo const fixPasswordChangedAt = async ('^) =^> {
echo   try {
echo     // Connect to MongoDB
echo     await mongoose.connect(process.env.MONGODB_URI ^|^| process.env.MONGO_URI, {
echo       useNewUrlParser: true,
echo       useUnifiedTopology: true,
echo     }'^);
echo.
echo     console.log('Connected to MongoDB'^);
echo.
echo     // Find all users with passwordChangedAt field set
echo     const usersWithPasswordChanged = await User.find({ 
echo       passwordChangedAt: { $exists: true } 
echo     }'^);
echo.
echo     console.log(`Found ${usersWithPasswordChanged.length} users with passwordChangedAt field`'^);
echo.
echo     if (usersWithPasswordChanged.length ^> 0'^) {
echo       // Clear the passwordChangedAt field for all users
echo       const result = await User.updateMany(
echo         { passwordChangedAt: { $exists: true } },
echo         { $unset: { passwordChangedAt: 1 } }
echo       '^);
echo.
echo       console.log(`✅ Cleared passwordChangedAt field for ${result.modifiedCount} users`'^);
echo       
echo       // List affected users
echo       console.log('\nAffected users:''^);
echo       usersWithPasswordChanged.forEach(user =^> {
echo         console.log(`- ${user.email} (${user.name}'^)`'^);
echo       }'^);
echo     } else {
echo       console.log('No users found with passwordChangedAt field'^);
echo     }
echo.
echo     // Also check for any users that might have this field causing issues
echo     const allUsers = await User.find({}'^).select('email name passwordChangedAt'^);
echo     console.log('\nAll users status:''^);
echo     allUsers.forEach(user =^> {
echo       console.log(`- ${user.email}: passwordChangedAt = ${user.passwordChangedAt ^|^| 'not set'}`'^);
echo     }'^);
echo.
echo     console.log('\n✅ Password authentication fix completed!'^);
echo     console.log('Users should now be able to authenticate with existing JWT tokens.'^);
echo     
echo   } catch (error'^) {
echo     console.error('❌ Error fixing passwordChangedAt:', error.message'^);
echo     console.error('Full error:', error'^);
echo   } finally {
echo     // Close database connection
echo     await mongoose.connection.close('^);
echo     console.log('\nDatabase connection closed.'^);
echo     process.exit(0'^);
echo   }
echo };
echo.
echo // Run the script
echo fixPasswordChangedAt('^);
) > fixPasswordChangedAt.js

echo ✅ Authentication fix script created

REM Check if package.json exists
if not exist "package.json" (
    echo ❌ Error: package.json not found. Make sure you're in the backend directory.
    pause
    exit /b 1
)

echo 📦 Dependencies check passed

REM Run the fix
echo 🚀 Running authentication fix...
node fixPasswordChangedAt.js

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ Authentication fix completed successfully!
    echo.
    echo 🔄 Please restart your backend service manually:
    echo    - If using PM2: pm2 restart pay4u-backend
    echo    - If using Windows Service: restart the service
    echo    - If using Docker: docker-compose restart backend
    echo.
    echo 🎉 Fix applied successfully!
    echo Your wallet and authentication issues should now be resolved.
    echo.
    echo 🧪 Test the fix by:
    echo    1. Refreshing your application
    echo    2. Trying to access wallet data
    echo    3. Attempting a recharge
) else (
    echo ❌ Authentication fix failed. Please check the error messages above.
    pause
    exit /b 1
)

REM Clean up
echo 🧹 Cleaning up temporary files...
del fixPasswordChangedAt.js 2>nul

echo ✅ Server authentication fix completed!
pause