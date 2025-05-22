const express = require('express');
const { 
  register, 
  login, 
  getMe, 
  updateDetails, 
  updatePassword 
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { validateUser } = require('../middleware/validation');

const router = express.Router();

router.post('/register', validateUser, register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/me', protect, updateDetails);
router.put('/updatepassword', protect, updatePassword);

module.exports = router;
