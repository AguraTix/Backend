const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
const eventImagesDir = path.join(uploadsDir, 'events');
const foodImagesDir = path.join(uploadsDir, 'foods');

// Create directories if they don't exist
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}
if (!fs.existsSync(eventImagesDir)) {
    fs.mkdirSync(eventImagesDir, { recursive: true });
}
if (!fs.existsSync(foodImagesDir)) {
    fs.mkdirSync(foodImagesDir, { recursive: true });
}

// Configure storage for event images
const eventStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, eventImagesDir);
    },
    filename: (req, file, cb) => {
        // Generate unique filename with timestamp
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, `event-${uniqueSuffix}${ext}`);
    }
});

// File filter to accept only images
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed!'), false);
    }
};

// Configure multer for event images
const uploadCombined = multer({
    storage: eventStorage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit per file
        files: 21 // 1 event image + up to 20 event images
    }
});

// Middleware for combined uploads
const uploadEventImages = uploadCombined.fields([
    { name: 'event_image', maxCount: 1 },
    { name: 'event_images', maxCount: 20 }
]);

// Error handling middleware
const handleUploadError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                error: 'File too large. Maximum size is 5MB per image.'
            });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                error: 'Too many files. Maximum 1 event image and 20 event images allowed.'
            });
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({
                error: 'Unexpected field name. Use "event_image" for main event image and "event_images" for additional event images.'
            });
        }
        return res.status(400).json({
            error: 'File upload error: ' + err.message
        });
    }
    
    if (err.message === 'Only image files are allowed!') {
        return res.status(400).json({
            error: 'Only image files are allowed.'
        });
    }
    
    next(err);
};

module.exports = {
    uploadEventImages,
    handleUploadError
};