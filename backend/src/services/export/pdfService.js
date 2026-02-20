const PDFDocument = require("pdfkit");

function generatePdf(documentModel, res) {
  const doc = new PDFDocument({
    margin: 72,
    size: "A4",
    bufferPages: true, // CRITICAL
  });

  doc.pipe(res);

  // =========================
  // Render Content
  // =========================

  let first = true;

  for (const block of documentModel) {
    if (!first) doc.moveDown(1.5);
    first = false;

    if (block.type === "heading") {
      doc
        .fontSize(20)
        .font("Helvetica-Bold")
        .fillColor("black")
        .text(block.text, { align: "left" });
    } else if (block.type === "paragraph") {
      doc
        .fontSize(12)
        .font("Helvetica")
        .fillColor("black")
        .text(block.text, { align: "left" });
    } else if (block.type === "bulletList" && Array.isArray(block.items)) {
      doc.fontSize(12).font("Helvetica").fillColor("black");

      for (const item of block.items) {
        doc.text(`• ${item}`, {
          indent: 20,
          lineGap: 4,
        });
      }
    }
  }

  // =========================
  // Add Page Numbers (SAFE)
  // =========================

  const range = doc.bufferedPageRange(); // AFTER rendering
  const pageCount = range.count;

  for (let i = 0; i < pageCount; i++) {
    doc.switchToPage(i);

    doc
      .fontSize(10)
      .fillColor("gray")
      .text(`Page ${i + 1} of ${pageCount}`, 0, doc.page.height - 40, {
        align: "center",
      });
  }

  doc.end();
}

module.exports = generatePdf;
