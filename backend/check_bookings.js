const { Client } = require('pg');

async function checkBookings() {
  const client = new Client({
    connectionString: 'postgresql://postgres:ahmad12345@localhost:5432/comfort_haven',
  });

  try {
    await client.connect();
    
    const columnsRes = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'bookings'");
    console.log('Columns:', columnsRes.rows.map(r => r.column_name).join(', '));

    const last5Res = await client.query(`
      SELECT b.id, b.status, b."totalPrice", b."createdAt", u.email as guest_email, p.title as property_title
      FROM bookings b
      LEFT JOIN users u ON b."guestId" = u.id
      LEFT JOIN properties p ON b."propertyId" = p.id
      ORDER BY b."createdAt" DESC LIMIT 10
    `);
    console.table(last5Res.rows);

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

checkBookings();
