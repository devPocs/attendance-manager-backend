const express = require("express");
const multer = require("multer");

const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
}).fields([{ name: "image" }]);

const {
  initEmployee,
  compareImage,
} = require("./../controllers/employeeController");
const router = express.Router();

router.post("/search_employee", initEmployee);
router.post(
  "/compare_image",
  upload,
  async (req, res, next) => {
    if (!req.files.image) {
      return res.status(400).json({ error: "image files not provided" });
    }

    const image = [req.files.image[0].buffer];

    req.image = image;

    next();
  },
  compareImage
);

module.exports = router;
