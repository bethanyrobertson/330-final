const express = require('express');
const {
  importTokens,
  getTokens,
  getToken,
  updateToken,
  deleteToken,
  exportTokens
} = require('../controllers/designTokenController');
const { protect, authorize } = require('../middleware/auth');
const { validateTokenImport } = require('../middleware/validation');

const router = express.Router({ mergeParams: true });

// All routes require authentication
router.use(protect);

// Token management routes
router.post('/import', authorize('designer', 'admin'), validateTokenImport, importTokens);
router.get('/', getTokens);
router.get('/export', exportTokens);
router.route('/:tokenId')
  .get(getToken)
  .put(authorize('designer', 'admin'), updateToken)
  .delete(authorize('designer', 'admin'), deleteToken);

module.exports = router;
