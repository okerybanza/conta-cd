/**
 * Script automatisé pour générer un token WhatsApp Meta
 * Ouvre Chrome et guide l'utilisateur étape par étape
 * 
 * Usage: node generate-whatsapp-token-auto.js
 * 
 * Le script ouvre Chrome, vous guide, et extrait automatiquement le token
 */

const puppeteer = require('puppeteer');
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
  console.log('🚀 Script automatisé de génération de token WhatsApp Meta\n');
  console.log('📋 Ce script va:');
  console.log('   1. Ouvrir Chrome');
  console.log('   2. Vous guider vers la page de génération de token');
  console.log('   3. Extraire automatiquement le token une fois généré');
  console.log('   4. Le mettre à jour dans votre fichier .env\n');
  
  await question('Appuyez sur Entrée pour commencer...');
  
  console.log('\n🌐 Ouverture de Chrome...');
  
  const browser = await puppeteer.launch({
    headless: false, // Afficher le navigateur
    defaultViewport: null,
    args: ['--start-maximized'],
    executablePath: '/usr/bin/google-chrome' || '/usr/bin/chromium-browser' || undefined
  });
  
  const page = await browser.newPage();
  
  try {
    // Étape 1: Aller sur Meta Business Manager
    console.log('\n📱 Étape 1: Navigation vers Meta Business Manager...');
    await page.goto('https://business.facebook.com', { waitUntil: 'networkidle2' });
    await page.waitForTimeout(2000);
    
    console.log('✅ Page chargée. Veuillez vous connecter manuellement.');
    console.log('⏳ Attente de votre connexion...');
    
    // Attendre que l'utilisateur se connecte (détecter un changement d'URL ou présence d'éléments)
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
    
    // Étape 2: Sélectionner l'entreprise si nécessaire
    try {
      const currentUrl = page.url();
      if (currentUrl.includes('select')) {
        console.log('📋 Étape 2: Sélection de l\'entreprise...');
        console.log('   Cliquez sur votre entreprise dans la liste...');
        
        await page.waitForFunction(
          () => !window.location.href.includes('select'),
          { timeout: 60000 }
        );
        console.log('✅ Entreprise sélectionnée!\n');
      }
    } catch (error) {
      console.log('✅ Déjà dans une entreprise\n');
    }
    
    // Étape 3: Aller aux System Users
    console.log('👥 Étape 3: Navigation vers System Users...');
    await page.goto('https://business.facebook.com/settings/system-users', { 
      waitUntil: 'networkidle2',
      timeout: 60000
    });
    await page.waitForTimeout(3000);
    
    console.log('✅ Page System Users chargée!\n');
    console.log('📋 Instructions:');
    console.log('   1. Si un System User existe, cliquez dessus');
    console.log('   2. Sinon, cliquez sur "Add" pour en créer un nouveau');
    console.log('   3. Assignez les permissions WhatsApp si nécessaire');
    console.log('   4. Cliquez sur "Generate New Token"');
    console.log('   5. Sélectionnez votre WhatsApp Business Account');
    console.log('   6. Cochez les permissions: whatsapp_business_messaging et whatsapp_business_management');
    console.log('   7. Cliquez sur "Generate Token"\n');
    
    console.log('⏳ Attente de la génération du token...');
    console.log('   (Le script détectera automatiquement le token une fois généré)\n');
    
    // Surveiller l'apparition du token
    let token = null;
    let attempts = 0;
    const maxAttempts = 120; // 2 minutes (1 seconde par tentative)
    
    while (!token && attempts < maxAttempts) {
      await page.waitForTimeout(1000);
      attempts++;
      
      try {
        // Chercher le token dans différents formats possibles
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
        // Continuer à chercher
      }
      
      // Afficher un point de progression toutes les 10 secondes
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
        
        // Remplacer ou ajouter le token
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
        console.log('⚠️  Fichier .env non trouvé, création...');
        fs.writeFileSync(envPath, `WHATSAPP_META_ACCESS_TOKEN=${token}\n`);
        console.log('✅ Fichier .env créé avec le token');
      }
      
      console.log('\n🎉 Terminé! Le token a été sauvegardé.');
      console.log('🔄 Redémarrez le backend pour appliquer les changements.');
      console.log('\n🧪 Pour tester, exécutez: node test-whatsapp-direct.js');
      
    } else {
      console.log('⚠️  Token non détecté automatiquement.');
      console.log('📋 Veuillez copier le token manuellement depuis la page.');
      console.log('   Le token commence généralement par "EAA" et fait plus de 100 caractères.');
      console.log('\n💡 Une fois copié, dites-moi "J\'ai le token" et je le mettrai à jour.');
    }
    
    // Garder le navigateur ouvert pour vérification
    console.log('\n👀 Le navigateur reste ouvert pour vérification.');
    console.log('⏸️  Appuyez sur Entrée pour fermer...');
    await question('');
    
  } catch (error) {
    console.error('\n❌ Erreur:', error.message);
    console.log('\n💡 Le script a rencontré une erreur.');
    console.log('📋 Le navigateur reste ouvert. Vous pouvez continuer manuellement.');
    console.log('\n⏸️  Appuyez sur Entrée pour fermer...');
    await question('');
  } finally {
    await browser.close();
    rl.close();
  }
}

// Exécuter
generateToken().catch(console.error);

