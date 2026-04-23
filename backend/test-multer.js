require('dotenv').config();
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const express = require('express');
const fs = require('fs');
const path = require('path');
const request = require('supertest');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'comfort-haven/users',
  },
});

const upload = multer({ storage: storage });

const app = express();

app.post('/upload', upload.single('file'), (req, res) => {
  res.json({ file: req.file });
});

async function testUpload() {
  const imgPath = path.join(__dirname, 'test.jpg');
  // create dummy file
  const base64Image = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
  fs.writeFileSync(imgPath, Buffer.from(base64Image, 'base64'));

  try {
    const res = await request(app)
      .post('/upload')
      .attach('file', imgPath);
    
    console.log('Multer req.file object:');
    console.log(res.body.file);
  } catch (err) {
    console.error(err);
  } finally {
    fs.unlinkSync(imgPath);
  }
}

testUpload();
