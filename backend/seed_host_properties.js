const { Client } = require('pg');

async function seedProperties(targetUserId) {
  const client = new Client({
    connectionString: 'postgresql://postgres:ahmad12345@localhost:5432/comfort_haven',
  });

  const properties = [
    {
      title: 'Luxury Villa in Lagos',
      description: 'A beautiful and spacious villa with a pool and sea view. Perfect for family vacations.',
      price: 150000.00,
      location: 'Lagos',
      address: '12 Admiralty Way, Lekki Phase 1',
      status: 'active',
      paymentStatus: 'paid',
      rating: 4.8,
      reviewCount: 15,
      images: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=800&q=80,https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80',
      amenities: 'Wifi,AC,Kitchen,Parking,Pool,Gym',
      lga: 'Eti-Osa',
      bedrooms: 4,
      bathrooms: 4,
      guests: 8,
      latitude: 6.4485,
      longitude: 3.4733
    },
    {
      title: 'Cozy Apartment in Abuja',
      description: 'Modern 2-bedroom apartment in the heart of Wuse 2. Close to restaurants and malls.',
      price: 45000.00,
      location: 'Abuja',
      address: '45 Adetokunbo Ademola Crescent',
      status: 'pending',
      paymentStatus: 'unpaid',
      rating: 0,
      reviewCount: 0,
      images: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80',
      amenities: 'Wifi,AC,Kitchen,Parking',
      lga: 'Abuja Municipal',
      bedrooms: 2,
      bathrooms: 2,
      guests: 4,
      latitude: 9.0765,
      longitude: 7.4833
    },
    {
      title: 'Beachfront Cottage in Lekki',
      description: 'Serene getaway cottage right on the beach. Enjoy the sounds of the ocean.',
      price: 25000.00,
      location: 'Lagos',
      address: 'Eleko Beach Road',
      status: 'rejected',
      paymentStatus: 'unpaid',
      rating: 0,
      reviewCount: 0,
      images: 'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?auto=format&fit=crop&w=800&q=80',
      amenities: 'Kitchen,Parking,Beach Access',
      lga: 'Ibeju-Lekki',
      bedrooms: 1,
      bathrooms: 1,
      guests: 2,
      latitude: 6.4253,
      longitude: 3.5132
    }
  ];

  try {
    await client.connect();
    console.log('Connected to database.');

    for (const prop of properties) {
      const query = `
        INSERT INTO properties (
          "id", "title", "description", "price", "location", "address", "status", "paymentStatus", 
          "rating", "reviewCount", "images", "amenities", "lga", "bedrooms", "bathrooms", 
          "guests", "latitude", "longitude", "ownerId", "createdAt", "updatedAt"
        ) VALUES (
          gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, NOW(), NOW()
        ) RETURNING "id";
      `;
      const values = [
        prop.title, prop.description, prop.price, prop.location, prop.address, prop.status, 
        prop.paymentStatus, prop.rating, prop.reviewCount, prop.images, prop.amenities, 
        prop.lga, prop.bedrooms, prop.bathrooms, prop.guests, prop.latitude, prop.longitude, targetUserId
      ];

      const res = await client.query(query, values);
      console.log(`Added property: ${prop.title} (ID: ${res.rows[0].id})`);
    }

    console.log('Seeding completed successfully!');
  } catch (err) {
    console.error('Error seeding properties:', err);
  } finally {
    await client.end();
  }
}

const targetId = 'a1b0c320-0c4b-40c4-8004-1f07bd665b7d';
seedProperties(targetId);
