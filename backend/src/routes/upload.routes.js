const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/upload.controller');
const { authenticate } = require('../middlewares/auth');
const { upload } = require('../config/multer');

// All upload routes require authentication
router.use(authenticate);

router.post(
  '/file',
  upload.single('file'),
  uploadController.uploadFile
);

router.post(
  '/multiple',
  upload.array('files', 10),
  uploadController.uploadMultipleFiles
);

router.delete('/:filename', uploadController.deleteFile);

module.exports = router;
