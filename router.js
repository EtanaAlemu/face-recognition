const express = require("express");
const router = express.Router();

const { train, test } = require("./user.controller");

router.route("/train").post(train);
router.route("/test").post(test);

module.exports = router;
