const express = require("express");
const faqController = require("../controllers/faqController");

const router = express.Router();

router.post("/generate", faqController.generateFAQs);
router.get("/:resource_id", faqController.getFAQs);

module.exports = router;
