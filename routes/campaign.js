const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  createCampaign,
  getCampaigns,
  getCampaign
} = require('../controllers/compaginController');



router.route('/')
  .get(getCampaigns)
  .post(createCampaign);

router.route('/:id')
  .get(getCampaign);

module.exports = router;
