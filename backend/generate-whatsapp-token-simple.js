/**
 * Script simple pour mettre à jour le token WhatsApp
 * Vous guide pour générer le token et le met à jour dans .env
 * 
 * Usage: node generate-whatsapp-token-simple.js
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function updateToken() {
  console.log('🚀 Mise à jour du token WhatsApp Meta\n');
  console.log('📋 Instructions:');
  console.log('   1. Ouvrez Chrome (déjà ouvert)');
  console.log('   2. Allez sur: https://business.facebook.com');
  console.log('   3. Connectez-vous si nécessaire');
  console.log('   4. Allez dans: Settings > System Users');
  console.log('   5. Cliquez sur votre System User (ou créez-en un)');
  console.log('   6. Cliquez sur "Generate New Token"');
  console.log('   7. Sélectionnez votre WhatsApp Business Account');
  console.log('   8. Cochez: whatsapp_business_messaging et whatsapp_business_management');
  console.log('   9. Cliquez sur "Generate Token"');
  console.log('   10. Copiez le token (commence par EAA...)\n');
  
  console.log('💡 Le token ne s\'affiche qu\'UNE SEULE FOIS, copiez-le immédiatement!\n');
  
  const token = await question('📨 Collez le token ici: ');
  
  if (!token || token.length < 50 || !token.startsWith('EAA')) {
    console.log('\n❌ Token invalide. Le token doit commencer par "EAA" et faire plus de 50 caractères.');
    rl.close();
    return;
  }
  
  console.log(`\n✅ Token reçu: ${token.substring(0, 30)}...${token.substring(token.length - 10)}\n`);
  
  // Mettre à jour le fichier .env
  const envPath = path.join(__dirname, '.env');
  
  if (!fs.existsSync(envPath)) {
    console.log('⚠️  Fichier .env non trouvé, création...');
    fs.writeFileSync(envPath, `WHATSAPP_META_ACCESS_TOKEN=${token}\n`);
    console.log('✅ Fichier .env créé avec le token');
  } else {
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    if (envContent.includes('WHATSAPP_META_ACCESS_TOKEN=')) {
      envContent = envContent.replace(
        /WHATSAPP_META_ACCESS_TOKEN=.*/,
        `WHATSAPP_META_ACCESS_TOKEN=${token}`
      );
      console.log('✅ Token mis à jour dans .env');
    } else {
      envContent += `\nWHATSAPP_META_ACCESS_TOKEN=${token}\n`;
      console.log('✅ Token ajouté dans .env');
    }
    
    fs.writeFileSync(envPath, envContent);
  }
  
  console.log('\n🎉 Terminé! Le token a été sauvegardé.');
  console.log('🔄 Redémarrez le backend pour appliquer les changements.');
  console.log('\n🧪 Pour tester: node test-whatsapp-direct.js');
  
  rl.close();
}

updateToken().catch(console.error);

