const multer = require('multer');
const path = require('path');

// Configure storage (store files on disk for food images)
const storage = multer.memoryStorage();

// Middleware for event image uploads (unchanged)
const uploadCombined = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.fieldname !== 'event_image' && file.fieldname !== 'event_images') {
      return cb(new Error('Unexpected field name. Use "event_image" for main event image and "event_images" for additional event images.'));
    }
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'));
    }
    cb(null, true);
  },
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB limit per file
  },
}).fields([
  { name: 'event_image', maxCount: 1 },
  { name: 'event_images', maxCount: 20 },
]);

// Middleware for food image uploads (updated to match controller)
const uploadFoodImage = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.fieldname !== 'foodimage') {
      return cb(new Error('Unexpected field name. Use "foodimage" for the food item image.'));
    }
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'));
    }
    cb(null, true);
  },
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB limit per file
    files: 1, // Only one food image allowed
  },
}).single('foodimage');

// Error handling middleware (unchanged)
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: `Multer error: ${err.message}` });
  }
  if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
};

module.exports = {
  uploadCombined,
  uploadFoodImage,
  handleUploadError,
};