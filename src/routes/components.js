const express = require('express');
const {
  getComponents,
  getComponent,
  createComponent,
  updateComponent,
  deleteComponent,
  searchComponents,
  getComponentAnalytics,
  duplicateComponent
} = require('../controllers/componentController');
const { protect, authorize } = require('../middleware/auth');
const { validateComponent } = require('../middleware/validation');

const router = express.Router();

// Public routes (with authentication)
router.use(protect);

router.route('/')
  .get(getComponents)
  .post(authorize('designer', 'admin'), validateComponent, createComponent);

router.get('/search', searchComponents);

router.route('/:id')
  .get(getComponent)
  .put(authorize('designer', 'admin'), validateComponent, updateComponent)
  .delete(authorize('designer', 'admin'), deleteComponent);

router.get('/:id/analytics', getComponentAnalytics);
router.post('/:id/duplicate', authorize('designer', 'admin'), duplicateComponent);

module.exports = router;