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

// Configure storage for food images
const foodStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, foodImagesDir);
    },
    filename: (req, file, cb) => {
        // Generate unique filename with timestamp
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, `food-${uniqueSuffix}${ext}`);
    }
});

// Middleware for event image uploads
const uploadCombined = multer({
    storage: eventStorage,
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
        fileSize: 5 * 1024 * 1024, // 5MB limit per file
    },
}).fields([
    { name: 'event_image', maxCount: 1 },
    { name: 'event_images', maxCount: 20 },
]);

// Middleware for food image uploads
const uploadFoodImage = multer({
    storage: foodStorage,
    fileFilter: (req, file, cb) => {
        // Accept multiple possible field names for food images
        const validFieldNames = ['foodimage', 'food_image', 'image', 'file'];
        if (!validFieldNames.includes(file.fieldname)) {
            return cb(new Error(`Unexpected field name: ${file.fieldname}. Use one of: ${validFieldNames.join(', ')}`));
        }
        if (!file.mimetype.startsWith('image/')) {
            return cb(new Error('Only image files are allowed'));
        }
        cb(null, true);
    },
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit per file
        files: 1, // Only one food image allowed
    },
}).single('foodimage'); // Default field name, but will accept others

// Error handling middleware (improved)
const handleUploadError = (err, req, res, next) => {
    console.error('Upload error:', err);
    
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ 
                error: 'File too large. Maximum size is 5MB.' 
            });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({ 
                error: 'Too many files. Only one image allowed.' 
            });
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({ 
                error: `Unexpected field name: ${err.field}. Use 'foodimage' for the food item image.` 
            });
        }
        return res.status(400).json({ 
            error: `Upload error: ${err.message}` 
        });
    }
    
    if (err) {
        return res.status(400).json({ 
            error: err.message 
        });
    }
    
    next();
};

module.exports = {
    uploadCombined,
    uploadFoodImage,
    handleUploadError,
};