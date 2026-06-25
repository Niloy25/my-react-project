const multer = require("multer");
const path = require("path");
const AppError = require("../utils/AppError");

// Configure storage with unique filenames to avoid collisions
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../uploads/"));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const extension = path.extname(file.originalname).toLowerCase();
    // Keep it clean: fieldname-timestamp-random.ext
    cb(null, `${file.fieldname}-${uniqueSuffix}${extension}`);
  },
});

// Image filter to prevent malicious file execution
const imageFilter = (req, file, cb) => {
  const allowedExtensions = /jpeg|jpg|png|gif|webp/;
  const allowedMimeTypes = /^image\/(jpeg|jpg|png|gif|webp)$/;

  const extCheck = allowedExtensions.test(path.extname(file.originalname).toLowerCase());
  const mimeCheck = allowedMimeTypes.test(file.mimetype);

  if (extCheck && mimeCheck) {
    cb(null, true);
  } else {
    cb(new AppError("Invalid file type. Only JPEG, JPG, PNG, GIF, and WEBP images are allowed.", 400), false);
  }
};

// General document filter
const fileFilter = (req, file, cb) => {
  const allowedExtensions = /jpeg|jpg|png|gif|webp|pdf|doc|docx|xls|xlsx|ppt|pptx|txt|zip|rar/;
  const allowedMimeTypes = /^(image\/|application\/pdf|application\/msword|application\/vnd.openxmlformats-officedocument|application\/vnd.ms-excel|application\/vnd.openxmlformats-officedocument.spreadsheetml|application\/vnd.ms-powerpoint|application\/vnd.openxmlformats-officedocument.presentationml|text\/plain|application\/zip|application\/x-rar-compressed|application\/x-zip-compressed)/;

  const extCheck = allowedExtensions.test(path.extname(file.originalname).toLowerCase());
  const mimeCheck = allowedMimeTypes.test(file.mimetype);

  if (extCheck && mimeCheck) {
    cb(null, true);
  } else {
    cb(new AppError("Invalid file type. Allowed formats: PDF, Word, Excel, PowerPoint, Text, Images, and Zip/Rar archives.", 400), false);
  }
};

// Export instances with specific size limits
const uploadImage = multer({
  storage,
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
});

const uploadFile = multer({
  storage,
  fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB limit
});

module.exports = {
  uploadImage,
  uploadFile,
};
