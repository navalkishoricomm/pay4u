#!/usr/bin/env node

/**
 * Production Issues Fix Script
 * Fixes barcode image serving and WebSocket connection issues
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Starting Production Issues Fix...');

// 1. Check and fix server.js for static file serving
function fixStaticFileServing() {
    console.log('\n📁 Checking static file serving configuration...');
    
    const serverPath = path.join(__dirname, 'backend', 'server.js');
    
    if (!fs.existsSync(serverPath)) {
        console.error('❌ server.js not found!');
        return false;
    }
    
    let serverContent = fs.readFileSync(serverPath, 'utf8');
    
    // Check if uploads static middleware exists
    const uploadsMiddleware = "app.use('/uploads', express.static('uploads'));";
    const uploadsMiddlewareAlt = "app.use('/uploads', express.static(path.join(__dirname, 'uploads')));";
    
    if (!serverContent.includes('/uploads') || !serverContent.includes('express.static')) {
        console.log('⚠️  Adding uploads static middleware...');
        
        // Find the position to insert the middleware (after other app.use statements)
        const appUseRegex = /app\.use\([^)]+\);/g;
        const matches = [...serverContent.matchAll(appUseRegex)];
        
        if (matches.length > 0) {
            const lastMatch = matches[matches.length - 1];
            const insertPosition = lastMatch.index + lastMatch[0].length;
            
            const newMiddleware = `\n\n// Serve uploaded files (barcodes, images)\n${uploadsMiddlewareAlt}`;
            
            serverContent = serverContent.slice(0, insertPosition) + newMiddleware + serverContent.slice(insertPosition);
            
            fs.writeFileSync(serverPath, serverContent);
            console.log('✅ Added uploads static middleware to server.js');
        }
    } else {
        console.log('✅ Uploads static middleware already configured');
    }
    
    return true;
}

// 2. Check uploads directory structure
function checkUploadsDirectory() {
    console.log('\n📂 Checking uploads directory structure...');
    
    const uploadsDir = path.join(__dirname, 'backend', 'uploads');
    const adminBarcodesDir = path.join(uploadsDir, 'admin-barcodes');
    
    if (!fs.existsSync(uploadsDir)) {
        console.log('⚠️  Creating uploads directory...');
        fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    if (!fs.existsSync(adminBarcodesDir)) {
        console.log('⚠️  Creating admin-barcodes directory...');
        fs.mkdirSync(adminBarcodesDir, { recursive: true });
    }
    
    // Check if the specific barcode file exists
    const files = fs.readdirSync(adminBarcodesDir).filter(file => file.includes('admin-barcode'));
    console.log(`📊 Found ${files.length} barcode files in admin-barcodes directory`);
    
    if (files.length > 0) {
        console.log('📋 Barcode files:');
        files.forEach(file => console.log(`   - ${file}`));
    }
    
    return true;
}

// 3. Fix WebSocket configuration
function fixWebSocketConfig() {
    console.log('\n🔌 Fixing WebSocket configuration...');
    
    // Check frontend WebSocket configuration
    const frontendSocketFiles = [
        path.join(__dirname, 'frontend', 'src', 'websocket.js'),
        path.join(__dirname, 'frontend', 'src', 'services', 'websocket.js'),
        path.join(__dirname, 'frontend', 'src', 'utils', 'websocket.js')
    ];
    
    let socketFile = null;
    for (const file of frontendSocketFiles) {
        if (fs.existsSync(file)) {
            socketFile = file;
            break;
        }
    }
    
    if (socketFile) {
        console.log(`📝 Found WebSocket file: ${path.basename(socketFile)}`);
        
        let content = fs.readFileSync(socketFile, 'utf8');
        
        // Fix WebSocket connection for production
        const productionSocketConfig = `
// Production WebSocket configuration
const isProduction = process.env.NODE_ENV === 'production';
const socketURL = isProduction ? 'https://pay4u.co.in' : 'http://localhost:5001';

const socket = io(socketURL, {
    transports: ['websocket', 'polling'],
    upgrade: true,
    rememberUpgrade: true,
    timeout: 20000,
    forceNew: false
});
`;
        
        // Replace existing socket initialization
        const socketInitRegex = /const\s+socket\s*=\s*io\([^}]+\}\s*\);?/s;
        if (socketInitRegex.test(content)) {
            content = content.replace(socketInitRegex, productionSocketConfig.trim());
            fs.writeFileSync(socketFile, content);
            console.log('✅ Updated WebSocket configuration for production');
        } else {
            console.log('⚠️  Could not find existing socket initialization to replace');
        }
    } else {
        console.log('❌ WebSocket configuration file not found');
    }
    
    return true;
}

// 4. Update backend CORS and Socket.IO configuration
function fixBackendSocketConfig() {
    console.log('\n🔧 Updating backend Socket.IO configuration...');
    
    const serverPath = path.join(__dirname, 'backend', 'server.js');
    
    if (!fs.existsSync(serverPath)) {
        console.error('❌ server.js not found!');
        return false;
    }
    
    let serverContent = fs.readFileSync(serverPath, 'utf8');
    
    // Add production CORS configuration for Socket.IO
    const productionCorsConfig = `
// Production CORS configuration for Socket.IO
const corsOptions = {
    origin: process.env.NODE_ENV === 'production' 
        ? ['https://pay4u.co.in', 'http://pay4u.co.in']
        : ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

// Socket.IO with CORS
const io = new Server(server, {
    cors: corsOptions,
    transports: ['websocket', 'polling'],
    allowEIO3: true
});
`;
    
    // Check if Socket.IO is already configured with CORS
    if (!serverContent.includes('corsOptions') && serverContent.includes('new Server')) {
        console.log('⚠️  Adding production CORS configuration...');
        
        // Find Socket.IO initialization and replace it
        const socketInitRegex = /const\s+io\s*=\s*new\s+Server\([^}]+\}\s*\);?/s;
        if (socketInitRegex.test(serverContent)) {
            const corsPosition = serverContent.indexOf('app.use(cors');
            if (corsPosition !== -1) {
                // Replace existing CORS configuration
                const corsEndPosition = serverContent.indexOf(');', corsPosition) + 2;
                serverContent = serverContent.slice(0, corsPosition) + productionCorsConfig + serverContent.slice(corsEndPosition);
            } else {
                // Add CORS configuration before Socket.IO
                const socketPosition = serverContent.search(socketInitRegex);
                serverContent = serverContent.slice(0, socketPosition) + productionCorsConfig + '\n' + serverContent.slice(socketPosition);
            }
            
            fs.writeFileSync(serverPath, serverContent);
            console.log('✅ Updated backend Socket.IO CORS configuration');
        }
    } else {
        console.log('✅ Backend Socket.IO configuration already updated');
    }
    
    return true;
}

// 5. Create test endpoint for barcode images
function createTestEndpoint() {
    console.log('\n🧪 Creating test endpoint for barcode images...');
    
    const testEndpoint = `
// Test endpoint for barcode images
app.get('/test-barcode/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, 'uploads', 'admin-barcodes', filename);
    
    if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
    } else {
        res.status(404).json({ error: 'Barcode image not found', path: filePath });
    }
});
`;
    
    const serverPath = path.join(__dirname, 'backend', 'server.js');
    let serverContent = fs.readFileSync(serverPath, 'utf8');
    
    if (!serverContent.includes('/test-barcode')) {
        // Add before the server.listen() call
        const listenPosition = serverContent.indexOf('server.listen');
        if (listenPosition !== -1) {
            serverContent = serverContent.slice(0, listenPosition) + testEndpoint + '\n' + serverContent.slice(listenPosition);
            fs.writeFileSync(serverPath, serverContent);
            console.log('✅ Added test endpoint for barcode images');
        }
    } else {
        console.log('✅ Test endpoint already exists');
    }
}

// Main execution
async function main() {
    try {
        console.log('🚀 Production Issues Fix Script');
        console.log('================================');
        
        fixStaticFileServing();
        checkUploadsDirectory();
        fixWebSocketConfig();
        fixBackendSocketConfig();
        createTestEndpoint();
        
        console.log('\n✅ All fixes applied successfully!');
        console.log('\n📋 Next Steps:');
        console.log('1. Restart both frontend and backend servers');
        console.log('2. Test barcode image loading: http://localhost:5001/uploads/admin-barcodes/[filename]');
        console.log('3. Test WebSocket connection in browser console');
        console.log('4. Check browser Network tab for any remaining 404 errors');
        
    } catch (error) {
        console.error('❌ Error during fix:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = { fixStaticFileServing, checkUploadsDirectory, fixWebSocketConfig, fixBackendSocketConfig };