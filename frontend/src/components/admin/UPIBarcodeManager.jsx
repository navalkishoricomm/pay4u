import React, { useState, useEffect } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  Table,
  Button,
  Modal,
  Form,
  Alert,
  Badge,
  Spinner
} from 'react-bootstrap';
import axios from 'axios';

const UPIBarcodeManager = () => {
  const [barcodes, setBarcodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBarcode, setEditingBarcode] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    upiId: '',
    description: '',
    isActive: true,
    isDefault: false
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [alert, setAlert] = useState({ show: false, message: '', variant: 'success' });
  const [stats, setStats] = useState({ total: 0, active: 0, default: null });

  useEffect(() => {
    fetchBarcodes();
    fetchStats();
  }, []);

  const fetchBarcodes = async () => {
    try {
      const response = await axios.get('/upi-barcodes', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const barcodesData = response.data.data.barcodes;
      setBarcodes(barcodesData);
      
      // Update stats with default barcode info
      const defaultBarcode = barcodesData.find(b => b.isDefault);
      setStats(prev => ({ ...prev, default: defaultBarcode }));
    } catch (error) {
      showAlert('Error fetching barcodes', 'danger');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get('/upi-barcodes/admin/stats', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const statsData = response.data.data.stats;
      setStats({
        total: statsData.totalBarcodes || 0,
        active: statsData.activeBarcodes || 0,
        default: null // Will be updated when barcodes are fetched
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const showAlert = (message, variant = 'success') => {
    setAlert({ show: true, message, variant });
    setTimeout(() => setAlert({ show: false, message: '', variant: 'success' }), 5000);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setPreviewUrl(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const submitData = new FormData();
    
    Object.keys(formData).forEach(key => {
      submitData.append(key, formData[key]);
    });
    
    if (selectedFile) {
      submitData.append('barcodeImage', selectedFile);
    }

    try {
      if (editingBarcode) {
        await axios.put(`/upi-barcodes/${editingBarcode._id}`, submitData, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'multipart/form-data'
          }
        });
        showAlert('Barcode updated successfully');
      } else {
        await axios.post('/upi-barcodes', submitData, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'multipart/form-data'
          }
        });
        showAlert('Barcode created successfully');
      }
      
      handleCloseModal();
      fetchBarcodes();
      fetchStats();
    } catch (error) {
      showAlert(error.response?.data?.message || 'Error saving barcode', 'danger');
    }
  };

  const handleEdit = (barcode) => {
    setEditingBarcode(barcode);
    setFormData({
      name: barcode.name,
      upiId: barcode.upiId,
      description: barcode.description || '',
      isActive: barcode.isActive,
      isDefault: barcode.isDefault
    });
    setPreviewUrl(barcode.barcodeUrl);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this barcode?')) {
      try {
        await axios.delete(`/upi-barcodes/${id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        showAlert('Barcode deleted successfully');
        fetchBarcodes();
        fetchStats();
      } catch (error) {
        showAlert('Error deleting barcode', 'danger');
      }
    }
  };

  const handleSetDefault = async (id) => {
    try {
      await axios.put(`/upi-barcodes/${id}/set-default`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      showAlert('Default barcode updated successfully');
      fetchBarcodes();
      fetchStats();
    } catch (error) {
      showAlert('Error setting default barcode', 'danger');
    }
  };

  const handleToggleActive = async (id, isActive) => {
    try {
      await axios.put(`/upi-barcodes/${id}`, { isActive: !isActive }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      showAlert(`Barcode ${!isActive ? 'activated' : 'deactivated'} successfully`);
      fetchBarcodes();
      fetchStats();
    } catch (error) {
      showAlert('Error updating barcode status', 'danger');
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingBarcode(null);
    setFormData({
      name: '',
      upiId: '',
      description: '',
      isActive: true,
      isDefault: false
    });
    setSelectedFile(null);
    setPreviewUrl('');
  };

  const handleOpenModal = () => {
    setEditingBarcode(null);
    setFormData({ name: '', upiId: '', description: '', isActive: true });
    setSelectedFile(null);
    setPreviewUrl('');
    setShowModal(true);
  };

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4">
      <Row className="mb-4">
        <Col>
          <h2>UPI Barcode Management</h2>
          <p className="text-muted">Manage UPI payment barcodes for your application</p>
        </Col>
        <Col xs="auto">
          <Button variant="primary" onClick={handleOpenModal}>
            <i className="fas fa-plus me-2"></i>
            Add New Barcode
          </Button>
        </Col>
      </Row>

      {alert.show && (
        <Alert variant={alert.variant} dismissible onClose={() => setAlert({ show: false, message: '', variant: 'success' })}>
          {alert.message}
        </Alert>
      )}

      {/* Stats Cards */}
      <Row className="mb-4">
        <Col md={4}>
          <Card>
            <Card.Body>
              <h5>Total Barcodes</h5>
              <h3 className="text-primary">{stats.total}</h3>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card>
            <Card.Body>
              <h5>Active Barcodes</h5>
              <h3 className="text-success">{stats.active}</h3>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card>
            <Card.Body>
              <h5>Default Barcode</h5>
              <h6 className="text-info">{stats.default?.name || 'None set'}</h6>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Barcodes Table */}
      <Card>
        <Card.Header>
          <h5 className="mb-0">UPI Barcodes</h5>
        </Card.Header>
        <Card.Body>
          {barcodes.length === 0 ? (
            <div className="text-center py-4">
              <i className="fas fa-qrcode fa-3x text-muted mb-3"></i>
              <p className="text-muted">No barcodes found. Add your first UPI barcode to get started.</p>
            </div>
          ) : (
            <Table responsive striped hover>
              <thead>
                <tr>
                  <th>Preview</th>
                  <th>Name</th>
                  <th>UPI ID</th>
                  <th>Status</th>
                  <th>Default</th>
                  <th>Usage Count</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {barcodes.map((barcode) => (
                  <tr key={barcode._id}>
                    <td>
                      <img 
                        src={barcode.barcodeUrl} 
                        alt={barcode.name}
                        style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                        className="rounded"
                      />
                    </td>
                    <td>
                      <strong>{barcode.name}</strong>
                      {barcode.description && (
                        <div className="text-muted small">{barcode.description}</div>
                      )}
                    </td>
                    <td>
                      <code>{barcode.upiId}</code>
                    </td>
                    <td>
                      <Badge bg={barcode.isActive ? 'success' : 'secondary'}>
                        {barcode.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td>
                      {barcode.isDefault ? (
                        <Badge bg="warning">
                          <i className="fas fa-star me-1"></i>
                          Default
                        </Badge>
                      ) : (
                        <Button 
                          variant="outline-warning" 
                          size="sm"
                          onClick={() => handleSetDefault(barcode._id)}
                        >
                          <i className="far fa-star"></i>
                        </Button>
                      )}
                    </td>
                    <td>{barcode.usageCount || 0}</td>
                    <td>
                      <div className="d-flex gap-2">
                        <Button 
                          variant="outline-primary" 
                          size="sm"
                          onClick={() => handleEdit(barcode)}
                        >
                          <i className="fas fa-edit"></i>
                        </Button>
                        <Button 
                          variant={barcode.isActive ? 'outline-secondary' : 'outline-success'} 
                          size="sm"
                          onClick={() => handleToggleActive(barcode._id, barcode.isActive)}
                        >
                          <i className={`fas fa-${barcode.isActive ? 'pause' : 'play'}`}></i>
                        </Button>
                        <Button 
                          variant="outline-danger" 
                          size="sm"
                          onClick={() => handleDelete(barcode._id)}
                        >
                          <i className="fas fa-trash"></i>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* Add/Edit Modal */}
      <Modal show={showModal} onHide={handleCloseModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingBarcode ? 'Edit UPI Barcode' : 'Add New UPI Barcode'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Barcode Name *</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="Enter barcode name"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>UPI ID *</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.upiId}
                    onChange={(e) => setFormData({ ...formData, upiId: e.target.value })}
                    required
                    placeholder="user@paytm"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Description</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Optional description"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Check
                    type="checkbox"
                    label="Active"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Check
                    type="checkbox"
                    label="Set as Default"
                    checked={formData.isDefault}
                    onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Barcode Image {!editingBarcode && '*'}</Form.Label>
                  <Form.Control
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    required={!editingBarcode}
                  />
                  <Form.Text className="text-muted">
                    Upload a QR code image (PNG, JPG, JPEG). Max size: 5MB
                  </Form.Text>
                </Form.Group>

                {previewUrl && (
                  <div className="text-center">
                    <p className="mb-2">Preview:</p>
                    <img 
                      src={previewUrl} 
                      alt="Preview" 
                      style={{ maxWidth: '200px', maxHeight: '200px' }}
                      className="img-thumbnail"
                    />
                  </div>
                )}
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              {editingBarcode ? 'Update Barcode' : 'Create Barcode'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default UPIBarcodeManager;