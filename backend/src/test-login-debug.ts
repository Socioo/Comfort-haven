import { Client } from 'pg';
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

async function verifyLogin() {
  const client = new Client({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  });

  try {
    await client.connect();
    console.log('Connected to database');

    const email = process.env.SUPER_ADMIN_EMAIL;
    const password = process.env.SUPER_ADMIN_PASSWORD;

    if (!email || !password) {
      console.error('❌ SUPER_ADMIN_EMAIL or SUPER_ADMIN_PASSWORD is not defined in .env');
      return;
    }

    const res = await client.query('SELECT password FROM users WHERE email = $1', [email]);

    if (res.rows.length > 0) {
      const storedHash = res.rows[0].password;
      console.log('User found. Comparing passwords...');
      console.log(`Testing password: ${password}`);
      
      const isValid = await bcrypt.compare(password, storedHash);
      if (isValid) {
        console.log('✅ Login simulation SUCCESSFUL!');
      } else {
        console.log('❌ Login simulation FAILED! Hash mismatch.');
        console.log(`Stored Hash starts with: ${storedHash.substring(0, 10)}...`);
      }
    } else {
      console.log('❌ User not found!');
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

verifyLogin();
