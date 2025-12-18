const path = require('path');
const fs = require('fs');
const { validateFileSize, getFileUrl } = require('../config/multer');

const uploadFile = async (req, res) => {
  try {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'No file uploaded',
          statusCode: 400
        }
      });
    }

    const file = req.file;

    // Validate file size based on category
    try {
      validateFileSize(file);
    } catch (err) {
      return res.status(400).json({
        success: false,
        error: {
          message: err.message,
          statusCode: 400
        }
      });
    }

    // Get file metadata from request body (optional)
    const { title, description } = req.body;

    // Build response with file metadata
    const fileMetadata = {
      id: path.basename(file.filename, path.extname(file.filename)), // Use filename as temp ID
      originalName: file.originalname,
      filename: file.filename,
      mimeType: file.mimetype,
      size: file.size,
      sizeFormatted: formatFileSize(file.size),
      category: file.category,
      url: getFileUrl(file.path),
      path: file.path, // Server-side path (don't expose in production)
      uploadedAt: new Date().toISOString(),
      title: title || file.originalname,
      description: description || null
    };

    console.log(`✅ File uploaded: ${file.originalname} (${fileMetadata.sizeFormatted})`);

    res.status(201).json({
      success: true,
      data: {
        file: fileMetadata
      }
    });
  } catch (err) {
    console.error('Upload error:', err);

    // Clean up uploaded file if error occurs
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      success: false,
      error: {
        message: 'File upload failed',
        statusCode: 500
      }
    });
  }
};

const uploadMultipleFiles = async (req, res) => {
  try {
    // Check if files were uploaded
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'No files uploaded',
          statusCode: 400
        }
      });
    }

    const files = req.files;
    const uploadedFiles = [];
    const failedFiles = [];

    // Validate each file
    for (const file of files) {
      try {
        validateFileSize(file);

        const fileMetadata = {
          id: path.basename(file.filename, path.extname(file.filename)),
          originalName: file.originalname,
          filename: file.filename,
          mimeType: file.mimetype,
          size: file.size,
          sizeFormatted: formatFileSize(file.size),
          category: file.category,
          url: getFileUrl(file.path),
          uploadedAt: new Date().toISOString()
        };

        uploadedFiles.push(fileMetadata);
        console.log(`✅ File uploaded: ${file.originalname}`);
      } catch (err) {
        failedFiles.push({
          originalName: file.originalname,
          error: err.message
        });

        // Clean up failed file
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      }
    }

    res.status(201).json({
      success: true,
      data: {
        uploaded: uploadedFiles,
        failed: failedFiles,
        summary: {
          total: files.length,
          successful: uploadedFiles.length,
          failed: failedFiles.length
        }
      }
    });
  } catch (err) {
    console.error('Multiple upload error:', err);

    // Clean up all uploaded files
    if (req.files) {
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }

    res.status(500).json({
      success: false,
      error: {
        message: 'File upload failed',
        statusCode: 500
      }
    });
  }
};

const deleteFile = async (req, res) => {
  try {
    const { filename } = req.params;

    if (!filename) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Filename is required',
          statusCode: 400
        }
      });
    }

    // Security: Prevent directory traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Invalid filename',
          statusCode: 400
        }
      });
    }

    // Find file in uploads directory (search in date folders)
    const uploadsDir = require('../config/multer').UPLOAD_DIR;
    let filePath = null;

    // Search in date-based subdirectories
    const dateFolders = fs.readdirSync(uploadsDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    for (const folder of dateFolders) {
      const potentialPath = path.join(uploadsDir, folder, filename);
      if (fs.existsSync(potentialPath)) {
        filePath = potentialPath;
        break;
      }
    }

    if (!filePath) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'File not found',
          statusCode: 404
        }
      });
    }

    // Delete file
    fs.unlinkSync(filePath);

    console.log(`🗑️  File deleted: ${filename}`);

    res.status(200).json({
      success: true,
      data: {
        message: 'File deleted successfully',
        filename
      }
    });
  } catch (err) {
    console.error('Delete file error:', err);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to delete file',
        statusCode: 500
      }
    });
  }
};

/**
 * Helper: Format file size to human-readable string
 */
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

module.exports = {
  uploadFile,
  uploadMultipleFiles,
  deleteFile
};
