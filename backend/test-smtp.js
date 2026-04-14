const nodemailer = require('nodemailer');
const dns = require('dns');
const { promisify } = require('util');
const resolve4 = promisify(dns.resolve4);

async function testConnection() {
  console.log('Testing SMTP connection...');
  
  try {
    const addresses = await resolve4('smtp.gmail.com');
    const resolvedHost = addresses[0];
    console.log(`Resolved smtp.gmail.com to ${resolvedHost}`);

    const transporter = nodemailer.createTransport({
      host: resolvedHost,
      port: 465,
      secure: true,
      auth: {
        user: 'badamaceeee@gmail.com',
        pass: 'wkupfcavmhderlow'
      },
      tls: {
        servername: 'smtp.gmail.com',
        rejectUnauthorized: false
      },
      connectionTimeout: 10000
    });

    console.log('Verifying connection on port 465...');
    await transporter.verify();
    console.log('✅ Connection to port 465 SUCCESSFUL!');
    
    // Test sending an email
    const info = await transporter.sendMail({
      from: '"Comfort Haven Test" <badamaceeee@gmail.com>',
      to: 'badamaceeee@gmail.com',
      subject: 'SMTP Port 465 Test',
      text: 'If you receive this, port 465 is working!'
    });
    console.log('✅ Test email sent! ID:', info.messageId);

  } catch (err) {
    console.error('❌ Connection Failed:', err.message);
  }
}

testConnection();
