const fs = require('fs');
const path = require('path');

// Read the built JavaScript file
const buildDir = path.join(__dirname, 'frontend', 'build', 'static', 'js');
const jsFiles = fs.readdirSync(buildDir).filter(file => file.endsWith('.js') && !file.endsWith('.LICENSE.txt'));

if (jsFiles.length > 0) {
  const jsFile = path.join(buildDir, jsFiles[0]);
  const content = fs.readFileSync(jsFile, 'utf8');
  
  console.log('JavaScript file:', jsFiles[0]);
  console.log('Contains /api/api/auth/login:', content.includes('/api/api/auth/login'));
  console.log('Contains /auth/login:', content.includes('/auth/login'));
  console.log('Contains localhost:5000/api:', content.includes('localhost:5000/api'));
  
  // Look for specific patterns
  const apiAuthMatches = content.match(/\/api\/auth\/\w+/g);
  const authMatches = content.match(/\/auth\/\w+/g);
  
  console.log('\nAPI auth patterns found:', apiAuthMatches ? apiAuthMatches.slice(0, 5) : 'None');
  console.log('Auth patterns found:', authMatches ? authMatches.slice(0, 5) : 'None');
} else {
  console.log('No JavaScript files found in build directory');
}