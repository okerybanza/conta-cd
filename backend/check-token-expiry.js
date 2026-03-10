/**
 * Script pour vérifier l'expiration d'un token Meta
 */

require('dotenv').config({ path: '.env' });
const axios = require('axios');

async function checkTokenExpiry() {
  const token = process.env.WHATSAPP_META_ACCESS_TOKEN;
  
  if (!token) {
    console.log('❌ Aucun token trouvé dans .env');
    return;
  }
  
  console.log('🔍 Vérification du token Meta...\n');
  console.log(`📨 Token: ${token.substring(0, 30)}...${token.substring(token.length - 10)}\n`);
  
  try {
    // Vérifier le token avec l'API Meta
    const response = await axios.get('https://graph.facebook.com/v21.0/me', {
      params: {
        access_token: token,
        fields: 'id,name'
      }
    });
    
    console.log('✅ Token valide!');
    console.log(`📱 Compte: ${response.data.name || response.data.id}\n`);
    
    // Vérifier les informations de débogage du token
    const debugResponse = await axios.get('https://graph.facebook.com/v21.0/debug_token', {
      params: {
        input_token: token,
        access_token: token
      }
    });
    
    const tokenData = debugResponse.data.data;
    
    console.log('📋 Informations du token:');
    console.log(`   Type: ${tokenData.type || 'N/A'}`);
    console.log(`   Application: ${tokenData.app_id || 'N/A'}`);
    console.log(`   Scopes: ${tokenData.scopes?.join(', ') || 'N/A'}`);
    
    if (tokenData.expires_at) {
      const expiryDate = new Date(tokenData.expires_at * 1000);
      const now = new Date();
      const daysUntilExpiry = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
      
      console.log(`\n⏰ Expiration:`);
      console.log(`   Date: ${expiryDate.toLocaleString('fr-FR')}`);
      console.log(`   Dans: ${daysUntilExpiry} jour(s)`);
      
      if (daysUntilExpiry > 365) {
        console.log('   ✅ Token système (n\'expire pratiquement jamais)');
      } else if (daysUntilExpiry > 50) {
        console.log('   ⚠️  Token utilisateur (expire dans ~60 jours)');
        console.log('   💡 Recommandation: Créer un token système pour éviter l\'expiration');
      } else {
        console.log('   ⚠️  Token expire bientôt!');
      }
    } else {
      console.log(`\n✅ Token système (n'expire jamais)`);
    }
    
  } catch (error) {
    if (error.response) {
      console.log('❌ Erreur:', error.response.data?.error?.message || error.message);
      if (error.response.data?.error?.code === 190) {
        console.log('\n💡 Le token est invalide ou expiré.');
        console.log('   Régénérez un nouveau token.');
      }
    } else {
      console.log('❌ Erreur:', error.message);
    }
  }
}

checkTokenExpiry();

