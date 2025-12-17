const express = require('express');
const router = express.Router();
const contextController = require('../controllers/context.controller');
const { authenticate } = require('../middlewares/auth');

// All context routes require authentication
router.use(authenticate);

router.post('/update', contextController.updateContext);

router.get('/current', contextController.getCurrentContext);

router.post('/clear', contextController.clearContext);

router.get('/age', contextController.getContextAge);

module.exports = router;
