const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const profileController = require('../controllers/profileController');

router.use(authenticate);

router.get('/owner', authorize('OWNER'), profileController.getOwnerProfile);
router.put('/owner', authorize('OWNER'), profileController.updateOwnerProfile);
router.delete('/owner', authorize('OWNER'), profileController.deleteOwnerProfile);
router.get('/owner/completion', authorize('OWNER'), profileController.getOwnerProfileCompletion);

router.get('/influencer', authorize('INFLUENCER'), profileController.getInfluencerProfile);
router.put('/influencer', authorize('INFLUENCER'), profileController.updateInfluencerProfile);
router.delete('/influencer', authorize('INFLUENCER'), profileController.deleteInfluencerProfile);
router.get('/influencer/completion', authorize('INFLUENCER'), profileController.getInfluencerProfileCompletion);

module.exports = router;