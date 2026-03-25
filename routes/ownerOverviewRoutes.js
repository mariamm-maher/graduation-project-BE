const express = require('express');
const ownerOverviewController = require('../controllers/ownerOverviewController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.get(
  '/overview',
  authenticate,
  authorize('OWNER'),
  ownerOverviewController.getOwnerOverview
);

module.exports = router;
