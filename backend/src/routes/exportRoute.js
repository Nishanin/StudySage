const express = require("express");
const router = express.Router();
const exportController = require("../controllers/exportController");

router.get("/pdf/:resourceId", exportController.exportPdf);
router.get("/docx/:resourceId", exportController.exportDocx);

module.exports = router;
