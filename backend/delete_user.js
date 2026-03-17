const { Client } = require('pg');

async function fix() {
  const client = new Client({
    connectionString: 'postgresql://postgres:ahmad12345@localhost:5432/comfort_haven',
  });

  try {
    await client.connect();
    const email = 'badamaceeee@gmail.com';
    const res = await client.query('DELETE FROM users WHERE email = $1', [email]);
    console.log(`Successfully deleted ${res.rowCount} user(s) matching ${email}`);
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
}

fix();
