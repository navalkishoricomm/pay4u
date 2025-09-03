// Device Fingerprinting and Geolocation Service

class DeviceFingerprintService {
  constructor() {
    this.fingerprint = null;
    this.location = null;
  }

  // Generate device fingerprint
  async generateFingerprint() {
    try {
      const canvas = this.getCanvasFingerprint();
      const webgl = this.getWebGLFingerprint();
      const audio = await this.getAudioFingerprint();
      const screen = this.getScreenFingerprint();
      const timezone = this.getTimezoneFingerprint();
      const fonts = this.getFontFingerprint();
      const plugins = this.getPluginFingerprint();
      const storage = this.getStorageFingerprint();
      
      const fingerprintData = {
        canvas,
        webgl,
        audio,
        screen,
        timezone,
        fonts,
        plugins,
        storage,
        userAgent: navigator.userAgent,
        language: navigator.language,
        platform: navigator.platform,
        cookieEnabled: navigator.cookieEnabled,
        doNotTrack: navigator.doNotTrack,
        hardwareConcurrency: navigator.hardwareConcurrency,
        maxTouchPoints: navigator.maxTouchPoints,
        timestamp: Date.now()
      };

      // Generate hash from fingerprint data
      this.fingerprint = await this.hashFingerprint(JSON.stringify(fingerprintData));
      return {
        fingerprint: this.fingerprint,
        details: fingerprintData
      };
    } catch (error) {
      console.error('Error generating device fingerprint:', error);
      return {
        fingerprint: 'error_' + Date.now(),
        details: { error: error.message }
      };
    }
  }

