const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkRelatedData() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
  });

  try {
    console.log('🔍 Vérification des données de référence...\n');

    // Vérifier airesantes
    const [airesantes] = await conn.execute('SELECT id, nom FROM airesantes LIMIT 10');
    console.log('📊 Aires de santé disponibles:');
    airesantes.forEach(a => console.log(`  - ID ${a.id}: ${a.nom}`));
    const [airesanteCount] = await conn.execute('SELECT COUNT(*) as total FROM airesantes');
    console.log(`  Total: ${airesanteCount[0].total}\n`);

    // Vérifier arrondissements
    const [arrondissements] = await conn.execute('SELECT id, nom FROM arrondissements LIMIT 10');
    console.log('📊 Arrondissements disponibles:');
    arrondissements.forEach(a => console.log(`  - ID ${a.id}: ${a.nom}`));
    const [arrondCount] = await conn.execute('SELECT COUNT(*) as total FROM arrondissements');
    console.log(`  Total: ${arrondCount[0].total}\n`);

  } catch (err) {
    console.error('❌ Erreur:', err);
  } finally {
    await conn.end();
  }
}

checkRelatedData();
