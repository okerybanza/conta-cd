/**
 * Script pour générer un token WhatsApp Meta
 * Se connecte à une instance Chrome existante
 * 
 * IMPORTANT: Chrome doit être lancé avec le flag --remote-debugging-port=9222
 * 
 * Pour lancer Chrome avec le bon flag:
 * google-chrome --remote-debugging-port=9222 --user-data-dir=/tmp/chrome-debug
 * 
 * Usage: node generate-whatsapp-token-existing-chrome.js
 */

const puppeteer = require('puppeteer-core');
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

async function generateToken() {
  console.log('🚀 Script de génération de token WhatsApp Meta\n');
  console.log('📋 Ce script va se connecter à votre Chrome existant\n');
  
  // Essayer de se connecter à Chrome
  let browser;
  try {
    console.log('🔌 Tentative de connexion à Chrome (port 9222)...');
    browser = await puppeteer.connect({
      browserURL: 'http://localhost:9222',
      defaultViewport: null
    });
    console.log('✅ Connecté à Chrome!\n');
  } catch (error) {
    console.log('❌ Impossible de se connecter à Chrome.');
    console.log('\n💡 Pour activer la connexion, fermez Chrome et relancez-le avec:');
    console.log('   google-chrome --remote-debugging-port=9222 --user-data-dir=/tmp/chrome-debug');
    console.log('\n   Ou si Chrome est déjà ouvert, créez un nouvel onglet et allez sur:');
    console.log('   chrome://inspect');
    console.log('\n   Puis cliquez sur "Open dedicated DevTools for Node"');
    process.exit(1);
  }
  
  // Obtenir les pages ouvertes
  const pages = await browser.pages();
  console.log(`📄 ${pages.length} onglet(s) ouvert(s) dans Chrome\n`);
  
  let page;
  
  // Option 1: Utiliser une page existante si elle est sur Meta Business
  const metaPage = pages.find(p => {
    const url = p.url();
    return url.includes('business.facebook.com') || url.includes('facebook.com');
  });
  
  if (metaPage) {
    console.log('✅ Page Meta Business trouvée, utilisation de cette page...');
    page = metaPage;
  } else {
    // Option 2: Créer une nouvelle page
    console.log('📱 Création d\'un nouvel onglet...');
    page = await browser.newPage();
  }
  
  try {
    // Aller sur Meta Business Manager si pas déjà là
    const currentUrl = page.url();
    if (!currentUrl.includes('business.facebook.com')) {
      console.log('🌐 Navigation vers Meta Business Manager...');
      await page.goto('https://business.facebook.com', { waitUntil: 'networkidle2' });
      await page.waitForTimeout(2000);
    } else {
      console.log('✅ Déjà sur Meta Business Manager\n');
    }
    
    // Vérifier si connecté
    const isLoggedIn = await page.evaluate(() => {
      return !window.location.href.includes('login') && 
             (document.querySelector('[aria-label*="Menu"]') || 
              document.querySelector('a[href*="settings"]'));
    });
    
    if (!isLoggedIn) {
      console.log('⚠️  Vous n\'êtes pas connecté.');
      console.log('📋 Veuillez vous connecter manuellement dans Chrome...');
      console.log('⏳ Attente de votre connexion...\n');
      
      await page.waitForFunction(
        () => {
          return !window.location.href.includes('login') && 
                 (document.querySelector('[aria-label*="Menu"]') || 
                  document.querySelector('a[href*="settings"]') ||
                  document.body.innerText.includes('Business'));
        },
        { timeout: 300000 } // 5 minutes max
      );
      
      console.log('✅ Connexion détectée!\n');
    }
    
    // Sélectionner l'entreprise si nécessaire
    try {
      const url = await page.url();
      if (url.includes('select')) {
        console.log('📋 Sélection de l\'entreprise...');
        console.log('   Veuillez cliquer sur votre entreprise dans Chrome...');
        
        await page.waitForFunction(
          () => !window.location.href.includes('select'),
          { timeout: 60000 }
        );
        console.log('✅ Entreprise sélectionnée!\n');
      }
    } catch (error) {
      // Ignorer
    }
    
    // Aller aux System Users
    console.log('👥 Navigation vers System Users...');
    await page.goto('https://business.facebook.com/settings/system-users', { 
      waitUntil: 'networkidle2',
      timeout: 60000
    });
    await page.waitForTimeout(3000);
    
    console.log('✅ Page System Users chargée!\n');
    console.log('📋 Instructions à suivre dans Chrome:');
    console.log('   1. Si un System User existe, cliquez dessus');
    console.log('   2. Sinon, cliquez sur "Add" pour en créer un nouveau');
    console.log('   3. Assignez les permissions WhatsApp si nécessaire');
    console.log('   4. Cliquez sur "Generate New Token"');
    console.log('   5. Sélectionnez votre WhatsApp Business Account');
    console.log('   6. Cochez: whatsapp_business_messaging et whatsapp_business_management');
    console.log('   7. Cliquez sur "Generate Token"\n');
    
    console.log('⏳ Le script surveille la page et détectera automatiquement le token...\n');
    
    // Surveiller l'apparition du token
    let token = null;
    let attempts = 0;
    const maxAttempts = 180; // 3 minutes
    
    while (!token && attempts < maxAttempts) {
      await page.waitForTimeout(1000);
      attempts++;
      
      try {
        token = await page.evaluate(() => {
          // Chercher dans les inputs readonly
          const inputs = Array.from(document.querySelectorAll('input[type="text"][readonly], input[readonly]'));
          for (const input of inputs) {
            const value = input.value || '';
            if (value.length > 50 && value.startsWith('EAA')) {
              return value;
            }
          }
          
          // Chercher dans les éléments code/pre
          const codeElements = Array.from(document.querySelectorAll('code, pre, div[class*="token"], span[class*="token"]'));
          for (const el of codeElements) {
            const text = el.textContent || el.innerText || '';
            if (text.length > 50 && text.startsWith('EAA')) {
              return text.trim();
            }
          }
          
          // Chercher dans tout le texte de la page
          const pageText = document.body.innerText || '';
          const tokenMatch = pageText.match(/EAA[a-zA-Z0-9]{100,}/);
          if (tokenMatch) {
            return tokenMatch[0];
          }
          
          return null;
        });
        
        if (token) {
          break;
        }
      } catch (error) {
        // Continuer
      }
      
      if (attempts % 10 === 0) {
        process.stdout.write('.');
      }
    }
    
    console.log('\n');
    
    if (token && token.length > 50) {
      console.log('✅ Token détecté!');
      console.log(`📨 Token: ${token.substring(0, 30)}...${token.substring(token.length - 10)}\n`);
      
      // Mettre à jour le fichier .env
      const envPath = path.join(__dirname, '.env');
      
      if (fs.existsSync(envPath)) {
        let envContent = fs.readFileSync(envPath, 'utf8');
        
        if (envContent.includes('WHATSAPP_META_ACCESS_TOKEN=')) {
          envContent = envContent.replace(
            /WHATSAPP_META_ACCESS_TOKEN=.*/,
            `WHATSAPP_META_ACCESS_TOKEN=${token}`
          );
        } else {
          envContent += `\nWHATSAPP_META_ACCESS_TOKEN=${token}\n`;
        }
        
        fs.writeFileSync(envPath, envContent);
        console.log('✅ Token mis à jour dans .env');
      } else {
        fs.writeFileSync(envPath, `WHATSAPP_META_ACCESS_TOKEN=${token}\n`);
        console.log('✅ Fichier .env créé avec le token');
      }
      
      console.log('\n🎉 Terminé! Le token a été sauvegardé.');
      console.log('🔄 Redémarrez le backend pour appliquer les changements.');
      console.log('\n🧪 Pour tester: node test-whatsapp-direct.js');
      
    } else {
      console.log('⚠️  Token non détecté automatiquement.');
      console.log('📋 Veuillez copier le token manuellement depuis Chrome.');
      console.log('   Le token commence par "EAA" et fait plus de 100 caractères.');
      console.log('\n💡 Une fois copié, dites-moi "J\'ai le token" et je le mettrai à jour.');
    }
    
    console.log('\n✅ Le script continue de surveiller. Vous pouvez fermer ce terminal quand vous voulez.');
    console.log('   (Chrome restera ouvert)\n');
    
  } catch (error) {
    console.error('\n❌ Erreur:', error.message);
    console.log('\n💡 Le script a rencontré une erreur.');
    console.log('📋 Vous pouvez continuer manuellement dans Chrome.');
  } finally {
    // Ne pas fermer le navigateur, juste se déconnecter
    await browser.disconnect();
    rl.close();
  }
}

// Exécuter
generateToken().catch(console.error);

