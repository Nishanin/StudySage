const fs = require('fs');
const fsPromises = require('fs').promises;
const path = require('path');
const convert = require('libreoffice-convert');

class ConversionService {
  /**
   * Convert PowerPoint file to PDF
   * @param {string} inputPath - Path to the input PPT file
   * @param {string} outputPath - Path where PDF will be saved
   * @returns {Promise<string>} - Path to the converted PDF
   */
  static async convertPptToPdf(inputPath, outputPath) {
    return new Promise((resolve, reject) => {
      try {
        if (!fs.existsSync(inputPath)) {
          return reject(new Error(`Input file not found: ${inputPath}`));
        }

        // Create output directory if it doesn't exist
        const outputDir = path.dirname(outputPath);
        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true });
        }

        // Read the input file
        const docFile = fs.readFileSync(inputPath);

        // Convert to PDF
        convert({
          files: [docFile],
          format: 'pdf',
          libreoffice: process.env.LIBREOFFICE_PATH || '/usr/bin/libreoffice'
        }, (err, result) => {
          if (err) {
            console.error('❌ Conversion error:', err);
            return reject(new Error(`Failed to convert file: ${err.message}`));
          }

          // Write PDF to output path
          fs.writeFileSync(outputPath, result);
          console.log(`✅ Converted ${inputPath} to ${outputPath}`);
          resolve(outputPath);
        });
      } catch (error) {
        console.error('❌ Conversion error:', error);
        reject(new Error(`Failed to convert file: ${error.message}`));
      }
    });
  }

  /**
   * Get or create PDF version of a document
   * @param {string} resourceId - Resource ID
   * @param {string} inputPath - Path to source file
   * @param {string} fileType - MIME type of file
   * @returns {Promise<string>} - Path to PDF file
   */
  static async getPdfVersion(resourceId, inputPath, fileType) {
    const uploadDir = path.join(__dirname, '../../uploads');
    const pdfPath = path.join(uploadDir, `${resourceId}.pdf`);

    // If it's already a PDF, return the path
    if (fileType === 'application/pdf' && fs.existsSync(inputPath)) {
      return inputPath;
    }

    // If PDF already exists, return it
    if (fs.existsSync(pdfPath)) {
      console.log(`📄 Using existing PDF: ${pdfPath}`);
      return pdfPath;
    }

    // Convert to PDF
    if (fileType.includes('presentation') || fileType.includes('powerpoint')) {
      console.log(`🔄 Converting PowerPoint to PDF: ${inputPath}`);
      return await this.convertPptToPdf(inputPath, pdfPath);
    }

    throw new Error(`Unsupported file type for conversion: ${fileType}`);
  }
}

module.exports = ConversionService;
