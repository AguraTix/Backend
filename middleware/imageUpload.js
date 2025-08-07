const multer = require('multer');

// Configure storage to use memory instead of disk
const storage = multer.memoryStorage();

// File filter to accept only images
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed!'), false);
    }
};

// Configure multer for multiple field types
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit per file
        files: 21 // 1 event image + up to 20 event images
    }
});

// Middleware for combined uploads
const uploadCombined = upload.fields([
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
    uploadCombined,
    handleUploadError
};