/**
 * Script automatisé pour générer un token WhatsApp Meta
 * Utilise Puppeteer pour contrôler Chrome
 * 
 * Usage: node generate-whatsapp-token.js
 * 
 * IMPORTANT: Vous devrez vous connecter manuellement une fois,
 * puis le script continuera automatiquement
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
  console.log('🚀 Démarrage de l\'automatisation pour générer le token WhatsApp...\n');
  
  // Vérifier les informations nécessaires
  console.log('📋 Informations nécessaires:');
  const email = await question('Email Meta Business Manager: ');
  const password = await question('Mot de passe (ne sera pas affiché): ');
  const businessName = await question('Nom de l\'entreprise Meta Business (optionnel, appuyez sur Entrée pour utiliser la première): ') || '';
  
  console.log('\n🌐 Ouverture de Chrome...');
  
  const browser = await puppeteer.launch({
    headless: false, // Afficher le navigateur pour voir ce qui se passe
    defaultViewport: null,
    args: ['--start-maximized']
  });
  
  const page = await browser.newPage();
  
  try {
    // Étape 1: Aller sur Meta Business Manager
    console.log('📱 Navigation vers Meta Business Manager...');
    await page.goto('https://business.facebook.com', { waitUntil: 'networkidle2' });
    await page.waitForTimeout(2000);
    
    // Étape 2: Se connecter
    console.log('🔐 Connexion en cours...');
    
    // Chercher le bouton de connexion Facebook
    try {
      const loginButton = await page.waitForSelector('button:has-text("Log in with Facebook"), a:has-text("Log in with Facebook")', { timeout: 5000 });
      await loginButton.click();
      await page.waitForTimeout(2000);
      
      // Remplir le formulaire de connexion Facebook
      const emailInput = await page.waitForSelector('input[type="email"], input[name="email"], input[id="email"]', { timeout: 5000 });
      await emailInput.type(email);
      
      const passwordInput = await page.waitForSelector('input[type="password"], input[name="pass"]', { timeout: 5000 });
      await passwordInput.type(password);
      
      const submitButton = await page.waitForSelector('button[type="submit"], button[name="login"]', { timeout: 5000 });
      await submitButton.click();
      
      await page.waitForTimeout(5000);
      
      // Gérer la vérification 2FA si nécessaire
      console.log('⏳ Attente de la connexion (vérification 2FA si nécessaire)...');
      await page.waitForTimeout(5000);
      
    } catch (error) {
      console.log('⚠️  Connexion déjà effectuée ou formulaire différent, continuation...');
    }
    
    // Étape 3: Sélectionner l'entreprise si nécessaire
    try {
      const selectPage = await page.waitForSelector('a:has-text("Facebook"), button:has-text("Facebook")', { timeout: 3000 });
      if (businessName) {
        // Chercher l'entreprise par nom
        const businessLink = await page.$(`a:has-text("${businessName}"), button:has-text("${businessName}")`);
        if (businessLink) {
          await businessLink.click();
          await page.waitForTimeout(3000);
        }
      } else {
        // Cliquer sur la première entreprise
        await selectPage.click();
        await page.waitForTimeout(3000);
      }
    } catch (error) {
      console.log('✅ Déjà dans une entreprise ou pas de sélection nécessaire');
    }
    
    // Étape 4: Aller aux System Users
    console.log('👥 Navigation vers System Users...');
    await page.goto('https://business.facebook.com/settings/system-users', { waitUntil: 'networkidle2' });
    await page.waitForTimeout(3000);
    
    // Étape 5: Vérifier si un System User existe
    console.log('🔍 Recherche d\'un System User existant...');
    
    let systemUserExists = false;
    try {
      // Chercher un System User existant (premier dans la liste)
      const systemUserLink = await page.waitForSelector('a[href*="system-users"], div[role="button"]:has-text("System User")', { timeout: 5000 });
      systemUserExists = true;
      console.log('✅ System User trouvé, clic...');
      await systemUserLink.click();
      await page.waitForTimeout(3000);
    } catch (error) {
      console.log('📝 Aucun System User trouvé, création d\'un nouveau...');
      
      // Créer un nouveau System User
      const addButton = await page.waitForSelector('button:has-text("Add"), a:has-text("Add"), button[aria-label*="Add"]', { timeout: 5000 });
      await addButton.click();
      await page.waitForTimeout(2000);
      
      // Remplir le formulaire
      const nameInput = await page.waitForSelector('input[type="text"], input[name="name"]', { timeout: 5000 });
      await nameInput.type('Conta WhatsApp API');
      
      // Sélectionner System User (pas Admin)
      const systemUserOption = await page.waitForSelector('input[type="radio"][value="SYSTEM_USER"], label:has-text("System User")', { timeout: 5000 });
      await systemUserOption.click();
      
      // Créer
      const createButton = await page.waitForSelector('button:has-text("Create"), button:has-text("Create System User")', { timeout: 5000 });
      await createButton.click();
      await page.waitForTimeout(5000);
    }
    
    // Étape 6: Assigner les permissions WhatsApp
    console.log('🔐 Assignation des permissions WhatsApp...');
    
    try {
      const assignAssetsButton = await page.waitForSelector('button:has-text("Assign Assets"), a:has-text("Assign Assets")', { timeout: 5000 });
      await assignAssetsButton.click();
      await page.waitForTimeout(2000);
      
      // Sélectionner WhatsApp Accounts
      const whatsappOption = await page.waitForSelector('input[type="checkbox"], label:has-text("WhatsApp")', { timeout: 5000 });
      await whatsappOption.click();
      await page.waitForTimeout(1000);
      
      // Sélectionner Manage permission
      const manageCheckbox = await page.waitForSelector('input[type="checkbox"][value="MANAGE"], label:has-text("Manage")', { timeout: 5000 });
      await manageCheckbox.click();
      
      // Sauvegarder
      const saveButton = await page.waitForSelector('button:has-text("Save"), button:has-text("Save Changes")', { timeout: 5000 });
      await saveButton.click();
      await page.waitForTimeout(3000);
    } catch (error) {
      console.log('⚠️  Permissions peut-être déjà assignées ou interface différente');
    }
    
    // Étape 7: Générer le token
    console.log('🎫 Génération du token...');
    
    const generateButton = await page.waitForSelector('button:has-text("Generate"), button:has-text("Generate Token"), a:has-text("Generate")', { timeout: 5000 });
    await generateButton.click();
    await page.waitForTimeout(2000);
    
    // Sélectionner WhatsApp Business Account
    try {
      const whatsappAccountSelect = await page.waitForSelector('select, div[role="combobox"]', { timeout: 5000 });
      await whatsappAccountSelect.click();
      await page.waitForTimeout(1000);
      
      // Sélectionner la première option WhatsApp
      const firstOption = await page.waitForSelector('div[role="option"]:first-child, option:first-child', { timeout: 3000 });
      await firstOption.click();
      await page.waitForTimeout(1000);
    } catch (error) {
      console.log('⚠️  Sélection automatique non possible, continuez manuellement');
    }
    
    // Cocher les permissions
    try {
      const messagingPermission = await page.waitForSelector('input[type="checkbox"][value*="messaging"], label:has-text("messaging")', { timeout: 5000 });
      await messagingPermission.click();
      
      const managementPermission = await page.waitForSelector('input[type="checkbox"][value*="management"], label:has-text("management")', { timeout: 5000 });
      await managementPermission.click();
    } catch (error) {
      console.log('⚠️  Permissions à cocher manuellement');
    }
    
    // Générer
    const finalGenerateButton = await page.waitForSelector('button:has-text("Generate Token"), button[type="submit"]:has-text("Generate")', { timeout: 5000 });
    await finalGenerateButton.click();
    await page.waitForTimeout(5000);
    
    // Étape 8: Extraire le token
    console.log('📋 Extraction du token...');
    
    // Le token est généralement dans un input ou un div avec le texte
    const tokenElement = await page.waitForSelector('input[type="text"][readonly], code, pre, div[class*="token"]', { timeout: 10000 });
    const token = await page.evaluate(el => el.value || el.textContent, tokenElement);
    
    if (token && token.length > 50) {
      console.log('\n✅ Token généré avec succès!');
      console.log(`📨 Token: ${token.substring(0, 20)}...`);
      
      // Mettre à jour le fichier .env
      const envPath = path.join(__dirname, '.env');
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
      
      console.log('\n🎉 Terminé! Le token a été sauvegardé.');
      console.log('🔄 Redémarrez le backend pour appliquer les changements.');
    } else {
      console.log('\n⚠️  Token non trouvé automatiquement.');
      console.log('📋 Veuillez copier le token manuellement depuis la page et me le donner.');
    }
    
    // Garder le navigateur ouvert pour vérification
    console.log('\n👀 Le navigateur reste ouvert pour vérification.');
    console.log('⏸️  Appuyez sur Entrée pour fermer...');
    await question('');
    
  } catch (error) {
    console.error('\n❌ Erreur:', error.message);
    console.log('\n💡 Le script a rencontré une erreur.');
    console.log('📋 Veuillez continuer manuellement ou me donner le token généré.');
    console.log('\n⏸️  Le navigateur reste ouvert. Appuyez sur Entrée pour fermer...');
    await question('');
  } finally {
    await browser.close();
    rl.close();
  }
}

// Exécuter
generateToken().catch(console.error);

