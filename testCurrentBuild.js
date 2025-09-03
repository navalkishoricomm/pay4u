// Test script to check what API URL is being used in the current build
const fs = require('fs');
const path = require('path');

// Read the main JavaScript file from the build
const buildDir = path.join(__dirname, 'frontend', 'build', 'static', 'js');
const files = fs.readdirSync(buildDir);
const mainJsFile = files.find(file => file.startsWith('main.') && file.endsWith('.js'));

if (mainJsFile) {
    const filePath = path.join(buildDir, mainJsFile);
    const content = fs.readFileSync(filePath, 'utf8');
    
    console.log('Main JS file:', mainJsFile);
    
    // Look for API URL patterns
    const apiUrlMatches = content.match(/localhost:5000[^"']*/g);
    if (apiUrlMatches) {
        console.log('Found API URLs in build:', apiUrlMatches);
    } else {
        console.log('No localhost:5000 URLs found in build');
    }
    
    // Look for auth/login patterns
    const authMatches = content.match(/auth\/login/g);
    if (authMatches) {
        console.log('Found auth/login references:', authMatches.length);
    }
    
    // Look for /api/api patterns (the problematic double api)
    const doubleApiMatches = content.match(/\/api\/api/g);
    if (doubleApiMatches) {
        console.log('Found problematic /api/api patterns:', doubleApiMatches.length);
    } else {
        console.log('No /api/api patterns found - this is good!');
    }
} else {
    console.log('Main JS file not found in build directory');
}