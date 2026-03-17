const { Client } = require('pg');
const bcrypt = require('bcryptjs');

async function checkUser(email) {
  const client = new Client({
    connectionString: 'postgresql://postgres:ahmad12345@localhost:5432/comfort_haven',
  });

  try {
    await client.connect();
    const res = await client.query('SELECT id, email, password, role, "mustChangePassword" FROM users WHERE email = $1', [email]);
    
    console.log(`Found ${res.rows.length} users with email ${email}:`);
    res.rows.forEach(user => {
      console.log({ 
        id: user.id, 
        email: user.email, 
        role: user.role, 
        mustChangePassword: user.mustChangePassword,
        hash: user.password 
      });
    });

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
}

const targetEmail = process.argv[2] || 'badamaceeee@gmail.com';
checkUser(targetEmail);