  // Canvas fingerprinting
  getCanvasFingerprint() {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      canvas.width = 200;
      canvas.height = 50;
      
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillStyle = '#f60';
      ctx.fillRect(125, 1, 62, 20);
      ctx.fillStyle = '#069';
      ctx.fillText('Device Fingerprint', 2, 15);
      ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
      ctx.fillText('Device Fingerprint', 4, 17);
      
      return canvas.toDataURL();
    } catch (error) {
      return 'canvas_error';
    }
  }

  // WebGL fingerprinting
  getWebGLFingerprint() {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      
      if (!gl) return 'webgl_not_supported';
      
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      const vendor = gl.getParameter(debugInfo?.UNMASKED_VENDOR_WEBGL || gl.VENDOR);
      const renderer = gl.getParameter(debugInfo?.UNMASKED_RENDERER_WEBGL || gl.RENDERER);
      
      return {
        vendor,
        renderer,
        version: gl.getParameter(gl.VERSION),
        shadingLanguageVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION)
      };
    } catch (error) {
      return 'webgl_error';
    }
  }

  // Audio fingerprinting
  async getAudioFingerprint() {
    try {
      if (!window.AudioContext && !window.webkitAudioContext) {
        return 'audio_not_supported';
      }
      
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const analyser = audioContext.createAnalyser();
      const gainNode = audioContext.createGain();
      const scriptProcessor = audioContext.createScriptProcessor(4096, 1, 1);
      
      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(10000, audioContext.currentTime);
      
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      
      oscillator.connect(analyser);
      analyser.connect(scriptProcessor);
      scriptProcessor.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.start(0);
      
      return new Promise((resolve) => {
        let samples = [];
        scriptProcessor.onaudioprocess = (event) => {
          const sample = event.inputBuffer.getChannelData(0)[0];
          if (sample) samples.push(sample);
          if (samples.length > 1000) {
            oscillator.stop();
            audioContext.close();
            resolve(samples.slice(0, 50).join(''));
          }
        };
        
        setTimeout(() => {
          oscillator.stop();
          audioContext.close();
          resolve('audio_timeout');
        }, 1000);
      });
    } catch (error) {
      return 'audio_error';
    }
  }

  // Screen fingerprinting
  getScreenFingerprint() {
    return {
      width: screen.width,
      height: screen.height,
      availWidth: screen.availWidth,
      availHeight: screen.availHeight,
      colorDepth: screen.colorDepth,
      pixelDepth: screen.pixelDepth,
      devicePixelRatio: window.devicePixelRatio || 1,
      orientation: screen.orientation?.type || 'unknown'
    };
  }

  // Timezone fingerprinting
  getTimezoneFingerprint() {
    return {
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      timezoneOffset: new Date().getTimezoneOffset(),
      locale: Intl.DateTimeFormat().resolvedOptions().locale
    };
  }

  // Font detection
  getFontFingerprint() {
    const testFonts = [
      'Arial', 'Helvetica', 'Times New Roman', 'Courier New', 'Verdana',
      'Georgia', 'Palatino', 'Garamond', 'Bookman', 'Comic Sans MS',
      'Trebuchet MS', 'Arial Black', 'Impact', 'Calibri', 'Cambria'
    ];
    
    const baseFonts = ['monospace', 'sans-serif', 'serif'];
    const testString = 'mmmmmmmmmmlli';
    const testSize = '72px';
    
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    context.textBaseline = 'top';
    context.font = testSize + ' monospace';
    
    const baselineWidths = {};
    baseFonts.forEach(baseFont => {
      context.font = testSize + ' ' + baseFont;
      baselineWidths[baseFont] = context.measureText(testString).width;
    });
    
    const availableFonts = [];
    testFonts.forEach(font => {
      baseFonts.forEach(baseFont => {
        context.font = testSize + ' ' + font + ', ' + baseFont;
        const width = context.measureText(testString).width;
        if (width !== baselineWidths[baseFont]) {
          availableFonts.push(font);
        }
      });
    });
    
    return [...new Set(availableFonts)];
  }

  // Plugin detection
  getPluginFingerprint() {
    const plugins = [];
    for (let i = 0; i < navigator.plugins.length; i++) {
      const plugin = navigator.plugins[i];
      plugins.push({
        name: plugin.name,
        filename: plugin.filename,
        description: plugin.description
      });
    }
    return plugins;
  }

  // Storage fingerprinting
  getStorageFingerprint() {
    try {
      return {
        localStorage: !!window.localStorage,
        sessionStorage: !!window.sessionStorage,
        indexedDB: !!window.indexedDB,
        webSQL: !!window.openDatabase
      };
    } catch (error) {
      return { error: 'storage_error' };
    }
  }

  // Hash fingerprint data
  async hashFingerprint(data) {
    try {
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(data);
      const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (error) {
      // Fallback hash function
      let hash = 0;
      for (let i = 0; i < data.length; i++) {
        const char = data.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
      }
      return Math.abs(hash).toString(16);
    }
  }

  // Get geolocation
  async getLocation() {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve({ error: 'Geolocation not supported' });
        return;
      }

      const options = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude,
            altitudeAccuracy: position.coords.altitudeAccuracy,
            heading: position.coords.heading,
            speed: position.coords.speed,
            timestamp: position.timestamp
          };
          resolve(this.location);
        },
        (error) => {
          resolve({ 
            error: error.message,
            code: error.code
          });
        },
        options
      );
    });
  }

  // Get MAC address (limited in browsers)
  async getMACAddress() {
    try {
      // This is very limited in modern browsers due to privacy restrictions
      // We can only get network interface info in some cases
      if ('connection' in navigator) {
        return {
          effectiveType: navigator.connection.effectiveType,
          downlink: navigator.connection.downlink,
          rtt: navigator.connection.rtt,
          saveData: navigator.connection.saveData
        };
      }
      return { error: 'Network info not available' };
    } catch (error) {
      return { error: error.message };
    }
  }

  // Get comprehensive device info
  async getDeviceInfo() {
    const fingerprint = await this.generateFingerprint();
    const location = await this.getLocation();
    const macInfo = await this.getMACAddress();
    
    return {
      fingerprint: fingerprint.fingerprint,
      fingerprintDetails: fingerprint.details,
      location,
      networkInfo: macInfo,
      browserInfo: {
        name: this.getBrowserName(),
        version: this.getBrowserVersion(),
        platform: navigator.platform,
        language: navigator.language,
        languages: navigator.languages,
        cookieEnabled: navigator.cookieEnabled,
        javaEnabled: navigator.javaEnabled ? navigator.javaEnabled() : false,
        onLine: navigator.onLine,
        screenResolution: `${screen.width}x${screen.height}`,
        colorDepth: screen.colorDepth,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      timestamp: new Date().toISOString()
    };
  }

  // Browser detection
  getBrowserName() {
    const userAgent = navigator.userAgent;
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    if (userAgent.includes('Opera')) return 'Opera';
    return 'Unknown';
  }

  getBrowserVersion() {
    const userAgent = navigator.userAgent;
    const match = userAgent.match(/(Chrome|Firefox|Safari|Edge|Opera)\/(\d+)/);
    return match ? match[2] : 'Unknown';
  }
}

export default new DeviceFingerprintService();