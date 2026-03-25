import { Client } from 'pg';

async function seedTickets() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'ahmad12345',
    database: 'comfort_haven',
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Get a user to act as the ticket issuer
    const userRes = await client.query('SELECT id FROM "users" LIMIT 1');
    if (userRes.rows.length === 0) {
      console.log('No users found to attach tickets to');
      return;
    }
    const userId = userRes.rows[0].id;

    // Clear existing tickets first to avoid clutter
    await client.query('DELETE FROM "tickets"');

    // Insert mock tickets
    const res1 = await client.query(`
      INSERT INTO "tickets" ("userId", summary, category, status, "refundId") 
      VALUES ($1, $2, $3, $4, $5) RETURNING id
    `, [userId, 'Sink maintenance', 'Maintenance', 'Open', null]);

    const res2 = await client.query(`
      INSERT INTO "tickets" ("userId", summary, category, status, "refundId") 
      VALUES ($1, $2, $3, $4, $5) RETURNING id
    `, [userId, 'Refund request for cancelled booking', 'Refund', 'In progress', '#REF12345']);

    const res3 = await client.query(`
      INSERT INTO "tickets" ("userId", summary, category, status, "refundId") 
      VALUES ($1, $2, $3, $4, $5) RETURNING id
    `, [userId, 'App keeps crashing on login', 'Technical', 'Open', null]);

    // Insert mock messages for the first ticket
    const ticketId = res1.rows[0].id;
    await client.query(`
      INSERT INTO "ticket_messages" ("ticketId", "senderId", content) 
      VALUES ($1, $2, $3), ($4, $5, $6)
    `, [
      ticketId, userId, 'Hello, my sink is leaking water everywhere.',
      ticketId, userId, 'I need someone to fix it ASAP!'
    ]);

    console.log('Successfully seeded 3 mock support tickets.');
  } catch (error) {
    console.error('Error seeding tickets:', error);
  } finally {
    await client.end();
  }
}

seedTickets();
