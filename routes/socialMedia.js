const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getAuthUrl,
  handleCallback,
  getAccounts,
  getAccount,
  disconnectAccount,
  refreshAccountToken,
} = require('../controllers/socialMediaController');

router.get('/auth/:platform', protect, getAuthUrl);
router.get('/:platform/callback', protect, handleCallback);
router.get('/accounts', protect, getAccounts);
router.get('/accounts/:id', protect, getAccount);
router.delete('/accounts/:id', protect, disconnectAccount);
router.post('/accounts/:id/refresh', protect, refreshAccountToken);


module.exports = router;

