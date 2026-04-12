import { Client } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

async function verifySuperAdmin() {
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

    const email = process.env.SUPER_ADMIN_EMAIL || 'badamaceeee@gmail.com';
    const res = await client.query('SELECT id, email, role, name FROM users WHERE email = $1', [email]);

    if (res.rows.length > 0) {
      console.log('✅ Super Admin found:');
      console.log(JSON.stringify(res.rows[0], null, 2));
    } else {
      console.log('❌ Super Admin NOT found!');
    }

    const countRes = await client.query('SELECT count(*) FROM users');
    console.log(`Total users in database: ${countRes.rows[0].count}`);

    const propCount = await client.query('SELECT count(*) FROM properties');
    console.log(`Total properties in database: ${propCount.rows[0].count}`);

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

verifySuperAdmin();
