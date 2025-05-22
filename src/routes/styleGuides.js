const express = require('express');
const {
  getStyleGuides,
  getStyleGuide,
  createStyleGuide,
  updateStyleGuide,
  deleteStyleGuide,
  getStyleGuideComponents,
  addTeamMember
} = require('../controllers/styleGuideController');
const { protect, authorize, checkStyleGuideAccess } = require('../middleware/auth');
const { validateStyleGuide } = require('../middleware/validation');

// Import design token routes
const designTokenRoutes = require('./designTokens');

const router = express.Router();

// All routes require authentication
router.use(protect);

router.route('/')
  .get(getStyleGuides)
  .post(authorize('designer', 'admin'), validateStyleGuide, createStyleGuide);

router.route('/:id')
  .get(getStyleGuide)
  .put(authorize('designer', 'admin'), validateStyleGuide, updateStyleGuide)
  .delete(authorize('admin'), deleteStyleGuide);

router.get('/:id/components', getStyleGuideComponents);
router.post('/:id/team', authorize('designer', 'admin'), addTeamMember);

router.use('/:id/tokens', designTokenRoutes);

module.exports = router;