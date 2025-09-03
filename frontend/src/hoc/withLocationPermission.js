import React, { useState, useEffect } from 'react';
import { useLocation } from '../contexts/LocationContext';
import LocationPermission from '../components/LocationPermission';
import { Alert } from 'react-bootstrap';

const withLocationPermission = (WrappedComponent, options = {}) => {
  const {
    requireLocation = true,
    showLocationInfo = false,
    skipLocationCheck = false
  } = options;

  return function WithLocationPermissionComponent(props) {
    const {
      locationData,
      permissionGranted,
      loading,
      error,
      requestLocationPermission,
      isLocationAvailable,
      getFormattedLocation,
      getAddressString
    } = useLocation();

    const [showLocationModal, setShowLocationModal] = useState(false);
    const [locationError, setLocationError] = useState('');
    const [canProceed, setCanProceed] = useState(!requireLocation);

    useEffect(() => {
      if (skipLocationCheck) {
        setCanProceed(true);
        return;
      }

      // Check if location is required and not available
      if (requireLocation && !isLocationAvailable()) {
        setShowLocationModal(true);
        setCanProceed(false);
      } else if (isLocationAvailable()) {
        setCanProceed(true);
      }
    }, [requireLocation, skipLocationCheck, isLocationAvailable]);

    const handleLocationGranted = (locationData) => {
      setShowLocationModal(false);
      setLocationError('');
      setCanProceed(true);
    };

    const handleLocationDenied = (errorMessage) => {
      setLocationError(errorMessage);
      if (requireLocation) {
        setCanProceed(false);
      } else {
        setShowLocationModal(false);
        setCanProceed(true);
      }
    };

    const handleRetryLocation = async () => {
      try {
        await requestLocationPermission();
        setShowLocationModal(false);
        setLocationError('');
        setCanProceed(true);
      } catch (err) {
        setLocationError(err.message);
        if (requireLocation) {
          setCanProceed(false);
        }
      }
    };

    // Show loading state while checking location
    if (loading && requireLocation && !skipLocationCheck) {
      return (
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '200px' }}>
          <div className="text-center">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-2">Checking location permissions...</p>
          </div>
        </div>
      );
    }

    // Show error state if location is required but denied
    if (requireLocation && !canProceed && !showLocationModal && locationError) {
      return (
        <div className="container mt-4">
          <Alert variant="danger">
            <Alert.Heading>
              <i className="fas fa-exclamation-triangle me-2"></i>
              Location Access Required
            </Alert.Heading>
            <p>{locationError}</p>
            <hr />
            <div className="d-flex justify-content-end">
              <button 
                className="btn btn-primary"
                onClick={handleRetryLocation}
              >
                <i className="fas fa-redo me-2"></i>
                Try Again
              </button>
            </div>
          </Alert>
        </div>
      );
    }

    return (
      <>
        {/* Location Permission Modal */}
        <LocationPermission
          show={showLocationModal}
          onHide={() => !requireLocation && setShowLocationModal(false)}
          onLocationGranted={handleLocationGranted}
          onLocationDenied={handleLocationDenied}
          requireLocation={requireLocation}
        />

        {/* Location Info Display */}
        {showLocationInfo && isLocationAvailable() && (
          <div className="mb-3">
            <Alert variant="info" className="mb-3">
              <div className="d-flex align-items-center">
                <i className="fas fa-map-marker-alt me-2"></i>
                <div>
                  <strong>Current Location:</strong>
                  <br />
                  <small>
                    <strong>Coordinates:</strong> {getFormattedLocation()}
                    <br />
                    <strong>Address:</strong> {getAddressString()}
                  </small>
                </div>
              </div>
            </Alert>
          </div>
        )}

        {/* Location Error Display */}
        {error && (
          <Alert variant="warning" className="mb-3">
            <i className="fas fa-exclamation-triangle me-2"></i>
            <strong>Location Warning:</strong> {error}
            {!requireLocation && (
              <div className="mt-2">
                <small>You can continue without location access, but some features may be limited.</small>
              </div>
            )}
          </Alert>
        )}

        {/* Render the wrapped component only if we can proceed */}
        {canProceed && (
          <WrappedComponent 
            {...props} 
            locationData={locationData}
            hasLocationPermission={permissionGranted}
            isLocationAvailable={isLocationAvailable()}
          />
        )}
      </>
    );
  };
};

export default withLocationPermission;