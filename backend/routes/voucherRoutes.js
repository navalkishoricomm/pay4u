const express = require('express');
const {
  getAllBrandVouchers,
  getBrandVoucher,
  createBrandVoucher,
  updateBrandVoucher,
  deleteBrandVoucher,
  getVoucherDenominations,
  createVoucherDenomination,
  updateVoucherDenomination,
  deleteVoucherDenomination,
  getVoucherCategories,
  purchaseVoucher,
  getUserVoucherOrders,
  getVoucherOrder,
  useVoucherCode
} = require('../controllers/voucherController');

const { protect, restrictTo } = require('../controllers/authController');

const router = express.Router();

// Public routes
router.get('/categories', getVoucherCategories);
router.get('/brands', getAllBrandVouchers);
router.get('/brands/:id', getBrandVoucher);
router.get('/brands/:id/denominations', getVoucherDenominations);

// Protected user routes
router.use(protect);
router.post('/purchase', purchaseVoucher);
router.get('/my-orders', getUserVoucherOrders);
router.get('/orders/:id', getVoucherOrder);
router.get('/orders/:id/download-file', require('../controllers/voucherController').downloadUserVoucherFile);
router.post('/use-code', useVoucherCode);

// Protected admin routes for brand vouchers
router.use(restrictTo('admin'));

router.post('/brands', createBrandVoucher);
router.put('/brands/:id', updateBrandVoucher);
router.delete('/brands/:id', deleteBrandVoucher);

// Protected admin routes for denominations
router.post('/brands/:id/denominations', createVoucherDenomination);
router.put('/denominations/:id', updateVoucherDenomination);
router.delete('/denominations/:id', deleteVoucherDenomination);

module.exports = router;