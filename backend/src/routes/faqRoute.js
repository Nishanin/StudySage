const express = require("express");
const faqController = require("../controllers/faqController");

const router = express.Router();

router.post("/generate", faqController.generateFAQs);
router.get("/", faqController.getFAQs);

module.exports = router;
