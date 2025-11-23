const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/v1';

async function testImportAPI() {
  console.log('🧪 Test de l\'API d\'import Excel\n');

  try {
    // Test 1: Obtenir la liste des tables importables (sans auth pour tester)
    console.log('📋 Test 1: Obtenir la liste des tables importables');
    try {
      const response = await axios.get(`${BASE_URL}/import/tables`);
      console.log('✅ Succès!');
      console.log('Tables importables:', response.data.data);
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('⚠️  Authentification requise (normal)');
      } else {
        console.log('❌ Erreur:', error.message);
      }
    }

    // Test 2: Vérifier que la route existe
    console.log('\n🔍 Test 2: Vérifier la disponibilité de la route');
    try {
      const response = await axios.get(`${BASE_URL}/import/batiments/structure`);
      console.log('✅ Route accessible!');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Route existe (authentification requise, ce qui est normal)');
      } else if (error.response?.status === 404) {
        console.log('❌ Route non trouvée');
      } else {
        console.log('⚠️  Erreur:', error.message);
      }
    }

    console.log('\n✨ Tests terminés!\n');
    console.log('📝 Pour utiliser l\'API d\'import:');
    console.log('1. Authentifiez-vous pour obtenir un token');
    console.log('2. Utilisez les endpoints décrits dans IMPORT_EXCEL.md');
    console.log('3. Consultez la documentation Swagger à /api-docs\n');

  } catch (error) {
    console.error('❌ Erreur lors des tests:', error.message);
  }
}

// Attendre que le serveur démarre
setTimeout(() => {
  testImportAPI();
}, 3000);
