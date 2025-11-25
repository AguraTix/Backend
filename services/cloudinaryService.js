const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  throw new Error('Cloudinary configuration error: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET must all be set in the environment');
}

/**
 * Upload a file from local storage to Cloudinary
 * @param {string} filePath - Path to the local file
 * @param {string} folder - Cloudinary folder (e.g., 'events', 'foods')
 * @param {string} publicId - Optional public ID for the image
 * @returns {Promise<Object>} Cloudinary upload result with secure_url
 */
async function uploadToCloudinary(filePath, folder = 'agura', publicId = null) {
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const options = {
      folder: folder,
      resource_type: 'auto', // Automatically detect image, video, etc.
      overwrite: true,
    };

    if (publicId) {
      options.public_id = publicId;
    }

    const result = await cloudinary.uploader.upload(filePath, options);
    
    return {
      public_id: result.public_id,
      secure_url: result.secure_url,
      url: result.url,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes,
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error(`Failed to upload to Cloudinary: ${error.message}`);
  }
}

/**
 * Upload a buffer directly to Cloudinary (without saving to disk first)
 * @param {Buffer} buffer - File buffer
 * @param {string} folder - Cloudinary folder
 * @param {string} filename - Original filename
 * @returns {Promise<Object>} Cloudinary upload result
 */
async function uploadBufferToCloudinary(buffer, folder = 'agura', filename = null) {
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      folder: folder,
      resource_type: 'auto',
    };

    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          return reject(new Error(`Failed to upload to Cloudinary: ${error.message}`));
        }
        resolve({
          public_id: result.public_id,
          secure_url: result.secure_url,
          url: result.url,
          width: result.width,
          height: result.height,
          format: result.format,
          bytes: result.bytes,
        });
      }
    );

    uploadStream.end(buffer);
  });
}

/**
 * Delete an image from Cloudinary
 * @param {string} publicId - Cloudinary public ID
 * @returns {Promise<Object>} Deletion result
 */
async function deleteFromCloudinary(publicId) {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw new Error(`Failed to delete from Cloudinary: ${error.message}`);
  }
}

/**
 * Delete a local file after successful Cloudinary upload
 * @param {string} filePath - Path to the local file
 */
function deleteLocalFile(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`Deleted local file: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error deleting local file ${filePath}:`, error);
    // Don't throw - local file deletion failure shouldn't break the flow
  }
}

/**
 * Extract public ID from Cloudinary URL
 * @param {string} url - Cloudinary URL
 * @returns {string|null} Public ID or null
 */
function extractPublicIdFromUrl(url) {
  if (!url) return null;
  
  try {
    // Cloudinary URL format: https://res.cloudinary.com/{cloud_name}/image/upload/{version}/{public_id}.{format}
    const match = url.match(/\/upload\/[^\/]+\/(.+)\.(jpg|jpeg|png|gif|webp)/i);
    if (match) {
      return match[1].replace(/^v\d+\//, ''); // Remove version prefix if present
    }
    
    // Try to extract from public_id in URL
    const publicIdMatch = url.match(/\/upload\/(.+)$/);
    if (publicIdMatch) {
      const pathParts = publicIdMatch[1].split('/');
      const filename = pathParts[pathParts.length - 1];
      return filename.replace(/\.(jpg|jpeg|png|gif|webp)$/i, '');
    }
    
    return null;
  } catch (error) {
    console.error('Error extracting public ID:', error);
    return null;
  }
}

module.exports = {
  uploadToCloudinary,
  uploadBufferToCloudinary,
  deleteFromCloudinary,
  deleteLocalFile,
  extractPublicIdFromUrl,
};
