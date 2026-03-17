const bcrypt = require('bcryptjs');

async function debug() {
  const password = "test_password_123";
  const rounds = 10;
  
  console.log('Original Password:', password);
  
  const hash = await bcrypt.hash(password, rounds);
  console.log('Generated Hash:', hash);
  
  const isValid = await bcrypt.compare(password, hash);
  console.log('Is valid (same script):', isValid);
  
  // Try comparing with a different instance of bcryptjs (simulated)
  const isValid2 = await require('bcryptjs').compare(password, hash);
  console.log('Is valid (different require):', isValid2);
}

debug();
