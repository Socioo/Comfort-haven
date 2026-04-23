require('dotenv').config();
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

async function testUpload() {
  try {
    console.log('Cloudinary Config:', {
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      hasKey: !!process.env.CLOUDINARY_API_KEY,
      hasSecret: !!process.env.CLOUDINARY_API_SECRET
    });

    console.log('Creating dummy image...');
    const imgPath = path.join(__dirname, 'test.jpg');
    // We need a real image or a valid base64 string for cloudinary
    const base64Image = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
    
    console.log('Uploading to Cloudinary...');
    const result = await cloudinary.uploader.upload(base64Image, {
      folder: 'comfort-haven/users'
    });
    
    console.log('Upload successful! Result:');
    console.log('Secure URL:', result.secure_url);
    console.log('Path property exists?:', !!result.path); // check if 'path' exists

  } catch (error) {
    console.error('Test failed!');
    console.error(error);
  }
}

testUpload();
