import React, { useState, useEffect } from 'react';
import { Modal, Button, Alert, Spinner } from 'react-bootstrap';
import locationService from '../services/locationService';

const LocationPermission = ({ show, onHide, onLocationGranted, onLocationDenied, requireLocation = true }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [locationData, setLocationData] = useState(null);
  const [permissionStatus, setPermissionStatus] = useState('prompt');

  useEffect(() => {
    if (show) {
      checkPermissionStatus();
    }
  }, [show]);

  const checkPermissionStatus = async () => {
    if (navigator.permissions) {
      try {
        const permission = await navigator.permissions.query({ name: 'geolocation' });
        setPermissionStatus(permission.state);
        
        if (permission.state === 'granted') {
          await requestLocation();
        }
      } catch (err) {
        console.log('Permission API not supported');
      }
    }
  };

  const requestLocation = async () => {
    setLoading(true);
    setError('');
    
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
      setPermissionStatus('granted');
      onLocationGranted(locationData);
      
    } catch (err) {
      setError(err.message);
      setPermissionStatus('denied');
      if (requireLocation) {
        onLocationDenied(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAllowLocation = () => {
    requestLocation();
  };

  const handleDenyLocation = () => {
    setPermissionStatus('denied');
    const errorMsg = 'Location access is required to proceed with transactions for security purposes.';
    setError(errorMsg);
    if (requireLocation) {
      onLocationDenied(errorMsg);
    }
  };

  const handleProceedWithoutLocation = () => {
    if (!requireLocation) {
      onLocationGranted(null);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered backdrop="static" keyboard={false}>
      <Modal.Header>
        <Modal.Title>
          <i className="fas fa-map-marker-alt me-2"></i>
          Location Permission Required
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body>
        {permissionStatus === 'prompt' && (
          <div>
            <Alert variant="info">
              <i className="fas fa-info-circle me-2"></i>
              <strong>Why do we need your location?</strong>
              <ul className="mt-2 mb-0">
                <li>Enhanced security for your transactions</li>
                <li>Fraud prevention and risk assessment</li>
                <li>Compliance with financial regulations</li>
                <li>Better customer support and dispute resolution</li>
              </ul>
            </Alert>
            
            <div className="text-center">
              <i className="fas fa-shield-alt fa-3x text-primary mb-3"></i>
              <p className="mb-3">
                We need access to your location to ensure secure transactions. 
                Your location data is encrypted and used only for security purposes.
              </p>
            </div>
          </div>
        )}
        
        {loading && (
          <div className="text-center">
            <Spinner animation="border" variant="primary" />
            <p className="mt-2">Getting your location...</p>
          </div>
        )}
        
        {error && (
          <Alert variant="danger">
            <i className="fas fa-exclamation-triangle me-2"></i>
            {error}
            {requireLocation && (
              <div className="mt-2">
                <small>
                  <strong>Note:</strong> Location access is mandatory for security compliance. 
                  Please enable location services and try again.
                </small>
              </div>
            )}
          </Alert>
        )}
        
        {locationData && permissionStatus === 'granted' && (
          <Alert variant="success">
            <i className="fas fa-check-circle me-2"></i>
            <strong>Location Access Granted!</strong>
            <div className="mt-2">
              <small>
                <strong>Coordinates:</strong> {locationData.formatted.latitude}, {locationData.formatted.longitude}<br/>
                <strong>Accuracy:</strong> {locationData.formatted.accuracy}<br/>
                <strong>Address:</strong> {locationData.address.formattedAddress}
              </small>
            </div>
          </Alert>
        )}
      </Modal.Body>
      
      <Modal.Footer>
        {permissionStatus === 'prompt' && !loading && (
          <>
            <Button variant="success" onClick={handleAllowLocation}>
              <i className="fas fa-map-marker-alt me-2"></i>
              Allow Location Access
            </Button>
            <Button variant="outline-danger" onClick={handleDenyLocation}>
              <i className="fas fa-times me-2"></i>
              Deny Access
            </Button>
          </>
        )}
        
        {permissionStatus === 'denied' && !requireLocation && (
          <>
            <Button variant="primary" onClick={handleAllowLocation}>
              <i className="fas fa-redo me-2"></i>
              Try Again
            </Button>
            <Button variant="outline-secondary" onClick={handleProceedWithoutLocation}>
              Proceed Without Location
            </Button>
          </>
        )}
        
        {permissionStatus === 'denied' && requireLocation && (
          <Button variant="primary" onClick={handleAllowLocation}>
            <i className="fas fa-redo me-2"></i>
            Try Again
          </Button>
        )}
        
        {permissionStatus === 'granted' && locationData && (
          <Button variant="success" onClick={onHide}>
            <i className="fas fa-check me-2"></i>
            Continue
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  );
};

export default LocationPermission;