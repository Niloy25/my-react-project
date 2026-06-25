const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { uploadImage, uploadFile } = require("../middleware/uploadMiddleware");
const AppError = require("../utils/AppError");

const router = express.Router();

// Guard all upload endpoints
router.use(protect);

// Helper function to handle multer errors (like size limit) and forward to express error handler
const handleUpload = (multerMiddleware) => {
  return (req, res, next) => {
    multerMiddleware(req, res, (err) => {
      if (err) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return next(new AppError("File size exceeds the allowed limit.", 400));
        }
        return next(err);
      }
      next();
    });
  };
};

// ── 1. Single Image Upload ────────────────────────────────
// POST /api/uploads/single-image (Multipart field: 'image')
router.post(
  "/single-image",
  handleUpload(uploadImage.single("image")),
  (req, res, next) => {
    if (!req.file) {
      return next(new AppError("Please upload an image file.", 400));
    }
    res.status(200).json({
      success: true,
      message: "Image uploaded successfully",
      filePath: `/uploads/${req.file.filename}`,
    });
  }
);

// ── 2. Multiple Image Upload ──────────────────────────────
// POST /api/uploads/multi-image (Multipart field: 'images', Max: 5)
router.post(
  "/multi-image",
  handleUpload(uploadImage.array("images", 5)),
  (req, res, next) => {
    if (!req.files || req.files.length === 0) {
      return next(new AppError("Please upload at least one image.", 400));
    }
    const paths = req.files.map((file) => `/uploads/${file.filename}`);
    res.status(200).json({
      success: true,
      message: `${req.files.length} images uploaded successfully`,
      filePaths: paths,
    });
  }
);

// ── 3. Single File Upload ─────────────────────────────────
// POST /api/uploads/single-file (Multipart field: 'file')
router.post(
  "/single-file",
  handleUpload(uploadFile.single("file")),
  (req, res, next) => {
    if (!req.file) {
      return next(new AppError("Please upload a file.", 400));
    }
    res.status(200).json({
      success: true,
      message: "File uploaded successfully",
      filePath: `/uploads/${req.file.filename}`,
    });
  }
);

// ── 4. Multiple File Upload ───────────────────────────────
// POST /api/uploads/multi-file (Multipart field: 'files', Max: 5)
router.post(
  "/multi-file",
  handleUpload(uploadFile.array("files", 5)),
  (req, res, next) => {
    if (!req.files || req.files.length === 0) {
      return next(new AppError("Please upload at least one file.", 400));
    }
    const paths = req.files.map((file) => `/uploads/${file.filename}`);
    res.status(200).json({
      success: true,
      message: `${req.files.length} files uploaded successfully`,
      filePaths: paths,
    });
  }
);

module.exports = router;
