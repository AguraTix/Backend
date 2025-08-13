const fs = require('fs');
const path = require('path');


// Debug script to check image directories and files
console.log('=== Image Directory Debug ===\n');


const uploadsDir = path.join(__dirname, 'uploads');
const eventsDir = path.join(uploadsDir, 'events');
const foodsDir = path.join(uploadsDir, 'foods');


console.log('Uploads directory:', uploadsDir);
console.log('Events directory:', eventsDir);
console.log('Foods directory:', foodsDir);
console.log('');


// Check if directories exist
console.log('Directory Status:');
console.log('- Uploads:', fs.existsSync(uploadsDir) ? '✅ EXISTS' : '❌ MISSING');
console.log('- Events:', fs.existsSync(eventsDir) ? '✅ EXISTS' : '❌ MISSING');
console.log('- Foods:', fs.existsSync(foodsDir) ? '✅ EXISTS' : '❌ MISSING');
console.log('');

// List files in each directory
try {
  if (fs.existsSync(eventsDir)) {
    const eventFiles = fs.readdirSync(eventsDir);
    console.log('Event images found:', eventFiles.length);
    if (eventFiles.length > 0) {
      console.log('Sample event files:', eventFiles.slice(0, 5));
    }
  }
  
  if (fs.existsSync(foodsDir)) {
    const foodFiles = fs.readdirSync(foodsDir);
    console.log('Food images found:', foodFiles.length);
    if (foodFiles.length > 0) {
      console.log('Sample food files:', foodFiles.slice(0, 5));
    }
  }
} catch (error) {
  console.error('Error reading directories:', error.message);
}

console.log('\n=== End Debug ===');

