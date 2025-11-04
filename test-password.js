const bcrypt = require('bcrypt');

const storedHash = '$2b$10$hXaci01DdMSQQeKLMnlGPuYUOBt8SKy9PaRAVM29tvX7scha0W62G';

// Test différents mots de passe possibles
const possiblePasswords = [
  'Admin@2024',
  'admin@2024',
  'Admin2024',
  'password',
  'admin',
  'Admin@123',
  'Admin123',
  '123456'
];

console.log('Testing stored hash:', storedHash);
console.log('');

possiblePasswords.forEach(async (password) => {
  const match = await bcrypt.compare(password, storedHash);
  console.log(`Password "${password}": ${match ? '✅ MATCH!' : '❌ No match'}`);
});

// Générer un nouveau hash pour Admin@2024
setTimeout(async () => {
  console.log('\n--- Generating new hash for Admin@2024 ---');
  const newHash = await bcrypt.hash('Admin@2024', 10);
  console.log('New hash:', newHash);
  console.log('Verification:', await bcrypt.compare('Admin@2024', newHash));
}, 1000);
