class LocationService {
  constructor() {
    this.currentPosition = null;
    this.watchId = null;
    this.permissionGranted = false;
  }

  // Request location permission and get current position
  async requestLocationPermission() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      // Check if permission is already granted
      if (navigator.permissions) {
        navigator.permissions.query({ name: 'geolocation' })
          .then(permission => {
            if (permission.state === 'granted') {
              this.permissionGranted = true;
              this.getCurrentPosition().then(resolve).catch(reject);
            } else if (permission.state === 'denied') {
              reject(new Error('Location permission denied'));
            } else {
              // Request permission
              this.getCurrentPosition().then(resolve).catch(reject);
            }
          })
          .catch(() => {
            // Fallback for browsers that don't support permissions API
            this.getCurrentPosition().then(resolve).catch(reject);
          });
      } else {
        // Fallback for browsers that don't support permissions API
        this.getCurrentPosition().then(resolve).catch(reject);
      }
    });
  }

  // Get current position with high accuracy
  async getCurrentPosition() {
    return new Promise((resolve, reject) => {
      const options = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000 // Cache for 1 minute
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.currentPosition = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude,
            altitudeAccuracy: position.coords.altitudeAccuracy,
            heading: position.coords.heading,
            speed: position.coords.speed,
            timestamp: position.timestamp
          };
          this.permissionGranted = true;
          resolve(this.currentPosition);
        },
        (error) => {
          let errorMessage = 'Location access denied';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location permission denied by user';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information unavailable';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out';
              break;
          }
          reject(new Error(errorMessage));
        },
        options
      );
    });
  }

  // Watch position for continuous tracking
  startWatching(callback, errorCallback) {
    if (!navigator.geolocation) {
      errorCallback(new Error('Geolocation not supported'));
      return;
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 30000
    };

    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        this.currentPosition = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude,
          altitudeAccuracy: position.coords.altitudeAccuracy,
          heading: position.coords.heading,
          speed: position.coords.speed,
          timestamp: position.timestamp
        };
        callback(this.currentPosition);
      },
      errorCallback,
      options
    );
  }

  // Stop watching position
  stopWatching() {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  // Get address from coordinates using reverse geocoding
  async getAddressFromCoordinates(latitude, longitude) {
    try {
      // Using a free geocoding service (you might want to use a paid service for production)
      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
      );
      
      if (!response.ok) {
        throw new Error('Geocoding service unavailable');
      }
      
      const data = await response.json();
      
      return {
        street: data.locality || '',
        city: data.city || data.locality || '',
        state: data.principalSubdivision || '',
        country: data.countryName || '',
        postalCode: data.postcode || '',
        formattedAddress: data.display_name || `${data.city}, ${data.countryName}`
      };
    } catch (error) {
      console.error('Error getting address:', error);
      return {
        street: '',
        city: '',
        state: '',
        country: '',
        postalCode: '',
        formattedAddress: 'Address unavailable'
      };
    }
  }

  // Check if location permission is granted
  isPermissionGranted() {
    return this.permissionGranted;
  }

  // Get current cached position
  getCurrentCachedPosition() {
    return this.currentPosition;
  }

  // Format coordinates for display
  formatCoordinates(latitude, longitude, accuracy) {
    return {
      latitude: parseFloat(latitude).toFixed(6),
      longitude: parseFloat(longitude).toFixed(6),
      accuracy: accuracy ? `±${Math.round(accuracy)}m` : 'Unknown',
      dms: this.convertToDMS(latitude, longitude)
    };
  }

  // Convert decimal degrees to degrees, minutes, seconds
  convertToDMS(latitude, longitude) {
    const convertDMS = (coordinate, isLatitude) => {
      const absolute = Math.abs(coordinate);
      const degrees = Math.floor(absolute);
      const minutesFloat = (absolute - degrees) * 60;
      const minutes = Math.floor(minutesFloat);
      const seconds = ((minutesFloat - minutes) * 60).toFixed(2);
      
      const direction = isLatitude 
        ? (coordinate >= 0 ? 'N' : 'S')
        : (coordinate >= 0 ? 'E' : 'W');
      
      return `${degrees}°${minutes}'${seconds}"${direction}`;
    };

    return {
      latitude: convertDMS(latitude, true),
      longitude: convertDMS(longitude, false)
    };
  }
}

export default new LocationService();