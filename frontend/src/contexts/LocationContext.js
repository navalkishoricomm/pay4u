import React, { createContext, useContext, useState, useEffect } from 'react';
import locationService from '../services/locationService';

const LocationContext = createContext();

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};

export const LocationProvider = ({ children }) => {
  const [locationData, setLocationData] = useState(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if location permission was previously granted
    checkExistingPermission();
  }, []);

  const checkExistingPermission = async () => {
    if (navigator.permissions) {
      try {
        const permission = await navigator.permissions.query({ name: 'geolocation' });
        if (permission.state === 'granted') {
          setPermissionGranted(true);
          // Optionally get current location if permission is already granted
          // await getCurrentLocation();
        }
      } catch (err) {
        console.log('Permission API not supported');
      }
    }
  };

  const getCurrentLocation = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const position = await locationService.requestLocationPermission();
      const address = await locationService.getAddressFromCoordinates(
        position.latitude,
        position.longitude
      );
      
      const locationData = {
        coordinates: {
          latitude: position.latitude,
          longitude: position.longitude,
          accuracy: position.accuracy,
          altitude: position.altitude,
          altitudeAccuracy: position.altitudeAccuracy,
          heading: position.heading,
          speed: position.speed,
          timestamp: position.timestamp
        },
        address: address,
        formatted: locationService.formatCoordinates(
          position.latitude,
          position.longitude,
          position.accuracy
        )
      };
      
      setLocationData(locationData);
      setPermissionGranted(true);
      return locationData;
      
    } catch (err) {
      setError(err.message);
      setPermissionGranted(false);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const requestLocationPermission = async () => {
    return await getCurrentLocation();
  };

  const clearLocation = () => {
    setLocationData(null);
    setPermissionGranted(false);
    setError(null);
  };

  const updateLocationInRequest = (requestData) => {
    if (locationData && locationData.coordinates) {
      return {
        ...requestData,
        location: {
          latitude: locationData.coordinates.latitude,
          longitude: locationData.coordinates.longitude,
          accuracy: locationData.coordinates.accuracy,
          altitude: locationData.coordinates.altitude,
          timestamp: locationData.coordinates.timestamp,
          address: locationData.address
        }
      };
    }
    return requestData;
  };

  const getLocationForAPI = () => {
    if (locationData && locationData.coordinates) {
      return {
        latitude: locationData.coordinates.latitude,
        longitude: locationData.coordinates.longitude,
        accuracy: locationData.coordinates.accuracy,
        altitude: locationData.coordinates.altitude,
        timestamp: locationData.coordinates.timestamp,
        address: locationData.address
      };
    }
    return null;
  };

  const value = {
    locationData,
    permissionGranted,
    loading,
    error,
    getCurrentLocation,
    requestLocationPermission,
    clearLocation,
    updateLocationInRequest,
    getLocationForAPI,
    isLocationAvailable: () => locationData && locationData.coordinates,
    getFormattedLocation: () => {
      if (locationData && locationData.formatted) {
        return `${locationData.formatted.latitude}, ${locationData.formatted.longitude} (±${locationData.formatted.accuracy})`;
      }
      return 'Location not available';
    },
    getAddressString: () => {
      if (locationData && locationData.address) {
        return locationData.address.formattedAddress || 'Address not available';
      }
      return 'Address not available';
    }
  };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
};

export default LocationContext;