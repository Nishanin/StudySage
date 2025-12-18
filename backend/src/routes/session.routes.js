const express = require('express');
const router = express.Router();
const sessionController = require('../controllers/session.controller');
const { authenticate } = require('../middlewares/auth');

// All session routes require authentication
router.use(authenticate);

router.post('/end', sessionController.endSession);

router.get('/active', sessionController.getActiveSession);

router.get('/duration-estimate', sessionController.getDurationEstimate);

router.get('/history', sessionController.getSessionHistory);

router.get('/config', sessionController.getSessionConfig);

module.exports = router;
