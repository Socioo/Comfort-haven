const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const path = require('path');

async function testUpload() {
  try {
    console.log('Logging in...');
    const loginRes = await axios.post('http://localhost:3000/auth/login', {
      email: 'badamaceeee@gmail.com',
      password: 'SuperAdmin123!'
    });
    const token = loginRes.data.access_token;
    const userId = loginRes.data.user.id;
    console.log('Logged in. User ID:', userId);

    console.log('Creating dummy image...');
    const imgPath = path.join(__dirname, 'test.jpg');
    fs.writeFileSync(imgPath, 'fake image data');

    console.log('Uploading image...');
    const form = new FormData();
    form.append('file', fs.createReadStream(imgPath));

    const uploadRes = await axios.post(`http://localhost:3000/users/${userId}/profile-image`, form, {
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${token}`
      }
    });

    console.log('Upload successful! Response:', uploadRes.data);
    
    // Clean up
    fs.unlinkSync(imgPath);
    
  } catch (error) {
    console.error('Test failed!');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error(error.message);
    }
  }
}

testUpload();
